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
        try {
          const { data: profile, error } = await supabase
            .from("users")
            .select("onboarding_completed")
            .eq("id", user.id)
            .maybeSingle();

          // New user (no profile row yet) or onboarding not completed → redirect to onboarding
          if (!error && (!profile || !profile.onboarding_completed)) {
            return NextResponse.redirect(
              `${origin}/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`
            );
          }
        } catch {
          // Column may not exist yet — skip onboarding redirect
        }
      }

      return NextResponse.redirect(`${origin}${returnUrl}`);
    }
  }

  // On error, redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
