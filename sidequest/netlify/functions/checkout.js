import Stripe from "stripe";

/**
 * Creates a Stripe Checkout Session for SideQuest Premium ($4.99/mo) using the
 * server-side restricted secret key (STRIPE_SECRET_KEY). The browser never sees
 * the key — it only receives the returned session URL to redirect to.
 */
export default async (req) => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return Response.json({ error: "stripe_not_configured" }, { status: 503 });
  }
  const stripe = new Stripe(key);
  const origin = req.headers.get("origin") || new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 499,
            recurring: { interval: "month" },
            product_data: { name: "SideQuest Premium" },
          },
        },
      ],
      success_url: `${origin}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=1`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
};

export const config = { path: "/api/checkout" };
