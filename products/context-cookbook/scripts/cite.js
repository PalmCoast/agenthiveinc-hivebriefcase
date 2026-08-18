'use strict';

/**
 * ClaudeFarm — 1M Context Cookbook: cite
 *
 * Builds a stable citation index for a large document so Claude can reference
 * exact locations ([L12], [L340]) instead of hallucinating page numbers.
 * Deterministic and dependency-free.
 */

/**
 * @param {string} text
 * @returns {{lines:number, index:{id:string, line:number, text:string}[]}}
 */
function run(text) {
  const src = String(text || '');
  const rawLines = src.split(/\r?\n/);
  const index = [];
  rawLines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.length >= 20) {
      index.push({ id: `L${i + 1}`, line: i + 1, text: trimmed });
    }
  });
  return { lines: rawLines.length, index };
}

function format(result) {
  const lines = [];
  lines.push('CLAUDE SKILL: cite  (1M Context Cookbook)');
  lines.push('=========================================');
  lines.push(`Lines: ${result.lines}   Citable spans: ${result.index.length}`);
  lines.push('');
  for (const c of result.index.slice(0, 20)) {
    const preview = c.text.replace(/\s+/g, ' ').slice(0, 56);
    lines.push(`  [${c.id}] ${preview}${c.text.length > 56 ? '…' : ''}`);
  }
  if (result.index.length > 20) lines.push(`  … +${result.index.length - 20} more`);
  return lines.join('\n');
}

module.exports = { run, format };

if (require.main === module) {
  const fs = require('fs');
  const arg = process.argv[2];
  let text;
  if (arg && fs.existsSync(arg)) text = fs.readFileSync(arg, 'utf8');
  else text = 'Introduction to the report.\nThis section covers the methodology in detail.\nResults were measured across three runs.\nConclusion and next steps for the team.';
  console.log(format(run(text)));
}
