# Library round 26 brief (for Codex): Junior speaking, course tasks, new stickers

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–25._

## Round 25 review: merged to main
Merged and live: every kids topic now has a Picture Quiz set and a picture story (61 of each), and the new stories
read well ("The Lost Blue Planet" is a lovely short one). I drew all 9 stickers you asked for: `fossil`,
`dinosaur-footprint`, `telescope`, `astronaut-helmet`, `lava`, `earthquake`, `sand-dune`, `festival-lantern`,
`superhero-cape` (bank: 587).

## Task 1: swap in the new stickers
Where round 25 used a stand-in picture because one of those 9 was missing, use the new sticker instead (questions,
options, story pages, story words). Keep everything else unchanged.

## Task 2: course tasks for the older ready courses
The 24 round-24 courses have an `arcTask` (the short task done in lesson 1 and again in the last lesson). The 22
older ones don't. Create `src/data/course-arc-tasks.json`: `{ "<preset id>": "<task>" }` for every preset in
`COURSE_PRESETS` (8 theme courses, ids in `src/lib/course-presets.ts`) and every reading course (ids are
`reading-<series id>`, the series ids in `src/data/book-library.json`). One simple speaking task each, 2–3 minutes,
right for the course's level and age (e.g. for a reading course: "Tell the story so far in three sentences").

## Task 3: Junior speaking situations
The Speak flight (`speak-60`) uses `src/data/speak-situations.json` (80 situations, kids and teens). For Junior
classes (about 5–9) add **30 situations** with `"ageBand": "junior"`, `"cefr": "A1"`, same fields as the kids ones,
plus:
- `pictures`: 1–3 sticker ids (from `src/data/sticker-words.json`) that show the scene (e.g. `["shop", "apple"]`).
- Replies of **at most 6 words**, one clearly natural and polite, the others clearly off in a way a young child can
  hear (too rude, wrong word, word salad), never trick answers.
- Everyday child situations: asking for a toy, saying sorry, asking a friend to play, at the doctor, buying an ice
  cream, a birthday, asking the teacher for help, finding a lost pet, ordering at a café, on the bus.

## Validator: extend or add `scripts/validate-speak-situations.ts` (fail on any)
- Junior situations: 30, unique ids, every picture a real sticker id, replies ≤ 6 words, exactly one natural reply
  before and after, same shape as existing situations.
- `course-arc-tasks.json`: an entry for every older preset id and every reading course, no unknown ids, each task
  ≤ 20 words.
- Junior checkers still all 0 after the sticker swaps.

## Rules
- Branch `codex/library-round-26` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/junior-picture-questions.json`, `src/data/junior-picture-stories.json`,
  `src/data/speak-situations.json`, the new `src/data/course-arc-tasks.json`, validators in `scripts/`, and `docs/`.
