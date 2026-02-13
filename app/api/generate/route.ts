import type OpenAI from "openai";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { debitCredits, refundCredits } from "@/lib/db/credits";
import { EnvError } from "@/lib/env/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import {
  getOpenAIClient,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
} from "@/lib/openai/client";
import { buildGenerateCopyMessages } from "@/lib/prompts/generateCopy";
import { checkRateLimit, type PlanType } from "@/lib/rateLimit";
import { z } from "zod";
import { NextResponse } from "next/server";

const INPUT_VALUE_MAX_LENGTH = 1000;
const CACHE_WINDOW_HOURS = 24;

// Manual test scenarios (run with valid session cookie):
// (A) Free user: 4th call in same day with unique idempotency_key -> 429 DAILY_LIMIT_EXCEEDED.
// (B) User with 0 credit_balance -> 402 INSUFFICIENT_CREDITS.
// (C) Simulate OpenAI failure (e.g. invalid key): refund runs; usage_ledger has credit row; balance restored.
// (D) Same idempotency_key twice: 2nd request returns 200 with same output (duplicated), no double charge.
// (E) usage_ledger: unique(user_id, idempotency_key) enforced by migration 20260213120000.
// Rate limit (Phase 5):
// (R-1) Rapid calls -> blocked at plan threshold (e.g. free 3/min).
// (R-2) Free vs Pro -> different limits (Pro 30/min, 500/hr).
// (R-3) Rate limit 429 does not deduct credit.
// (R-4) History unaffected.
// Cost control (Phase 5):
// (C-1) INPUT_TOO_LONG: exceed input length -> 400 INPUT_TOO_LONG, no debit, no OpenAI call.
// (C-2) Token cap: max_output_tokens 900; JSON schema still valid.
// (C-3) Cache hit: same payload twice (new idempotency_key) -> 2nd returns cacheHit true, no debit.
// (C-4) Cache per-user: different user same input -> not cache hit.
// Error logging (Phase 5):
// (L-1) INPUT_TOO_LONG -> error_logs row created (user_id set).
// (L-2) RATE_LIMIT_EXCEEDED -> error log created, no credit debit.
// (L-3) AI_FAILED (e.g. bad key) -> error log created.
// (L-4) Webhook invalid signature -> error log via service role (user_id null).
// Env security (Phase 5):
// (E-1) Unset OPENAI_API_KEY -> 500 SERVER_MISCONFIGURED, error_logs row created.
// (E-2) Unset STRIPE_SECRET_KEY -> checkout returns 500 SERVER_MISCONFIGURED, logs.
// (E-3) Missing STRIPE_PRICE_STANDARD -> checkout returns 400 PRICE_NOT_CONFIGURED.
// (E-4) No response includes actual env values.

const channelEnum = z.enum([
  "smartstore",
  "coupang",
  "affiliate",
  "social",
  "shortform",
]);
const vibeEnum = z.enum(["trust", "review", "impulse", "premium", "groupbuy"]);

const requestSchema = z.object({
  idempotency_key: z.string().min(1).max(256),
  input_type: z.enum(["url", "text"]),
  input_value: z.string().min(1).max(INPUT_VALUE_MAX_LENGTH),
  channel: channelEnum,
  vibe: vibeEnum,
});

const riskCheckSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  flags: z.array(z.string()),
  notes: z.array(z.string()),
});

const responseSchema = z.object({
  headlines: z.array(z.string()).length(10),
  benefits: z.array(z.string()).length(5),
  shortform_scripts: z
    .array(z.object({ hook: z.string(), script: z.string() }))
    .length(2),
  ctas: z.array(z.string()).length(5),
  risk_check: riskCheckSchema,
});

type GenerateOutput = z.infer<typeof responseSchema>;

const REPAIR_PROMPT =
  "Your previous response was invalid JSON or did not match the required schema. Return only a single JSON object with keys: headlines (10 strings), benefits (5 strings), shortform_scripts (2 objects with hook and script), ctas (5 strings), risk_check (object with level, flags, notes). No markdown.";

