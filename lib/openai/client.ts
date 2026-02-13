import OpenAI from "openai";

const OPENAI_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 900;

export function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey: key, timeout: OPENAI_TIMEOUT_MS });
}

export const OPENAI_MODEL = "gpt-4o-mini";
export const OPENAI_MAX_OUTPUT_TOKENS = MAX_OUTPUT_TOKENS;
