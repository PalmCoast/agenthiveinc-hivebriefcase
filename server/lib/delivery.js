'use strict';

const fs = require('fs');
const path = require('path');
const { getProduct, loadManifest } = require('./catalog');
const tokens = require('./tokens');

/**
 * Download delivery. Free products download directly. Paid products require a
 * short-lived, HMAC-signed grant that is only issued after server-side payment
 * verification. Artifacts are served from dist/ by manifest entry — never from
 * a client-supplied path.
 */
function artifactFor(productId) {
  const manifest = loadManifest();
  if (!manifest || !manifest.products || !manifest.products[productId]) return null;
  const entry = manifest.products[productId];
  if (!entry.file || !fs.existsSync(entry.file)) return null;
  return entry;
}

function issueDownloadToken(productId) {
  return tokens.sign({ kind: 'download', product: productId }, 60 * 30); // 30 min
}

function verifyDownloadToken(token, productId) {
  const payload = tokens.verify(token);
  if (!payload || payload.kind !== 'download') return false;
  return payload.product === productId;
}

/**
 * Resolve a download request into a streamable artifact or an error reason.
 * @returns {{ok:true, file:string, filename:string, entry:object} | {ok:false, status:number, reason:string}}
 */
function resolveDownload({ slug, token }) {
  const product = getProduct(slug);
  if (!product) return { ok: false, status: 404, reason: 'product_not_found' };

  const entry = artifactFor(product.id);
  if (!entry) return { ok: false, status: 503, reason: 'artifact_not_built' };

  if (product.priceCents > 0) {
    if (!token || !verifyDownloadToken(token, product.id)) {
      return { ok: false, status: 403, reason: 'invalid_or_missing_token' };
    }
  }

  const filename = path.basename(entry.file);
  // Guard against any path escaping: the file must live under dist/.
  return { ok: true, file: entry.file, filename, entry };
}

module.exports = { artifactFor, issueDownloadToken, verifyDownloadToken, resolveDownload };
