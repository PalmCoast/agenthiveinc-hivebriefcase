---
name: budget
title: Budget Skill
description: Turn a messy description of income and spending into a clean, repeatable monthly budget using the 50/30/20 framework.
version: 1.0.0
license: MIT
compatibility:
  - Claude Code (skills format)
entry: scripts/budget.js
command: budget
test: node scripts/budget.js "income 5000 rent 1500 groceries 500"
verify: node scripts/budget.js
---

# Budget Skill

Give Claude a rough description of your money and get back the same clean,
structured monthly budget every time — no re-prompting, no drift.

## What it does

Parses income and expenses from plain text, classifies each expense as a
**need** or a **want**, compares your spending to the **50/30/20** framework,
and tells you exactly how much is left to save.

## Who it's for

Anyone using Claude who wants a repeatable budgeting workflow instead of a
one-off answer that changes every time they ask.

## Use it

```
budget income 5000 rent 1500 groceries 500 dining 300 streaming 40
```

Or just type `budget` for a sample.

## What you get

- `scripts/budget.js` — the runnable skill (deterministic, no dependencies)
- `SKILL.md` — this file
- `README.md` — install + usage

## Install

1. Download and unzip.
2. Copy the `budget` folder into your Claude Code skills directory.
3. Verify: `node scripts/budget.js "income 5000 rent 1500 groceries 500"`
4. Ask Claude to run the `budget` skill.

## Updates

Free. Re-download any time from claudefarm to get the latest version.
