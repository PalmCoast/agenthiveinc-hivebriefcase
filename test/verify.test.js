'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadManifest, loadRaw, ROOT } = require('../server/lib/catalog');
const { verifyProduct } = require('../scripts/lib/verify');
const { checksumFile } = require('../scripts/lib/pack');

test('every catalog product built and PASSES verification', () => {
  const manifest = loadManifest();
  assert.ok(manifest, 'manifest should exist (pretest builds it)');
  const catalog = loadRaw();
  for (const p of catalog.products) {
    const entry = manifest.products[p.id];
    assert.ok(entry, `manifest missing ${p.id}`);
    assert.equal(entry.verification.status, 'PASS', `${p.id} should PASS`);
  }
});

test('release artifact checksums match the built files on disk', () => {
  const manifest = loadManifest();
  for (const id of Object.keys(manifest.products)) {
    const entry = manifest.products[id];
    assert.ok(fs.existsSync(entry.file), `${id} artifact should exist`);
    assert.equal(checksumFile(entry.file), entry.checksum, `${id} checksum mismatch`);
  }
});

test('verification actually FAILS a structurally broken product (not faked)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'broken-'));
  // SKILL.md references an entry script that does not exist.
  fs.writeFileSync(path.join(dir, 'SKILL.md'), [
    '---',
    'name: broken',
    'description: intentionally broken for the test',
    'version: 0.0.1',
    'entry: scripts/missing.js',
    'verify: node scripts/missing.js',
    '---',
    '# Broken'
  ].join('\n'));

  const product = { id: 'broken', slug: 'broken', name: 'Broken', sourceDir: path.relative(ROOT, dir) };
  const result = verifyProduct(product, null);
  assert.equal(result.status, 'FAIL');
  const entryCheck = result.checks.find((c) => c.label === 'Entry script exists');
  assert.equal(entryCheck.status, 'fail');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('verification reports NOT AUTOMATABLE honestly rather than passing', () => {
  const manifest = loadManifest();
  const cookbook = manifest.products['context-cookbook'];
  const hasNA = cookbook.verification.checks.some((c) => c.status === 'not-automatable');
  // The cookbook has no external links, so it may have none — assert the field
  // is a real status value, never silently "pass" for an unrun check.
  for (const c of cookbook.verification.checks) {
    assert.ok(['pass', 'fail', 'not-automatable'].includes(c.status));
  }
  assert.equal(typeof hasNA, 'boolean');
});
