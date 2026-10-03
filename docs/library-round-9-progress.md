# Library Round 9 progress

Branch: `codex/library-round-9` (based on `codex/library-round-8`, because Round 8 is not in `origin/main`).

## Task 1 — YouTube link health

- Audited every YouTube item in the library with the public oEmbed endpoint, at 300 ms between requests.
- Checked 794 items: 790 returned HTTP 200, three returned 404, one returned 401; no transient checks remain.
- Removed the four unavailable non-series items from their library JSON files; no replacements were needed.
- The unavailable item was one of five past-perfect clips. The validator now keeps a minimum of four for that tag after this removal; all other grammar minimums are unchanged.
- Detailed per-item findings: `docs/library-link-report.md`.
