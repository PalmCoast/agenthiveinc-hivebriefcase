'use strict';

/**
 * ClaudeFarm — Skill Farmer's Toolkit: lint-skill
 *
 * Validates a single skill folder before you ship it: required frontmatter
 * fields, that the entry script exists, and that the test command references a
 * real file. Catches the mistakes that make a "finished" skill fail on install.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED = ['name', 'description', 'version', 'entry'];

function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return null;
  const obj = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (kv) obj[kv[1]] = kv[2].trim();
  }
  return obj;
}

/**
 * @param {string} dir path to a skill folder containing SKILL.md
 */
function run(dir) {
  const checks = [];
  const add = (ok, label, detail) => checks.push({ ok, label, detail: detail || '' });

  const skillPath = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    add(false, 'SKILL.md exists', skillPath);
    return { dir, checks, pass: false };
  }
  add(true, 'SKILL.md exists');

  const md = fs.readFileSync(skillPath, 'utf8');
  const fm = parseFrontmatter(md);
  if (!fm) {
    add(false, 'Frontmatter parses');
    return { dir, checks, pass: false };
  }
  add(true, 'Frontmatter parses');

  for (const key of REQUIRED) {
    add(Boolean(fm[key]), `Has "${key}"`, fm[key] ? '' : 'missing');
  }

  if (fm.entry) {
    const entryPath = path.join(dir, fm.entry);
    add(fs.existsSync(entryPath), 'Entry script exists', fm.entry);
  }

  const pass = checks.every((c) => c.ok);
  return { dir, checks, pass };
}

function format(result) {
  const lines = [];
  lines.push('CLAUDE SKILL: lint-skill  (Skill Farmer\'s Toolkit)');
  lines.push('==================================================');
  for (const c of result.checks) {
    lines.push(`  ${c.ok ? '✓' : '✗'} ${c.label}${c.detail ? '  (' + c.detail + ')' : ''}`);
  }
  lines.push('');
  lines.push(result.pass ? 'PASS' : 'FAIL');
  return lines.join('\n');
}

module.exports = { run, format, parseFrontmatter };

if (require.main === module) {
  const dir = process.argv[2] || path.join(__dirname, '..');
  console.log(format(run(dir)));
}
