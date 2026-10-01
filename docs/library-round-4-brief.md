# Library round 4 brief (for Codex)

_Written Oct 1 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md`, `docs/library-round-2-brief.md`, `docs/library-round-3-brief.md`)._

## Why

- **Captain's Flight v2** builds every lesson around one debatable **Flight Question**, and its briefing now runs as a **mission while a video plays** (phones catch answers live). Round 3 added `flightQuestion` to 30 *texts*; the flagship needs **videos** with good timestamped transcripts.
- **Courses** (one theme, several lessons in a row) need **series**: items that belong together in order.
- **Listening** (Radio Check, Static, Black Box) is currently tagged only on BBC catalogue items; it needs **variety**.
- The **review queue** has 299 annotated items; round 3 added notes, and now the fixable ones should be fixed.

## Tasks, in this order

### 1. Flight Question videos (+40)
Short videos (3–8 min) for kids/teens that give evidence on a question people can disagree about (technology, environment, school, animals, space, health, cities, sport, food, history "what if").
- Each gets `flightQuestion` (max 12 words), `genre` (`opinion` or `expository`), `cefr` and `ageBand`.
- **Transcripts are required:** fetch with the local `scripts/prefetch-library-transcripts.ts` (free `youtube-transcript`, run locally); drop anything without clean timestamped captions. Never add runtime transcript fetching to routes.
- Spread across A1–B2 (at least 10 at A1/A2).

### 2. Course series (10 series × 4–6 items)
Group existing items (or add new ones) into ordered series that make sense as a course: e.g. "Animals of the world", "How cities work", "Space for beginners", "Travel survival English", "Great inventions", "Food around the world".
- Add a `series` field to each member: `{ "id": "animals-of-the-world", "title": "Animals of the world", "order": 1 }`.
- Each series stays at one level band (`cefr` within one step) and one age band. Prefer items that already have transcripts or are texts.
- List the series in the progress doc.

### 3. Listening variety (+30, not BBC)
Podcast segments, interviews, announcements and dialogues from VOA Learning English and other approved sources, 2–8 min, timestamped transcripts verified locally. Tag `listening` + `listening:podcast | interview | announcement | dialogue`.

### 4. Review queue: fix, don't just annotate
For the 299 `needsReview` items, fix what can be fixed from the item's own text/transcript/metadata (missing `cefr`/`ageBand`, wrong tags, broken summaries), then clear `needsReview` on those. Leave the rest flagged with their `reviewNote`. Delete nothing. Report how many were cleared.

## Rules
- Branch `codex/library-round-4` off `origin/main`. Small commits per task. Don't push or merge; report back with counts.
- Run `scripts/validate-library.ts` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration in scripts).
- Progress log: `docs/library-round-4-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
