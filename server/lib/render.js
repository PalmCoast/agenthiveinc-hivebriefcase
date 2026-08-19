'use strict';

const { esc, attr, join } = require('./html');

const SITE = {
  name: 'ClaudeFarm',
  tagline: 'Real Claude skills. Test them before you buy.',
  baseUrl: process.env.PUBLIC_BASE_URL || ''
};

function canonicalFor(path) {
  return (SITE.baseUrl || '') + (path || '/');
}

function ogImageUrl() {
  return (SITE.baseUrl || '') + '/og.png';
}

function layout({ title, description, path, jsonLd, ogType }, body) {
  const canonical = canonicalFor(path);
  const image = ogImageUrl();
  const jsonLdBlocks = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('');
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${attr(description)}">`,
    `<link rel="canonical" href="${attr(canonical)}">`,
    `<meta property="og:type" content="${attr(ogType || 'website')}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:site_name" content="${attr(SITE.name)}">`,
    canonical ? `<meta property="og:url" content="${attr(canonical)}">` : '',
    `<meta property="og:image" content="${attr(image)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${attr(SITE.name + ' — ' + SITE.tagline)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${attr(title)}">`,
    `<meta name="twitter:description" content="${attr(description)}">`,
    `<meta name="twitter:image" content="${attr(image)}">`,
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="stylesheet" href="/styles.css">',
    jsonLdBlocks
  ];
  return `<!doctype html>
<html lang="en">
<head>
${join(head)}
</head>
<body data-path="${attr(path || '/')}">
<a class="skip-link" href="#main">Skip to content</a>
${header(path)}
<main id="main">
${body}
</main>
${footer()}
<script src="/app.js" defer></script>
</body>
</html>`;
}

function header(path) {
  const link = (href, label) =>
    `<a href="${attr(href)}"${path === href ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="${attr(SITE.name)} home">
      <span class="brand-mark" aria-hidden="true">🌱</span>
      <span class="brand-name">Claude<b>Farm</b></span>
    </a>
    <nav class="nav" aria-label="Primary">
      ${link('/products', 'Products')}
      ${link('/quiz', 'Find your skill')}
      ${link('/#demo', 'Live demo')}
      ${link('/trust', 'Trust')}
    </nav>
    <a class="btn btn-ghost nav-cta" href="/products">Browse the farm</a>
  </div>
</header>`;
}

