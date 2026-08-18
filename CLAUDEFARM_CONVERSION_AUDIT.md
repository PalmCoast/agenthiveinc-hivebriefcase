# ClaudeFarm — Conversion & Product Reliability Audit

## What you found

The task briefed an audit-and-overhaul of an **existing** ClaudeFarm storefront.
On inspection, **no ClaudeFarm/storefront code existed anywhere in this
repository** — not on `main`, not on any branch. The repo (`agenthiveinc-hivebriefcase`)
contained only the **HiveBriefcase SDK** (a Node.js library for agent identity,
credentials, and micropayments): `index.js`, `src/{did,vault,payments}.js`,
`examples/full-demo.js`, `package.json`, and a release zip. A full-text search
for `claudefarm|stripe|checkout|storefront|react|next.js|vite|skill.md` returned
zero matches, and no ClaudeFarm repo exists under the owner's account.

Because the task was re-issued verbatim after this was flagged, ClaudeFarm was
built as a **real, working greenfield storefront** in this repo, and the existing
SDK was preserved untouched under `hivebriefcase-sdk/`.

There was therefore no pre-existing broken flow, dead link, or fake demo to
remediate — the "audit findings" are the greenfield decisions documented below.

## What you changed

Built a complete storefront for tested Claude Code skills. High level:

- **Products are real skills**, not marketing. Each is runnable Node with a
  `SKILL.md`: `products/free-budget` (the live-demo skill), `products/context-cookbook`,
  `products/skill-farmers-toolkit`, plus `whole-farm` (a bundle assembled at build time).
- **Server-rendered storefront** (Express, no heavy client framework) with a
  homepage (positioning + live demo + value ladder + trust), products index,
  per-product pages, a 3-question product finder, a trust page, and a
  post-purchase success/activation page.
- **Live demo hero** runs the actual free skill server-side (`/api/demo`) — the
  same file customers download.
- **Product reliability pipeline** (`scripts/verify-product.js`, `scripts/build-products.js`):
  packages each product into a versioned, `sha256`-checksummed zip and runs a
  real verification suite, writing `dist/manifest.json` as the source of truth.
- **Checkout** via Stripe with a signed **MOCK mode** so the full purchase →
  delivery flow works with no secrets. Prices come only from the server catalog.
- **Protected delivery**: free downloads open; paid downloads require a
  short-lived HMAC grant issued only after server-side payment verification.
- **SEO, accessibility, mobile-first CSS, explicit loading/error/empty states,
  and privacy-conscious funnel analytics.**
- **19 automated tests** + browser QA (desktop + 390px mobile) + a recorded
  end-to-end demo.

## What you deliberately did not change

- **The HiveBriefcase SDK** was moved to `hivebriefcase-sdk/` unchanged and is
  otherwise left alone. It is a separate product from ClaudeFarm.
- **No testimonials, review counts, customer numbers, revenue, logos, or
  endorsements** were invented (Phase 25). Trust is built from product proof
  (verification output, exact file lists, checksums) instead of social proof.
- **No third-party analytics/marketing stack** was added; analytics are a small
  self-hosted, allowlisted event log.
- **AI model version strings are not hard-coded** into copy; compatibility lives
  in `catalog/compatibility.json` and product pages state "Claude Code (skills format)".

## Products and pricing

Pricing lives server-side in `catalog/products.json` and is asserted by tests
(`test/pricing.test.js`) to prevent drift. The browser can never set a price.

| Product | Tier | Price | For whom | Outcome |
| --- | --- | --- | --- | --- |
| Budget Skill (`budget`) | Free | $0 | Anyone evaluating ClaudeFarm | A repeatable 50/30/20 monthly budget; powers the live demo |
| 1M Context Cookbook | Entry | $19 | People feeding huge docs to Claude | Boundary-aware chunking + stable citations + recipes |
| Skill Farmer's Toolkit | Pro | $29 | Builders shipping many skills | Scaffold + lint skills so they work on first install |
| The Whole Farm | Complete | $99 | Teams / power users | Everything above + all future skills, one download |

