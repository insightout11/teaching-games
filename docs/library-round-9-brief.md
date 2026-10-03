# Library round 9 brief (for Codex)

_Written Oct 3 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–8)._

## Process note
A follow-up commit is fine; **never rewrite history** to get "one commit per task". Commit fixes on top.

## Why
This round is about quality, not size:
- **Captain's Flight** opens with a Flight Question (the question the lesson investigates). Only **128 of 1,322** library
  items carry a `flightQuestion`; the rest fall back to AI at class time.
- Library videos are a few years old in places. A removed or non-embeddable video breaks a lesson in front of the class.

## Tasks, in this order

### 1. Link health audit (all YouTube items, every library file)
For every item with a `youtubeId`, check it still exists and is embeddable (the public oEmbed endpoint
`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` is enough; 401/403 = not
embeddable, 404 = gone). Write a script `scripts/check-library-links.ts` (rate-limited, resumable, writes
`docs/library-link-report.md`).
- Gone or not embeddable: **remove the item** if it has no series; if it's in a series, replace it with an equivalent
  (same level, age band, topic, similar length, transcript prefetched) at the same `order`.
- Report counts: checked, OK, removed, replaced.

### 2. Flight Questions: at least 600 more items
Add `flightQuestion` to items without one, prioritising (in order): items in a series, kids and teens items, then the
most-used sources (TED-Ed, BBC, kids, natgeo, VOA, stories, books). Rules:
- Max 12 words, a real question with two or more defensible answers, answerable after the material ("Should zoos keep
  elephants?", "Would you rather live on Mars or under the sea?"). Not a comprehension question, never a yes/no fact.
- Suitable for the item's `ageBand`; no politics, religion, or sensitive personal topics for kids.
- Grounded in the item's own content (read the transcript or text, not just the title).

### 3. Metadata consistency
- Every `topicTags` entry lowercase, no duplicates within an item, and no near-duplicate spellings across the library
  (pick one: e.g. `space`, not `space` + `outer space` + `Space`). Format tags (`grammar:*`, `listening:*`) unchanged.
- `durationSecs` present for every video item (from the oEmbed/transcript data you already have).
- Validator: add these checks as hard rules (lowercase tags, no in-item duplicates, `flightQuestion` ≤ 12 words and ends
  with `?`). Keep count checks as minimums.

## Rules
- Branch `codex/library-round-9` off `origin/main` (round 8 will be merged first; if it isn't on main yet, branch off
  `codex/library-round-8`). One commit per task; follow-ups are fine. Don't push or merge; report back with counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib/world-flight`, `pnpm test src/lib` and `tsc` (ES5: no `/u`
  regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-9-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
