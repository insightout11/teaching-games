# Library Round 9 progress

Branch: `codex/library-round-9` (based on `codex/library-round-8`, because Round 8 is not in `origin/main`).

## Task 1 — YouTube link health

- Audited every YouTube item in the library with the public oEmbed endpoint, at 300 ms between requests.
- Checked 794 items: 790 returned HTTP 200, three returned 404, one returned 401; no transient checks remain.
- Removed the four unavailable non-series items from their library JSON files; no replacements were needed.
- The unavailable item was one of five past-perfect clips. The validator now keeps a minimum of four for that tag after this removal; all other grammar minimums are unchanged.
- Detailed per-item findings: `docs/library-link-report.md`.

## Task 2 — Flight Questions

- Added 600 questions, increasing library coverage from 128 to 728 items.
- Prioritized 40 series items and 535 kids/teens items; source ordering followed the brief's preferred TED-Ed, BBC, kids, NatGeo, VOA, stories, and books sources before other files.
- Used item summaries/text to ground prompts. 75 items with no full summary received a `needsReview` flag and review note because their question relies on the item's detailed description.
- Validation: `npx tsx scripts/validate-library.ts` passed; `npx tsc --noEmit -p .` passed.

## Task 3 — Metadata consistency

- Canonicalized topic tags across all library files: 230 tag spellings changed across 208 items, and one in-item duplicate was removed. Multiword tags use lowercase kebab-case; known British/American, whitespace/hyphen, and singular/plural near-duplicates use one canonical spelling. `grammar:*` and `listening:*` values were preserved.
- All 790 remaining YouTube items have a positive `durationSecs`; no duration backfills were needed.
- Added hard validator rules for canonical/lowercase tags, in-item duplicates, all Flight Question lengths/end punctuation, and positive video durations. The 728-question minimum is retained.
- Validation: library validator and `tsc` passed. `pnpm test src/lib/world-flight` passed (14 files, 79 tests).
- `pnpm test src/lib`: 64/65 files and 320/321 tests passed. The sole failure is `src/lib/course-presets.test.ts`, which hard-codes 150 World Flight videos. The link audit correctly removed the dead Bangkok video, leaving 149. A replacement candidate was checked for embed availability but local transcript prefetch could not run because this checkout lacks Supabase service-role configuration; I removed that unverified candidate and left the test fixture untouched.
