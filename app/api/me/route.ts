import { createClient } from "@/lib/supabase/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import { NextResponse } from "next/server";
import { PLAN_LIMITS, type PlanType, type PlanLimitType } from "@/lib/constants/limits";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
  }
  let result = await supabase
    .from("users")
    .select("id, email, plan, credit_balance, trial_ends_at")
    .eq("id", user.id)
    .single();
  let profile = result.data;
  let error = result.error;

  // If no row (e.g. user signed up before trigger existed), create it and retry
  if (error && (result.error?.code === "PGRST116" || result.error?.message?.includes("single JSON object"))) {
    await supabase.from("users").insert({ id: user.id, email: user.email ?? undefined }).select().single();
    result = await supabase
      .from("users")
      .select("id, email, plan, credit_balance")
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

  // Build plan info for the response
  const plan = profile.plan as PlanType;
  const planConfig = PLAN_LIMITS[plan];

  // Check trial status
  const isTrial = plan === "free" && profile.trial_ends_at
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  let creditBalance = profile.credit_balance;
  let remaining = creditBalance;
  let limit = planConfig.monthlyCredits ?? 0;

  // Free plan: show remaining daily uses, not DB credit_balance
  if (plan === "free") {
    // Trial users get 3/day, regular free users get 1/day
    const dailyLimit = isTrial ? 3 : PLAN_LIMITS.free.dailyLimit!;
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("usage_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "debit")
      .eq("reason", "generate")
      .gte("created_at", startOfToday.toISOString());
    const todayUsed = count ?? 0;
    creditBalance = Math.max(0, dailyLimit - todayUsed);
    remaining = creditBalance;
    limit = dailyLimit;
  }

  // Build plan_info for frontend
  const planInfo: {
    type: PlanLimitType;
    label: string;
    limit: number;
    remaining: number;
  } = {
    type: planConfig.type,
    label: planConfig.labelKo,
    limit,
    remaining,
  };

  return NextResponse.json({
    ok: true,
    data: {
      id: profile.id,
      email: profile.email,
      plan: profile.plan,
      credit_balance: creditBalance,
      plan_info: planInfo,
      trial: isTrial
        ? {
            active: true,
            ends_at: profile.trial_ends_at,
            model: "gpt-4o",
          }
        : null,
    },
  });
}
