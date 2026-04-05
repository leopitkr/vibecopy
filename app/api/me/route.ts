import { createClient } from "@/lib/supabase/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import { NextResponse } from "next/server";
import { PLAN_LIMITS, TRIAL_CONFIG, type PlanType, type PlanLimitType } from "@/lib/constants/limits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const unauth = NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
    unauth.headers.set("Cache-Control", "no-store, max-age=0");
    return unauth;
  }
  // Try full select first; if onboarding columns don't exist yet, fall back to basic select
  let result = await supabase
    .from("users")
    .select("id, email, nickname, plan, credit_balance, trial_ends_at, onboarding_completed, terms_agreed_at")
    .eq("id", user.id)
    .single();

  // Column doesn't exist (42703) — fall back without onboarding fields
  if (result.error?.code === "42703") {
    result = await supabase
      .from("users")
      .select("id, email, plan, credit_balance, trial_ends_at")
      .eq("id", user.id)
      .single();
  }

  let profile = result.data;
  let error = result.error;

  // If no row (e.g. user signed up before trigger existed), create it and retry
  if (error && (result.error?.code === "PGRST116" || result.error?.message?.includes("single JSON object"))) {
    await supabase.from("users").insert({ id: user.id, email: user.email ?? undefined }).select().single();
    result = await supabase
      .from("users")
      .select("id, email, plan, credit_balance, trial_ends_at")
      .eq("id", user.id)
      .single();
    profile = result.data;
    error = result.error;
  }

  if (error || !profile) {
    try {
      await writeErrorLog(supabase, {
        route: "/api/me",
        method: "GET",
        status: 500,
        error_code: "INTERNAL",
        message: "Failed to load profile",
        user_id: user.id,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load profile" } },
      { status: 500 }
    );
  }

  const plan = (profile.plan as PlanType) || "free";
  const planConfig = PLAN_LIMITS[plan];

  // Check trial status
  const isTrialActive = plan === "free" && profile.trial_ends_at
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  // Compute KST boundaries
  const nowKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const startOfTodayKST = new Date(nowKST);
  startOfTodayKST.setHours(0, 0, 0, 0);
  const startOfMonthKST = new Date(nowKST.getFullYear(), nowKST.getMonth(), 1, 0, 0, 0, 0);

  // Convert KST boundaries to UTC ISO for DB query
  const todayStartUTC = new Date(startOfTodayKST.getTime() - 9 * 60 * 60 * 1000).toISOString();
  const monthStartUTC = new Date(startOfMonthKST.getTime() - 9 * 60 * 60 * 1000).toISOString();

  let remaining: number;
  let limit: number;
  let limitType: PlanLimitType;
  let effectiveModel: string;
  let upgradeCta: string | null = null;

  if (plan === "free") {
    // Helper: count effective debits (debits - refunds) in a period
    const countEffectiveDebits = async (periodStartUTC: string) => {
      const { count: debits } = await supabase
        .from("usage_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "debit")
        .eq("reason", "generate")
        .gte("created_at", periodStartUTC);
      const { count: refunds } = await supabase
        .from("usage_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "credit")
        .like("idempotency_key", "refund:%")
        .gte("created_at", periodStartUTC);
      return Math.max(0, (debits ?? 0) - (refunds ?? 0));
    };

    if (isTrialActive) {
      // Trial: 5/day, gpt-4o
      limit = TRIAL_CONFIG.dailyLimit;
      limitType = "daily";
      effectiveModel = TRIAL_CONFIG.model;

      const effectiveUsed = await countEffectiveDebits(todayStartUTC);
      remaining = Math.max(0, limit - effectiveUsed);

      if (remaining <= 0) upgradeCta = "trial_daily_exhausted";
      else if (remaining <= 2) upgradeCta = "trial_daily_low";
    } else {
      // Free (post-trial): 10/month, gpt-4o-mini
      limit = PLAN_LIMITS.free.monthlyCredits;
      limitType = "monthly";
      effectiveModel = PLAN_LIMITS.free.model;

      const effectiveUsed = await countEffectiveDebits(monthStartUTC);
      remaining = Math.max(0, limit - effectiveUsed);

      if (remaining <= 0) upgradeCta = "free_monthly_exhausted";
      else if (remaining <= 2) upgradeCta = "free_monthly_low";

      // If trial just ended, surface it
      if (profile.trial_ends_at) {
        upgradeCta = upgradeCta ?? "trial_ended";
      }
    }
  } else {
    // Standard / Pro: credit_balance based
    limit = planConfig.monthlyCredits;
    limitType = "monthly";
    effectiveModel = planConfig.model;
    remaining = profile.credit_balance ?? 0;

    if (remaining <= 0) upgradeCta = "paid_monthly_exhausted";
    else if (remaining <= (plan === "standard" ? 10 : 10)) upgradeCta = "paid_monthly_low";
  }

  // Build plan_info for frontend
  const planInfo = {
    type: limitType,
    label: isTrialActive ? TRIAL_CONFIG.label : planConfig.labelKo,
    limit,
    remaining,
  };

  const res = NextResponse.json({
    ok: true,
    data: {
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname ?? null,
      social_nickname: user.user_metadata?.full_name || user.user_metadata?.name || null,
      plan: profile.plan,
      credit_balance: remaining,
      plan_info: planInfo,
      onboarding_completed: profile.onboarding_completed ?? false,
      terms_agreed_at: profile.terms_agreed_at ?? null,
      trial_ends_at: profile.trial_ends_at ?? null,
      trial: isTrialActive
        ? {
            active: true,
            ends_at: profile.trial_ends_at,
            model: TRIAL_CONFIG.model,
          }
        : null,
      // Enhanced fields for frontend UX
      is_trial_active: isTrialActive,
      effective_model: effectiveModel,
      monthly_limit: plan === "free" && isTrialActive ? null : limit,
      daily_trial_limit: isTrialActive ? TRIAL_CONFIG.dailyLimit : null,
      remaining_monthly_credits: limitType === "monthly" ? remaining : null,
      remaining_daily_trial_credits: limitType === "daily" ? remaining : null,
      upgrade_cta_type: upgradeCta,
    },
  });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
