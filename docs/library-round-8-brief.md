# Library round 8 brief (for Codex)

_Written Oct 3 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–7). Transcripts are fetched LOCALLY with
`scripts/prefetch-library-transcripts.ts`; never at runtime._

## Review notes from round 7 (merged to main)
- `listening-library.json` was not registered in any loader. Claude registered it as source `listening` in
  `src/lib/source-library.ts`, `src/lib/library-source-material.ts`, `src/lib/live-room/library-catalog.ts` and
  `SourceType`. **Any new library file must be registered in those same places in the same commit.**
- *Greatest Invention Yet! (That Mitchell and Webb Look)* was removed pending the owner's review. Don't re-add it.
- The validator's exact counts became minimums. Keep new checks as minimums (`<`), never exact (`!==`).

## Tasks, in this order

### 0. Confirm transcripts are in Supabase
For every round 7 item (grammar clips and the 29 listening clips), confirm the transcript is stored in Supabase (the same
table the prefetch script writes). If any are missing, run the prefetch for them. Report the count found vs expected.

### 1. Beginner listening: 15 A1 clips + 15 announcements
The round 7 gaps:
- **15 A1 clips** (`ageBand: "kids"` for at least 10), 30 seconds to 2 minutes, slow and clear: greetings, numbers and
  prices, colours, family, food, time, weather. Tag `listening:dialogue`.
- **15 announcement clips** (A2–B1), tagged `listening:announcement` (new tag): airport, train station, weather forecast,
  school or shop announcements. 30 seconds to 2 minutes.
Clean, verified transcripts; add them to `listening-library.json`.

### 2. Attraction tiers and prices for all 50 cities
Travel's Out & About stop now runs on budgets ($ / $$ / $$$). In `src/data/world-flight/destinations.ts` (types in
`src/lib/world-flight/types.ts`), add optional `tier?: '$' | '$$' | '$$$'` and `price?: string` to each attraction
(`"Free"` when free, otherwise `"about ¥500"` style, same as round 6). Free or cheap = `$`; major paid sight = `$$`;
premium experience (observation deck, guided tour, show) = `$$$`. Use absolute tiers, not relative-within-city.

### 3. Fix the dish tiers to be absolute
Round 6 assigned dish tiers by rank within each city (so a cheap street dish can be `$$$`). Re-tier every dish
absolutely from its `price`: a street snack or a cheap meal = `$`, a typical restaurant main = `$$`, fine dining or a
special-occasion dish = `$$$`. Several dishes in one city may share a tier.

## Rules
- Branch `codex/library-round-8` off `origin/main`. One commit per task. Don't push or merge; report back with counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib/world-flight` and `tsc` (ES5: no `/u` regex, no direct Set/Map
  iteration).
- Progress log: `docs/library-round-8-progress.md`.
- Only touch `src/data/`, `src/lib/world-flight/types.ts`, library scripts in `scripts/`, the library registration
  points, and `docs/`.
