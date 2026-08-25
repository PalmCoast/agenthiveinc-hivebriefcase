'use strict';

/**
 * Free, genuinely-useful guide content for organic search. Each guide targets a
 * real question a Claude user searches for and links into the relevant product.
 * Content is authored (trusted) HTML — no fabricated claims or stats.
 */
const GUIDES = [
  {
    slug: 'install-claude-code-skills',
    title: 'How to install a Claude Code skill (step by step)',
    description: 'A plain, five-step guide to installing a Claude Code skill from a downloaded package, plus how to verify it actually works before you rely on it.',
    updated: '2026-08-20',
    related: ['free-budget', 'whole-farm'],
    bodyHtml: `
      <p>A Claude Code skill is just a folder of files — a <code>SKILL.md</code> that
      describes the skill and one or more scripts it runs. Installing one is
      copying that folder into your skills directory and confirming it runs.
      Here is the whole process.</p>

      <h2>1. Download and unzip</h2>
      <p>Download the skill's <code>.zip</code> and unzip it. You should see a single
      top-level folder containing a <code>SKILL.md</code> and a <code>scripts/</code>
      directory. If you want to try one first, the
      <a href="/p/budget">free Budget skill</a> is a complete, real example you can
      <a href="/#demo">run live in your browser</a> before downloading.</p>

      <h2>2. Copy the folder into your Claude Code skills directory</h2>
      <p>Move the unzipped folder into the directory Claude Code loads skills from.
      Keep the folder intact — the <code>SKILL.md</code> and <code>scripts/</code>
      must stay together for the skill to resolve its own files.</p>

      <h2>3. Verify it before you rely on it</h2>
      <p>Every ClaudeFarm skill ships a one-line verify command in its
      <code>SKILL.md</code>. Run it to confirm the skill executes on your machine:</p>
      <pre><code>node scripts/&lt;skill&gt;.js</code></pre>
      <p>If it prints output with no error, the skill is installed correctly.</p>

      <h2>4. Use it from Claude</h2>
      <p>Ask Claude to run the skill by its command name (listed in the
      <code>SKILL.md</code> frontmatter). Because the workflow lives in a file, you
      get the same structured result every time instead of re-prompting.</p>

      <h2>5. Keep it updated</h2>
      <p>When a skill is updated, re-download and replace the folder. Paid ClaudeFarm
      products include lifetime updates, so you can always pull the latest version.</p>

      <h2>Why "works the first time" matters</h2>
      <p>Most install failures come from a missing file, a bad path, or documentation
      that doesn't match the package. ClaudeFarm runs every product through an
      automated verification suite before shipping — file structure, valid
      <code>SKILL.md</code>, referenced files, and an example run — so the install
      steps above actually match what's in the box.</p>
    `
  },
  {
    slug: '1m-context-workflows',
    title: 'Reliable 1M-context workflows with Claude',
    description: 'How to feed very large documents to Claude without truncation or drifting citations: boundary-aware chunking, stable citation indexing, and a map-reduce summary recipe.',
    updated: '2026-08-20',
    related: ['context-cookbook', 'whole-farm'],
    bodyHtml: `
      <p>Long inputs break naive workflows: text gets cut mid-sentence, summaries
      lose the thread, and citations drift to pages that don't exist. Here is a
      reliable pattern for working with very large documents.</p>

      <h2>Chunk on real boundaries, with overlap</h2>
      <p>Don't split by a fixed character count — you'll cut sentences in half.
      Split on paragraph or sentence boundaries and add a small overlap so no idea
      is orphaned between chunks. The
      <a href="/p/context-cookbook">1M Context Cookbook</a> ships a
      <code>chunk</code> script that does exactly this and is deterministic.</p>

      <h2>Build a stable citation index</h2>
      <p>Give every citable line a stable id (for example <code>[L42]</code>) and ask
      Claude to cite those ids. Stable anchors make hallucinated citations obvious
      and easy to reject.</p>

      <h2>Map-reduce for oversized documents</h2>
      <ol>
        <li><strong>Map:</strong> summarize each chunk into a few bullet points,
        keeping names, numbers, and dates exact.</li>
        <li><strong>Reduce:</strong> merge the bullet summaries, remove duplicates,
        and flag contradictions between chunks.</li>
        <li><strong>Verify:</strong> spot-check a few facts against the source using
        the citation index.</li>
      </ol>

      <h2>Why the plumbing matters more than the prompt</h2>
      <p>The hard part of long-context work isn't the wording of the prompt — it's the
      mechanical steps around it. Reliable chunking and citation indexing are what
      keep the output faithful to the source, which is why the Cookbook ships them as
      tested scripts rather than as prose.</p>
    `
  },
  {
    slug: 'build-reusable-claude-skills',
    title: 'How to build reusable Claude skills that work on the first install',
    description: 'A short checklist for building Claude Code skills that other people can install and run without breakage: consistent structure, valid frontmatter, and a verify step.',
    updated: '2026-08-20',
    related: ['skill-farmers-toolkit', 'whole-farm'],
    bodyHtml: `
      <p>If you build more than one Claude skill, the difference between "works on my
      machine" and "works on the first install" is structure and verification. Here
      is a checklist that prevents the common failures.</p>

      <h2>Start from a consistent structure</h2>
      <p>Every skill should have a <code>SKILL.md</code> with valid frontmatter
      (name, description, version, entry) and a <code>scripts/</code> directory. The
      <a href="/p/skill-farmers-toolkit">Skill Farmer's Toolkit</a> scaffolds this for
      you so every skill starts the same way.</p>

      <h2>Keep the entry script dependency-light</h2>
      <p>Skills that lean on the standard library install cleanly anywhere. Fewer
      dependencies means fewer ways an install can fail on someone else's setup.</p>

      <h2>Lint before you ship</h2>
      <p>The most common shipping bug is a <code>SKILL.md</code> that references an
      entry file that isn't there. A quick lint that checks frontmatter and confirms
      the entry file exists catches this before it reaches a user.</p>

      <h2>Include a one-line verify command</h2>
      <p>Put a runnable verify command in the <code>SKILL.md</code> so anyone can
      confirm the skill works in one step. This is the single most effective way to
      make a skill feel trustworthy.</p>

      <h2>Version and document updates</h2>
      <p>Bump the version on every change and say what "updates" means. Predictable
      versioning is what lets people rely on your skills over time.</p>
    `
  }
];

function getGuides() {
  return GUIDES;
}

function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}

module.exports = { getGuides, getGuide };