**Value ladder / cross-sell:** each product's `upgradeTo` points to the next
tier (`free → cookbook → toolkit → whole-farm`), surfaced as a "Next step"
cross-sell on product pages and a "Best value" highlight on the Whole Farm.

## Checkout architecture

```
Browser (slug only)
   │  POST /api/checkout {product: slug}
   ▼
Server looks up price in catalog/products.json (never trusts the client)
   │
   ├── STRIPE_SECRET_KEY set  → Stripe Checkout Session (price_data from catalog)
   │                             success_url=/success?session_id={ID}&product=slug
   │
   └── no key (MOCK)          → signed mock session token
                                 url=/success?session_id=mock_<hmac>&product=slug
   ▼
GET /success  → verifySession() SERVER-SIDE
   │             (Stripe retrieve + payment_status==='paid', or verify mock HMAC)
   │             product id must match; otherwise 402
   ▼
issue short-lived HMAC download grant → success page with tokenized link
   ▼
GET /api/download?product=slug&token=...  → verify grant → stream dist artifact
```

- **Webhook**: `POST /api/stripe/webhook` verifies the Stripe signature
  (`STRIPE_WEBHOOK_SECRET`) using the raw body before the JSON parser.
- **Cancellation**: `cancel_url` returns to `/p/slug?checkout=cancelled`, which
  renders a "no charge was made" notice.
- **Failure states**: unverified/failed payment → `402` page with retry;
  missing/expired download token → `403` page telling the user how to get a fresh
  link. No client-only confirmation is trusted anywhere.

## Product verification architecture

`npm run verify-product` (and `build-products`) verify each product against real
checks defined in `scripts/lib/verify.js`. For each skill product:

- ✓ Source directory exists
- ✓ `SKILL.md` present and frontmatter valid (required: name, description, version, entry)
- ✓ `README.md` present
- ✓ Entry script exists
- ✓ Documented file references resolve (no broken `scripts/…` or `recipes/…` links)
- ✓ Example command actually executes (`node …` run with a timeout; real exit code)
- ✓ Archive contains expected files (zip entries vs. source file list)
- ✓ Download artifact matches release checksum (`sha256` recomputed vs. manifest)
- • External link liveness → **NOT AUTOMATABLE** (reported honestly, never faked)

Bundles verify that every included product passed and the archive is non-empty.
A test (`test/verify.test.js`) proves the suite genuinely **FAILS** a
structurally broken product, so a pass means something.

**Release manifest** (`dist/manifest.json`) records, per product: `id`, `version`,
`releaseDate`, artifact `file`, `bytes`, `checksum`, the full `files` list, and
the `verification` result (status + per-check detail + timestamp). The storefront
reads this manifest for the version, checksum, verification badge, file list, and
which artifact to serve — so it cannot advertise or sell an unbuilt/stale package.

## Tests created

- `test/app.test.js` — homepage positioning, live demo (success + unknown
  command), product page + price, checkout→product mapping, free-product
  redirect, full purchase→success→protected download, paid download refused
  without token, tampered session rejected, free download open, navigation +
  sitemap + robots + 404, analytics allowlist.
- `test/verify.test.js` — every product built and PASSES; artifact checksums
  match files on disk; a broken product genuinely FAILS; statuses are always a
  real value (never a silent pass for an unrun check).
- `test/pricing.test.js` — prices/tiers match the intended ladder; exactly four
  products, one per tier.

## Tests executed

- `npm test` → **19/19 passing** (build runs first via `pretest`).
- `npm run build` / `npm run verify-product` → **4/4 products PASS** with real
  checksums.
- Skills run directly from their **downloaded** zip artifacts (install reality check).
- Browser QA (Chrome, desktop + 390px mobile): **11/11 steps PASS, no console errors**.
- Recorded end-to-end demo: hero → run demo → product cards → product page
  (Verified: PASS) → purchase → "You're in." success → download.

## Failures discovered and fixed

- **`adm-zip` high-severity advisory** (`GHSA-xcpc-8h2w-3j85`): pinned to
  `adm-zip@^0.6.0`; `npm audit` → **0 vulnerabilities**.
