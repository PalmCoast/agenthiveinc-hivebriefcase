'use strict';

const path = require('path');
const express = require('express');

const catalog = require('./lib/catalog');
const guides = require('./lib/guides');
const render = require('./lib/render');
const demo = require('./lib/demo');
const checkout = require('./lib/checkout');
const delivery = require('./lib/delivery');
const analytics = require('./lib/analytics');

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
}

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  // Stripe webhook needs the raw body — mount BEFORE the JSON parser.
  app.post('/api/stripe/webhook', express.raw({ type: '*/*' }), (req, res) => {
    const result = checkout.verifyWebhook(req.body, req.headers['stripe-signature']);
    if (!result.ok) {
      return res.status(result.reason === 'webhook_not_configured' ? 503 : 400).json({ ok: false, reason: result.reason });
    }
    const ev = result.event;
    if (ev.type === 'checkout.session.completed') {
      const productId = ev.data.object.metadata && ev.data.object.metadata.product;
      analytics.track('checkout_completed', productId ? { product: productId } : {});
    }
    return res.json({ received: true });
  });

  app.use(express.json({ limit: '32kb' }));
  app.use(express.static(path.join(catalog.ROOT, 'public'), { maxAge: '1h', extensions: [] }));

  // ---- Pages ----
  app.get('/', (req, res) => {
    res.type('html').send(render.homePage(catalog.getProducts()));
  });

  app.get('/products', (req, res) => {
    res.type('html').send(render.productsPage(catalog.getProducts()));
  });

  app.get('/quiz', (req, res) => {
    res.type('html').send(render.quizPage(catalog.getProducts()));
  });

  app.get('/trust', (req, res) => {
    res.type('html').send(render.legalPage());
  });

  app.get('/guides', (req, res) => {
    res.type('html').send(render.guidesIndexPage(guides.getGuides()));
  });

  app.get('/guides/:slug', (req, res) => {
    const guide = guides.getGuide(req.params.slug);
    if (!guide) {
      return res.status(404).type('html').send(render.errorPage({
        code: 404, title: 'Guide not found',
        message: 'That guide does not exist. Browse all guides instead.',
        cta: '<a class="btn btn-primary" href="/guides">All guides</a>'
      }));
    }
    res.type('html').send(render.guidePage(guide, catalog.getProducts()));
  });

  app.get('/p/:slug', (req, res) => {
    const product = catalog.getProduct(req.params.slug);
    if (!product) {
      return res.status(404).type('html').send(render.errorPage({
        code: 404, title: 'Product not found',
        message: 'That product does not exist. Browse the farm to see everything available.',
        cta: '<a class="btn btn-primary" href="/products">Browse products</a>'
      }));
    }
    res.type('html').send(render.productPage(product, catalog.getProducts(), {
      cancelled: req.query.checkout === 'cancelled'
    }));
  });

  app.get('/success', async (req, res) => {
    const slug = String(req.query.product || '');
    const sessionId = String(req.query.session_id || '');
    const product = catalog.getProduct(slug);
    if (!product) {
      return res.status(404).type('html').send(render.errorPage({
        code: 404, title: 'Unknown product',
        message: 'We could not match this purchase to a product. If you were charged, email support with your receipt.'
      }));
    }
    const check = await checkout.verifySession(sessionId, product.id);
    if (!check.paid) {
      return res.status(402).type('html').send(render.errorPage({
        code: 402, title: 'Payment not verified',
        message: 'We could not confirm this payment yet. If you completed checkout, refresh in a moment. If you were charged and still see this, email support.',
        cta: `<a class="btn btn-primary" href="/p/${product.slug}">Back to ${product.name}</a>`
      }));
    }
    const token = delivery.issueDownloadToken(product.id);
    const downloadUrl = `/api/download?product=${encodeURIComponent(product.slug)}&token=${encodeURIComponent(token)}`;
    analytics.track('checkout_completed', { product: product.id, tier: product.tier });
    res.type('html').send(render.successPage({
      product,
      downloadUrl,
      mock: check.mode === 'mock' || req.query.mock === '1'
    }));
  });

  // ---- APIs ----
  app.post('/api/demo', (req, res) => {
    const { command, input } = req.body || {};
    const result = demo.runDemo(command, input);
    analytics.track(result.ok ? 'demo_completed' : 'demo_started', { command: result.command });
    res.json(result);
  });

  app.post('/api/checkout', async (req, res) => {
    const slug = String((req.body && req.body.product) || '');
    const product = catalog.getProduct(slug);
    if (!product) return res.status(404).json({ ok: false, error: 'product_not_found' });
    if (product.priceCents === 0) return res.status(400).json({ ok: false, error: 'free_product', redirect: `/api/download?product=${product.slug}` });
    try {
      const session = await checkout.createCheckoutSession({ slug, origin: originOf(req) });
      if (session.error) return res.status(400).json({ ok: false, error: session.error });
      analytics.track('checkout_started', { product: product.id, tier: product.tier });
      res.json({ ok: true, url: session.url, mode: session.mode });
    } catch (err) {
      res.status(502).json({ ok: false, error: 'checkout_failed', detail: err.message });
    }
  });

  app.get('/api/download', (req, res) => {
    const slug = String(req.query.product || '');
    const token = req.query.token ? String(req.query.token) : null;
    const resolved = delivery.resolveDownload({ slug, token });
    if (!resolved.ok) {
      const messages = {
        product_not_found: 'That product does not exist.',
        artifact_not_built: 'This product has not been built yet. Run the release build and try again.',
        invalid_or_missing_token: 'This download link is missing or expired. Purchase the product (or re-open your success page) to get a fresh link.'
      };
      // For browser navigations, render a friendly page; for fetch, JSON.
      if ((req.headers.accept || '').includes('text/html')) {
        return res.status(resolved.status).type('html').send(render.errorPage({
          code: resolved.status,
          title: 'Download unavailable',
          message: messages[resolved.reason] || 'This download could not be served.',
          cta: `<a class="btn btn-primary" href="/p/${catalog.getProduct(slug) ? slug : ''}">Back to product</a>`
        }));
      }
      return res.status(resolved.status).json({ ok: false, error: resolved.reason });
    }
    const product = catalog.getProduct(slug);
    analytics.track('download_started', { product: product.id, tier: product.tier });
    if (product.priceCents === 0) analytics.track('free_download', { product: product.id });
    res.download(resolved.file, resolved.filename, (err) => {
      if (err && !res.headersSent) res.status(500).end();
    });
  });

  app.get('/api/product/:id', (req, res) => {
    const product = catalog.getProduct(req.params.id);
    if (!product) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({
      id: product.id,
      slug: product.slug,
      name: product.name,
      tier: product.tier,
      priceLabel: product.priceLabel,
      oneLiner: product.oneLiner,
      cta: product.cta
    });
  });

  app.post('/api/events', (req, res) => {
    const { event, props } = req.body || {};
    const result = analytics.track(String(event || ''), props || {});
    res.status(result.ok ? 202 : 400).json(result);
  });

  // ---- SEO ----
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${originOf(req)}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = originOf(req);
    const urls = [
      '/', '/products', '/quiz', '/trust', '/guides',
      ...catalog.getProducts().map((p) => `/p/${p.slug}`),
      ...guides.getGuides().map((g) => `/guides/${g.slug}`)
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${origin}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`;
    res.type('application/xml').send(body);
  });

  app.get('/healthz', (req, res) => res.json({ ok: true }));
  app.get('/api/stats', (req, res) => res.json(analytics.summary()));

  // ---- 404 + errors ----
  app.use((req, res) => {
    if ((req.headers.accept || '').includes('text/html')) {
      return res.status(404).type('html').send(render.errorPage({
        code: 404, title: 'Page not found',
        message: 'That page does not exist here on the farm.',
        cta: '<a class="btn btn-primary" href="/">Back to home</a>'
      }));
    }
    res.status(404).json({ ok: false, error: 'not_found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[claudefarm] error:', err && err.stack ? err.stack : err);
    if (res.headersSent) return;
    res.status(500).type('html').send(render.errorPage({
      code: 500, title: 'Something broke',
      message: 'An unexpected error occurred. Please try again — if it persists, email support.'
    }));
  });

  return app;
}

module.exports = { createApp };
