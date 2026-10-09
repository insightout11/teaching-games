# Library round 23 progress

## Junior picture stories

- Wrote 40 complete picture-led stories: 20 A1 and 20 A2, six pages each (240 pages total). Each has a character, a small problem, a turn and a positive ending, plus three picture-answer questions and four to six word cards.
- Added `scripts/validate-junior-stories.ts` with a `--build` mode for the reviewed source in `docs/library-round-23-story-seeds.txt`. The output is `src/data/junior-picture-stories.json`.
- Story checker: 40 stories, 240 pages, A1 20, A2 20, 215 distinct sticker IDs used. All 17 check counters are 0.

## Sticker ideas for later rounds

These 32 stickers are absent from the current bank. Each would let a page show its action or setting more precisely; none was added to `sticker-words.json` in this round.

| Story area | Useful missing stickers |
| --- | --- |
| Lost things and travel | single-boot, shoe, kite-string, train-ticket, station-worker, road-sign |
| Making and cooking | paper-boat, flour, cupboard, jar, crumb, paint-spot, easel, toy-tower |
| Outdoors and animals | hill, mud, bike-wheel, nest, bamboo, burrow, collar, leash, food-bowl, seaweed, coral, tide, picnic-mat, rain-gutter |
| Play and discovery | stage, actor, costume, echo |

## Checks

- `npx tsx scripts/validate-junior-stories.ts`: passed, all 17 check counters 0.
- `npx tsx scripts/validate-library.ts`: passed, 1388 existing library items across 28 files.
- `npx tsx scripts/validate-junior-questions.ts`: passed, 40 sets and 400 questions; all 16 check counters 0.
- `pnpm test src/lib`: passed, 84 files and 386 tests.
- Targeted TypeScript check for `scripts/validate-junior-stories.ts`: passed.
- Full `npx tsc --noEmit -p .`: blocked by this checkout's missing declared `@anthropic-ai/sdk` package (two unresolved imports in `src/lib/ai/providers/anthropic.ts` and one resulting implicit-any error). No package was installed.
