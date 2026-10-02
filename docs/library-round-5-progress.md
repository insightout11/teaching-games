# Library round 5 progress

Branch: `codex/library-round-5` from `origin/main` (`ead331db`). No pushes or merges.

## Targets and results

| Task | Before | Added / enabled | Result |
|---|---:|---:|---|
| Public-domain book courses | 0 | 6 courses / 24 lessons | Complete |
| Course series | 10 | +15 (6 book courses + 9 themed series) | 25 total; complete |
| A1 kids library entries available in the catalog | 49 | +30 StoryWeaver picture books | 79 total; complete |

The 24 book lessons are in six four-part series. Each has A2 and B1 original retellings (250–450 words each), a full A2 `summary` for existing readers, a short synopsis, source links to Project Gutenberg originals, and an opinion question. The retellings carry CC BY 4.0 attribution; no source illustrations or modern abridgements were copied. The six series cover The Jungle Book, Alice’s Adventures in Wonderland, The Wonderful Wizard of Oz, Peter and Wendy, Sherlock Holmes short stories, and Aesop’s Fables.

The nine added five-item series are Digital life and communication, Inventions and design, Earth systems: water, weather and sunlight, Cities and natural habitats, Animal adaptations, The human body and health, Matter and materials, Space and science curiosities, and Music-making and performance. The human-body series uses VOA’s “Making Healthy Choices” lesson in place of an unrelated animal video.

The 30 StoryWeaver entries were already present in source data but hidden by `needsReview`. Their StoryWeaver Level 1/2, A1/kids metadata, CC BY 4.0 attribution, and picture-book image metadata were checked; those 30 are now available through the library catalog. Ten have simple Flight Questions. No videos were added, so no transcript prefetch was needed. Other StoryWeaver items remain flagged for review.

## Batch log

- 2026-10-01 · task 1 · added six Project Gutenberg book courses (24 items); validator and typecheck passed.
- 2026-10-01 · task 2 · added nine ordered themed series to 45 existing items; total series count is now 25 including the six book courses; validator passed.
- 2026-10-01 · task 3 · surfaced 30 A1/kids StoryWeaver picture books, including 10 Flight Questions; validator passed.
- Final validation after the source-fidelity review: `npx tsx scripts/validate-library.ts` passed (1,247 items across 27 files); `npx tsc --noEmit -p .` passed; `git diff --check` passed.

## Registration

`book-library.json` is registered as `books` in the live-room catalog, course-source material lookup, and source recommender. StoryWeaver is now available as a `storyweaver` source in those same paths.
