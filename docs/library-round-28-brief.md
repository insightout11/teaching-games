# Library round 28 brief (for Codex): grammar and debate for every topic

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–27._

## Round 27 review: merged and live
Merged. Every banked topic now gets its own hand-checked Speak situation: the server looks up the topic's id and
picks a situation with that id in `topicIds` (`bankSituationFor(..., topicId)` in `src/lib/speak-check.ts`), at the
class's level where possible. The 11 revised replies read better.

## Why this round
Teachers now prepare lessons from a sheet that suggests what to teach next (Home → Prepare). Two lesson types need
more from the bank:
- **Grammar** lessons need a grammar point. Today the teacher picks one from a long list with no hint of which points
  fit the topic.
- **Debate** lessons use `src/data/debate-motions.json` (120 motions), matched by topic words only.

## Task 1: grammar points that fit each topic
For every topic in `src/data/topic-briefings.json`, add:
```json
"grammarFits": [
  { "target": "Past Simple", "why": "Tell the story of a famous eruption.", "example": "The volcano erupted in 1980." },
  { "target": "Comparatives", "why": "Compare volcanoes.", "example": "Mount Etna is bigger than Vesuvius." }
]
```
- 2–3 per topic, `target` exactly one of the values in `GRAMMAR_TARGET_GROUPS` (`src/lib/grammar.ts`; use the
  enum's string values).
- Natural fits only: the grammar point should be something the class would really use when talking about the topic.
- `why`: one short teacher-facing reason (≤ 10 words). `example`: one sentence at the topic's easiest level that uses
  the point and the topic (kids topics A1–A2, teen topics B1–B2).
- Kids topics: avoid points beyond A2 (no past perfect, passive, reported speech).

## Task 2: debate motions linked to topics
- Add `"topicIds": [...]` to every motion in `debate-motions.json` (briefing ids it fits; can be empty).
- Add motions so **every teen topic has at least one** motion linked to it (same shape and rules as the existing
  ones: for/against points, evidence cards, pulse). Kids topics: add motions only where a kid-friendly question
  exists (e.g. "Should every class have a pet?"), aiming for at least 30 kids topics covered.

## Validator: extend the library validator (fail on any)
- `grammarFits`: every topic has 2–3, every target a real enum value, no A2+ points on kids topics, examples ≤ 14
  words.
- Motions: every motion has `topicIds` (real ids); every teen topic has ≥ 1 motion; existing motion checks all 0.
- Report: topics with grammar fits, distribution of targets, motions added, teen and kids topics covered.

## Rules
- Branch `codex/library-round-28` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/topic-briefings.json`, `src/data/debate-motions.json`, validators in `scripts/`, and `docs/`.
