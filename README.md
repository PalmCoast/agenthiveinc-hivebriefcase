# ClaudeFarm

Real Claude Code skills you can **run before you buy**, then install and use.

ClaudeFarm is a conversion-focused storefront for tested, versioned Claude
skills. Visitors run a real skill live in the browser, see exactly what they'll
receive (files, version, checksum, verification status), buy with one click, and
land on a success page that walks them through install → verify → first run.

## Quick start

```bash
npm install
npm start           # builds + verifies products, then serves on http://localhost:3000
```

`npm start` runs `npm run build` first (the release pipeline), so the storefront
never serves an unbuilt or stale artifact.

Checkout runs in **MOCK mode** by default so the full purchase → delivery flow
works with no secrets. Set `STRIPE_SECRET_KEY` (and `STRIPE_WEBHOOK_SECRET`) to
switch to live Stripe.

## Common commands

| Command | What it does |
| --- | --- |
| `npm start` | Build + verify products, then serve the storefront |
| `npm run build` | Package every product into a versioned, checksummed zip and verify it |
| `npm run verify-product` | Verify all products (exits non-zero on any FAIL) |
| `npm run verify-product budget` | Verify a single product |
| `npm test` | Build products, then run the automated test suite |

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Server port | `3000` |
| `APP_SECRET` | HMAC key for download/session tokens | dev-only fallback (set in prod) |
| `STRIPE_SECRET_KEY` | Enables live Stripe checkout | unset → MOCK mode |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhooks | unset |
| `SUPPORT_EMAIL` | Support address shown on the site | `support@claudefarm.example` |
| `PUBLIC_BASE_URL` | Absolute base URL for canonical/OG tags | empty (relative) |

## Architecture

See [`CLAUDEFARM_CONVERSION_AUDIT.md`](./CLAUDEFARM_CONVERSION_AUDIT.md) for the
full architecture map, product/verification/checkout design, how to add a new
product safely, and how to run the QA suite.

The `hivebriefcase-sdk/` directory contains the separate HiveBriefcase SDK that
previously lived at the repo root; it is preserved unchanged.
