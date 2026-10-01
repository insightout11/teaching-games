# Library round 5 brief (for Codex)

_Written Oct 1 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–4)._

## Why

The next product step is **courses**: a class flies a series of lessons in order, and each lesson carries the last one's language forward. Round 4 added 10 series. Courses now need:
- more series;
- **reading courses built from books** (the owner teaches reading courses from books);
- a better spread at the youngest levels.

## Tasks, in this order

### 1. Public-domain book courses (6 books)
Pick 6 public-domain books that kids/teens love and that work in an ESL class (e.g. *The Jungle Book*, *Alice's Adventures in Wonderland*, *The Wonderful Wizard of Oz*, *Peter Pan*, *The Adventures of Sherlock Holmes* (short stories), *Aesop's Fables*). Use Project Gutenberg or other clearly public-domain editions only.
- **Each book becomes a series** of 4–6 lesson items (a chapter or a short story each), in reading order, as text items in a new `src/data/book-library.json`.
- **Each item has:**
  - the original title;
  - a **levelled retelling** written for the class (A2 and B1 versions, 250–450 words each, faithful to the plot, in your own words), in the existing text-item fields;
  - a short `summary`, `cefr`, `ageBand`, `genre: "narrative"`;
  - a `flightQuestion` (max 12 words, debatable, e.g. "Should Mowgli stay with the wolves or go to the village?");
  - a `source` link to the public-domain original;
  - `series: { id, title, order }`.
- Copy no modern abridgements or illustrations; only the public-domain text as the source of your own retelling.

### 2. More series (+15, to 25 total)
Group existing items (or add a few) into ordered series of 4–6 that make sense as a course: science basics, world festivals, famous journeys, the human body, oceans, weather and climate, music around the world, sports science, inventions, mysteries of history, digital life, money basics, kindness/wellbeing, travel survival English (part 2), nature's record-breakers.
- One level band and one age band per series.
- Prefer items with transcripts (videos) or full text.

### 3. Youngest learners (+30 at A1, `ageBand: "kids"`)
Short, simple, joyful items (songs excluded for rights reasons): picture-led stories, very short animal/nature videos (< 4 min) with clean transcripts, simple read-alongs. Verify transcripts locally as before. At least 10 should carry a simple `flightQuestion` ("Is a cat or a dog a better pet?").

## Rules
- Branch `codex/library-round-5` off `origin/main`. Small commits per task. Don't push or merge; report back with counts.
- Register `book-library.json` wherever the library files are listed (validator, any loader/registry that enumerates libraries); keep the change minimal and mention every file you touched.
- Run `scripts/validate-library.ts` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-5-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, the library registration point(s), and `docs/`.
