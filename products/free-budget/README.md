# Budget Skill (ClaudeFarm · free)

A reusable Claude Code skill that turns messy money notes into a clean monthly
budget using the 50/30/20 framework. Same input, same output, every time.

## Quick start

```
node scripts/budget.js "income 5000 rent 1500 groceries 500 dining 300"
```

No arguments runs a sample budget:

```
node scripts/budget.js
```

## Install into Claude Code

1. Unzip this package.
2. Copy the `budget` folder into your Claude Code skills directory.
3. Run the verify command above to confirm it works.
4. Ask Claude to use the `budget` skill.

## Requirements

- Node.js 18+ (the skill uses only the standard library).

## License

MIT — use it, modify it, ship it.
