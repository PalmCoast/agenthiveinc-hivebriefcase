import Stripe from "stripe";

// SideQuest Premium pricing (cents/mo). Founder is the discounted early-member
// rate that early sign-ups lock in; STANDARD documents the regular list price the
// founder rate is measured against. The checkout button charges FOUNDER, so the
// UI must show $2.49/mo as the amount actually billed.
const FOUNDER_PRICE_CENTS = 249;
const STANDARD_PRICE_CENTS = 499;

/**
 * Creates a Stripe Checkout Session for SideQuest Premium — founder / launch
 * rate ($2.49/mo) — using the server-side restricted secret key
 * (STRIPE_SECRET_KEY). The browser never sees the key; it only receives the
 * returned session URL to redirect to.
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
            unit_amount: FOUNDER_PRICE_CENTS,
            recurring: { interval: "month" },
            product_data: {
              name: "SideQuest Premium — Founder rate",
              description:
                "Early-member founder pricing: verified badge, host your own Nest, see who SideQuested you first, priority + unlimited SideQuests.",
            },
          },
        },
      ],
      metadata: {
        plan: "premium_founder",
        founder_price_cents: String(FOUNDER_PRICE_CENTS),
        standard_price_cents: String(STANDARD_PRICE_CENTS),
      },
      success_url: `${origin}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=1`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
};

export const config = { path: "/api/checkout" };
