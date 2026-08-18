'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startServer } = require('./helpers');

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.stop(); });

test('homepage renders with the core positioning', async () => {
  const res = await fetch(srv.base + '/');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Test them before you buy/i);
  assert.match(html, /id="demo"/);
  assert.match(html, /Run a real Claude skill/i);
});

test('demo endpoint runs the real budget skill', async () => {
  const res = await fetch(srv.base + '/api/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'budget', input: 'income 5000 rent 1500 groceries 500' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.match(data.output, /CLAUDE SKILL: budget/);
  assert.match(data.output, /\$5,000/);
});

test('demo endpoint rejects unknown commands with a helpful message', async () => {
  const res = await fetch(srv.base + '/api/demo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'rm', input: '-rf /' })
  });
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.match(data.error, /budget/);
});

test('product pages render with correct prices and details', async () => {
  const cookbook = await (await fetch(srv.base + '/p/context-cookbook')).text();
  assert.match(cookbook, /1M Context Cookbook/);
  assert.match(cookbook, /\$19/);
  assert.match(cookbook, /What you receive/);
  assert.match(cookbook, /Install it/);

  const missing = await fetch(srv.base + '/p/does-not-exist');
  assert.equal(missing.status, 404);
});

test('checkout maps to the correct product (mock mode)', async () => {
  const res = await fetch(srv.base + '/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: 'skill-farmers-toolkit' })
  });
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'mock');
  assert.match(data.url, /product=skill-farmers-toolkit/);
  assert.match(data.url, /\/success\?/);
});

test('free product cannot be checked out; redirects to download', async () => {
  const res = await fetch(srv.base + '/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: 'budget' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.redirect, /product=budget/);
});

test('full purchase → success → protected download works', async () => {
  const checkout = await (await fetch(srv.base + '/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: 'context-cookbook' })
  })).json();
  const url = new URL(checkout.url);
  const sessionId = url.searchParams.get('session_id');

  const successHtml = await (await fetch(srv.base + '/success?session_id=' + encodeURIComponent(sessionId) + '&product=context-cookbook&mock=1')).text();
  assert.match(successHtml, /You're in/);
  const m = successHtml.match(/\/api\/download\?product=context-cookbook&amp;token=([^"]+)/);
  assert.ok(m, 'success page should contain a tokenized download link');
  const token = m[1];

  const dl = await fetch(srv.base + '/api/download?product=context-cookbook&token=' + token);
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get('content-type'), /zip/);
});

test('paid download is refused without a valid token', async () => {
  const res = await fetch(srv.base + '/api/download?product=context-cookbook', {
    headers: { Accept: 'application/json' }
  });
  assert.equal(res.status, 403);
});

test('tampered checkout session is rejected server-side', async () => {
  const res = await fetch(srv.base + '/success?session_id=mock_not_a_real_token&product=context-cookbook');
  assert.equal(res.status, 402);
});

test('free download works with no token', async () => {
  const res = await fetch(srv.base + '/api/download?product=budget');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /zip/);
});

test('core navigation, sitemap and robots respond', async () => {
  for (const p of ['/products', '/quiz', '/trust']) {
    assert.equal((await fetch(srv.base + p)).status, 200, p);
  }
  assert.match(await (await fetch(srv.base + '/sitemap.xml')).text(), /\/p\/context-cookbook/);
  assert.match(await (await fetch(srv.base + '/robots.txt')).text(), /Sitemap:/);
  assert.equal((await fetch(srv.base + '/totally-missing', { headers: { Accept: 'text/html' } })).status, 404);
});

test('analytics endpoint accepts allowlisted events and rejects others', async () => {
  const ok = await fetch(srv.base + '/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'demo_started', props: { command: 'budget' } })
  });
  assert.equal(ok.status, 202);
  const bad = await fetch(srv.base + '/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'evil_event' })
  });
  assert.equal(bad.status, 400);
});
