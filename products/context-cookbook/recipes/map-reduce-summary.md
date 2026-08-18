# Recipe: Map-reduce summary for oversized documents

Use when a document is too large to summarize reliably in one pass.

## Steps

1. **Chunk** the document with overlap so no idea is split:
   ```
   chunk ./document.txt
   ```
2. **Map** — for each chunk, ask Claude:
   > Summarize this chunk in 3 bullet points. Keep names, numbers, and dates exact.
3. **Reduce** — paste all chunk summaries back and ask Claude:
   > Merge these bullet summaries into one structured summary. Remove duplicates,
   > keep every unique fact, and flag any contradictions between chunks.
4. **Verify** — spot-check 2–3 facts against the original using `cite`.

## Why it works

Overlapping, boundary-aware chunks stop mid-sentence truncation, and the
reduce step deduplicates so the final summary stays faithful to the source.
