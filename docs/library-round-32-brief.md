# Library round 32 brief (for Codex): finish the game decks (definitions, real Imposter rounds, plainer Hot Seat words)

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–31. Use your strongest writing
model: every card is read by children and teenagers in a live class._

## Round 31 review: merged and in use
Good work. The Taboo cards are specific to their topics and the forbidden words are the ones a describer really
reaches for (rain: water, cloud, wet, fall). No templating: almost no word is shared between decks. Taboo Sprint,
Hot Seat and Twenty Questions now start from these decks, with no AI wait, whenever a lesson has no video or text.

Three things came out of wiring them in. This round fixes them, all in the same file.

## 1. Add a `description` to every Taboo and Hot Seat card
The games show a short meaning next to each word (Hot Seat shows it to the clue-givers as a hint; both games show it
in the review after a round). The decks have none, so those lines are blank today.
```json
{ "word": "puddle", "forbidden": ["water", "ground", "small", "splash"], "level": "A1",
  "description": "a little pool of rain on the ground" }
```
- 4–10 words, at or below the card's level, never using the word itself or a form of it.
- A meaning a child could say, not a dictionary entry. "a coat that keeps you dry", not "a waterproof garment".
- For Taboo cards the description may use the forbidden words (it is never shown to the describer during a turn).

## 2. Rebuild `imposter` in the shape the game uses
My brief asked for `{ word, decoy }`, but the Imposter game has no place for a decoy, so those pairs are unused.
That was my mistake. Replace each deck's `imposter` list with 6 rounds in the game's real shape:
```json
{ "word": "umbrella", "level": "A1",
  "description": "you hold it over your head in the rain",
  "hint": "a rainy-day thing",
  "crewQuestion": "What do you take with you when it rains?",
  "imposterQuestion": "What do you take with you when it is sunny?" }
```
- `word`: the secret word everyone except the imposter sees. Concrete and easy to give clues about.
- `description`: as in part 1.
- `hint`: 2–4 words naming the category only, shown to the imposter in easy mode. It must not give the word away
  ("a rainy-day thing", not "you hold it up").
- `crewQuestion` / `imposterQuestion`: for question mode. Everyone answers aloud; the imposter got a slightly
  different question. Answers must overlap enough for the imposter to blend in (rain / sun, breakfast / lunch),
  but differ enough that a careful listener can catch it. Both questions ask for a short spoken answer, never yes/no.
- You may reuse a good `word`/`decoy` pair from round 31 as the seed for the two questions.

## 3. Replace Hot Seat words that are hard to give clues for
Some Hot Seat entries are invented compound phrases that nobody would guess: "roof drip", "genre shelf", "headset
stand", "analyst desk", "tail tip". Go through every deck's `hotSeat` list and replace any entry that is not a
normal word or phrase a student of that level would know and could reach from spoken clues. Keep 14 per deck.
Rule of thumb: if it would not appear in a learner's dictionary or on a classroom word wall, replace it.
Do the same pass over `twentyQuestions`: secrets must be things a class can find with yes/no questions
("match schedule" and "team roster" are not; "trophy", "referee", "stadium" are).

## Validator: extend `scripts/validate-topic-game-decks.ts` (fail on any)
- Every taboo and hotSeat card has a `description` of 4–10 words that does not contain its word.
- Imposter: exactly 6 rounds per deck with all five text fields; `hint` 2–4 words and not containing the word;
  the two questions differ, both end in "?", neither starts with Do/Does/Is/Are/Can/Did/Will/Have.
- No `decoy` field remains.
- Hot Seat and Twenty Questions: no entry of 3 or more words; report every 2-word entry so I can skim them.
- All round 31 checks still pass (counts 14 / 14 / 8 for taboo, hotSeat, twentyQuestions).
- Report: how many Hot Seat and Twenty Questions entries you replaced, and paste 4 full decks (two kids, two teens)
  in the progress log.

## Rules
- Branch `codex/library-round-32` off `origin/main` (it now contains round 31). Commit in batches of about 15
  topics; don't push or merge; report.
- Write by hand, topic by topic. No templates: "a thing you use for…" on every card will be sent back.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/topic-game-decks.json`, the validator, and `docs/`. Do not change `src/lib/topic-game-decks.ts`
  (it reads the fields above; I will wire the new ones in).
