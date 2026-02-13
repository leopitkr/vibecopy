/**
 * Per-user + per-IP rate limiting for POST /api/generate.
 * Sliding window: counts rows in rate_limits for (user_id, ip) within 1min / 1hr.
 * Inserts one row on every allowed request. RLS restricts to own user_id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanType = "free" | "standard" | "pro";

const PER_MINUTE: Record<PlanType, number> = {
  free: 3,
  standard: 10,
  pro: 30,
};

const PER_HOUR: Record<PlanType, number> = {
  free: 10,
  standard: 100,
  pro: 500,
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Check sliding-window rate limit for (userId, ip) and plan.
 * If allowed, inserts one row into rate_limits and returns { allowed: true }.
 * Otherwise returns { allowed: false } without inserting (no credit deduction).
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  params: { userId: string; ip: string; plan: PlanType }
): Promise<RateLimitResult> {
  const { userId, ip, plan } = params;
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [minCount, hourCount] = await Promise.all([
    supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ip", ip)
      .gte("created_at", oneMinAgo.toISOString()),
    supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ip", ip)
      .gte("created_at", oneHourAgo.toISOString()),
  ]);

  const perMin = PER_MINUTE[plan];
  const perHour = PER_HOUR[plan];

  if ((minCount.count ?? 0) >= perMin) {
    return { allowed: false, message: "Too many requests per minute. Please wait." };
  }
  if ((hourCount.count ?? 0) >= perHour) {
    return { allowed: false, message: "Too many requests per hour. Please wait." };
  }

  const { error } = await supabase.from("rate_limits").insert({
    user_id: userId,
    ip,
  });

  if (error) {
    console.error("[rateLimit] insert failed:", error);
    return { allowed: false, message: "Rate limit recording failed. Please retry." };
  }

  return { allowed: true };
}
