# Library Round 10 progress

Branch: `codex/library-round-10` from the current `origin/main`. Earlier pre-main work is preserved on `codex/library-round-10-pre-main`; no commit history was rewritten.

## Task 0 — Round 9 review fixes

- Loaded Supabase credentials directly from `C:\Users\insig\Documents\teaching-games\.env.local` for local scripts. The file was not copied into this worktree or printed.
- Added Bangkok replacement `O5rygyX5wJ0` (447 seconds, A2). The local transcript pipeline verified its 70 stored caption segments, so `transcriptVerified` is true and the transcript-based summary replaces the pending note. The World Flight count check now expects 150.
- Reworked Flight Questions to 500 distinct items. Every added question is assigned only when full text or a stored transcript is available; the generator prioritizes series and younger learners and includes individually curated questions for the children’s readings and main video sources. The generator found 791 transcript rows.
- Cleared all 75 Round 9 question review flags after replacing their questions from source content. The validator now rejects duplicate question text after case, punctuation, and whitespace normalization and requires 500 questions.
- Renamed-tag code search: `src/components/planner/text-library-modal.tsx` still contains the display key `fairy tale` at lines 52 and 78, but converts hyphenated tags to spaced keys at lines 129–130 and 161–162. Other matches for `fairy tales`, `public spaces`, and `storyweaver` were lesson text or source identifiers, not unhandled library tag keys. No production code was changed for this audit.
- Task 0 checks: validator passed (1,350 items / 28 files); `npx tsc --noEmit -p .` passed; `pnpm test src/lib` passed (66 files / 325 tests).

## Task 1 — Course series

- Added 20 ordered four-item series using 80 existing sources: kids A1 ×8 (32 items), kids B1 ×4 (16), teens A2 ×6 (24), and teens B1 ×2 (8). Every member has one exact CEFR level, one age band, and a Flight Question; the validator enforces the cohort counts and these fields.
- The six teens A2 courses cover wellbeing, school life, gaming, food and health, everyday science, and cultural stories.
- Four legacy travel entries had mismatched video titles/transcripts or unusable caption language. They were excluded from the series and marked `needsReview` with notes in `travel-english-library.json`; no entry was deleted.
- Task 1 checks: validator passed (1,350 items / 28 files); `npx tsc --noEmit -p .` passed; `pnpm test src/lib` passed (66 files / 325 tests).

## Task 2 — Level ladder

- Wrote `docs/library-level-ladder.md` for the top 15 subject topics, ranked from the Task 1 baseline. The table gives A1/A2/B1/B2 counts separately for kids and teens, plus before/after totals.
- Added 30 original full-text discussion readings (155–190 words each) under CC BY 4.0: kids A1 ×4, kids A2 ×2, kids B1 ×6, kids B2 ×6, teens A1 ×6, teens A2 ×2, teens B2 ×4. Each has a distinct, content-specific Flight Question. Added the `school` tag to one existing teens B1 text about the school day.
- Thin topic × age-band × level cells fell from 60/120 to 0/120, within the 40-new-item cap. The final catalogue has 1,380 items and 530 Flight Questions.
- Final checks: `npx tsx scripts/validate-library.ts` passed (1,380 items / 28 files); `npx tsc --noEmit -p .` passed; `pnpm test src/lib` passed (66 files / 325 tests).
