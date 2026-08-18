'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseFrontmatter } = require('./frontmatter');
const { listFiles, listZipEntries, checksumFile } = require('./pack');

const ROOT = path.resolve(__dirname, '..', '..');
const PASS = 'pass';
const FAIL = 'fail';
const NA = 'not-automatable';

function tokenizeCommand(cmd) {
  // Split a shell-ish command respecting double quotes. Good enough for our
  // controlled `node script "arg"` commands.
  const out = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(cmd))) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}

function runExampleCommand(cmd, cwd) {
  const tokens = tokenizeCommand(cmd);
  if (tokens[0] !== 'node') {
    return { status: NA, detail: `only "node ..." commands are auto-run (got: ${cmd})` };
  }
  const scriptRel = tokens[1];
  const args = tokens.slice(2);
  const scriptAbs = path.join(cwd, scriptRel);
  if (!fs.existsSync(scriptAbs)) {
    return { status: FAIL, detail: `referenced script missing: ${scriptRel}` };
  }
  try {
    execFileSync('node', [scriptRel, ...args], { cwd, timeout: 15000, stdio: 'pipe' });
    return { status: PASS, detail: cmd };
  } catch (err) {
    return { status: FAIL, detail: `${cmd} exited ${err.status ?? 'error'}` };
  }
}

function findInternalRefs(text) {
  const refs = new Set();
  const re = /(?:scripts|recipes)\/[A-Za-z0-9_\-./]+\.(?:js|md)/g;
  let m;
  while ((m = re.exec(text))) refs.add(m[0]);
  return [...refs];
}

function countExternalLinks(text) {
  const m = text.match(/https?:\/\/[^\s)"'`]+/g);
  return m ? m.length : 0;
}

/**
 * Verify a single source-skill product (has its own SKILL.md).
 * @param {object} product catalog entry
 * @param {object} [manifestEntry] built artifact entry ({file, checksum, files})
 */
function verifySkillProduct(product, manifestEntry) {
  const checks = [];
  const add = (label, status, detail) => checks.push({ label, status, detail: detail || '' });

  const dir = path.join(ROOT, product.sourceDir);
  if (!fs.existsSync(dir)) {
    add('Source directory exists', FAIL, product.sourceDir);
    return finalize(product, checks);
  }
  add('Source directory exists', PASS, product.sourceDir);

  const skillPath = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    add('SKILL.md present', FAIL);
    return finalize(product, checks);
  }
  add('SKILL.md present', PASS);

  const md = fs.readFileSync(skillPath, 'utf8');
  const fm = parseFrontmatter(md);
  if (!fm) {
    add('SKILL.md frontmatter valid', FAIL);
    return finalize(product, checks);
  }
  const required = ['name', 'description', 'version', 'entry'];
  const missing = required.filter((k) => !fm[k]);
  add('SKILL.md frontmatter valid', missing.length ? FAIL : PASS, missing.length ? `missing: ${missing.join(', ')}` : `v${fm.version}`);

  // README present
  add('README.md present', fs.existsSync(path.join(dir, 'README.md')) ? PASS : FAIL);

  // Entry script exists
  if (fm.entry) {
    add('Entry script exists', fs.existsSync(path.join(dir, fm.entry)) ? PASS : FAIL, fm.entry);
  }

  // Internal references in SKILL.md + README resolve
  const refText = md + '\n' + (fs.existsSync(path.join(dir, 'README.md')) ? fs.readFileSync(path.join(dir, 'README.md'), 'utf8') : '');
  const refs = findInternalRefs(refText);
  const brokenRefs = refs.filter((r) => !fs.existsSync(path.join(dir, r)));
  add('Documented file references resolve', brokenRefs.length ? FAIL : PASS, brokenRefs.length ? `broken: ${brokenRefs.join(', ')}` : `${refs.length} refs`);

  // Example command actually executes
  const exampleCmd = fm.verify || fm.test;
  if (exampleCmd) {
    const res = runExampleCommand(exampleCmd, dir);
    add('Example command executes', res.status, res.detail);
  } else {
    add('Example command executes', NA, 'no verify/test command declared');
  }

  // Archive checks (require a built artifact)
  if (manifestEntry && fs.existsSync(manifestEntry.file)) {
    const entries = listZipEntries(manifestEntry.file);
    const expected = listFiles(dir).map((f) => path.posix.join(product.slug, f)).sort();
    const missingInZip = expected.filter((f) => !entries.includes(f));
    add('Archive contains expected files', missingInZip.length ? FAIL : PASS, missingInZip.length ? `missing: ${missingInZip.join(', ')}` : `${entries.length} files`);

    const actual = checksumFile(manifestEntry.file);
    add('Download artifact matches release checksum', actual === manifestEntry.checksum ? PASS : FAIL, actual === manifestEntry.checksum ? manifestEntry.checksum.slice(0, 22) + '…' : 'checksum mismatch');
  } else {
    add('Archive contains expected files', NA, 'no built artifact (run build first)');
    add('Download artifact matches release checksum', NA, 'no built artifact (run build first)');
  }

  // External link liveness — honestly not automatable offline
  const ext = countExternalLinks(refText);
  if (ext > 0) add('External link liveness', NA, `${ext} external link(s) require network — not auto-checked`);

  return finalize(product, checks);
}

