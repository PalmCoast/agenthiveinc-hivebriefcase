'use strict';

/**
 * ClaudeFarm — 1M Context Cookbook: chunk
 *
 * Splits a large document into overlapping, boundary-aware chunks so you can
 * feed huge inputs to Claude without cutting sentences in half. Deterministic:
 * the same text and options always produce the same chunks.
 */

function approxTokens(text) {
  // Rough, dependency-free heuristic: ~4 chars per token.
  return Math.ceil(text.length / 4);
}

/**
 * @param {string} text
 * @param {{maxTokens?:number, overlapTokens?:number}} [opts]
 * @returns {{index:number, tokens:number, start:number, end:number, text:string}[]}
 */
function run(text, opts = {}) {
  const maxTokens = Math.max(50, opts.maxTokens || 800);
  const overlapTokens = Math.max(0, Math.min(opts.overlapTokens ?? 80, maxTokens - 10));
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const src = String(text || '');
  if (!src.trim()) return [];

  // Prefer to break on paragraph, then sentence, then whitespace boundaries.
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < src.length) {
    let end = Math.min(src.length, start + maxChars);
    if (end < src.length) {
      const window = src.slice(start, end);
      const para = window.lastIndexOf('\n\n');
      const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
      const space = window.lastIndexOf(' ');
      const breakAt = para > maxChars * 0.5 ? para
        : sentence > maxChars * 0.5 ? sentence + 1
          : space > maxChars * 0.5 ? space
            : -1;
      if (breakAt > 0) end = start + breakAt;
    }
    const piece = src.slice(start, end).trim();
    if (piece) {
      chunks.push({ index, tokens: approxTokens(piece), start, end, text: piece });
      index += 1;
    }
    if (end >= src.length) break;
    start = Math.max(end - overlapChars, start + 1);
  }
  return chunks;
}

function format(chunks) {
  const total = chunks.reduce((s, c) => s + c.tokens, 0);
  const lines = [];
  lines.push('CLAUDE SKILL: chunk  (1M Context Cookbook)');
  lines.push('==========================================');
  lines.push(`Chunks: ${chunks.length}   Approx tokens: ${total}`);
  lines.push('');
  for (const c of chunks) {
    const preview = c.text.replace(/\s+/g, ' ').slice(0, 60);
    lines.push(`  #${String(c.index).padStart(2, '0')}  ~${String(c.tokens).padStart(5)} tok  "${preview}${c.text.length > 60 ? '…' : ''}"`);
  }
  return lines.join('\n');
}

module.exports = { run, format, approxTokens };

if (require.main === module) {
  const fs = require('fs');
  const arg = process.argv[2];
  let text;
  if (arg && fs.existsSync(arg)) text = fs.readFileSync(arg, 'utf8');
  else text = arg || 'The quick brown fox. '.repeat(400);
  console.log(format(run(text, { maxTokens: 400, overlapTokens: 40 })));
}
