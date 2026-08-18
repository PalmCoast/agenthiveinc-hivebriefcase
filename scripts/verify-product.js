'use strict';

/**
 * verify-product — run the verification suite against built release artifacts.
 *
 * Usage:
 *   node scripts/verify-product.js            # verify all products
 *   node scripts/verify-product.js budget     # verify one product by slug/id
 *
 * Exits non-zero if any product FAILs, so it can gate a release.
 */

const fs = require('fs');
const path = require('path');
const { ROOT, MANIFEST_PATH, loadRaw } = require('../server/lib/catalog');
const { verifyProduct, formatReport } = require('./lib/verify');

function ensureBuilt() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log('No build manifest found — building products first...\n');
    process.env.BUILD_QUIET = '1';
    require('./build-products').main();
  }
}

function main() {
  ensureBuilt();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const catalog = loadRaw();
  const filter = process.argv[2];

  const source = catalog.products.filter((p) => !p.bundleOf);
  const bundles = catalog.products.filter((p) => p.bundleOf);

  const results = {};
  const ordered = [...source, ...bundles].filter(
    (p) => !filter || p.slug === filter || p.id === filter
  );

  if (!ordered.length) {
    console.error(`No product matches "${filter}".`);
    process.exit(2);
  }

  // Verify source first so bundles can reference their results.
  let anyFail = false;
  const run = (p) => {
    const entry = manifest.products[p.id];
    const result = verifyProduct(p, entry, results);
    results[p.id] = result;
    console.log(formatReport(result) + '\n');
    if (result.status !== 'PASS') anyFail = true;
  };
  ordered.filter((p) => !p.bundleOf).forEach(run);
  ordered.filter((p) => p.bundleOf).forEach(run);

  console.log(anyFail ? 'RESULT: FAIL (one or more products did not pass)' : 'RESULT: PASS (all verified products passed)');
  process.exit(anyFail ? 1 : 0);
}

if (require.main === module) main();

module.exports = { main };
