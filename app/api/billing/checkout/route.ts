import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { PLAN_PRICE_MAP } from "@/lib/billing/plans";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
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
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: msg } },
      { status: 400 }
    );
  }

  const { plan } = parsed.data;
  const priceId = PLAN_PRICE_MAP[plan];
  if (!priceId) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
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
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json(
      { error: { code: "INTERNAL", message: msg } },
      { status: 500 }
    );
  }
}
