/**
 * SERVER-ONLY: Centralized env validation. Never import from client components.
 */

import { z } from "zod";

const urlSchema = z.string().min(1).refine((s) => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}, "Invalid URL");

const requiredString = z.string().min(1, "Required env var is empty");

const serverEnvSchema = z.object({
  OPENAI_API_KEY: requiredString,
  STRIPE_SECRET_KEY: requiredString,
  STRIPE_WEBHOOK_SECRET: requiredString,
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString,
  APP_URL: urlSchema,
  STRIPE_PRICE_STANDARD: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvError extends Error {
  code = "ENV_MISSING" as const;
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

function parse(): ServerEnv {
  const raw = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APP_URL: process.env.APP_URL,
    STRIPE_PRICE_STANDARD: process.env.STRIPE_PRICE_STANDARD,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  };
  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".") ?? "env";
    const msg = `Missing or invalid: ${path}`;
    console.error("[env] getServerEnv validation failed:", msg);
    throw new EnvError(msg);
  }
  const data = result.data;
  return {
    ...data,
    STRIPE_PRICE_STANDARD: data.STRIPE_PRICE_STANDARD?.trim() || undefined,
    STRIPE_PRICE_PRO: data.STRIPE_PRICE_PRO?.trim() || undefined,
  };
}

let cached: ServerEnv | null = null;

/**
 * Returns validated server env. Throws EnvError (code ENV_MISSING) if any required var is missing or invalid.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  cached = parse();
  return cached;
}

/**
 * Get a single env var by name; throws EnvError if missing or empty. Never includes actual value in error.
 */
export function mustGet(name: string): string {
  const val = process.env[name];
  if (val == null || String(val).trim() === "") {
    throw new EnvError(`Missing or invalid: ${name}`);
  }
  return val;
}

/**
 * Returns which server env vars are present (boolean only). For debugging logs; never includes secrets.
 */
export function safeServerEnvSummary(): Record<string, boolean> {
  const names = [
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "APP_URL",
    "STRIPE_PRICE_STANDARD",
    "STRIPE_PRICE_PRO",
  ] as const;
  const out: Record<string, boolean> = {};
  for (const n of names) {
    const v = process.env[n];
    out[n] = v != null && String(v).trim() !== "";
  }
  return out;
}
