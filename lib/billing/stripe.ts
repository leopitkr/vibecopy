import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

export async function createCheckoutSession(
  userId: string,
  priceId: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?success=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
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