/**
 * Verify a bundle product (whole-farm): all included products pass, and the
 * bundle archive contains each included product's files.
 */
function verifyBundleProduct(product, manifestEntry, resultsById) {
  const checks = [];
  const add = (label, status, detail) => checks.push({ label, status, detail: detail || '' });

  const included = product.bundleOf || [];
  add('Bundle references known products', included.length ? PASS : FAIL, included.join(', '));

  for (const id of included) {
    const r = resultsById[id];
    add(`Included product passes: ${id}`, r ? (r.status === 'PASS' ? PASS : FAIL) : NA, r ? r.status : 'not verified yet');
  }

  if (manifestEntry && fs.existsSync(manifestEntry.file)) {
    const entries = listZipEntries(manifestEntry.file);
    add('Bundle archive is non-empty', entries.length ? PASS : FAIL, `${entries.length} files`);
    const actual = checksumFile(manifestEntry.file);
    add('Download artifact matches release checksum', actual === manifestEntry.checksum ? PASS : FAIL, actual === manifestEntry.checksum ? manifestEntry.checksum.slice(0, 22) + '…' : 'mismatch');
  } else {
    add('Bundle archive is non-empty', NA, 'no built artifact (run build first)');
  }

  return finalize(product, checks);
}

function finalize(product, checks) {
  const failed = checks.filter((c) => c.status === FAIL);
  return {
    id: product.id,
    name: product.name,
    checks,
    status: failed.length ? 'FAIL' : 'PASS',
    verifiedAt: new Date().toISOString()
  };
}

function verifyProduct(product, manifestEntry, resultsById = {}) {
  if (product.bundleOf) return verifyBundleProduct(product, manifestEntry, resultsById);
  return verifySkillProduct(product, manifestEntry);
}

function formatReport(result) {
  const lines = [];
  lines.push('PRODUCT VERIFICATION — ' + result.name + ' (' + result.id + ')');
  lines.push('='.repeat(48));
  const symbol = { pass: '✓', fail: '✗', 'not-automatable': '•' };
  for (const c of result.checks) {
    const tag = c.status === NA ? 'NOT AUTOMATABLE' : '';
    lines.push(`  ${symbol[c.status]} ${c.label}${c.detail ? '  — ' + c.detail : ''}${tag ? '  [' + tag + ']' : ''}`);
  }
  lines.push('');
  lines.push(result.status);
  return lines.join('\n');
}

module.exports = { verifyProduct, formatReport, PASS, FAIL, NA };
