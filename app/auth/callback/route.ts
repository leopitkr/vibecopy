import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/generate";
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent"); // "signin" | "signup"
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        // 1) Existing user, onboarding done → returnUrl
        if (profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}${returnUrl}`);
        }

        // 2) Existing user, onboarding incomplete → resume onboarding
        if (profile) {
          return NextResponse.redirect(
            `${origin}/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`
          );
        }

        // 3) New user (no profile) — intent decides next step
        if (intent === "signup") {
          // signup intent: terms already agreed → straight to onboarding
          return NextResponse.redirect(
            `${origin}/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`
          );
        }
        // signin intent or missing: needs terms agreement
        return NextResponse.redirect(
          `${origin}/login?mode=signup-complete&returnUrl=${encodeURIComponent(returnUrl)}`
        );
      }

      return NextResponse.redirect(`${origin}${returnUrl}`);
    }
  }

  // On error, redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
