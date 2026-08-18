'use strict';

/**
 * ClaudeFarm — Skill Farmer's Toolkit: scaffold
 *
 * Generates a valid, ready-to-edit Claude skill (SKILL.md + entry script) so
 * every skill you build starts from the same tested structure.
 */

function slug(name) {
  return String(name || 'my-skill')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-skill';
}

/**
 * @param {string} name
 * @returns {{files: {path:string, contents:string}[]}}
 */
function run(name) {
  const id = slug(name);
  const skillMd = `---
name: ${id}
title: ${name || id}
description: One sentence describing exactly what this skill does.
version: 0.1.0
license: MIT
compatibility:
  - Claude Code (skills format)
entry: scripts/${id}.js
command: ${id}
test: node scripts/${id}.js
---

# ${name || id}

Describe the skill, who it is for, and how to run it.
`;
  const entry = `'use strict';

function run(input) {
  return { input: String(input || ''), ok: true };
}

module.exports = { run };

if (require.main === module) {
  console.log(JSON.stringify(run(process.argv.slice(2).join(' ')), null, 2));
}
`;
  return {
    files: [
      { path: `${id}/SKILL.md`, contents: skillMd },
      { path: `${id}/scripts/${id}.js`, contents: entry }
    ]
  };
}

function format(result) {
  const lines = [];
  lines.push('CLAUDE SKILL: scaffold  (Skill Farmer\'s Toolkit)');
  lines.push('================================================');
  lines.push(`Generated ${result.files.length} files:`);
  for (const f of result.files) lines.push(`  + ${f.path}`);
  return lines.join('\n');
}

module.exports = { run, format, slug };

if (require.main === module) {
  const name = process.argv.slice(2).join(' ') || 'invoice-parser';
  console.log(format(run(name)));
}
