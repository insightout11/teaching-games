# Library round 22 progress

## Task 1 — picture words

- Added `pictureWords` to all 150 Focus briefings using existing sticker IDs, in topic order of usefulness. No other briefing fields changed.
- Library checker: 876 picture word references across 150 topics; 13 topics have fewer than six suitable picture words; average 5.84 per topic. Picture word validation errors: 0. The other existing library checks pass.
- These 13 topics need additional drawings before six direct, concrete cards make sense. Suggested future stickers (not added in this round):

| Topic | Useful missing stickers |
| --- | --- |
| `topic-teens-social-media` | post, comment, profile, like |
| `topic-teens-online-privacy` | lock, password, privacy-shield |
| `topic-teens-digital-footprints` | post, profile, search-history, cookie |
| `topic-teens-internet-memes` | meme, caption, share-button |
| `topic-teens-artificial-intelligence` | computer-chip, data, chatbot |
| `topic-teens-virtual-reality` | vr-headset, controller |
| `topic-teens-coding` | keyboard, code, computer-chip |
| `topic-teens-cybersecurity` | lock, password, shield |
| `topic-teens-peer-pressure` | group-of-friends, choice-sign |
| `topic-teens-film-making` | actor, film-clapperboard, movie-camera |
| `topic-teens-entrepreneurship` | market-stall, product, customer |
| `topic-teens-money-and-saving` | piggy-bank, wallet, bank |
| `topic-teens-budgeting` | wallet, receipt, price-tag |

## Task 2 — Junior question topics

- Added `topicIds` to all 40 question sets (157 links), connecting each set to briefing topics it can support. Five general sets have no close Focus match and use `[]`: Home, Actions, Sizes, Opposites, and What Do You Use?
- Junior checker: 40 sets, 400 questions, 120 opinion questions (30.0%), 404 sticker words used; 5 sets have no `topicIds`; all 16 error counters are 0.
- The `--build` path in the Junior checker now preserves reviewed topic links if questions are regenerated from the Round 21 seeds.
- Checks: `npx tsx scripts/validate-library.ts` and `npx tsx scripts/validate-junior-questions.ts` pass; `pnpm test src/lib` passes (84 files, 386 tests); a targeted TypeScript compile of the edited scripts passes. Full `npx tsc --noEmit -p .` is blocked by the checkout's missing declared `@anthropic-ai/sdk` package (two module resolution errors and one resulting implicit-any error in `src/lib/ai/providers/anthropic.ts`). No package installation was performed.
