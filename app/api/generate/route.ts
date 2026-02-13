import type OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { debitCredits, refundCredits } from "@/lib/db/credits";
import {
  getOpenAIClient,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
} from "@/lib/openai/client";
import { buildGenerateCopyMessages } from "@/lib/prompts/generateCopy";
import { z } from "zod";
import { NextResponse } from "next/server";

// Manual test scenarios (run with valid session cookie):
// (A) Free user: 4th call in same day with unique idempotency_key -> 429 DAILY_LIMIT_EXCEEDED.
// (B) User with 0 credit_balance -> 402 INSUFFICIENT_CREDITS.
// (C) Simulate OpenAI failure (e.g. invalid key): refund runs; usage_ledger has credit row; balance restored.
// (D) Same idempotency_key twice: 2nd request returns 200 with same output (duplicated), no double charge.
// (E) usage_ledger: unique(user_id, idempotency_key) enforced by migration 20260213120000.

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
  input_value: z.string().min(1).max(10000),
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues?.map((i) => i.message).join("; ") ??
      parsed.error.message;
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: msg } },
      { status: 400 }
    );
  }

  const { idempotency_key, input_type, input_value, channel, vibe } =
    parsed.data;

  const debit = await debitCredits(supabase, {
    userId: user.id,
    amount: 1,
    idempotencyKey: idempotency_key,
    reason: "generate",
  });

  if (!debit.ok) {
    if (debit.error === "INSUFFICIENT_CREDITS")
      return NextResponse.json(
        {
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Not enough credits to generate",
          },
        },
        { status: 402 }
      );
    if (debit.error === "DAILY_LIMIT_EXCEEDED")
      return NextResponse.json(
        {
          error: {
            code: "DAILY_LIMIT_EXCEEDED",
            message: "Free plan daily limit (3) reached",
          },
        },
        { status: 429 }
      );
    if (debit.error === "IDEMPOTENCY_CONFLICT")
      return NextResponse.json(
        {
          error: {
            code: "IDEMPOTENCY_CONFLICT",
            message: "Duplicate request or partial state; retry with a new key",
          },
        },
        { status: 409 }
      );
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
    const msg = e instanceof Error ? e.message : "OpenAI not configured";
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
