import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { getPlanPriceMap } from "@/lib/billing/plans";
import { EnvError } from "@/lib/env/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import { z } from "zod";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  plan: z.enum(["standard", "pro"]),
});

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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const user_agent = request.headers.get("user-agent") ?? null;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    try {
      await writeErrorLog(supabase, {
        route: "/api/billing/checkout",
        method: "POST",
        status: 400,
        error_code: "BAD_REQUEST",
        message: "Request body must be JSON",
        user_id: user.id,
        ip,
        user_agent,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues?.map((i) => i.message).join("; ") ??
      parsed.error.message;
    try {
      await writeErrorLog(supabase, {
        route: "/api/billing/checkout",
        method: "POST",
        status: 400,
        error_code: "BAD_REQUEST",
        message: msg,
        user_id: user.id,
        ip,
        user_agent,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: msg } },
      { status: 400 }
    );
  }

  const { plan } = parsed.data;
  let priceId: string | undefined;
  try {
    priceId = getPlanPriceMap()[plan];
  } catch (e) {
    if (e instanceof EnvError) {
      try {
        await writeErrorLog(supabase, {
          route: "/api/billing/checkout",
          method: "POST",
          status: 500,
          error_code: "SERVER_MISCONFIGURED",
          message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          user_id: user.id,
          ip,
          user_agent,
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "SERVER_MISCONFIGURED",
            message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          },
        },
        { status: 500 }
      );
    }
    throw e;
  }
  if (!priceId) {
    try {
      await writeErrorLog(supabase, {
        route: "/api/billing/checkout",
        method: "POST",
        status: 400,
        error_code: "PRICE_NOT_CONFIGURED",
        message: "Stripe price not configured for this plan",
        details: { plan },
        user_id: user.id,
        ip,
        user_agent,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      {
        error: {
          code: "PRICE_NOT_CONFIGURED",
          message: "Stripe price not configured for this plan",
        },
      },
      { status: 400 }
    );
  }

  try {
    const { url } = await createCheckoutSession(user.id, priceId);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof EnvError) {
      try {
        await writeErrorLog(supabase, {
          route: "/api/billing/checkout",
          method: "POST",
          status: 500,
          error_code: "SERVER_MISCONFIGURED",
          message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          user_id: user.id,
          ip,
          user_agent,
        });
      } catch {
        /* best-effort */
      }
      return NextResponse.json(
        {
          error: {
            code: "SERVER_MISCONFIGURED",
            message: "서버 설정 오류입니다. 잠시 후 다시 시도해 주세요.",
          },
        },
        { status: 500 }
      );
    }
    const msg = e instanceof Error ? e.message : "Checkout failed";
    try {
      await writeErrorLog(supabase, {
        route: "/api/billing/checkout",
        method: "POST",
        status: 500,
        error_code: "INTERNAL",
        message: msg,
        details: { plan },
        user_id: user.id,
        ip,
        user_agent,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: msg } },
      { status: 500 }
    );
  }
}
