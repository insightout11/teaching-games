# Library round 15 brief (for Codex)

_Written Oct 6 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and pipeline
as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–14). Never rewrite history; follow-up commits are
fine. Load env from the main checkout's `.env.local` without copying it._

## Round 14 review (merged to main)
Good round: natural Static swaps ("Cairo" spoken as "London"), Black Box passages exact and caption-timed with decoys
outside the passage, 120 distinct debate motions with sourced evidence on both sides.

## Why
The **Reading flight** is next (`docs/reading-flight-concept.md`): book = course, chapter = lesson. Students take turns
reading short passages aloud, tap a quick gist question after each passage, predict at the start and check "what really
happened" at the end. The first version runs on the **12 library book courses** (`src/data/book-library.json`, 48
lessons, each with A2 and B1 `retellings`). We want checked content for every lesson so no AI runs at class time.

## Task: a `readingPack` for all 48 book lessons, per level
Add `readingPack: { A2: Pack, B1: Pack }` to each lesson item (one pack per retelling, because the texts differ):

```
Pack {
  passages: Array<{ text: string; gist: { q: string; options: string[3]; correctIndex: number } }>
  predict: { q: string; options: string[3]; outcomeIndex: number }
  check: Array<{ q: string; options: string[3]; correctIndex: number }>   // exactly 3
  words: Array<{ word: string; meaning: string }>                         // exactly 5
  cast: Array<{ name: string; who: string }>                              // the characters in THIS lesson
  talk: string                                                            // one discussion question
}
```

Rules:
- **passages:** split the retelling into **4–8 passages of 2–4 sentences**, in order, using the **exact text** (joined
  back together they must equal the retelling, ignoring whitespace). One short **gist** question per passage, answerable
  from that passage only (who/what/why at the level), plausible options, one correct.
- **predict:** asked **before** reading, from the lesson title and the story so far (earlier lessons). 3 plausible
  outcomes, `outcomeIndex` = what actually happens in this lesson. Not guessable from the title alone.
- **check:** 3 comprehension questions about the **whole** lesson (main events, cause, a character's feeling), not the same
  as any gist question.
- **words:** 5 useful words from the text with a short, level-appropriate meaning. No names.
- **cast:** every named character who appears in this lesson, with a 4–8 word "who" ("a boy raised by wolves").
- **talk:** one question about a character's choice or "what would you do?", max 14 words, two or more defensible answers.
- **Level:** A2 packs use very simple language in questions and options; B1 a little richer.

Validator: shapes and counts; passages rejoin to the retelling; option counts and distinctness; no gist identical to a
check question; every lesson in every book course has both packs.

## Rules
- Branch `codex/library-round-15` off `origin/main`. One commit (follow-ups fine). Don't push or merge; report the
  validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-15-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
