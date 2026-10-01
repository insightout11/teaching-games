# Library round 3 brief (for Codex)

_Written Oct 1 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and
transcript pipeline as `docs/library-expansion-brief.md` and `docs/library-round-2-brief.md` (read both first)._

## Why

New features shipped this week that depend on the library:

- **Grammar Spotlight "Watch it"** plays a short grammar clip for the lesson's grammar point. `src/lib/grammar-clips.ts` finds clips in `src/data/grammar-library.json`, which has only **28** clips, and several points have none (past perfect, reported speech, relative clauses, question forms, modals beyond can/should/must).
- **The Listening Flight** (`docs/listening-flight-concept.md`) needs **short spoken audio/video with clean transcripts** (podcast-style, announcements, interviews) that Radio Check can cut into clips by timestamp.
- **Captain's Flight v2** (`docs/captains-flight-v2-concept.md`) builds each lesson around **one debatable "Flight Question"** the source helps answer. It works best with sources that present evidence or two sides.

## Tasks, in this order

### 1. Grammar clips (+40), tagged by grammar point
Short (2–6 min), classroom-safe explanations. Add to `grammar-library.json` with a `topicTags` entry from this exact list:
`grammar:present-simple`, `grammar:present-continuous`, `grammar:past-simple`, `grammar:past-continuous`, `grammar:present-perfect`, `grammar:past-perfect`, `grammar:future-will`, `grammar:future-going-to`, `grammar:questions`, `grammar:comparatives-superlatives`, `grammar:modals`, `grammar:conditionals`, `grammar:passive`, `grammar:reported-speech`, `grammar:relative-clauses`, `grammar:prepositions`, `grammar:articles`.
- Fill the gaps first: past perfect, reported speech, relative clauses, questions, modals (have to / must / should / can / might), conditionals (zero / first / second).
- Aim for at least 2 per tag, mixing kids and teens levels (`cefr`, `ageBand` required).
- **Also add these tags to the 28 existing grammar clips.**

### 2. Listening sources (+40)
Videos or audio with **reliable timestamped transcripts**: podcast segments, interviews, announcements and real-world dialogues, ideally 2–8 minutes. Kids/teens appropriate. Tag with `listening` plus the format (`listening:podcast`, `listening:interview`, `listening:announcement`, `listening:dialogue`).
- Prefer VOA Learning English, BBC Learning English and the other sources the first brief approved. Embed only; never host copies.
- **Transcripts:** fetch them with the existing local script (`scripts/prefetch-library-transcripts.ts`, free `youtube-transcript`, run locally). **Never** add on-the-fly transcript fetching to routes. Drop any item whose transcript fails or is auto-garbled.

### 3. "Flight Question" sources (+30)
Short videos or texts that give evidence on a question people can disagree about, suitable for kids/teens: technology, environment, school, animals, space, health, cities, sport. Each item gets a `flightQuestion` field: one short debatable question (max 12 words) the source helps answer, e.g. "Should cities ban cars?". Set `genre: "opinion"` or `"expository"` as appropriate.

### 4. Review queue
Work through items with `needsReview: true` (291 after round 1): fix or fill what you can from the item's own text/transcript, and leave a short `reviewNote` on anything you can't resolve. Don't delete items.

## Rules
- Branch `codex/library-round-3` off `origin/main`. Small commits per task. Don't push or merge; report back.
- Run the existing library validator and `tsc` (ES5 target: no `/u` regex flags, no direct Set/Map iteration in scripts).
- Keep a progress log in `docs/library-round-3-progress.md` (counts per task, anything skipped and why).
- Don't touch code outside `src/data/`, `scripts/` (library scripts only) and `docs/`.
