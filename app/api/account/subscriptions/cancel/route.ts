import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  let body: { subscription_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { subscription_id } = body;
  if (!subscription_id) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "subscription_id is required" } },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id, stripe_subscription_id, status")
    .eq("id", subscription_id)
    .eq("user_id", user.id)
    .single();

  if (!sub) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "구독을 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  if (sub.status !== "active" && sub.status !== "trialing") {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "취소할 수 없는 구독 상태입니다." } },
      { status: 400 }
    );
  }

  // TODO: When Stripe is integrated, call stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true })
  // For now, just update the DB flag
  const { error } = await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("id", subscription_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
