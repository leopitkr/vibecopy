/**
 * Plan <-> Stripe Price ID mapping and credit rules.
 * Monthly credits are the source of truth for paid plan resets (invoice.paid webhook).
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
  free: 10,
  standard: 300,
  pro: 1_000,
};

export type PlanType = "free" | "standard" | "pro";

export function getPlanFromPriceId(priceId: string | null): PlanType {
  if (!priceId) return "free";
  const { STRIPE_PRICE_STANDARD, STRIPE_PRICE_PRO } = getServerEnv();
  if (priceId === STRIPE_PRICE_STANDARD) return "standard";
  if (priceId === STRIPE_PRICE_PRO) return "pro";
  return "free";
}