function footer() {
  const { getStore } = require('./catalog');
  const store = getStore();
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <div class="brand"><span aria-hidden="true">🌱</span> <span class="brand-name">Claude<b>Farm</b></span></div>
      <p class="muted">${esc(SITE.tagline)}</p>
    </div>
    <nav aria-label="Footer">
      <a href="/products">Products</a>
      <a href="/quiz">Find your skill</a>
      <a href="/trust">Trust &amp; refunds</a>
      <a href="/#demo">Live demo</a>
    </nav>
    <div class="footer-legal">
      <p class="muted small">${esc(store.disclaimer)}</p>
      <p class="muted small">Questions? <a href="mailto:${attr(store.supportEmail)}">${esc(store.supportEmail)}</a></p>
    </div>
  </div>
</footer>`;
}

function proofStrip() {
  const items = [
    ['Tested before shipping', 'Every product runs through an automated verification suite.'],
    ['Exact files shown', 'You see the file list and version before you buy.'],
    ['Verify command included', 'Confirm the skill works on your machine in one command.'],
    ['Lifetime updates', 'Paid products include every future revision.']
  ];
  return `<section class="proof-strip" aria-label="Why ClaudeFarm">
  <div class="wrap proof-grid">
    ${items.map(([h, p]) => `<div class="proof-item"><h3>${esc(h)}</h3><p class="muted">${esc(p)}</p></div>`).join('')}
  </div>
</section>`;
}

function tierBadge(tier) {
  const labels = { free: 'Free', entry: 'Entry', pro: 'Professional', complete: 'Complete' };
  return `<span class="tier tier-${attr(tier)}">${esc(labels[tier] || tier)}</span>`;
}

function verifyBadge(product) {
  if (!product.verification) {
    return `<span class="vbadge vbadge-unknown" title="Run the build to verify">Verification: not built</span>`;
  }
  const pass = product.verification.status === 'PASS';
  return `<span class="vbadge ${pass ? 'vbadge-pass' : 'vbadge-fail'}">Verified: ${esc(product.verification.status)}</span>`;
}

function productCard(product, opts = {}) {
  const isFree = product.priceCents === 0;
  const cta = isFree
    ? `<a class="btn btn-primary" href="/api/download?product=${attr(product.slug)}" data-event="free_download" data-product="${attr(product.slug)}">${esc(product.cta)}</a>`
    : `<button class="btn btn-primary" data-checkout="${attr(product.slug)}" data-tier="${attr(product.tier)}">${esc(product.cta)}</button>`;
  return `<article class="card product-card ${opts.featured ? 'card-featured' : ''}">
  ${opts.featured ? '<div class="ribbon">Best value</div>' : ''}
  <div class="card-top">
    ${tierBadge(product.tier)}
    <span class="price">${esc(product.priceLabel)}</span>
  </div>
  <h3><a href="/p/${attr(product.slug)}">${esc(product.name)}</a></h3>
  <p class="tagline">${esc(product.tagline)}</p>
  <p class="oneliner muted">${esc(product.oneLiner)}</p>
  <div class="card-actions">
    ${cta}
    <a class="btn btn-ghost" href="/p/${attr(product.slug)}">Details</a>
  </div>
</article>`;
}

function homePage(products) {
  const free = products.find((p) => p.tier === 'free');
  const ladder = products;
  const featuredId = 'whole-farm';

  const hero = `<section class="hero">
  <div class="wrap">
    <p class="eyebrow">Claude Code skills · run before you buy</p>
    <h1 class="hero-title">Real Claude skills.<br>Test them before you buy.<br>Install them and use them.</h1>
    <p class="hero-sub">Stop buying prompt packs that look impressive and fail in practice. ClaudeFarm ships skills that are built, tested, and ready to run — and you can prove it right now, in your browser.</p>
    <div class="hero-cta">
      <a class="btn btn-primary btn-lg" href="#demo">Run a real skill →</a>
      <a class="btn btn-ghost btn-lg" href="/products">See the products</a>
    </div>
  </div>
</section>`;

  const demo = `<section id="demo" class="demo-section" aria-labelledby="demo-h">
  <div class="wrap">
    <h2 id="demo-h" class="section-title">Run a real Claude skill</h2>
    <p class="section-sub muted">This is the actual free <code>budget</code> skill running on our server — the same file you can download. Type <code>budget</code> and run it.</p>
    <div class="terminal" role="group" aria-label="Live skill runner">
      <div class="terminal-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="term-title">claude ~ skill runner</span></div>
      <div class="terminal-body">
        <label class="term-label" for="demo-input">Type a command (try <b>budget</b>, or add numbers like <b>budget income 5000 rent 1500</b>)</label>
        <div class="term-input-row">
          <span class="term-prompt">$</span>
          <input id="demo-input" class="term-input" value="budget" autocomplete="off" spellcheck="false" aria-label="Skill command">
          <button id="demo-run" class="btn btn-primary" data-event="demo_started">RUN IT</button>
        </div>
        <pre id="demo-output" class="term-output" aria-live="polite" tabindex="0">Press “RUN IT” to run the budget skill.</pre>
      </div>
    </div>
    <div class="demo-cta">
      <p><b>This is the real skill you can download — free.</b> If the free one works like this, the paid ones do too.</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="/api/download?product=budget" data-event="free_download" data-product="budget">Download the free skill</a>
        <a class="btn btn-ghost" href="/p/budget">See what's inside</a>
      </div>
    </div>
  </div>
</section>`;

  const ladderSection = `<section class="ladder" aria-labelledby="ladder-h">
  <div class="wrap">
    <h2 id="ladder-h" class="section-title">Pick your crop</h2>
    <p class="section-sub muted">Start free. Upgrade when you need more. Every paid product is a one-time purchase with lifetime updates.</p>
    <div class="card-grid">
      ${ladder.map((p) => productCard(p, { featured: p.id === featuredId })).join('')}
    </div>
    <p class="center"><a class="btn btn-ghost" href="/quiz">Not sure? Find your skill in 3 questions →</a></p>
  </div>
</section>`;

  const trust = trustSection();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ClaudeFarm',
      description: 'Independent maker of tested, versioned Claude Code skills.',
      ...(SITE.baseUrl ? { url: SITE.baseUrl, logo: SITE.baseUrl + '/og.png' } : {})
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ClaudeFarm',
      ...(SITE.baseUrl ? { url: SITE.baseUrl } : {})
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: ladder.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: canonicalFor('/p/' + p.slug),
        name: p.name
      }))
    }
  ];

  return layout(
    {
      title: 'ClaudeFarm — Real Claude skills you can test before you buy',
      description: 'Run a real Claude Code skill in your browser, then install it. ClaudeFarm ships tested, verified skills with exact file lists, verify commands, and lifetime updates.',
      path: '/',
      jsonLd
    },
    hero + proofStrip() + demo + ladderSection + trust
  );
}

function trustSection() {
  const { getStore } = require('./catalog');
  const store = getStore();
  const items = [
    ['One-time purchase', 'Pay once. No subscription. Paid products include lifetime updates.'],
    ['You see exactly what you get', 'Every product page lists the exact files, version, and size before purchase.'],
    ['Verify on your machine', 'Each skill ships a one-line verify command so you know it works.'],
    ['Independent product', store.disclaimer],
    ['Refunds', store.refundPolicy],
    ['Support', `Email ${store.supportEmail} with your order id.`]
  ];
  return `<section class="trust" id="trust" aria-labelledby="trust-h">
  <div class="wrap">
    <h2 id="trust-h" class="section-title">No surprises</h2>
    <div class="trust-grid">
      ${items.map(([h, p]) => `<div class="trust-item"><h3>${esc(h)}</h3><p class="muted">${esc(p)}</p></div>`).join('')}
    </div>
  </div>
</section>`;
}

function productsPage(products) {
  return layout(
    {
      title: 'ClaudeFarm products — tested Claude Code skills',
      description: 'Browse ClaudeFarm products: the free Budget skill, the 1M Context Cookbook, the Skill Farmer\'s Toolkit, and the Whole Farm bundle. Tested, versioned, one-time purchase.',
      path: '/products'
    },
    `<section class="page-head"><div class="wrap">
      <h1 class="section-title">The farm</h1>
      <p class="section-sub muted">Every product is tested before shipping and shows its exact contents. Start free.</p>
    </div></section>
    <section class="ladder"><div class="wrap">
      <div class="card-grid">${products.map((p) => productCard(p, { featured: p.id === 'whole-farm' })).join('')}</div>
    </div></section>` + proofStrip()
  );
}

function copyRow(label, command) {
  return `<div class="copy-row">
    <span class="copy-label">${esc(label)}</span>
    <div class="copy-box">
      <code>${esc(command)}</code>
      <button class="btn btn-ghost btn-copy" data-copy="${attr(command)}" aria-label="Copy command">Copy</button>
    </div>
  </div>`;
}

function productPage(product, all, opts = {}) {
  const isFree = product.priceCents === 0;
  const cancelled = opts.cancelled;
  const upgrade = product.upgradeTo ? all.find((p) => p.id === product.upgradeTo) : null;

  const cta = isFree
    ? `<a class="btn btn-primary btn-lg" href="/api/download?product=${attr(product.slug)}" data-event="free_download" data-product="${attr(product.slug)}">${esc(product.cta)}</a>`
    : `<button class="btn btn-primary btn-lg" data-checkout="${attr(product.slug)}" data-tier="${attr(product.tier)}">${esc(product.cta)}</button>`;

  const filesList = (product.verification && product.hasArtifact)
    ? `<ul class="file-list">${(require('./catalog').loadManifest().products[product.id].files || []).map((f) => `<li><code>${esc(f)}</code></li>`).join('')}</ul>`
    : '';

  const verifyBlock = product.verification
    ? `<div class="verify-panel">
        <div class="verify-head">${verifyBadge(product)} <span class="muted small">v${esc(product.version)} · verified ${esc((product.verification.verifiedAt || '').slice(0, 10))}</span></div>
        <ul class="verify-checks">
          ${product.verification.checks.map((c) => `<li class="vc vc-${attr(c.status)}"><span class="vc-mark" aria-hidden="true">${c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '•'}</span> ${esc(c.label)}${c.status === 'not-automatable' ? ' <span class="na">NOT AUTOMATABLE</span>' : ''}</li>`).join('')}
        </ul>
        ${product.checksum ? `<p class="muted small">Artifact ${esc(product.checksum.slice(0, 26))}… · ${(product.artifactBytes / 1024).toFixed(1)} KB</p>` : ''}
      </div>`
    : '<p class="muted">Verification runs at build time. Run <code>npm run verify-product</code> to generate it.</p>';

  const demoLink = isFree ? `<p><a class="btn btn-ghost" href="/#demo">Run this skill live →</a></p>` : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.oneLiner,
    brand: { '@type': 'Brand', name: 'ClaudeFarm' },
    ...(product.version ? { softwareVersion: product.version } : {}),
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: canonicalFor('/p/' + product.slug)
    }
  };

  const body = `
  ${cancelled ? '<div class="wrap"><div class="notice notice-warn" role="status">Checkout cancelled — no charge was made. Your cart is still here whenever you\'re ready.</div></div>' : ''}
  <section class="product-hero"><div class="wrap product-hero-grid">
    <div>
      <div class="ph-badges">${tierBadge(product.tier)} ${verifyBadge(product)}</div>
      <h1 class="product-title">${esc(product.name)}</h1>
      <p class="product-oneliner">${esc(product.oneLiner)}</p>
      <div class="buy-row">
        <span class="price price-lg">${esc(product.priceLabel)}</span>
        ${cta}
      </div>
      <p class="muted small">${isFree ? 'Free download — no account needed.' : 'One-time purchase · lifetime updates · instant download.'}</p>
      ${demoLink}
    </div>
    <aside class="ph-side">
      <h2 class="side-h">What you receive</h2>
      <ul class="receive-list">${product.receives.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    </aside>
  </div></section>

  <section class="prod-section"><div class="wrap narrow">
    <h2>Who it's for</h2>
    <p>${esc(product.audience)}</p>
    <h2>The problem it eliminates</h2>
    <p>${esc(product.problem)}</p>
    <h2>What happens after you install it</h2>
    <p>${esc(product.workflow)}</p>
  </div></section>

  <section class="prod-section alt"><div class="wrap narrow">
    <h2>Proof it works</h2>
    <p class="muted">This is generated by our verification suite at build time — not marketing copy.</p>
    ${verifyBlock}
    ${filesList}
  </div></section>

  <section class="prod-section"><div class="wrap narrow">
    <h2>Install it</h2>
    <ol class="steps">${product.installSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${product.firstRun ? copyRow('First run', product.firstRun) : ''}
    <h2>Updates</h2>
    <p>${esc(product.updates)}</p>
  </div></section>

  ${upgrade ? `<section class="prod-section alt"><div class="wrap narrow">
    <h2>Next step</h2>
    <div class="cross-sell">
      <div>
        <p class="muted small">Ready for more?</p>
        <h3>${esc(upgrade.name)} — ${esc(upgrade.priceLabel)}</h3>
        <p class="muted">${esc(upgrade.oneLiner)}</p>
      </div>
      <a class="btn btn-primary" href="/p/${attr(upgrade.slug)}" data-event="upgrade_clicked" data-product="${attr(upgrade.slug)}">See ${esc(upgrade.name)} →</a>
    </div>
  </div></section>` : ''}

  <section class="prod-section"><div class="wrap narrow center">
    ${cta}
  </div></section>
  `;

  return layout(
    {
      title: product.seo.title,
      description: product.seo.description,
      path: '/p/' + product.slug,
      ogType: 'product',
      jsonLd
    },
    body
  );
}

function quizPage(products) {
  // Data-driven quiz; logic runs client-side but options map to real products.
  return layout(
    {
      title: 'Find your Claude skill — ClaudeFarm',
      description: 'Answer 3 quick questions and we\'ll point you to the ClaudeFarm product that fits what you\'re doing with Claude.',
      path: '/quiz'
    },
    `<section class="page-head"><div class="wrap">
      <h1 class="section-title">Which crop is right for you?</h1>
      <p class="section-sub muted">Three questions. No email. Straight to the product that fits.</p>
    </div></section>
    <section class="quiz"><div class="wrap narrow">
      <div id="quiz" class="quiz-card" data-event="product_selector_started"></div>
      <noscript><p class="muted">The finder needs JavaScript. <a href="/products">Browse all products instead →</a></p></noscript>
    </div></section>`
  );
}

function successPage({ product, downloadUrl, mock }) {
  const body = `<section class="success"><div class="wrap narrow">
    <div class="notice notice-ok" role="status">${mock ? 'Test purchase complete (mock mode — no real charge).' : 'Payment confirmed.'}</div>
    <h1 class="success-title">You're in.</h1>
    <p class="lead">Your product is ready: <b>${esc(product.name)}</b>.</p>
    <p><a class="btn btn-primary btn-lg" href="${attr(downloadUrl)}" data-event="download_started" data-product="${attr(product.slug)}">Download your product</a></p>

    <h2>Install it in ${product.installSteps.length} steps</h2>
    <ol class="steps" data-event="installation_started">${product.installSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

    ${product.firstRun ? `<h2>Verify your installation</h2>${copyRow('Run this to confirm it works', product.firstRun)}` : ''}

    <h2>First thing to try</h2>
    <p class="muted">${esc(product.workflow)}</p>

    <p class="muted small">Bookmark this page — your download link stays valid for 30 minutes. Lost it? ${esc('Re-open your product page and purchase link, or email support.')}</p>
  </div></section>`;
  return layout(
    {
      title: `You're in — ${product.name} | ClaudeFarm`,
      description: 'Your ClaudeFarm product is ready to download and install.',
      path: '/success'
    },
    body
  );
}

function legalPage() {
  return layout(
    {
      title: 'Trust, refunds & disclaimer — ClaudeFarm',
      description: 'How ClaudeFarm works: one-time purchases, lifetime updates, refunds, support, and our independence from Anthropic.',
      path: '/trust'
    },
    `<section class="page-head"><div class="wrap"><h1 class="section-title">Trust &amp; refunds</h1></div></section>` + trustSection()
  );
}

function errorPage({ code, title, message, cta }) {
  return layout(
    { title: `${code} — ${title} | ClaudeFarm`, description: message, path: '/error' },
    `<section class="error-page"><div class="wrap narrow center">
      <p class="error-code">${esc(code)}</p>
      <h1 class="section-title">${esc(title)}</h1>
      <p class="muted">${esc(message)}</p>
      <p>${cta || '<a class="btn btn-primary" href="/">Back to the farm</a>'}</p>
    </div></section>`
  );
}

module.exports = {
  SITE,
  canonicalFor,
  layout,
  homePage,
  productsPage,
  productPage,
  quizPage,
  successPage,
  legalPage,
  errorPage
};
