'use strict';

const fs = require('fs');
const path = require('path');

// Resolve the app root robustly so this works both as a normal Node process
// and inside a bundled serverless function (where __dirname differs). Honors an
// explicit APP_ROOT override, then walks up looking for catalog/products.json.
function resolveRoot() {
  if (process.env.APP_ROOT && fs.existsSync(process.env.APP_ROOT)) return process.env.APP_ROOT;
  const candidates = [path.resolve(__dirname, '..', '..'), process.cwd()];
  for (const start of candidates) {
    let dir = start;
    for (let i = 0; i < 8; i++) {
      if (fs.existsSync(path.join(dir, 'catalog', 'products.json'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return path.resolve(__dirname, '..', '..');
}

const ROOT = resolveRoot();
const CATALOG_PATH = path.join(ROOT, 'catalog', 'products.json');
const MANIFEST_PATH = path.join(ROOT, 'dist', 'manifest.json');

function loadRaw() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function resolveStore(store) {
  const supportEmail = store.supportEmail === 'SUPPORT_EMAIL'
    ? (process.env.SUPPORT_EMAIL || 'support@claudefarm.example')
    : store.supportEmail;
  return { ...store, supportEmail };
}

/** Products merged with build manifest (version, checksum, verification, artifact). */
function getProducts() {
  const raw = loadRaw();
  const manifest = loadManifest();
  return raw.products.map((p) => {
    const built = manifest && manifest.products ? manifest.products[p.id] : null;
    return {
      ...p,
      priceLabel: p.priceCents === 0 ? 'Free' : '$' + (p.priceCents / 100).toFixed(p.priceCents % 100 === 0 ? 0 : 2),
      version: built ? built.version : (p.version || null),
      releaseDate: built ? built.releaseDate : null,
      checksum: built ? built.checksum : null,
      artifactBytes: built ? built.bytes : null,
      verification: built ? built.verification : null,
      hasArtifact: Boolean(built && built.file && fs.existsSync(built.file))
    };
  });
}

function getProduct(slugOrId) {
  return getProducts().find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
}

function getStore() {
  return resolveStore(loadRaw().store);
}

function getCurrency() {
  return loadRaw().currency || 'usd';
}

module.exports = {
  ROOT,
  MANIFEST_PATH,
  loadRaw,
  loadManifest,
  getProducts,
  getProduct,
  getStore,
  getCurrency
};
