/**
 * Server-side error logging to Supabase error_logs.
 * Best-effort: never throws; do not log PII, API keys, or full prompts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const MESSAGE_MAX_LENGTH = 500;

export type ErrorLogInput = {
  route: string;
  method: string;
  error_code?: string | null;
  status?: number | null;
  message?: string | null;
  /** Safe details only: e.g. channel, vibe, input_length, cache_hit, rate_limit_outcome, debit_outcome. No full body. */
  details?: Record<string, unknown> | null;
  user_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
};

function capMessage(msg: string | null | undefined): string | null {
  if (msg == null || msg === "") return null;
  const s = String(msg);
  return s.length > MESSAGE_MAX_LENGTH ? s.slice(0, MESSAGE_MAX_LENGTH) + "…" : s;
}

/**
 * Write one row to error_logs. Best-effort: catches and ignores insert errors.
 * Use server client when user_id is set (RLS allows own insert). Use service role when user_id is null (e.g. webhook).
 */
export async function writeErrorLog(
  supabase: SupabaseClient,
  input: ErrorLogInput
): Promise<void> {
  const request_id = randomUUID();
  const message = capMessage(input.message ?? null);

  const row = {
    user_id: input.user_id ?? null,
    route: input.route,
    method: input.method,
    error_code: input.error_code ?? null,
    status: input.status ?? null,
    message,
    details: input.details ?? null,
    request_id,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
  };

  try {
    await supabase.from("error_logs").insert(row);
  } catch {
    // Best-effort: do not break main response path
  }
}
