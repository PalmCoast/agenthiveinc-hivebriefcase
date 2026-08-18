# 1M Context Cookbook (ClaudeFarm)

Recipes + skills for reliable long-context work with Claude.

## Scripts

```
node scripts/chunk.js ./big-report.txt   # boundary-aware chunking
node scripts/cite.js  ./big-report.txt   # stable citation index
```

Both run with no arguments against a built-in sample so you can confirm they
work immediately.

## Recipes

- `recipes/map-reduce-summary.md` — summarize a document larger than a single pass.
- `recipes/citation-qa.md` — answer questions with exact `[L123]` citations.

## Requirements

- Node.js 18+ (standard library only).

## License

Commercial, single-team. Included updates for the life of the product.
