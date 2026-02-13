/**
 * Plan ↔ Stripe Price ID mapping and credit rules (VibeCopy_PRD §3.3, tech_design).
 */

export const PLAN_PRICE_MAP: Record<"standard" | "pro", string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD,
  pro: process.env.STRIPE_PRICE_PRO,
};

export const PLAN_CREDITS: Record<"free" | "standard" | "pro", number> = {
  free: 0,
  standard: 500,
  pro: 999999,
};

export type PlanType = "free" | "standard" | "pro";

export function getPlanFromPriceId(priceId: string | null): PlanType {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_STANDARD) return "standard";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "free";
}
