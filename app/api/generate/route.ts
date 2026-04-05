import type OpenAI from "openai";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { debitCredits, refundCredits } from "@/lib/db/credits";
import { EnvError, safeServerEnvSummary } from "@/lib/env/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import {
  getOpenAIClient,
  getModelForPlan,
  OPENAI_MAX_OUTPUT_TOKENS,
} from "@/lib/openai/client";
import {
  buildGenerateCopyMessages,
  STRICT_JSON_RETRY_PROMPT,
  validateProductInput,
} from "@/lib/prompts/generateCopy";
import { checkRateLimit, type PlanType } from "@/lib/rateLimit";
import { z } from "zod";
import { NextResponse } from "next/server";

const INPUT_VALUE_MAX_LENGTH = 2000;
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

// New conversion-focused response schema
const responseSchema = z.object({
  hook_headlines: z.array(z.string()).length(10),
  benefits: z.array(z.string()).length(5),
  dm_messages: z.array(z.string()).length(5),
  comment_triggers: z.array(z.string()).length(5),
  scarcity_lines: z.array(z.string()).length(5),
  shortform_scripts: z
    .array(z.object({ hook: z.string(), body: z.string() }))
    .length(2),
});

type GenerateOutput = z.infer<typeof responseSchema>;

// Normalize output to exact counts (trim excess, pad if slightly short)
function normalizeOutput(raw: Record<string, unknown>): Record<string, unknown> {
  const ensureArrayLength = (arr: unknown, len: number): string[] => {
    if (!Array.isArray(arr)) return Array(len).fill("");
    const stringArr = arr.map((item) => (typeof item === "string" ? item : String(item ?? "")));
    if (stringArr.length >= len) return stringArr.slice(0, len);
    // Pad with last item or empty string if slightly short
    while (stringArr.length < len) {
      stringArr.push(stringArr[stringArr.length - 1] || "");
    }
    return stringArr;
  };

  const ensureScripts = (arr: unknown): Array<{ hook: string; body: string }> => {
    if (!Array.isArray(arr)) return [{ hook: "", body: "" }, { hook: "", body: "" }];
    const scripts = arr.slice(0, 2).map((item) => {
      if (typeof item !== "object" || item === null) return { hook: "", body: "" };
      const obj = item as Record<string, unknown>;
      return {
        hook: typeof obj.hook === "string" ? obj.hook : String(obj.hook ?? ""),
        body: typeof obj.body === "string" ? obj.body : (typeof obj.script === "string" ? obj.script : String(obj.body ?? obj.script ?? "")),
      };
    });
    while (scripts.length < 2) {
      scripts.push({ hook: "", body: "" });
    }
    return scripts;
  };

  return {
    hook_headlines: ensureArrayLength(raw.hook_headlines ?? raw.headlines, 10),
    benefits: ensureArrayLength(raw.benefits, 5),
    dm_messages: ensureArrayLength(raw.dm_messages, 5),
    comment_triggers: ensureArrayLength(raw.comment_triggers, 5),
    scarcity_lines: ensureArrayLength(raw.scarcity_lines, 5),
    shortform_scripts: ensureScripts(raw.shortform_scripts),
  };
}

function parseAndValidate(jsonStr: string): GenerateOutput | null {
  try {
    // Try to extract JSON from markdown code fence if present
    let cleanJson = jsonStr.trim();
    const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanJson = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(cleanJson) as Record<string, unknown>;

    // First try strict validation
    const strictResult = responseSchema.safeParse(parsed);
    if (strictResult.success) {
      return strictResult.data;
    }

    // If strict fails, try normalizing the output
    const normalized = normalizeOutput(parsed);
    const normalizedResult = responseSchema.safeParse(normalized);
    if (normalizedResult.success) {
      return normalizedResult.data;
    }

    console.log("[parseAndValidate] validation failed:", normalizedResult.error.issues);
    return null;
  } catch (e) {
    console.log("[parseAndValidate] JSON parse error:", e);
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
    { role: "user", content: STRICT_JSON_RETRY_PROMPT },
  ];
}

