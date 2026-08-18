'use strict';

/**
 * Minimal YAML-frontmatter parser for SKILL.md files.
 * Supports scalar `key: value` and simple `key:` followed by `- item` lists.
 * Intentionally dependency-free and strict enough for our schema.
 */
function parseFrontmatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) return null;
  const obj = {};
  let currentListKey = null;
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && currentListKey) {
      obj[currentListKey].push(listItem[1].trim());
      continue;
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      if (val === '') {
        obj[key] = [];
        currentListKey = key;
      } else {
        obj[key] = val;
        currentListKey = null;
      }
    }
  }
  return obj;
}

module.exports = { parseFrontmatter };
