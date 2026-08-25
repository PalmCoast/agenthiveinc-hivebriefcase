'use strict';

/**
 * Generate a per-product Open Graph share card (1200x630 PNG) so each product
 * link previews with its own title, price, and tier. Rendered with headless
 * Chrome (no paid service, no extra npm deps).
 *
 * Run: node scripts/gen-og.js   (also runs as part of `npm run build`)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { getProducts, ROOT } = require('../server/lib/catalog');

const OUT = path.join(ROOT, 'public', 'og');
const TIER = {
  free: { label: 'Free', accent: '#4ade80' },
  entry: { label: 'Entry', accent: '#60a5fa' },
  pro: { label: 'Professional', accent: '#c084fc' },
  complete: { label: 'Complete', accent: '#fbbf24' }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function cardHtml(p) {
  const tier = TIER[p.tier] || TIER.free;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}html,body{width:1200px;height:630px}
  body{font-family:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif;
    background:radial-gradient(1200px 630px at 82% -10%, #143d28 0%, #0f1a14 55%);
    color:#eafff2;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
  .brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800}
  .brand b{color:#4ade80}
  .brand svg{width:46px;height:46px}
  .tier{display:inline-block;font-size:24px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;
    color:#0f1a14;background:${tier.accent};padding:8px 18px;border-radius:999px}
  .name{font-size:74px;line-height:1.02;font-weight:800;letter-spacing:-1.5px;margin:18px 0 10px;max-width:1040px}
  .tag{font-size:30px;color:#a7d8bd;font-weight:500;max-width:980px}
  .footer{display:flex;align-items:center;justify-content:space-between}
  .price{font-size:56px;font-weight:800;color:${tier.accent}}
  .verify{font-size:24px;font-weight:700;color:#0f1a14;background:#4ade80;padding:10px 20px;border-radius:999px}
  </style></head><body>
  <div class="brand">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#0b130f"/><path d="M32 48c0-11 7-17 17-19-2 13-9 19-17 19z" fill="#4ade80"/><path d="M32 48c0-9-6-14-15-16 2 11 8 16 15 16z" fill="#22c55e"/><rect x="30" y="30" width="4" height="18" rx="2" fill="#166534"/></svg>
    Claude<b>Farm</b>
  </div>
  <div>
    <span class="tier">${esc(tier.label)}</span>
    <div class="name">${esc(p.name)}</div>
    <div class="tag">${esc(p.oneLiner)}</div>
  </div>
  <div class="footer">
    <div class="price">${esc(p.priceLabel)}</div>
    <div class="verify">✓ Tested before shipping</div>
  </div>
  </body></html>`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const products = getProducts();
  for (const p of products) {
    const tmp = path.join('/tmp', `og-card-${p.slug}.html`);
    fs.writeFileSync(tmp, cardHtml(p));
    const out = path.join(OUT, `${p.slug}.png`);
    try {
      // `timeout` bounds Chrome, which can linger after writing the screenshot.
      execFileSync('timeout', [
        '20', 'google-chrome', '--headless=new', '--no-sandbox',
        `--user-data-dir=/tmp/ogp-${p.slug}`, '--hide-scrollbars',
        '--force-device-scale-factor=1', `--screenshot=${out}`,
        '--window-size=1200,630', `file://${tmp}`
      ], { stdio: 'ignore' });
    } catch {
      /* timeout-kill is expected; the screenshot is written before the hang */
    }
    if (!fs.existsSync(out)) throw new Error(`Failed to generate OG card for ${p.slug}`);
    console.log('generated', path.relative(ROOT, out));
  }
}

if (require.main === module) main();
module.exports = { main };
