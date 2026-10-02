# Library round 7 brief (for Codex)

_Written Oct 2 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–6). Transcripts are fetched LOCALLY with
`scripts/prefetch-library-transcripts.ts`; never at runtime._

## Why

- **Grammar Spotlight's "Watch" step** plays a short clip matched by `grammar:<point>` tags (`src/lib/grammar-clips.ts`).
  Several targets have only 1–3 clips (relative clauses, phrasal verbs, past perfect, countable/uncountable, reported
  speech, prepositions), and almost none suit kids.
- **The Listening Flight** (Radio Check, Static, Black Box) needs short, clean-audio clips. Today's `listening:*` items are
  mostly long podcasts and interviews; there are only 4 dialogues.
- **Travel v2** ends with a spoken postcard and runs on real city data. A few real local phrases per city make the
  arrival and the postcard feel like *that* city.

## Tasks, in this order

### 1. Grammar clips: at least 5 per point (+~40)
For every `grammar:*` tag used in `src/lib/grammar-clips.ts`, bring the count up to **at least 5**, including **at least 2
suitable for kids** (`ageBand: "kids"`, A1–A2). Short explainers or story clips under 6 minutes from channels already used
in the library (or equally clear and licensed). Clean transcripts are required (prefetch locally). Use the existing tag
spelling exactly. Note `grammar:future-will-going-to` vs `future-will` / `future-going-to`: keep using the existing ones,
don't invent new spellings.

### 2. Listening clips: 30 short dialogues and announcements
30 clips of **1–3 minutes** with clean transcripts, tagged `listening:dialogue` (everyday conversations: shop, café,
phone call, directions, doctor) or a new `listening:announcement` (airport, station, weather, school). Spread:
10 at A1–A2, 12 at B1, 8 at B2; at least 10 for kids. Avoid music-heavy audio and heavy accents at A1–A2.

### 3. Local phrases for all 50 World Flight cities
In `src/data/world-flight/destinations.ts` (types in `src/lib/world-flight/types.ts`), add optional
`localPhrases?: Array<{ phrase: string; meaning: string; sayIt: string }>`: **4 per city** (hello, thank you,
excuse me/sorry, goodbye or cheers) in the main local language, with a simple English-letters pronunciation in `sayIt`
(e.g. `{ phrase: "Arigatō", meaning: "Thank you", sayIt: "ah-ree-GAH-toh" }`). For English-speaking cities use
well-known local expressions instead (e.g. Dublin "Grand" = fine/great, Sydney "No worries"). Use Latin script in `phrase`
(romanise when needed).

## Rules
- Branch `codex/library-round-7` off `origin/main` (rounds 5–6 will be merged first; if they aren't on main yet, branch off
  `codex/library-round-6`). One commit per task. Don't push or merge; report back with counts per tag/level.
- Run `scripts/validate-library.ts`, the world-flight tests (`pnpm test src/lib/world-flight`) and `tsc` (ES5: no `/u`
  regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-7-progress.md`.
- Only touch `src/data/`, `src/lib/world-flight/types.ts`, library scripts in `scripts/`, and `docs/`.
