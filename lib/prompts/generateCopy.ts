import type OpenAI from "openai";

/**
 * Prompt for strict JSON copy generation.
 * Response must match the schema: headlines[10], benefits[5], shortform_scripts[2], ctas[5], risk_check.
 */

const RESPONSE_SCHEMA_DESC = `
You must respond with ONLY a single JSON object (no markdown, no code fence) with exactly these keys:
- "headlines": array of exactly 10 strings (ad headlines)
- "benefits": array of exactly 5 strings (product benefits)
- "shortform_scripts": array of exactly 2 objects, each with "hook" (string) and "script" (string)
- "ctas": array of exactly 5 strings (call-to-action phrases)
- "risk_check": object with "level" (one of "low", "medium", "high"), "flags" (array of strings), "notes" (array of strings)
`;

export function buildGenerateCopyMessages(
  inputType: "url" | "text",
  inputValue: string,
  channel: string,
  vibe: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemContent = `You are a copywriter generating marketing copy. ${RESPONSE_SCHEMA_DESC} Output only valid JSON.`;
  const userContent =
    inputType === "url"
      ? `Generate copy for channel "${channel}" and vibe "${vibe}". Product/source URL or context: ${inputValue}`
      : `Generate copy for channel "${channel}" and vibe "${vibe}". Product/input text: ${inputValue}`;
  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}

