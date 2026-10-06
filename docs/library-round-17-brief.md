# Library round 17 brief (for Codex)

_Written Oct 6 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and pipeline
as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–16). Never rewrite history; follow-up commits are
fine. Load env from the main checkout's `.env.local` without copying it._

## Round 16 review (merged to main)
Very good: no reflective padding left, no repeated sentences across retellings, the Smollett leak in *The Old
Buccaneer* is gone, and all 96 packs pass. Go ahead and commit your whitespace cleanup in
`scripts/rebuild-library-round-16-packs.ts` on that branch (it's yours; no confirmation needed for your own files).

## Why this round
The owner teaches kids' reading courses from very early readers (*Fly Guy*-style) up. Our library starts at A2, so
Beginner classes have nothing at their level. The Reading flight now supports an **A1** level (`bookLevelFor`:
Beginner → A1, falling back to the nearest level when a lesson has none).

## Task 1: A1 retellings for the 6 kids' courses (24 lessons)
*Jungle Book, Alice, Wizard of Oz, Peter Pan, Sherlock Holmes short stories, Aesop.* Add `retellings.A1` to each
lesson:
- **120–220 words**, short sentences (mostly 5–10 words), present or simple past, the most common words, a little
  repetition is good (it helps young readers), dialogue welcome.
- Same story events as that lesson's A2 retelling, **in order**, nothing from later lessons (round 16 rule).
- Story only: no commentary or morals (Aesop: the moral may be one short last line, as in the original).

## Task 2: A1 reading packs for those 24 lessons
`readingPack.A1`, same schema; passages rebuild the A1 text exactly (`validReadingPack`).
- **4–6 passages of 1–3 short sentences**; gist questions very simple (who/what/where), options 1–4 words.
- predict, check (3), words (5, very concrete: nouns/verbs a child can picture), cast, talk (max 10 words).

## Task 3: 2 new early-reader courses (A1 + A2), 4 lessons each
Public domain only: **Beatrix Potter** (*The Tale of Peter Rabbit*, *Benjamin Bunny*, *Jemima Puddle-Duck*,
*Squirrel Nutkin*: one course "Beatrix Potter stories", one story per lesson) and **a second set of very short
classic tales** (e.g. *The Three Little Pigs*, *The Little Red Hen*, *The Gingerbread Man*, *Goldilocks*: "First
fairy tales"). Same entry/series shape as the existing kids' courses, with A1 and A2 retellings and packs.

## Validator additions
- A1: 120–220 words; average sentence length ≤ 10 words; flag sentences over 14 words.
- Every level present has a valid pack; every `cast` name appears in that level's text.
- Allow `A1` wherever levels are listed.

## Rules
- Branch `codex/library-round-17` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge;
  report the validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-17-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
