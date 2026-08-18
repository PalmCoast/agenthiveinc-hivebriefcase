# Recipe: Grounded Q&A with real citations

Use when you need answers you can trust and trace back to the source.

## Steps

1. Build a citation index:
   ```
   cite ./document.txt
   ```
2. Give Claude the indexed lines and your question, then instruct:
   > Answer only using the provided lines. After each claim, cite the line id
   > like [L42]. If the answer is not in the text, say "not in source".
3. Verify each `[Lxx]` citation points to the claim it supports.

## Why it works

Stable line ids give Claude a concrete anchor for every claim, which makes
hallucinated citations obvious and easy to reject.
