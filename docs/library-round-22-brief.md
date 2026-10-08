# Library round 22 brief (for Codex): picture words for every topic

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–21._

## Rounds 20 and 21 review: merged to main
Both merged. Round 20's facts now climb by level (volcano A1 "Hot lava can flow down a slope." → B1 plates and gas
pressure), and the questions match each level. Round 21's 400 picture questions read well for 5–9s, the answer slots
vary, and the checker is a good one. All 60 missing words you listed are now drawn: the sticker bank has 553 words.

## Task: `pictureWords` for every topic briefing (Junior classes)
When a Junior class picks a topic in the Live Room (Focus), the phones should show picture word cards. For each of the
150 topics in `src/data/topic-briefings.json`, add a top-level field:
```json
"pictureWords": ["volcano", "mountain", "fire", "rock", "island", "map"]
```
- 6–10 sticker `id`s from `src/data/sticker-words.json` (exactly as spelled) that a 5–9-year-old would meet when
  talking about that topic, most useful first. Literal and concrete: for "volcanoes", mountain, fire, rock (all
  drawn) and island beat abstract links.
- If a topic has fewer than 6 good matches, use what fits (minimum 3) and list the missing words in the progress log
  (topic → up to 5 words that would make good stickers). Don't edit `sticker-words.json`.
- Don't change anything else in the briefings.

## Also: Junior questions per topic
In `src/data/junior-picture-questions.json`, add a `topicIds` field to each set listing the briefing topic ids it
suits (e.g. the "Sea Animals" set → `["ocean", "sharks", ...]`), so a Junior Focus can pick a matching quiz. Empty
array if none fits.

## Validator additions (fail)
- Every `pictureWords` id exists in `sticker-words.json`; 3–10 per topic, no duplicates; every topic has the field.
- Every `topicIds` entry is a real briefing id.
- Report: topics with fewer than 6 picture words, average per topic, sets with no topicIds, and the existing checks.

## Rules
- Branch `codex/library-round-22` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run `scripts/validate-library.ts`, `scripts/validate-junior-questions.ts`, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/topic-briefings.json`, `src/data/junior-picture-questions.json`, library scripts in `scripts/`,
  and `docs/`.
