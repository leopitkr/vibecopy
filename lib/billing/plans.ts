/**
 * Plan ↔ Stripe Price ID mapping and credit rules (VibeCopy_PRD §3.3, tech_design).
 */

import { getServerEnv } from "@/lib/env/server";

export function getPlanPriceMap(): Record<"standard" | "pro", string | undefined> {
  const env = getServerEnv();
  return {
    standard: env.STRIPE_PRICE_STANDARD,
    pro: env.STRIPE_PRICE_PRO,
  };
}

export const PLAN_CREDITS: Record<"free" | "standard" | "pro", number> = {
  free: 0,
  standard: 100,
  pro: 999999,
};

export type PlanType = "free" | "standard" | "pro";

export function getPlanFromPriceId(priceId: string | null): PlanType {
  if (!priceId) return "free";
  const { STRIPE_PRICE_STANDARD, STRIPE_PRICE_PRO } = getServerEnv();
  if (priceId === STRIPE_PRICE_STANDARD) return "standard";
  if (priceId === STRIPE_PRICE_PRO) return "pro";
  return "free";
}
