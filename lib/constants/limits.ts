/**
 * Centralized plan and rate limit constants for VibeCopy.
 * All files should import from here to ensure consistency.
 *
 * Policy (2026-04-05):
 *   Free:     10/month, gpt-4o-mini
 *   Trial:    7 days, 5/day, gpt-4o, all vibes/channels
 *   Standard: 300/month, gpt-4o, 19,000 KRW
 *   Pro:      1,000/month, gpt-4o, 49,000 KRW
 */

export type PlanType = "free" | "standard" | "pro";

export type PlanLimitType = "daily" | "monthly";

export interface PlanConfig {
  monthlyCredits: number;
  type: PlanLimitType;
  label: string;
  labelKo: string;
  model: "gpt-4o" | "gpt-4o-mini";
  priceKrw: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanConfig> = {
  free: {
    monthlyCredits: 10,
    type: "monthly",
    label: "Free",
    labelKo: "무료",
    model: "gpt-4o-mini",
    priceKrw: 0,
  },
  standard: {
    monthlyCredits: 300,
    type: "monthly",
    label: "Standard",
    labelKo: "Standard",
    model: "gpt-4o",
    priceKrw: 19_000,
  },
  pro: {
    monthlyCredits: 1_000,
    type: "monthly",
    label: "Pro",
    labelKo: "Pro",
    model: "gpt-4o",
    priceKrw: 49_000,
  },
} as const;

/** Trial period config (7-day free trial after signup) */
export const TRIAL_CONFIG = {
  dailyLimit: 5,
  durationDays: 7,
  model: "gpt-4o" as const,
  label: "무료 체험",
} as const;

export interface RateLimitConfig {
  perMinute: number;
  perHour: number;
}

export const RATE_LIMITS: Record<PlanType, RateLimitConfig> = {
  free: { perMinute: 3, perHour: 10 },
  standard: { perMinute: 10, perHour: 100 },
  pro: { perMinute: 30, perHour: 500 },
} as const;

/** Threshold for "low credit" warning display */
export const LOW_CREDIT_THRESHOLD: Record<PlanType, number> = {
  free: 2,
  standard: 10,
  pro: 10,
} as const;

/** History display limits */
export const HISTORY_LIMITS: Record<PlanType, number | null> = {
  free: 30,       // show last 30 only
  standard: null, // unlimited
  pro: null,      // unlimited
} as const;