function parseAndValidate(jsonStr: string): GenerateOutput | null {
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    const result = responseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function buildRetryMessages(
  base: OpenAI.Chat.ChatCompletionMessageParam[],
  invalidContent: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    ...base,
    { role: "assistant", content: invalidContent },
    { role: "user", content: REPAIR_PROMPT },
  ];
}

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (e) {
    if (e instanceof EnvError) {
      return NextResponse.json(
        {
          error: {
            code: "SERVER_MISCONFIGURED",
            message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          },
        },
        { status: 500 }
      );
    }
    throw e;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan: PlanType =
    profile?.plan === "standard" || profile?.plan === "pro"
      ? profile.plan
      : "free";

  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip")) ||
    "unknown";

  const rate = await checkRateLimit(supabase, {
    userId: user.id,
    ip,
    plan,
  });
  if (!rate.allowed) {
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 429,
        error_code: "RATE_LIMIT_EXCEEDED",
        message: rate.message ?? "Too many requests. Please wait.",
        details: { rate_limit_outcome: "blocked" },
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: rate.message ?? "Too many requests. Please wait.",
        },
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 400,
        error_code: "BAD_REQUEST",
        message: "Request body must be JSON",
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const inputTooLong = parsed.error.issues.some(
      (i) =>
        i.path.join(".") === "input_value" &&
        (i.code === "too_big" || String(i.message).includes("1000"))
    );
    if (inputTooLong) {
      try {
        await writeErrorLog(supabase, {
          route: "/api/generate",
          method: "POST",
          status: 400,
          error_code: "INPUT_TOO_LONG",
          message: "입력 길이가 너무 깁니다. 핵심만 요약해 주세요.",
          user_id: user.id,
          ip,
          user_agent: request.headers.get("user-agent") ?? null,
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "INPUT_TOO_LONG",
            message: "입력 길이가 너무 깁니다. 핵심만 요약해 주세요.",
          },
        },
        { status: 400 }
      );
    }
    const msg =
      parsed.error.issues?.map((i) => i.message).join("; ") ??
      parsed.error.message;
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 400,
        error_code: "BAD_REQUEST",
        message: msg,
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: msg } },
      { status: 400 }
    );
  }

  const { idempotency_key, input_type, input_value, channel, vibe } =
    parsed.data;

  const normalizedInput = input_value.trim();
  const cacheKeyPayload = JSON.stringify({
    channel,
    vibe,
    normalized_input: normalizedInput,
  });
  const cache_key =
    createHash("sha256").update(cacheKeyPayload).digest("hex");

  const windowStart = new Date(Date.now() - CACHE_WINDOW_HOURS * 60 * 60 * 1000);
  const { data: cached } = await supabase
    .from("generations")
    .select("id, output_json")
    .eq("user_id", user.id)
    .eq("cache_key", cache_key)
    .gte("created_at", windowStart.toISOString())
    .not("output_json", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.output_json) {
    const { data: profileRow } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", user.id)
      .single();
    const balance = profileRow?.credit_balance ?? 0;
    return NextResponse.json(
      {
        ok: true,
        data: {
          generationId: cached.id,
          output: cached.output_json,
          credits: { before: balance, after: balance },
        },
        cacheHit: true,
      },
      { status: 200 }
    );
  }

  const debit = await debitCredits(supabase, {
    userId: user.id,
    amount: 1,
    idempotencyKey: idempotency_key,
    reason: "generate",
  });

  if (!debit.ok) {
    const logPayload = {
      route: "/api/generate",
      method: "POST",
      user_id: user.id,
      ip,
      user_agent: request.headers.get("user-agent") ?? null,
      details: { channel, vibe, input_length: input_value.length, debit_outcome: debit.error },
    } as const;
    if (debit.error === "INSUFFICIENT_CREDITS") {
      try {
        await writeErrorLog(supabase, {
          ...logPayload,
          status: 402,
          error_code: "INSUFFICIENT_CREDITS",
          message: "Not enough credits to generate",
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Not enough credits to generate",
          },
        },
        { status: 402 }
      );
    }
    if (debit.error === "DAILY_LIMIT_EXCEEDED") {
      try {
        await writeErrorLog(supabase, {
          ...logPayload,
          status: 429,
          error_code: "DAILY_LIMIT_EXCEEDED",
          message: "Free plan daily limit (3) reached",
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "DAILY_LIMIT_EXCEEDED",
            message: "Free plan daily limit (3) reached",
          },
        },
        { status: 429 }
      );
    }
    if (debit.error === "IDEMPOTENCY_CONFLICT") {
      try {
        await writeErrorLog(supabase, {
          ...logPayload,
          status: 409,
          error_code: "IDEMPOTENCY_CONFLICT",
          message: "Duplicate request or partial state; retry with a new key",
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "IDEMPOTENCY_CONFLICT",
            message: "Duplicate request or partial state; retry with a new key",
          },
        },
        { status: 409 }
      );
    }
    try {
      await writeErrorLog(supabase, {
        ...logPayload,
        status: 400,
        error_code: debit.error,
        message: String(debit.error),
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: debit.error, message: String(debit.error) } },
      { status: 400 }
    );
  }

  if (debit.duplicated) {
    const { data: ledgerRow } = await supabase
      .from("usage_ledger")
      .select("generation_id")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();
    const genId = ledgerRow?.generation_id;
    if (genId) {
      const { data: gen } = await supabase
        .from("generations")
        .select("id, output_json")
        .eq("id", genId)
        .maybeSingle();
      if (gen?.output_json)
        return NextResponse.json(
          {
            ok: true,
            data: {
              generationId: gen.id,
              output: gen.output_json,
              credits: { before: debit.before, after: debit.after },
            },
          },
          { status: 200 }
        );
    }
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 409,
        error_code: "IDEMPOTENCY_CONFLICT",
        message: "Duplicate key but no generation found; use a new idempotency key",
        details: { channel, vibe, input_length: input_value.length },
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      {
        error: {
          code: "IDEMPOTENCY_CONFLICT",
          message: "Duplicate key but no generation found; use a new idempotency key",
        },
      },
      { status: 409 }
    );
  }

  let openai;
  try {
    openai = getOpenAIClient();
  } catch (e) {
    if (e instanceof EnvError) {
      try {
        await writeErrorLog(supabase, {
          route: "/api/generate",
          method: "POST",
          status: 500,
          error_code: "SERVER_MISCONFIGURED",
          message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          details: { channel, vibe, input_length: input_value.length },
          user_id: user.id,
          ip,
          user_agent: request.headers.get("user-agent") ?? null,
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "SERVER_MISCONFIGURED",
            message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          },
        },
        { status: 500 }
      );
    }
    const msg = e instanceof Error ? e.message : "OpenAI not configured";
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 500,
        error_code: "INTERNAL",
        message: msg,
        details: { channel, vibe, input_length: input_value.length },
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: msg } },
      { status: 500 }
    );
  }

  const messages = buildGenerateCopyMessages(
    input_type,
    input_value,
    channel,
    vibe
  );
  const start = Date.now();

  const runCompletion = async (
    msgs: OpenAI.Chat.ChatCompletionMessageParam[]
  ) =>
    openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: msgs,
      max_tokens: OPENAI_MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    });

  let completion: Awaited<ReturnType<typeof runCompletion>>;
  let output: GenerateOutput;

  try {
    completion = await runCompletion(messages);
    const content = completion.choices[0]?.message?.content?.trim();
    let parsed: GenerateOutput | null = content ? parseAndValidate(content) : null;

    if (!parsed && content) {
      try {
        const retryMessages = buildRetryMessages(messages, content);
        const retry = await runCompletion(retryMessages);
        const retryContent = retry.choices[0]?.message?.content?.trim();
        parsed = retryContent ? parseAndValidate(retryContent) : null;
      } catch {
        // fall through
      }
    }

    if (!parsed) {
      throw new Error("Model returned invalid or non-conforming JSON after retry");
    }
    output = parsed;
  } catch (e) {
    const refund = await refundCredits(supabase, {
      userId: user.id,
      amount: 1,
      idempotencyKey: idempotency_key,
    });
    if (!refund.ok) {
      console.error("[generate] refund failed after AI error:", refund.error);
    }
    const msg = e instanceof Error ? e.message : "AI generation failed";
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 500,
        error_code: "AI_FAILED",
        message: msg,
        details: { channel, vibe, input_length: input_value.length },
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "AI_FAILED", message: msg } },
      { status: 500 }
    );
  }

  const latencyMs = Date.now() - start;
  const usage = completion!.usage;

  const { data: inserted, error: insertError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      channel,
      vibe,
      input_type,
      input_value,
      cache_key,
      output_json: output as unknown as Record<string, unknown>,
      model: OPENAI_MODEL,
      input_tokens: usage?.prompt_tokens ?? null,
      output_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
      latency_ms: latencyMs,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    const refund = await refundCredits(supabase, {
      userId: user.id,
      amount: 1,
      idempotencyKey: idempotency_key,
    });
    if (!refund.ok) {
      console.error("[generate] refund failed after insert error:", refund.error);
    }
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 500,
        error_code: "AI_FAILED",
        message: "Failed to save generation log",
        details: { channel, vibe, input_length: input_value.length },
        user_id: user.id,
        ip,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      {
        error: {
          code: "AI_FAILED",
          message: "Failed to save generation log",
        },
      },
      { status: 500 }
    );
  }

  await supabase
    .from("usage_ledger")
    .update({ generation_id: inserted.id })
    .eq("user_id", user.id)
    .eq("idempotency_key", idempotency_key);

  return NextResponse.json(
    {
      ok: true,
      data: {
        generationId: inserted.id,
        output,
        credits: { before: debit.before, after: debit.after },
      },
    },
    { status: 200 }
  );
}
