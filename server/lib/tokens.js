'use strict';

const crypto = require('crypto');

/**
 * Small HMAC-signed token helper used for (a) mock checkout sessions and
 * (b) time-limited download grants. Never trust client-supplied product/price
 * data — these tokens are minted server-side and verified server-side.
 */

let cachedSecret = null;
function secret() {
  if (cachedSecret) return cachedSecret;
  const s = process.env.APP_SECRET;
  if (s && s.length >= 16) {
    cachedSecret = s;
  } else {
    // Dev fallback: stable within a process so tokens verify during a session.
    cachedSecret = 'dev-only-secret-' + crypto.createHash('sha256').update(process.cwd()).digest('hex').slice(0, 24);
    if (!global.__CF_SECRET_WARNED) {
      global.__CF_SECRET_WARNED = true;
      console.warn('[claudefarm] APP_SECRET not set — using a dev-only signing key. Set APP_SECRET in production.');
    }
  }
  return cachedSecret;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload, ttlSeconds = 3600) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(JSON.stringify(body));
  const mac = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${mac}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [data, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(mac || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

module.exports = { sign, verify };
