import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require onboarding completion
const PROTECTED_ROUTES = ["/generate", "/history", "/me", "/dashboard"];
// Routes that should be accessible without onboarding
const ONBOARDING_ALLOWED = ["/onboarding", "/welcome", "/auth", "/api", "/login", "/signup", "/pricing", "/guide", "/faq", "/terms", "/feedback"];

export async function middleware(request: NextRequest) {
  // If OAuth code arrives at root, redirect to /auth/callback to complete the exchange
  const pathname = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get("code");
  if (pathname === "/" && code) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code);
    return NextResponse.redirect(callbackUrl);
  }

  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, check onboarding status for protected routes
  if (user) {
    const pathname = request.nextUrl.pathname;
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAllowed = ONBOARDING_ALLOWED.some((r) => pathname.startsWith(r));

    if (isProtected && !isAllowed) {
      // Check onboarding status (gracefully skip if column doesn't exist yet)
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!error && profile && !profile.onboarding_completed) {
          const redirectUrl = new URL("/onboarding", request.url);
          redirectUrl.searchParams.set("returnUrl", pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        // Column may not exist yet — let user through
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
