import OpenAI from "openai";
import { getServerEnv } from "@/lib/env/server";

const OPENAI_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 900;

export function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = getServerEnv();
  return new OpenAI({ apiKey: OPENAI_API_KEY, timeout: OPENAI_TIMEOUT_MS });
}

export const OPENAI_MODEL = "gpt-4o-mini";
export const OPENAI_MAX_OUTPUT_TOKENS = MAX_OUTPUT_TOKENS;
