'use strict';

const { getProduct, getCurrency, getStore } = require('./catalog');
const tokens = require('./tokens');

/**
 * Checkout with two modes:
 *  - LIVE:  STRIPE_SECRET_KEY is set → real Stripe Checkout Sessions.
 *  - MOCK:  no key → a signed mock session so the whole purchase→delivery flow
 *           is fully testable locally without secrets. Mock is clearly labeled.
 *
 * Prices ALWAYS come from the server catalog. The browser only sends a product
 * slug; it can never set or tamper with the amount.
 */
function isLive() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe = null;
function stripe() {
  if (!_stripe) {
    // eslint-disable-next-line global-require
    _stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

async function createCheckoutSession({ slug, origin }) {
  const product = getProduct(slug);
  if (!product) return { error: 'not_found' };
  if (product.priceCents === 0) return { error: 'free_product' };

  const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}&product=${product.slug}`;
  const cancelUrl = `${origin}/p/${product.slug}?checkout=cancelled`;

  if (isLive()) {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: getCurrency(),
            unit_amount: product.priceCents,
            product_data: { name: `ClaudeFarm — ${product.name}` }
          }
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { product: product.id },
      client_reference_id: product.id
    });
    return { url: session.url, mode: 'live', sessionId: session.id };
  }

  // MOCK mode: mint a signed session that /success can verify server-side.
  const token = tokens.sign({ kind: 'mock_session', product: product.id, paid: true }, 1800);
  const sessionId = `mock_${token}`;
  const url = `${origin}/success?session_id=${encodeURIComponent(sessionId)}&product=${product.slug}&mock=1`;
  return { url, mode: 'mock', sessionId };
}

/**
 * Verify a completed checkout session server-side before granting a download.
 * Returns { paid, productId, mode }.
 */
async function verifySession(sessionId, expectedProductId) {
  if (!sessionId) return { paid: false, reason: 'missing_session' };

  if (sessionId.startsWith('mock_')) {
    const payload = tokens.verify(sessionId.slice('mock_'.length));
    if (!payload || payload.kind !== 'mock_session' || !payload.paid) {
      return { paid: false, reason: 'invalid_mock_session' };
    }
    if (expectedProductId && payload.product !== expectedProductId) {
      return { paid: false, reason: 'product_mismatch' };
    }
    return { paid: true, productId: payload.product, mode: 'mock' };
  }

  if (!isLive()) return { paid: false, reason: 'live_session_without_keys' };

  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    const productId = (session.metadata && session.metadata.product) || session.client_reference_id;
    if (expectedProductId && productId !== expectedProductId) {
      return { paid: false, reason: 'product_mismatch' };
    }
    return { paid, productId, mode: 'live' };
  } catch (err) {
    return { paid: false, reason: 'stripe_error', detail: err.message };
  }
}

/** Verify a Stripe webhook signature (no-op-safe in mock mode). */
function verifyWebhook(rawBody, signature) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isLive() || !whSecret) return { ok: false, reason: 'webhook_not_configured' };
  try {
    const event = stripe().webhooks.constructEvent(rawBody, signature, whSecret);
    return { ok: true, event };
  } catch (err) {
    return { ok: false, reason: 'bad_signature', detail: err.message };
  }
}

module.exports = { isLive, createCheckoutSession, verifySession, verifyWebhook, getStore };
