# Library round 28 progress

## Task 1 — topic grammar fits

- Added 2–3 grammar fits to all 150 briefings (80 kids, 70 teens). Examples come from each topic's easiest existing level where possible; a few simple-present replacements were written where the source sentence used a modal.
- Added library checks for fit count, exact grammar targets, repeated targets, kids' advanced targets, reason length, and one-sentence examples of at most 14 words.
- Editorially corrected examples initially paired with `present simple` when they used a modal instead. Added a third, topic-specific fit where the existing material offered a clear comparison, past event, relative clause, passive, or future form.

## Task 2 — debate motion topic links

- Added `topicIds` to all 120 existing motions. Four kids' phone/screen motions have empty links because the kids briefing bank has no matching digital-life topic; the field is explicit and valid.
- Added 11 teen motions for the remaining topic gaps, each with three points per side, a pulse, and two evidence cards grounded in named primary sources. The new source references include their URLs in `source` for editorial checking.
- Added library checks for valid, unique, age-matched topic links; all 70 teen topics and at least 30 kids topics must be covered. The original Round 12/14 motion cohort and evidence checks remain in force.
- Checker counts: **150/150** topics with grammar fits; target distribution: present simple 150, question forms 150, comparatives and superlatives 12, relative clause 7, past simple 5, passive voice 3, future (will) 2. **11** motions added; **131** total (60 kids, 71 teens), **262** evidence cards. Debate coverage: **70/70** teen topics and **46/80** kids topics.

## Checks

- `npx tsx scripts/validate-library.ts` — passes.
- `pnpm test src/lib` — 88 files, 397 tests passed.
- `npx tsc --noEmit -p .` — fails only on the checkout's unresolved `@anthropic-ai/sdk` import in `src/lib/ai/providers/anthropic.ts` (two TS2307 errors and one derived TS7006). The new validator type error found on the first run was fixed; the second run reports no Round 28 files.
