'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./catalog');

/**
 * Privacy-conscious, self-hosted funnel analytics. Appends one JSON line per
 * event to data/events.log. No cookies, no third-party scripts, no PII — only
 * an allowlisted event name and a small allowlisted property set.
 */
const DATA_DIR = path.join(ROOT, 'data');
const LOG = path.join(DATA_DIR, 'events.log');

const ALLOWED_EVENTS = new Set([
  'page_view',
  'demo_started',
  'demo_completed',
  'free_download',
  'product_view',
  'product_selector_started',
  'product_selector_completed',
  'checkout_started',
  'checkout_completed',
  'download_started',
  'installation_started',
  'installation_verified',
  'upgrade_clicked'
]);

const ALLOWED_PROPS = new Set(['product', 'path', 'command', 'tier', 'answer', 'source']);

const counts = Object.create(null);

function track(event, props = {}) {
  if (!ALLOWED_EVENTS.has(event)) return { ok: false, error: 'unknown_event' };
  const safeProps = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (ALLOWED_PROPS.has(k) && (typeof v === 'string' || typeof v === 'number')) {
      safeProps[k] = String(v).slice(0, 80);
    }
  }
  const record = { t: new Date().toISOString(), event, ...safeProps };
  counts[event] = (counts[event] || 0) + 1;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify(record) + '\n');
  } catch {
    /* analytics must never break a request */
  }
  return { ok: true };
}

function summary() {
  return { counts: { ...counts } };
}

module.exports = { track, summary, ALLOWED_EVENTS: [...ALLOWED_EVENTS] };
