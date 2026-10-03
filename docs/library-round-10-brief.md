# Library round 10 brief (for Codex)

_Written Oct 3 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–9). Never rewrite history; follow-up
commits are fine._

## Why
Courses are the next product step, and launch is **kids and teens worldwide**. On main today the 31 course series are:
kids A2 ×17, teens B1 ×10, teens B2 ×3, teens A2 ×1. There are **no kids A1, no kids B1**, and almost no teens A2. A
teacher with beginners or young B1 learners finds no course to fly.

## Tasks, in this order

### 0. Round 9 review: fix first
**Supabase keys.** Your worktree has no `.env.local` (it's gitignored, so new worktrees never get it), which is why the
prefetch couldn't reach Supabase. Load the env from the owner's main checkout when running scripts, without copying or
committing it: e.g. `node --env-file=C:/Users/insig/Documents/teaching-games/.env.local …`, or `dotenv -e <that path>`.
Never print, log or commit key values.

**Flight Questions were templated.** Round 9 added 600, but only 146 were distinct: "Should people risk comfort to help a
friend?" was on 59 items. Claude removed the 585 that repeated across items (the 128 originals + 15 unique ones stay).
Redo them properly:
- **Every question unique to its item** and specific to its content: names a thing, place, character or idea from the
  material ("Should Mowgli stay with the wolves?", not "Should people risk comfort to help a friend?").
- Read the transcript/text for each item. If there's no transcript or text, skip the item.
- Validator: add a hard rule that no `flightQuestion` text appears on more than one item.
- Target: 500+ items, same priority as round 9 (series, kids/teens, then main sources).

**Bangkok.** Round 9 removed the dead Bangkok video (149 World Flight entries; `course-presets.test.ts` now expects
149). Add an equivalent replacement (Bangkok, same level band, < 7 min, embeddable, clean captions), prefetch its
transcript with the env above, and set the test back to 150.

**75 flagged Flight Questions** (`needsReview`): any that survived are covered by the redo above; clear the flags you fix.

**Renamed tags.** The tag normalisation hyphenated tags (`fairy tale` → `fairy-tale`). Code that keys on tag strings
must keep working: search `src/` for any tag you rename and report it, don't change code.

### 1. Series to fill the level gaps (+20 series)
Group existing items (or add a few, verified like before) into ordered series of 4–6:
- **kids A1 ×8:** e.g. animals, my day, food, colours and shapes, family, weather, the body, at school. Picture books
  (StoryWeaver, picture-books, African Storybook) and very short kids videos.
- **kids B1 ×4:** e.g. how things work, amazing animals, inventors, world festivals.
- **teens A2 ×6:** e.g. daily life around the world, sports, food, music, technology, travel.
- **teens B1 ×2:** two topics not covered yet.
Each series has one level band, one age band, and every item in it carries a `flightQuestion`.

### 2. A level ladder for the top 15 topics
For the 15 most-tagged topics, report the item count per CEFR level (A1/A2/B1/B2) and age band in
`docs/library-level-ladder.md`. For any topic × level cell (kids or teens) with fewer than 2 items, add items until it
has 2 (max 40 new items in this task). Verified transcripts or full text; `flightQuestion` on each.

## Rules
- Branch `codex/library-round-10` off `origin/main` (rounds 8–9 will be merged first; if they aren't on main yet,
  branch off `codex/library-round-9`). One commit per task; follow-ups are fine. Don't push or merge; report counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-10-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
