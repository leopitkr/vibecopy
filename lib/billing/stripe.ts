import Stripe from "stripe";
import { getServerEnv } from "@/lib/env/server";

function getStripe(): Stripe {
  const { STRIPE_SECRET_KEY } = getServerEnv();
  return new Stripe(STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(
  userId: string,
  priceId: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  const { APP_URL } = getServerEnv();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/generate?upgraded=1`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    metadata: { user_id: userId },
    subscription_data: {
      metadata: { user_id: userId },
    },
  });
  const url = session.url;
  if (!url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { url };
}
