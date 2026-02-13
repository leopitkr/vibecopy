import { createClient } from "@/lib/supabase/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import { NextResponse } from "next/server";

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
    .select("id, email, plan, credit_balance")
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

  // Free plan: show remaining daily uses (3 - today's debits), not DB credit_balance
  let creditBalance = profile.credit_balance;
  if (profile.plan === "free") {
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
    creditBalance = Math.max(0, 3 - todayUsed);
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: profile.id,
      email: profile.email,
      plan: profile.plan,
      credit_balance: creditBalance,
    },
  });
}
