# Library round 37 brief (for Codex): listening packs for the World Flight city videos

_Written Oct 13 2026. Owner: LessonCaptain. Executor: Codex. This round ADDS listening packs to existing entries
and proposes two missing course videos. No entry is retitled, hidden or removed._

## Round 36 review: merged
The corrections are in. All 448 library tests pass after two follow-ups made on main:
- **The six course lessons you listed** now point at library videos whose captions match the lesson:
  Airport Journeys → `travel-directions` (English at the Airport), Smart Questions →
  `business-interview-prepare-bbc`, Professional Emails → `business-meetings` (Writing Emails in English),
  Networking Next Steps → `business-phone` (Making Small Talk). Two are **stopgaps** because the library has no
  real match that meets the course bar: Asking For Directions → the Berlin transport video, Restaurant Language →
  the London Chinatown restaurant story. See task 2.
- `source-library.test.ts` now expects the Berlin transport video for the "simple direction phrases" case.

Entries you left hidden stay hidden. Thank you for listing the protected-field problems (attribution, the 82-minute
"NatGeo sleep" video): those are noted for the owner, not for this round.

## Why this round
World Flight now runs inside the Live Room: a teacher taps a city on the room map, picks one of its lessons and a
flight type. Captain's, Speak, Grammar and Debate work from any city video. **The Listening flight does not**,
because it needs a prepared listening pack and only 17 of the 150 city videos have one.

## Task 1: listening packs for city videos
Add a `listeningPack` to World Flight city videos in `src/data/world-flight-library.json` that do not have one.

- **Which videos:** work city by city so that every city with a published video ends up with **at least one**
  video carrying a pack. Then add second packs where a city has more than one good video. Report the count.
- **Format:** exactly the existing one (`src/lib/listening-pack.ts`, `ListeningPack`). Use the 17 existing packs
  in this file as the model, e.g. `world-flight-singapore-changi-jewel-video`:
  - `segments`: 3 to 5. Each has `start`, `end` (seconds, from the cached caption timestamps), `question`,
    `options` (3), `correctIndex`, and `keyLine` (the caption words that contain the answer, copied exactly).
  - `gist`: exactly 3 questions about the whole clip (`q`, `options`, `correctIndex`).
  - `harder`: one inference question.
  - `words`: 4 to 6 useful words from the clip with a plain meaning.
- **Evidence or nothing:** every answer must be in the cached captions inside its segment. If a video's cached
  captions are untimed, sparse or garbled, skip it and list it. Do not fetch from YouTube and do not write a pack
  from the title or description.
- **Quality bar (the reason for hand work):**
  - A question must need the listening: not answerable from general knowledge or from the other options.
  - Wrong options are plausible and the same kind of thing as the right one (three years, three places).
  - Spread `correctIndex` across 0, 1 and 2 within a pack. No "all of the above".
  - Segments are 12 to 30 seconds, do not overlap, and are spread through the clip, not all in the first minute.
  - Keep the whole listening window within 180 seconds from the first segment's start to the last segment's end
    (`WINDOW_CAP`), or the app will trim it.
  - No templated stems repeated across packs ("What does the speaker say about…").
  - Language level of the questions matches the entry's `cefr`.

## Task 2: two course videos the library is missing
Find **one** real ESL teaching video for each of these, with accurate English captions, 3 to 8 minutes long:
1. **Asking for and giving directions in a city** (A2).
2. **Ordering food in a restaurant: menu, ordering, paying** (A2).

For each, give the YouTube id, title, channel, duration and why it fits, plus a ready-to-paste entry for
`src/data/travel-english-library.json` in that file's exact shape (with `needsReview: true`). **Do not add the
entries to the library file and do not fetch captions**: put them in the report. The owner's side adds them and
runs the caption pre-fetch, then repoints the two course lessons.

## Checks and report
- Extend `src/lib/listening-pack.test.ts` (or add a data test beside it) so every `listeningPack` in the World
  Flight library passes `validPack`, has 3 gist questions, has non-overlapping segments inside the window cap, and
  uses each `correctIndex` position at least once when it has 3 or more segments.
- `pnpm test src/lib src/data` and `tsc` (same known typecheck exception).
- Report: packs added per city, cities still without a pack and why, videos skipped for caption quality, and the
  two proposed course videos.

## Rules
- Branch `codex/library-round-37` off `origin/main`. Commit in batches of cities; don't push or merge; report.
- Only touch `src/data/world-flight-library.json`, the listening-pack test, and `docs/`.
- Change only the `listeningPack` field of an entry. Never change ids, titles, YouTube ids, urls or durations.
