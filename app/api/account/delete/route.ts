import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE() {
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

  // TODO: When Stripe is integrated, cancel all active subscriptions via Stripe API first

  // Use admin client to delete user from auth.users (cascades to public.users, generations, subscriptions)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: { code: "SERVER_MISCONFIGURED", message: "서버 설정 오류입니다." } },
      { status: 500 }
    );
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey);

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: error.message } },
      { status: 500 }
    );
  }

  // Sign out the current session
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
