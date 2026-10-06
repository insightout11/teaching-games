# Library round 16 brief (for Codex)

_Written Oct 6 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and pipeline
as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–15). Never rewrite history; follow-up commits are
fine. Load env from the main checkout's `.env.local` without copying it._

## Round 15 review (merged to main)
Excellent: all 96 packs pass the Reading flight's own validator (`validReadingPack` in `src/lib/reading-pack.ts`:
passages rebuild the retelling exactly), predictions have a real outcome, full casts, good talk questions. Thanks for
flagging the retelling problem; it's real and it's task 1.

## Task 1: fix the padded retellings (all 96 retellings, priority teen B1/B2)
Round 6's retellings reached the word count with **reflective padding**: generic commentary that isn't story. Example,
*Treasure Island*, "The Old Buccaneer: Chapters I–VI", B2, last paragraph: *"The adults around Jim do not all respond to
danger in the same way… confidence is not the same as good judgment…"*. It also names **Captain Smollett, who doesn't
appear until later chapters** (a spoiler and a factual error for that lesson).
- Find every retelling paragraph that is commentary, theme talk, moral, or "what we learn" rather than events, and
  replace it with **more story**: real events, dialogue, places and details **from those chapters only**.
- **Nothing from later chapters** (characters, events, outcomes). Check each name against the chapters the lesson covers.
- Keep the length rules (A2 250–450, B1 300–500, B2 400–600 words), level-appropriate language, and the original plot
  order.
- Report how many retellings changed and list any future-character leaks you found and removed.

## Task 2: rebuild the packs for the changed retellings
For every retelling you changed, rebuild its `readingPack` level (passages must still rebuild the text exactly; gist,
check, words and cast updated). Keep unchanged retellings' packs as they are.
- Gist questions: vary the stem (not always "What is the main idea here?"); ask about this passage's event (who did
  what, why, what happened next).

## Validator additions
- No retelling paragraph matches a reflective-padding pattern (e.g. starts with "The adults", "This chapter", "This
  part shows", "We learn", "In the end, the story", or is mostly abstract nouns): use a simple heuristic and print
  candidates for review.
- Every `cast` name appears in that lesson's retelling text.

## Rules
- Branch `codex/library-round-16` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge; report
  the validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-16-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
