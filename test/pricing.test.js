'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { getProducts } = require('../server/lib/catalog');

// Guards against accidental price/positioning drift. Prices are the source of
// truth used server-side for checkout; the browser can never override them.
const EXPECTED = {
  'free-budget': { priceCents: 0, tier: 'free' },
  'context-cookbook': { priceCents: 1900, tier: 'entry' },
  'skill-farmers-toolkit': { priceCents: 2900, tier: 'pro' },
  'whole-farm': { priceCents: 9900, tier: 'complete' }
};

test('catalog prices and tiers match the intended value ladder', () => {
  const byId = Object.fromEntries(getProducts().map((p) => [p.id, p]));
  for (const [id, exp] of Object.entries(EXPECTED)) {
    assert.ok(byId[id], `missing product ${id}`);
    assert.equal(byId[id].priceCents, exp.priceCents, `${id} price`);
    assert.equal(byId[id].tier, exp.tier, `${id} tier`);
  }
});

test('exactly four products, one per tier', () => {
  const products = getProducts();
  assert.equal(products.length, 4);
  const tiers = products.map((p) => p.tier).sort();
  assert.deepEqual(tiers, ['complete', 'entry', 'free', 'pro']);
});