export async function POST(request: Request) {
  // [1] 단계 로깅: 환경 변수 존재 여부 (값은 노출하지 않음)
  const envSummary = safeServerEnvSummary();
  console.log("[generate] step 1 env summary:", JSON.stringify(envSummary));

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    console.log("[generate] step 2 createClient...");
    supabase = await createClient();
    console.log("[generate] step 2 createClient ok");
  } catch (e) {
    if (e instanceof EnvError) {
      console.error("[generate] SERVER_MISCONFIGURED at createClient:", e.message);
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

  // Auth required: reject unauthenticated requests
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "로그인이 필요합니다.",
        },
      },
      { status: 401 }
    );
  }

  let plan: PlanType = "free";
  let isTrial = false;
  const { data: profile } = await supabase
    .from("users")
    .select("plan, trial_ends_at")
    .eq("id", user.id)
    .single();
  plan =
    profile?.plan === "standard" || profile?.plan === "pro"
      ? profile.plan
      : "free";
  // Check if user is in trial period (free plan + trial_ends_at in the future)
  if (plan === "free" && profile?.trial_ends_at) {
    isTrial = new Date(profile.trial_ends_at) > new Date();
  }

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
    console.log("[generate] step 3 parsing body...");
    body = await request.json();
    console.log("[generate] step 3 body parsed:", JSON.stringify(body));
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

  console.log("[generate] step 4 validating schema...");
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    console.log("[generate] step 4 schema validation failed:", JSON.stringify(parsed.error.issues));
    const inputTooLong = parsed.error.issues.some(
      (i) =>
        i.path.join(".") === "input_value" &&
        (i.code === "too_big" || String(i.message).includes("2000"))
    );
    if (inputTooLong) {
      try {
        await writeErrorLog(supabase, {
          route: "/api/generate",
          method: "POST",
          status: 400,
          error_code: "INPUT_TOO_LONG",
          message: "입력 길이가 너무 깁니다. 2000자 이내로 입력해 주세요.",
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
            message: "입력 길이가 너무 깁니다. 2000자 이내로 입력해 주세요.",
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

  // Input validation: prevent hallucination from vague input
  const inputValidation = validateProductInput(input_value);
  if (!inputValidation.valid && inputValidation.error) {
    try {
      await writeErrorLog(supabase, {
        route: "/api/generate",
        method: "POST",
        status: 400,
        error_code: inputValidation.error.code,
        message: inputValidation.error.message,
        details: { input_length: input_value.length },
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
          code: inputValidation.error.code,
          message: inputValidation.error.message,
        },
      },
      { status: 400 }
    );
  }

  const normalizedInput = input_value.trim();
  const cacheKeyPayload = JSON.stringify({
    channel,
    vibe,
    normalized_input: normalizedInput,
  });
  const cache_key =
    createHash("sha256").update(cacheKeyPayload).digest("hex");

  // Check cache
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
    const cachedOutput = responseSchema.safeParse(cached.output_json);
    if (cachedOutput.success) {
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
            output: cachedOutput.data,
            credits: { before: balance, after: balance },
          },
          cacheHit: true,
        },
        { status: 200 }
      );
    }
    console.log("[generate] cached output invalid, regenerating");
  }

  // Debit credits
  console.log("[generate] step 5 debiting credits...");
  const debitResult = await debitCredits(supabase, {
    userId: user.id,
    amount: 1,
    idempotencyKey: idempotency_key,
    reason: "generate",
  });
  console.log("[generate] step 5 debit result:", JSON.stringify(debitResult));

  if (!debitResult.ok) {
    const logPayload = {
      route: "/api/generate",
      method: "POST",
      user_id: user.id,
      ip,
      user_agent: request.headers.get("user-agent") ?? null,
      details: { channel, vibe, input_length: input_value.length, debit_outcome: debitResult.error },
    } as const;
    if (debitResult.error === "INSUFFICIENT_CREDITS") {
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
    if (debitResult.error === "DAILY_LIMIT_EXCEEDED") {
      try {
        await writeErrorLog(supabase, {
          ...logPayload,
          status: 429,
          error_code: "DAILY_LIMIT_EXCEEDED",
          message: "Trial daily limit reached (5/day)",
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "DAILY_LIMIT_EXCEEDED",
            message: "오늘 체험 생성 5회를 모두 사용했습니다.",
          },
        },
        { status: 429 }
      );
    }
    if (debitResult.error === "MONTHLY_LIMIT_EXCEEDED") {
      try {
        await writeErrorLog(supabase, {
          ...logPayload,
          status: 429,
          error_code: "MONTHLY_LIMIT_EXCEEDED",
          message: "Free plan monthly limit reached (10/month)",
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "MONTHLY_LIMIT_EXCEEDED",
            message: "이번 달 무료 10회를 모두 사���했습니다.",
          },
        },
        { status: 429 }
      );
    }
    if (debitResult.error === "IDEMPOTENCY_CONFLICT") {
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
        error_code: debitResult.error,
        message: String(debitResult.error),
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: debitResult.error, message: String(debitResult.error) } },
      { status: 400 }
    );
  }

  if (debitResult.duplicated) {
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
      if (gen?.output_json) {
        const validatedOutput = responseSchema.safeParse(gen.output_json);
        if (validatedOutput.success) {
          return NextResponse.json(
            {
              ok: true,
              data: {
                generationId: gen.id,
                output: validatedOutput.data,
                credits: { before: debitResult.before, after: debitResult.after },
              },
            },
            { status: 200 }
          );
        }
        console.log("[generate] idempotent output invalid, returning conflict");
      }
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

  const debit = debitResult;

  let openai;
  try {
    console.log("[generate] step 3 getOpenAIClient...");
    openai = getOpenAIClient();
    console.log("[generate] step 3 getOpenAIClient ok");
  } catch (e) {
    // Refund the debit since we can't proceed with generation
    const refund = await refundCredits(supabase, {
      userId: user.id,
      amount: 1,
      idempotencyKey: idempotency_key,
    });
    if (!refund.ok) {
      console.error("[generate] refund failed after OpenAI init error:", refund.error);
    } else {
      console.log("[generate] refunded credit after OpenAI init failure");
    }
    if (e instanceof EnvError) {
      console.error("[generate] SERVER_MISCONFIGURED at getOpenAIClient:", e.message);
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

  const selectedModel = getModelForPlan(plan, isTrial);
  console.log("[generate] selected model:", selectedModel, "plan:", plan, "isTrial:", isTrial);

  const runCompletion = async (
    msgs: OpenAI.Chat.ChatCompletionMessageParam[]
  ) =>
    openai.chat.completions.create({
      model: selectedModel,
      messages: msgs,
      max_tokens: OPENAI_MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    });

  let completion: Awaited<ReturnType<typeof runCompletion>>;
  let output: GenerateOutput;

  try {
    console.log("[generate] step 6 calling OpenAI...");
    completion = await runCompletion(messages);
    console.log("[generate] step 6 OpenAI response received");
    const content = completion.choices[0]?.message?.content?.trim();
    console.log("[generate] step 6 content length:", content?.length ?? 0);
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
      console.error("[generate] step 6 parsing failed, content:", content?.substring(0, 200));
      throw new Error("Model returned invalid or non-conforming JSON after retry");
    }
    output = parsed;
    console.log("[generate] step 6 parsing success");
  } catch (e) {
    console.error("[generate] step 6 error:", e);
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

  console.log("[generate] step 7 inserting generation...");

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
      model: selectedModel,
      input_tokens: usage?.prompt_tokens ?? null,
      output_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
      latency_ms: latencyMs,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[generate] step 7 insert failed:", insertError);
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
        credits: { before: debit!.before, after: debit!.after },
      },
    },
    { status: 200 }
  );
}
