import Stripe from "stripe";
import { NextResponse } from "next/server";
import { writeErrorLog } from "@/lib/logging/errorLog";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  PLAN_CREDITS,
  getPlanFromPriceId,
  type PlanType,
} from "@/lib/billing/plans";
import { EnvError, getServerEnv } from "@/lib/env/server";

/*
 * Manual test steps:
 * 1) Checkout complete -> DB updated (subscriptions row with stripe_customer_id, stripe_subscription_id, status active)
 * 2) invoice.paid -> users.credit_balance reset to PLAN_CREDITS[plan], users.plan updated
 * 3) subscription canceled -> customer.subscription.deleted; user downgraded to free, credit_balance = 0
 * 4) Free user upgrade -> after checkout + invoice.paid, users.plan_type changes to standard/pro
 */

function periodTs(sub: { current_period_start?: number; current_period_end?: number }) {
  return {
    start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
    end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }
  let stripe: Stripe;
  let secret: string;
  try {
    const env = getServerEnv();
    stripe = new Stripe(env.STRIPE_SECRET_KEY);
    secret = env.STRIPE_WEBHOOK_SECRET;
  } catch (e) {
    if (e instanceof EnvError) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    throw e;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature";
    const supabase = createServiceRoleClient();
    try {
      await writeErrorLog(supabase, {
        route: "/api/billing/webhook",
        method: "POST",
        status: 400,
        error_code: "WEBHOOK_SIGNATURE_INVALID",
        message: msg,
        details: { reason: "signature_verification_failed" },
        user_id: null,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    if (e instanceof EnvError) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    throw e;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.user_id ?? session.client_reference_id) as string | null;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (!userId || !subscriptionId) {
          console.warn("[webhook] checkout.session.completed missing user_id or subscription_id");
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const plan = getPlanFromPriceId(priceId);
        const period = periodTs(subscription as { current_period_start?: number; current_period_end?: number });
        const { error: upsertErr } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            provider: "stripe",
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            status: "active",
            plan,
            current_period_start: period.start,
            current_period_end: period.end,
            cancel_at_period_end: (subscription as { cancel_at_period_end?: boolean }).cancel_at_period_end ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        if (upsertErr) {
          console.error("[webhook] subscriptions upsert failed:", upsertErr);
          return NextResponse.json({ error: "DB error" }, { status: 500 });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id?: string } };
        const subId = invoice.subscription;
        const subscriptionId =
          typeof subId === "string" ? subId : subId && typeof subId === "object" ? (subId as { id?: string }).id : null;
        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const plan: PlanType = getPlanFromPriceId(priceId);
        const userId = (subscription.metadata?.user_id as string) ?? null;
        const periodEnd = periodTs(subscription as { current_period_end?: number }).end;
        if (!userId) {
          const { data: subRow } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .maybeSingle();
          const uid = subRow?.user_id;
          if (!uid) {
            console.warn("[webhook] invoice.paid no user_id for subscription", subscriptionId);
            break;
          }
          const { error: userErr } = await supabase
            .from("users")
            .update({
              plan,
              credit_balance: PLAN_CREDITS[plan],
              updated_at: new Date().toISOString(),
            })
            .eq("id", uid);
          if (userErr) {
            console.error("[webhook] users update failed:", userErr);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
          }
          await supabase
            .from("subscriptions")
            .update({
              plan,
              stripe_price_id: priceId,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        } else {
          const { error: userErr } = await supabase
            .from("users")
            .update({
              plan,
              credit_balance: PLAN_CREDITS[plan],
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
          if (userErr) {
            console.error("[webhook] users update failed:", userErr);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
          }
          await supabase
            .from("subscriptions")
            .update({
              plan,
              stripe_price_id: priceId,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const plan = getPlanFromPriceId(priceId);
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "unpaid",
          incomplete: "incomplete",
        };
        const status = statusMap[subscription.status] ?? "incomplete";
        const period = periodTs(subscription as { current_period_start?: number; current_period_end?: number });
        const { error: updErr } = await supabase
          .from("subscriptions")
          .update({
            status,
            plan,
            stripe_price_id: priceId,
            current_period_start: period.start,
            current_period_end: period.end,
            cancel_at_period_end: (subscription as { cancel_at_period_end?: boolean }).cancel_at_period_end ?? false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        if (updErr) {
          console.error("[webhook] subscription updated failed:", updErr);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const userId = (subscription.metadata?.user_id as string) ?? null;
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        const uid = userId ?? subRow?.user_id;
        if (uid) {
          await supabase
            .from("users")
            .update({
              plan: "free",
              credit_balance: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", uid);
        }
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
