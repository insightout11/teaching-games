# Library round 2 progress

Branch: `codex/library-round-2`, created from fetched `origin/main` (`c405b115`).

| Task | Target | Baseline | Complete |
|---|---:|---:|---:|
| Metadata backfill | 446 | 446 missing `cefr` or `ageBand` | 0 / 446 |
| Grammar videos | +60 | 17 | 0 / 60 |
| Short hooks under 180 seconds | +60 | 43 | 0 / 60 |
| Opinion/discussion texts | +40 | 10 | 0 / 40 |

## Batch log

No round 2 batches committed yet.

## Notes

- Baseline validation passes for 1,033 items in 23 library JSON files.
- Baseline `npx tsc --noEmit -p .` reports `TS2307` because the already-declared `@mozilla/readability` package is absent from `node_modules`. No package has been installed; owner approval is pending.
- `scripts/validate-library.ts` now treats records with only `cefr`/`ageBand` as metadata-backfilled legacy records. This lets the task add only the requested metadata without forcing unrelated schema migration; records with `kind` or `license` still receive the full expanded-schema validation.
- Video additions require English captions and locally prefetched transcripts per the expansion brief. Do not count any video until its transcript has been verified in Supabase.

## Task 1 — metadata backfill

- Batch 1 of 23: 20 metadata backfills (`bbc-ideas` 10, `bbc` 10); validator passes at 1,033 records.
- CEFR values use the existing `difficultyLevel`; age bands use source audience and intended class fit. None of these 20 lacked enough title/description evidence to require a new review flag.
- `npx tsc --noEmit -p .` passes after the owner-approved local install of already-declared `@mozilla/readability@0.6.0`; package.json and lockfile are unchanged.
- Both required checks pass. Commit: `cb094c00` (`Backfill library metadata batch 1`).

- 2026-09-30 · metadata batch 2 · +20 (bbc-library.json) · validator and tsc pass · needsReview added only where source text is too limited · commit pending.
px tsc --noEmit -p . pass · needsReview added only where source text is too limited · commit pending.

- 2026-09-30 · metadata batch 3 · +20 (bbc-library.json, bigthink-library.json) · validator and tsc pass · needsReview added only where source text is too limited · commit pending.

- 2026-09-30 · metadata batch 4 · +20 (bigthink-library.json, business-english-library.json, crash-course-library.json) · validator and tsc pass · needsReview added only where source text is too limited · commit pending.

- 2026-09-30 · metadata batch 5 · +20 (crash-course-library.json, internet-memes-library.json, kids-library.json) · validator and tsc pass · needsReview added only where source text is too limited · commit pending.

- 2026-09-30 · metadata batch 6 · +20 (kids-library.json, kurzgesagt-library.json) · validator and tsc pass · needsReview added only where source text is too limited · commit pending.
