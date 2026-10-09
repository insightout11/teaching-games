# Library round 23 brief (for Codex): Junior picture stories

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–22. Use your strongest writing
model: it's all writing._

## Round 22 review: merged to main
Merged. The picture words are concrete and well ordered (Rainforests: forest, tree, rain, monkey, parrot, leaf), and
the topic links let Picture Quiz pick the right set for a lesson topic. Both are live: Junior classes now get picture
word cards when they pick a banked topic. The missing stickers you listed are almost all for teen topics, so we'll
leave them for now.

## Task: `src/data/junior-picture-stories.json`
Short read-along stories for Junior classes (about ages 5–9), told with our sticker pictures, so a young class can
read together in the Reading flight. **40 stories**, each 6–8 pages:
```json
{ "id": "lost-kite", "title": "The Lost Kite", "level": "A1", "topicIds": ["weather", "parks"],
  "cast": ["girl", "dog"],
  "pages": [
    { "text": "Ana has a red kite.", "pictures": ["girl", "kite"] },
    { "text": "The wind is strong!", "pictures": ["wind", "kite"] }
  ],
  "questions": [
    { "prompt": "What does Ana have?", "options": ["kite", "ball", "bike"], "answer": "kite" }
  ],
  "words": ["kite", "wind", "tree", "dog"] }
```
- **pages**: 6–8. `text` is 1–2 sentences, A1 (half the stories) or A2, at most 10 words a sentence, present simple
  or simple past used consistently within a story. `pictures`: 1–3 sticker ids from `src/data/sticker-words.json`
  that show what the sentence says (exact ids). The pictures carry the story: a child who can't read should follow it.
- **A real story**: a character, a small problem, a turn and a happy or funny ending. Not a list of things. Name
  characters with short, easy names from many cultures (Ana, Kofi, Mei, Omar, Lila, Sam).
- **questions**: 3 per story, picture answers: 2–4 sticker-id options, one `answer` (or `null` for "Which part did
  you like best?" style opinions, at most 1 per story). Answerable from the story.
- **words**: 4–6 sticker ids that are the story's key words (they become phone word cards).
- **topicIds**: briefing topic ids from `src/data/topic-briefings.json` the story fits (can be empty).
- Kid-safe, kind, culturally neutral. Variety across stories: animals, family, school, weather, food, a trip,
  a lost thing, making something, a surprise, a sport, a new friend.
- Also list in `docs/library-round-23-progress.md` up to 40 sticker words that would have made stories better and
  aren't in the list (don't edit `sticker-words.json`).

## Validator: `scripts/validate-junior-stories.ts` (fail on any)
- Every picture, option, answer and word is a sticker id; 6–8 pages; 1–3 pictures a page; 3 questions with at most
  one opinion; answers in options; sentence length limits by level; unique story ids and titles; every topicId is a
  real briefing id; no page text repeated across stories.
- Report: stories, pages, A1/A2 split, distinct sticker ids used, and all checks at 0.

## Rules
- Branch `codex/library-round-23` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the new validator, the existing validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/junior-picture-stories.json`, the new validator in `scripts/`, and `docs/`.
