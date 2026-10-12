# Library round 31 brief (for Codex): spoken-game card decks for every banked topic

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–30. Use your strongest writing
model: every card is read by children and teenagers in a live class._

## Round 30 review: merged
Good work. The texts are original and specific (no shared sentences, no repeated openings or talk prompts), the
first and last lessons of a course really do set up and revisit the course task (Omar's dinosaur card, Ari's speaking
card), and the questions are answerable from the text. Merged as written; wiring into the course lessons is next on
my side.

## Why this round
A Speak lesson now ends on a game the class plays out loud: Taboo Sprint, Hot Seat, Imposter, Twenty Questions.
Today those games ask the AI for their words at the moment they start, which is slow, sometimes fails, and often
drifts away from the lesson's topic. A ready deck per topic makes them start at once and stay on the lesson.

## Task: `src/data/topic-game-decks.json`
One deck for each of the 150 topics in `src/data/topic-briefings.json` (use the topic's `id`, respect its `ageBand`
and the levels it has):
```json
{ "topicId": "topic-kids-space", "ageBand": "kids",
  "taboo": [{ "word": "rocket", "forbidden": ["space", "fly", "fire", "astronaut"], "level": "A2" }],
  "hotSeat": [{ "word": "telescope", "level": "A2" }],
  "imposter": [{ "word": "planet", "decoy": "moon", "level": "A1" }],
  "twentyQuestions": [{ "secret": "the Moon", "kind": "place", "level": "A1" }] }
```
- `taboo`: 14 cards. `word` is a concrete, guessable word or short phrase from the topic. `forbidden`: exactly 4, the
  words a describer would reach for first (never the word itself or a form of it). Every forbidden word must be at
  or below the card's level.
- `hotSeat`: 14 words the whole class can give spoken clues for (things, places, people-roles, actions). No overlap
  with the topic's taboo words.
- `imposter`: 8 pairs. `word` and `decoy` are close enough that clues overlap (planet/moon, bus/tram) but different
  enough that a careful listener can tell.
- `twentyQuestions`: 8 secrets with `kind` one of `thing | place | animal | job | food | activity`. Answerable with
  yes/no questions by that age group.
- Levels: spread across the topic's own levels; kids' topics are A1–A2 only. At least 4 taboo and 4 hot-seat cards
  at the topic's lowest level, so beginners always have a playable deck.
- Where a word has a sticker (`src/data/sticker-ids.json`), prefer it: Junior classes play with pictures.
- Kid-safe, kind, culturally neutral. No brands, real people, or words that only make sense in one country.

## Validator: `scripts/validate-topic-game-decks.ts` (fail on any)
- One deck per topic id, none missing or unknown; counts exactly 14 / 14 / 8 / 8.
- Taboo: 4 distinct forbidden words; none equals or contains the word (or the word a forbidden one); no duplicates
  of a word inside a deck across taboo and hotSeat.
- Imposter: word ≠ decoy; neither repeated in the deck.
- No card word used in more than 4 topics across the whole bank (stops generic filler like "friend", "happy").
- No two decks more than 40% the same.
- Report: counts by age band and level, how many words have stickers, and paste 6 full decks (two kids, two teens,
  two general) in the progress log.

## Rules
- Branch `codex/library-round-31` off `origin/main`. Commit in batches of about 15 topics; don't push or merge; report.
- Write the cards yourself, topic by topic. Do not generate them from a template or a word list: round 28 was sent
  back for that.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/topic-game-decks.json`, the new validator in `scripts/`, and `docs/`.
