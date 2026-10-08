# Library round 21 brief (for Codex): Junior picture questions

_Written Oct 8 2026. Owner: LessonCaptain. Executor: Codex. Start after round 20 is reported (finish that first).
Same rules as rounds 18–20. Use your strongest writing model._

## Context
Junior mode (`docs/pictures-and-junior-concept.md`) is for classes of young kids, about 5–9, who read slowly or not
yet. We now have a core set of picture stickers: `src/data/sticker-words.json` (493 words, each with `id`, `word`,
`category`, `kind`). On phones, a question whose options all have a sticker is shown as big picture tiles
(`src/lib/stickers.ts`, `stickerIdFor`). Junior classes need questions written **for** those tiles.

## Task: `src/data/junior-picture-questions.json`
About **400 questions** in topic sets, each answerable by tapping a picture:
```json
{ "id": "animals-01", "topic": "Animals", "questions": [
  { "prompt": "Which one can fly?", "options": ["bird", "cow", "fish", "snail"], "answer": "bird",
    "say": "Which one can fly? A bird, a cow, a fish or a snail?" }
] }
```
- **Topics** (8–12 questions each, about 40 sets): animals, food, fruit and vegetables, body, clothes, weather, home,
  school things, toys, transport, places, jobs, family, actions, feelings, colours of things ("Which one is yellow?"
  with banana, etc.), sizes ("Which one is the biggest?"), seasons, sea animals, farm animals, wild animals, breakfast,
  birthday party, sports, nature, opposites (hot/cold, happy/sad), "what do you use to…", "where do you…".
- **options**: 2–4 sticker `id`s from `sticker-words.json` (exactly as the ids are spelled), **every option must be an
  existing id**. `answer` is one of them. For opinion questions ("Which one do you like best?") set `answer: null`.
- **prompt**: A1 English, at most 8 words, one clear idea, answerable from the picture alone. No trick questions.
- **say**: the prompt plus the options, read aloud by the teacher screen's computer voice.
- Mix: about 70% one right answer, 30% opinion (`answer: null`). The right answer must not always be first.
- Kid-safe, culturally neutral (no pork-only or religion-specific items as "the right answer"), no questions about
  people's bodies or looks beyond simple parts ("Which one do you see with?" eye).
- Also: **missing words**. List in `docs/library-round-21-progress.md` up to 60 everyday words for this age that
  would make good stickers and are not in the list yet (with the topic they'd help). Don't edit `sticker-words.json`.

## Validator: `scripts/validate-junior-questions.ts` (fail on any)
- Every option and answer is an id in `sticker-words.json`; 2–4 options; no duplicate options; answer in options or
  null; prompt ≤ 8 words; unique question ids and no repeated prompt+options pair; each set 8–12 questions; the
  answer's position varies (no set with the answer in the same slot for more than half its questions).
- Report the counts (sets, questions, opinion share, words used) and that all checks are at 0.

## Rules
- Branch `codex/library-round-21` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the validator, `pnpm test src/lib` (`--maxWorkers=1` if needed) and `tsc`.
- Only touch `src/data/junior-picture-questions.json`, the new validator in `scripts/`, and `docs/`.
