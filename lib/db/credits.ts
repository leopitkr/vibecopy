/**
 * Credit debit/refund via usage_ledger (source of truth).
 *
 * Idempotency: usage_ledger has unique(user_id, idempotency_key). A duplicate
 * key on debit returns { ok: true, duplicated: true } without inserting again
 * (no double charge). Refund uses key "refund:"||original_key so one refund per
 * original request.
 *
 * Limit enforcement (server-only, in debit_credits RPC):
 *   Trial (7-day)       = 5/day  (count-based, KST)
 *   Free  (post-trial)  = 10/month (count-based, KST)
 *   Standard/Pro        = credit_balance based
 *
 * All mutations run in Postgres transactions via RPC (debit_credits,
 * refund_credits). Caller must use Supabase client with auth.uid() = userId.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type DebitReason = "generate" | "plan_reset" | "admin";

export type DebitResult =
  | { ok: true; duplicated?: boolean; before: number; after: number }
  | {
      ok: false;
      error:
        | "INSUFFICIENT_CREDITS"
        | "DAILY_LIMIT_EXCEEDED"
        | "MONTHLY_LIMIT_EXCEEDED"
        | "IDEMPOTENCY_CONFLICT"
        | "UNAUTHORIZED"
        | "BAD_REQUEST";
    };

export type RefundResult =
  | { ok: true; duplicated?: boolean; before: number; after: number }
  | { ok: false; error: string };

/**
 * Debit credits atomically. Checks idempotency first; if key exists returns
 * duplicated without charging. Enforces:
 *   - Trial: 5/day (count-based)
 *   - Free: 10/month (count-based)
 *   - Standard/Pro: credit_balance check
 */
export async function debitCredits(
  supabase: SupabaseClient,
  params: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    reason: DebitReason;
  }
): Promise<DebitResult> {
  const { data, error } = await supabase.rpc("debit_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_idempotency_key: params.idempotencyKey,
    p_reason: params.reason,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "IDEMPOTENCY_CONFLICT" };
    }
    return { ok: false, error: "BAD_REQUEST" };
  }

  const result = data as
    | { ok: true; duplicated?: boolean; before: number; after: number }
    | { ok: false; error: string };
  if (!result.ok) {
    const err = (result as { ok: false; error: string }).error;
    const code = String(err ?? "").toUpperCase();
    if (
      code === "INSUFFICIENT_CREDITS" ||
      code === "DAILY_LIMIT_EXCEEDED" ||
      code === "MONTHLY_LIMIT_EXCEEDED" ||
      code === "UNAUTHORIZED" ||
      code === "BAD_REQUEST"
    ) {
      return { ok: false, error: code as DebitResult extends { ok: false } ? DebitResult["error"] : never };
    }
    return { ok: false, error: "BAD_REQUEST" };
  }
  return {
    ok: true,
    duplicated: result.duplicated ?? false,
    before: result.before,
    after: result.after,
  };
}

/**
 * Refund credits atomically. Uses idempotency_key = "refund:"||originalKey
 * so the same refund is not applied twice.
 */
export async function refundCredits(
  supabase: SupabaseClient,
  params: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    reason?: string;
  }
): Promise<RefundResult> {
  const { data, error } = await supabase.rpc("refund_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_original_idempotency_key: params.idempotencyKey,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, duplicated: true, before: 0, after: 0 };
    }
    return { ok: false, error: error.message };
  }

  const result = data as
    | { ok: true; duplicated?: boolean; before: number; after: number }
    | { ok: false; error: string };
  if (!result.ok) return { ok: false, error: result.error ?? "Refund failed" };
  return {
    ok: true,
    duplicated: result.duplicated ?? false,
    before: result.before,
    after: result.after,
  };
}
