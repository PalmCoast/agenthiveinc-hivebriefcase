'use strict';

/* Live-site QA for the SideQuest marketing funnel using headless Chrome.
   Captures desktop + mobile screenshots and exercises the key conversion paths:
   hero CTAs, pricing -> /upgrade -> Stripe, and the app tab bar. */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.env.QA_BASE || 'https://sidequest-7e53.netlify.app';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/local/bin/google-chrome';

fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log('[qa]', ...a);

async function clickByText(page, tag, text) {
  const clicked = await page.evaluate(
    (t, txt) => {
      const els = [...document.querySelectorAll(t)];
      const el = els.find((e) => e.textContent.trim().toLowerCase().includes(txt.toLowerCase()));
      if (el) { el.click(); return true; }
      return false;
    },
    tag,
    text
  );
  if (!clicked) throw new Error(`could not find ${tag} containing "${text}"`);
}

async function shot(page, name, fullPage = false) {
  const path = `${OUT}/${name}`;
  await page.screenshot({ path, fullPage });
  log('screenshot', path);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const results = [];
  const record = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    log(ok ? 'PASS' : 'FAIL', name, detail);
  };

  try {
    // ── DESKTOP ──────────────────────────────────────────────
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    // Root should route first-time visitors to /welcome.
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1200));
    record('root redirects to /welcome', page.url().includes('/welcome'), page.url());

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    await shot(page, 'welcome_desktop_hero.png');
    await shot(page, 'welcome_desktop_full.png', true);

    // Secondary CTA: "See how it works" scrolls down.
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickByText(page, 'button', 'See how it works');
    await new Promise((r) => setTimeout(r, 1200));
    const scrolled = await page.evaluate(() => window.scrollY);
    record('secondary CTA scrolls', scrolled > 300, `scrollY=${scrolled}`);

    // Primary funnel: Start Premium -> /upgrade.
    await clickByText(page, 'button', 'Start Premium');
    await new Promise((r) => setTimeout(r, 1200));
    record('pricing CTA -> /upgrade', page.url().includes('/upgrade'), page.url());
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, 'desktop_upgrade.png');

    // Payment gate -> Stripe.
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
      clickByText(page, 'button', 'Upgrade with Stripe'),
    ]);
    await new Promise((r) => setTimeout(r, 2500));
    const onStripe = page.url().includes('checkout.stripe.com');
    record('payment gate routes to Stripe', onStripe, page.url());
    if (onStripe) await shot(page, 'desktop_stripe_checkout.png');

    // App still works: open web app + tabs.
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle2' });
    await clickByText(page, 'button', 'Open the web app');
    await new Promise((r) => setTimeout(r, 1000));
    const inApp = await page.evaluate(() => document.body.innerText.includes('Nearby players'));
    record('opens app (Signals)', inApp, page.url());
    await shot(page, 'desktop_app_signals.png');

    await page.goto(`${BASE}/nest`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));
    const nestOk = await page.evaluate(() => document.body.innerText.includes('Nest Events'));
    record('Nest tab works', nestOk, page.url());

    record('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

    // ── MOBILE (~390px) ──────────────────────────────────────
    const m = await browser.newPage();
    await m.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    await m.goto(`${BASE}/welcome`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await shot(m, 'welcome_mobile_hero.png');
    await shot(m, 'welcome_mobile_full.png', true);

    // Mobile pricing section screenshot.
    await m.evaluate(() => document.getElementById('premium')?.scrollIntoView());
    await new Promise((r) => setTimeout(r, 800));
    await shot(m, 'welcome_mobile_pricing.png');

    const stickyOk = await m.evaluate(() => {
      const bars = [...document.querySelectorAll('div')];
      return bars.some((b) => /Get the app/i.test(b.textContent) && getComputedStyle(b).position === 'fixed');
    });
    record('mobile sticky CTA present', stickyOk);
  } catch (e) {
    record('script exception', false, String(e));
  } finally {
    await browser.close();
  }

  fs.writeFileSync(`${OUT}/qa_results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.ok);
  log('SUMMARY', `${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
