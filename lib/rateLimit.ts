/**
 * Per-user + per-IP rate limiting for POST /api/generate.
 * Sliding window: counts rows in rate_limits for (user_id, ip) within 1min / 1hr.
 * Inserts one row on every allowed request. RLS restricts to own user_id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { RATE_LIMITS, type PlanType } from "@/lib/constants/limits";

export type { PlanType };

const PER_MINUTE: Record<PlanType, number> = {
  free: RATE_LIMITS.free.perMinute,
  standard: RATE_LIMITS.standard.perMinute,
  pro: RATE_LIMITS.pro.perMinute,
};

const PER_HOUR: Record<PlanType, number> = {
  free: RATE_LIMITS.free.perHour,
  standard: RATE_LIMITS.standard.perHour,
  pro: RATE_LIMITS.pro.perHour,
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

  // PGRST205: table not found - skip rate limiting if table doesn't exist
  if (minCount.error?.code === "PGRST205" || hourCount.error?.code === "PGRST205") {
    console.warn("[rateLimit] rate_limits table not found, skipping rate limit check");
    return { allowed: true };
  }

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
    // PGRST205: table not found in schema cache - skip rate limiting if table doesn't exist
    if (error.code === "PGRST205") {
      console.warn("[rateLimit] rate_limits table not found, skipping rate limit check");
      return { allowed: true };
    }
    console.error("[rateLimit] insert failed:", error);
    return { allowed: false, message: "Rate limit recording failed. Please retry." };
  }

  return { allowed: true };
}
