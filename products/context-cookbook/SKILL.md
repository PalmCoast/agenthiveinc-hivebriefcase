---
name: context-cookbook
title: 1M Context Cookbook
description: Recipes and skills for feeding huge documents to Claude without losing structure — boundary-aware chunking and stable citation indexing.
version: 1.0.0
license: commercial
compatibility:
  - Claude Code (skills format)
entry: scripts/chunk.js
command: chunk
test: node scripts/chunk.js
verify: node scripts/cite.js
---

# 1M Context Cookbook

Working with very large inputs breaks most prompt packs: sentences get cut,
citations drift, and summaries lose the thread. This cookbook ships the
mechanical plumbing that makes long-context workflows reliable.

## What you get

- `scripts/chunk.js` — boundary-aware chunking with overlap (never splits mid-sentence)
- `scripts/cite.js` — stable citation index so Claude references exact lines
- `recipes/map-reduce-summary.md` — a repeatable long-document summary recipe
- `recipes/citation-qa.md` — grounded Q&A with real citations
- `SKILL.md` + `README.md`

## Use it

```
chunk ./big-report.txt
cite ./big-report.txt
```

## Install

1. Download and unzip.
2. Copy the `context-cookbook` folder into your Claude Code skills directory.
3. Verify: `node scripts/chunk.js`
4. Follow a recipe in `recipes/`.

## Updates

Lifetime updates: every future revision of these recipes and scripts is
included with your one-time purchase. Re-download from claudefarm any time.
