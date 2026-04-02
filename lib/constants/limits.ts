/**
 * Centralized plan and rate limit constants for VibeCopy.
 * All files should import from here to ensure consistency.
 */

export type PlanType = "free" | "standard" | "pro";

export type PlanLimitType = "daily" | "monthly" | "unlimited";

export interface PlanConfig {
  dailyLimit?: number;
  monthlyCredits?: number;
  type: PlanLimitType;
  label: string;
  labelKo: string;
}

export const PLAN_LIMITS: Record<"guest" | PlanType, PlanConfig> = {
  guest: { dailyLimit: 1, type: "daily", label: "Guest", labelKo: "비회원" },
  free: { dailyLimit: 3, type: "daily", label: "Free", labelKo: "Free" },
  standard: { monthlyCredits: 500, type: "monthly", label: "Standard", labelKo: "Standard" },
  pro: { monthlyCredits: 999999, type: "unlimited", label: "Pro", labelKo: "Pro" },
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

// Threshold for "low credit" warning display
export const LOW_CREDIT_THRESHOLD: Record<PlanType, number> = {
  free: 1,
  standard: 50,
  pro: 0, // Pro has unlimited, no warning needed
} as const;
