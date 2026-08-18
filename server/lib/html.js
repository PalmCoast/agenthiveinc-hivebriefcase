'use strict';

/** Escape text for safe HTML interpolation. */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a value for use inside a double-quoted attribute. */
function attr(value) {
  return esc(value);
}

/** Join an array of html fragments. */
function join(arr) {
  return arr.filter(Boolean).join('');
}

module.exports = { esc, attr, join };