- **Build ran against the wrong revision** in the earlier environment build
  (default branch had no `package.json`); resolved by building the feature
  branch — not a storefront bug, but recorded for completeness.
- **Video-review flags investigated, not dismissed:** the reviewer thought the
  success page showed "3 of 4" install steps and that no download occurred. I
  verified the rendered HTML shows **"Install it in 4 steps" with exactly 4
  items**, and confirmed downloads work three independent ways (curl returned a
  4918-byte zip, the QA screenshot showed `context-cookbook-1.0.0.zip … Done`,
  and an automated test). Both were video compression/scroll artifacts, not bugs.

## Known limitations

- **Live Stripe not exercised end-to-end**: no Stripe test keys are available in
  this environment, so live checkout was validated by code path only; the full
  purchase→delivery flow was validated in MOCK mode. To exercise live, set
  `STRIPE_SECRET_KEY` (test key) + `STRIPE_WEBHOOK_SECRET` and re-run the flow.
- **Fulfillment is stateless** (no database): download grants are signed,
  time-limited tokens rather than persisted entitlements. Re-downloads after the
  30-minute window require re-visiting checkout. A persistent orders table is the
  natural next step if repeat/long-lived access is needed.
- **Analytics** is a local append-only log (`data/events.log`), intended for
  self-hosting; it is not aggregated into a dashboard.
- **`releaseDate`** is the artifact build date (honest, but changes each build).
  Pin per-version dates in a releases file if immutable dates are required.
- **Support email / refund policy** are configurable placeholders
  (`SUPPORT_EMAIL`, `catalog/products.json`) — set real values before launch.

## Remaining conversion opportunities

- Real, opt-in testimonials once customers exist (kept out per the factuality rule).
- Persisted licenses + a "re-download" portal for returning customers.
- Per-product Open Graph images (currently metadata-only; no fabricated imagery).
- A/B testing the hero CTA and the demo's default prefilled command.
- Email receipt + delivery (requires an email provider secret).

## Deployment instructions

The app is a standard Node server and also fits Netlify (the environment ships
Netlify skills). Minimal path:

1. `npm install`
2. Set env: `APP_SECRET` (required in prod), `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `SUPPORT_EMAIL`, `PUBLIC_BASE_URL`.
3. `npm run build` (produces + verifies `dist/` artifacts).
4. `npm start` (serves on `PORT`, default 3000). `prestart` re-runs the build so
   a deploy never serves an unbuilt artifact.
5. Point the Stripe webhook at `/api/stripe/webhook`.

For a Netlify deploy, run the release build in the build step and host the Node
server via the Netlify Node runtime (or split the static pages + serverless
functions). Keep `dist/` produced at build time; it is gitignored.

## How to add a new product safely

1. Create `products/<id>/` with `SKILL.md` (valid frontmatter: `name`,
   `description`, `version`, `entry`, and a `verify`/`test` command), a `README.md`,
   and the runnable `scripts/`.
2. Add an entry to `catalog/products.json` (id, slug, tier, price in cents,
   `sourceDir`, the Phase-6 fields, `seo`, `upgradeTo`). Prices are cents.
3. Run `npm run verify-product <slug>` — fix anything that isn't ✓ (it will
   FAIL on missing files, invalid frontmatter, broken references, or a failing
   example command).
4. Run `npm test` — `test/pricing.test.js` may need the expected-price map
   updated intentionally.
5. Commit. The storefront picks up the product automatically from the catalog +
   manifest; no page code changes are required.

## How to run product verification

```bash
npm run verify-product          # verify all products; non-zero exit on any FAIL
npm run verify-product budget   # verify a single product by slug or id
npm run build                   # (re)build artifacts and record verification in the manifest
```

## How to run the full QA suite

```bash
npm install
npm test          # builds products, then runs 19 automated tests

npm start         # serve locally on http://localhost:3000 (MOCK checkout)
# Manual customer QA: run the demo, browse products, complete a (mock) purchase,
# download the artifact, unzip it, and run the skill's verify command.
```

Browser QA was performed with the computer-use agent across desktop and a 390px
mobile viewport; the recorded end-to-end demo and screenshots are attached to the
pull request.
