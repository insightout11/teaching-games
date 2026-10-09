# Library round 26 progress

Branch: `codex/library-round-26` from `origin/main`. Local task commits only.

## Task 1 — sticker swaps

Replaced the Round 25 picture stand-ins with all nine new sticker IDs in the relevant question options, story pages, and story word lists. Updated only the prompts and spoken option lines needed to make the new pictures answer the question. The volcano page now names the lava that its new picture shows. The Junior question and story checkers pass with all checks at zero: 61 sets / 610 questions; 61 stories (51 short, 10 standard); kids-topic coverage 80/80 in both banks.

## Task 2 — older course arc tasks

Added 22 course arc tasks in `src/data/course-arc-tasks.json`: eight original theme presets and fourteen reading courses. Each is a simple speaking task of at most 20 words. The new speaking bank checker derives the expected IDs from the course presets and reports 22/22 valid tasks; all four course-task checks are zero.

## Task 3 — Junior speaking situations

Added 30 A1 Junior Speak situations with 1–3 real sticker IDs per scene and four reply choices before and after. The natural reply position is rotated (before 8/8/7/7; after 7/7/8/8). All 240 replies are at most six words. The speaking checker reports **30/30 Junior situations**, **43 distinct scene stickers**, and every check at zero; its course-task count remains **22/22**.

The library validator passes: 1,388 library items and 110 Speak situations (40 kids, 40 teens, 30 junior). Both Junior picture validators remain at zero. `pnpm test src/lib` passes (87 files, 393 tests). `npx tsc --noEmit -p .` reports only the checkout's existing missing declared `@anthropic-ai/sdk` package (two TS2307 errors and one related TS7006 in `src/lib/ai/providers/anthropic.ts`); no Round 26 TypeScript errors were reported. No package was installed.

Data-to-UI follow-up: the current Speak selector in `src/lib/speak-check.ts` returns the situation and reply sets without its `pictures` field and does not select by `ageBand`. `course-arc-tasks.json` is validated data but is not yet imported by the course preset code. Those runtime files were outside this brief's allowed edits.
