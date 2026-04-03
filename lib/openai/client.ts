import OpenAI from "openai";
import { getServerEnv } from "@/lib/env/server";

const OPENAI_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 2000;

export function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = getServerEnv();
  return new OpenAI({ apiKey: OPENAI_API_KEY, timeout: OPENAI_TIMEOUT_MS });
}

export const OPENAI_MODEL = "gpt-4o-mini";
export const OPENAI_MODEL_PREMIUM = "gpt-4o";
export const OPENAI_MAX_OUTPUT_TOKENS = MAX_OUTPUT_TOKENS;

/**
 * Returns the AI model to use based on the user's plan.
 * Free/guest → gpt-4o-mini, Standard/Pro (or trial) → gpt-4o
 */
export function getModelForPlan(plan: string, isTrial?: boolean): string {
  if (isTrial) return OPENAI_MODEL_PREMIUM;
  if (plan === "standard" || plan === "pro") return OPENAI_MODEL_PREMIUM;
  return OPENAI_MODEL;
}
