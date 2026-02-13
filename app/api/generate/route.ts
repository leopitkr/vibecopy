import type OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAIClient,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
} from "@/lib/openai/client";
import { buildGenerateCopyMessages } from "@/lib/prompts/generateCopy";
import { z } from "zod";
import { NextResponse } from "next/server";

const channelEnum = z.enum([
  "smartstore",
  "coupang",
  "affiliate",
  "social",
  "shortform",
]);
const vibeEnum = z.enum(["trust", "review", "impulse", "premium", "groupbuy"]);

const requestSchema = z.object({
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
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Request body must be JSON" },
      },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues?.map((i) => i.message).join("; ") ??
      parsed.error.message;
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: msg },
      },
      { status: 400 }
    );
  }

  const { input_type, input_value, channel, vibe } = parsed.data;

  let openai;
  try {
    openai = getOpenAIClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI not configured";
    return NextResponse.json(
      { ok: false, error: { code: "CONFIG_ERROR", message: msg } },
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

  let completion;
  try {
    completion = await runCompletion(messages);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json(
      { ok: false, error: { code: "OPENAI_ERROR", message: msg } },
      { status: 502 }
    );
  }

  const content = completion.choices[0]?.message?.content?.trim();
  let output: GenerateOutput | null = content ? parseAndValidate(content) : null;

  if (!output && content) {
    try {
      const retryMessages = buildRetryMessages(messages, content);
      const retry = await runCompletion(retryMessages);
      const retryContent = retry.choices[0]?.message?.content?.trim();
      output = retryContent ? parseAndValidate(retryContent) : null;
    } catch {
      // fall through to error
    }
  }

  if (!output) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "GENERATION_INVALID",
          message: "Model returned invalid or non-conforming JSON after retry",
        },
      },
      { status: 502 }
    );
  }

  const latencyMs = Date.now() - start;
  const usage = completion.usage;

  const { error: insertError } = await supabase.from("generations").insert({
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
  });

  if (insertError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DB_ERROR",
          message: "Failed to save generation log",
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: output }, { status: 200 });
}
