# Library round 25 brief (for Codex): more Junior material

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–24._

## Rounds 23 and 24 review: merged to main
Both merged and live. The picture stories are real little stories (Omar Shares Lunch is a good example: a problem, a
kind turn, a sharing ending), and they now run as the **Picture Stories** activity. All 24 ready courses are in the
Courses page and the builder, with your course tasks driving the new "first lesson / last lesson" arc. I drew 25 of
the stickers you listed for the stories (nest, coral, easel, actor, station worker and others): the bank is 578.

## Task 1: picture questions and stories for the topics that have none
These 11 kids topics have no Junior question set and no story: dinosaurs, fossils, the sun, planets, rockets,
astronauts, volcanoes, earthquakes, deserts, festivals around the world, superheroes (`topic-kids-*` ids in
`src/data/topic-briefings.json`).
- **Question sets**: add 11 sets to `src/data/junior-picture-questions.json` (one per topic, 10 questions, same rules
  as round 21, with `topicIds`).
- **Stories**: add 11 stories to `src/data/junior-picture-stories.json` (one per topic, same rules as round 23).
- Where a topic needs pictures we don't have (e.g. fossil, rocket, astronaut helmet, telescope, sand dune, lantern),
  use what exists, then list the missing words (up to 40) in the progress log; I'll draw them and you can swap them
  in next round. Don't edit `sticker-words.json`.

## Task 2: more variety for the busiest topics
Add a **second** question set and a **second** story for the 10 kids topics teachers will use most: animals,
food, family, school, weather, transport, the ocean, pets, sports, birthdays. New questions and new stories only (no
repeats of existing prompts or pages).

## Task 3: story lengths for the youngest
Mark each story (old and new) with `"length": "short" | "standard"`: short = 6 pages of 1 sentence each (for 5–6
year olds), standard = everything else. Add **10 short stories** if fewer than 10 exist.

## Validator additions (fail)
- Every kids topic has at least one question set and one story.
- `length` present on every story and consistent with the page count and sentences.
- Existing checks in `scripts/validate-junior-questions.ts` and `scripts/validate-junior-stories.ts` all 0.
- Report: sets, questions, stories (short/standard), kids topics covered, missing stickers listed.

## Rules
- Branch `codex/library-round-25` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run both Junior validators, `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc`.
- Only touch the two Junior data files, the Junior validators in `scripts/`, and `docs/`.
