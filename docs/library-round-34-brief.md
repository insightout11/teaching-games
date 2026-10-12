# Library round 34 brief (for Codex): finish the game decks

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as before._

## Round 33 review: merged and in use
Excellent work, the best round so far. The city notes are specific and come from each lesson's own material, and
you were right to ignore my Tokyo example where the captions did not support it. They now show in design missions
as "what the class found" and feed the options the AI writes. The source mismatches you flagged (the London
Chinatown video that is about a New York restaurant, the Moscow "city history" video that is a tower tour) have
gone to the owner.

## This round: Part B of the round 33 brief, which was not done
`docs/library-round-33-brief.md`, section "Part B", in full. In short:

- **B1. Imposter questions.** Rewrite every `imposterQuestion` as a real, different question about a neighbouring
  situation whose answers overlap with the crew's. Today most are the crew question with one word swapped, and
  many are nonsense. Vary the hints.
- **B2. Hot Seat and Twenty Questions.** Replace invented two-word phrases with words a class can reach from
  clues: at least 9 of 14 Hot Seat entries are single words. Twenty Questions secrets must not repeat the deck's
  Hot Seat or Taboo words.
- Extend the validator as that section says, and report what you replaced.

## Rules
- Branch `codex/library-round-34` off `origin/main` (it contains rounds 32 and 33; round 33's branch did not
  contain round 32's deck changes, so do not start from it).
- Commit in batches of about 15 topics; don't push or merge; report.
- Only touch `src/data/topic-game-decks.json`, `scripts/validate-topic-game-decks.ts`, and `docs/`.
