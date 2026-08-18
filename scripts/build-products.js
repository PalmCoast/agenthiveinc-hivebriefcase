'use strict';

/**
 * ClaudeFarm release pipeline.
 *
 * For every catalog product: package the source into a versioned zip artifact,
 * compute its checksum, run the verification suite, and write dist/manifest.json
 * — the single source of truth the storefront reads for version, checksum,
 * verification status, and which artifact to serve.
 *
 * Build never fabricates a pass: it records the real verification result.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { ROOT, loadRaw } = require('../server/lib/catalog');
const { packDir, listFiles } = require('./lib/pack');
const { parseFrontmatter } = require('./lib/frontmatter');
const { verifyProduct, formatReport } = require('./lib/verify');

const DIST = path.join(ROOT, 'dist');

function versionOf(product) {
  if (product.version) return product.version;
  const skill = path.join(ROOT, product.sourceDir, 'SKILL.md');
  if (fs.existsSync(skill)) {
    const fm = parseFrontmatter(fs.readFileSync(skill, 'utf8'));
    if (fm && fm.version) return fm.version;
  }
  return '0.0.0';
}

function assembleBundle(product, catalog, tmpDir) {
  // Combine each included product's folder under its slug inside a temp dir.
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const id of product.bundleOf) {
    const inc = catalog.products.find((p) => p.id === id);
    if (!inc || !inc.sourceDir) continue;
    const srcDir = path.join(ROOT, inc.sourceDir);
    const destDir = path.join(tmpDir, inc.slug);
    for (const rel of listFiles(srcDir)) {
      const from = path.join(srcDir, rel);
      const to = path.join(destDir, rel);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
  return tmpDir;
}

function main() {
  const catalog = loadRaw();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const releaseDate = new Date().toISOString().slice(0, 10);
  const manifest = { generatedAt: new Date().toISOString(), products: {} };
  const results = {};

  // 1) Pack + verify source-skill products first.
  for (const product of catalog.products) {
    if (product.bundleOf) continue;
    const version = versionOf(product);
    const outFile = path.join(DIST, `${product.slug}-${version}.zip`);
    const packed = packDir(path.join(ROOT, product.sourceDir), product.slug, outFile);
    const entry = {
      id: product.id,
      version,
      releaseDate,
      file: outFile,
      relFile: path.relative(ROOT, outFile),
      bytes: packed.bytes,
      checksum: packed.checksum,
      files: packed.files,
      compatibility: catalog.products.find((p) => p.id === product.id) ? undefined : undefined
    };
    const result = verifyProduct(product, entry, results);
    results[product.id] = result;
    entry.verification = { status: result.status, verifiedAt: result.verifiedAt, checks: result.checks };
    manifest.products[product.id] = entry;
  }

  // 2) Pack + verify bundle products (need source results above).
  for (const product of catalog.products) {
    if (!product.bundleOf) continue;
    const version = versionOf(product);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wholefarm-'));
    assembleBundle(product, catalog, tmpDir);
    const outFile = path.join(DIST, `${product.slug}-${version}.zip`);
    const packed = packDir(tmpDir, product.slug, outFile);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    const entry = {
      id: product.id,
      version,
      releaseDate,
      file: outFile,
      relFile: path.relative(ROOT, outFile),
      bytes: packed.bytes,
      checksum: packed.checksum,
      files: packed.files
    };
    const result = verifyProduct(product, entry, results);
    results[product.id] = result;
    entry.verification = { status: result.status, verifiedAt: result.verifiedAt, checks: result.checks };
    manifest.products[product.id] = entry;
  }

  fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Report
  const ids = Object.keys(results);
  const failed = ids.filter((id) => results[id].status !== 'PASS');
  if (process.env.BUILD_QUIET !== '1') {
    for (const id of ids) console.log(formatReport(results[id]) + '\n');
  }
  console.log(`Build complete: ${ids.length} products, ${ids.length - failed.length} PASS, ${failed.length} FAIL.`);
  console.log(`Manifest: ${path.relative(ROOT, path.join(DIST, 'manifest.json'))}`);

  if (failed.length && process.env.BUILD_STRICT === '1') {
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main };
