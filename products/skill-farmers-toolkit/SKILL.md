---
name: skill-farmers-toolkit
title: Skill Farmer's Toolkit
description: Tools for building reliable Claude skills fast — scaffold a valid skill and lint it before you ship so it works on the first install.
version: 1.0.0
license: commercial
compatibility:
  - Claude Code (skills format)
entry: scripts/scaffold.js
command: scaffold
test: node scripts/lint-skill.js
verify: node scripts/scaffold.js
---

# Skill Farmer's Toolkit

If you build serious Claude workflows, you build a lot of skills. This toolkit
gives every skill the same tested structure and catches the mistakes that make
a "done" skill fail on someone else's machine.

## What you get

- `scripts/scaffold.js` — generate a valid skill (SKILL.md + entry script)
- `scripts/lint-skill.js` — validate frontmatter + entry file before shipping
- `SKILL.md` + `README.md`

## Use it

```
scaffold invoice-parser      # create a new skill from the tested template
lint-skill ./invoice-parser  # validate it before you ship
```

## Install

1. Download and unzip.
2. Copy the `skill-farmers-toolkit` folder into your Claude Code skills directory.
3. Verify: `node scripts/scaffold.js`
4. Scaffold your first skill.

## Updates

Lifetime updates included with your one-time purchase.
