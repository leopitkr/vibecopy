import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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
  const { data: profile, error } = await supabase
    .from("users")
    .select("id, email, plan, credit_balance")
    .eq("id", user.id)
    .single();
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load profile" } },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    data: {
      id: profile.id,
      email: profile.email,
      plan: profile.plan,
      credit_balance: profile.credit_balance,
    },
  });
}
