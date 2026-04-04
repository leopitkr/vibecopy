import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnUrl = searchParams.get("returnUrl") || "/generate";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        // Redirect to onboarding unless profile exists with onboarding_completed === true
        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(
            `${origin}/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${returnUrl}`);
    }
  }

  // On error, redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
