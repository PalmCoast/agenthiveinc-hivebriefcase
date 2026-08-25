# ClaudeFarm — Go Live (start selling)

The storefront is built, tested, and **deploy-ready**. To actually take money it
needs two things only you can provide: a **live deployment** and **Stripe keys**.
This doc is the exact path from here to a first real sale, plus a launch kit.

Until live Stripe keys are set, the store runs in **MOCK mode** (fully browsable
and testable, but it does not charge cards).

---

## 1. Secrets required to sell

Add these as environment variables (locally via `.env`, on Netlify via
`netlify env:set`, or on any host's dashboard):

| Variable | Required? | What it's for |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | **Yes (to charge)** | Live/test Stripe secret key. Its presence flips the app from MOCK to LIVE checkout. |
| `APP_SECRET` | **Yes in prod** | Random 32+ char string; signs download/session tokens. Generate: `openssl rand -hex 32`. |
| `PUBLIC_BASE_URL` | Recommended | Your public URL (e.g. `https://claudefarm.com`) for canonical/OG tags. |
| `SUPPORT_EMAIL` | Recommended | Real support address shown on the site + refund contact. |
| `STRIPE_WEBHOOK_SECRET` | Optional | Verifies Stripe webhooks. The success page already verifies payment via the Stripe API, so this is a hardening step, not required for MVP. |

No Stripe **Product/Price** objects are needed — checkout builds `price_data`
from `catalog/products.json` at request time, so prices always come from the
server and can't be tampered with by the browser.

---

## 2. Deploy

### Option A — Netlify (recommended; config already in repo)

```bash
npm install -g netlify-cli
netlify login                 # or set NETLIFY_AUTH_TOKEN in the environment
netlify init                  # create/link a site (Git CI/CD) — or: netlify deploy --build
netlify env:set APP_SECRET "$(openssl rand -hex 32)"
netlify env:set STRIPE_SECRET_KEY "sk_live_or_test_..."
netlify env:set PUBLIC_BASE_URL "https://<your-site>.netlify.app"
netlify env:set SUPPORT_EMAIL "you@yourdomain.com"
netlify deploy --build --prod
```

`netlify.toml` already: runs `npm run build` (build + verify), publishes
`public/`, ships `catalog/` + `dist/` to the function, and routes all dynamic
traffic to the Express app in `netlify/functions/server.js`.

### Option B — Any Node host / Docker (Render, Railway, Fly, a VM)

```bash
docker build -t claudefarm .
docker run -p 3000:3000 \
  -e APP_SECRET="$(openssl rand -hex 32)" \
  -e STRIPE_SECRET_KEY="sk_..." \
  -e PUBLIC_BASE_URL="https://claudefarm.com" \
  -e SUPPORT_EMAIL="you@yourdomain.com" \
  claudefarm
```

A `Procfile` (`web: npm run build && node server/index.js`) is included for
buildpack hosts.

---

## 3. Turn on payments + verify a real purchase

1. Set `STRIPE_SECRET_KEY` and redeploy. The boot log prints `Checkout mode: LIVE`.
2. (Optional) In the Stripe dashboard add a webhook to
   `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed`,
   then set `STRIPE_WEBHOOK_SECRET`.
3. With a **test** key, buy the $19 Cookbook using Stripe test card
   `4242 4242 4242 4242`, any future expiry/CVC. Confirm: redirect to Stripe →
   pay → land on the "You're in." success page → download the zip → unzip → run
   the skill's verify command.
4. Swap the test key for the **live** key and repeat with a real card once.

---

## 4. Pre-launch QA checklist

- [ ] `npm test` passes (19/19) and `npm run verify-product` is all PASS.
- [ ] Live purchase of each paid product completes and delivers the correct zip.
- [ ] Cancelling checkout returns to the product page with a "no charge" notice.
- [ ] `SUPPORT_EMAIL` and refund policy on `/trust` are real.
- [ ] `PUBLIC_BASE_URL` is set (canonical/OG/sitemap use it).
- [ ] Mobile purchase works (tested at 390px).

---

## 5. Launch kit (drafts — post from your own accounts)

These are **factual** drafts. They intentionally contain no invented metrics,
testimonials, or endorsements. Fill in the bracketed URL. Nothing here has been
posted anywhere on your behalf.

### One-liner
> ClaudeFarm — real Claude Code skills you can run before you buy. Tested,
> versioned, with the exact files and a verify command shown up front.

### Short launch post (X / Hacker News / Reddit)
> I got tired of "prompt packs" that look great and fall apart in practice, so I
> built ClaudeFarm: Claude Code skills you can **run in the browser before you
> buy**.
>
> - Free Budget skill you can try right now
> - Every product is packaged, checksummed, and passes an automated verification
>   suite (structure, docs, example run) — the results are shown on the page
> - You see the exact file list + version before paying
> - One-time purchase, lifetime updates
>
> Try the live demo: [your-url]

### Product Hunt-style blurb
> **ClaudeFarm** — Tested Claude Code skills you can try before you buy.
> Run a real skill live, see exactly what you'll download, install it in a few
> steps, and verify it works with one command. Free skill to start; toolkits and
> a complete bundle for people building serious Claude workflows.

### Email announcement (to an opted-in list only)
> Subject: Claude skills you can test before you buy
>
> ClaudeFarm is live. Instead of asking you to trust a screenshot, every skill
> runs live on the site and ships with its exact file list, a version, and a
> verify command. Start with the free Budget skill, then grab the 1M Context
> Cookbook, the Skill Farmer's Toolkit, or the Whole Farm bundle.
>
> Try it: [your-url]

> Want me to publish any of these? I did **not** post to X/social or send email
> on your behalf — say the word (and confirm the account/handle) and I'll draft
> the exact post for your approval.
