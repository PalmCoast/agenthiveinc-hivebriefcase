import Stripe from "stripe";

/**
 * Verifies a Checkout Session server-side after the customer returns from
 * Stripe, so premium is only unlocked on a genuinely paid session.
 */
export default async (req) => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return Response.json({ paid: false, error: "stripe_not_configured" }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return Response.json({ paid: false, error: "missing_session" }, { status: 400 });
  }
  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid" || session.status === "complete";
    return Response.json({ paid });
  } catch (err) {
    return Response.json({ paid: false, error: err.message }, { status: 502 });
  }
};

export const config = { path: "/api/verify" };
