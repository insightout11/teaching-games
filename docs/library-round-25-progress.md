# Library round 25 progress

Branch: `codex/library-round-25` from `origin/main`. Local commits only.

## Task 1 — new topics

Added 11 topic sets (110 questions) and 11 A1 stories for dinosaurs, fossils, the sun, planets, rockets, astronauts, volcanoes, earthquakes, deserts, festivals around the world, and superheroes. The question and story checkers pass at 51 sets / 510 questions and 51 stories. Several sets also cover the moon and stars with relevant questions.

Picture words requested for a future sticker pass (all absent from the 578-word bank): `fossil`, `dinosaur-footprint`, `telescope`, `astronaut-helmet`, `lava`, `earthquake`, `sand-dune`, `festival-lantern`, `superhero-cape`. Existing stickers stand in where possible; some concepts remain expressed in text.

## Task 2 — busiest topics

Added ten second sets (100 new questions) and ten A2 stories for animals, food, family, school, weather, transport, the ocean, pets, sports, and birthdays. All prompts and page texts are new. The two Junior validators pass at **61 sets / 610 questions** and **61 stories / 376 pages**. All 80 kids topics now have both a question set and a story by topic ID; the volcano story was revised to include its rainforest setting.

## Task 3 — lengths and full validation

Marked all 61 stories by length: **51 short** (six pages, one sentence each) and **10 standard** (seven pages). The existing 40 stories already met the short definition, so no extra short stories were required. Both Junior checkers now fail for missing kids-topic coverage; the story checker also fails for missing or mismatched length. The `--build` modes retain newer Round 25 rows.

Final checker counts: 61 sets, 610 questions (183 opinion, 30.0%), 61 stories, 376 pages, 51 short / 10 standard, kids topics covered 80/80 in each bank. **Every Junior check is 0.** Library validator passes (1,388 items). `pnpm test src/lib` passes (86 files, 390 tests).

`npx tsc --noEmit -p .` reports no Round 25 errors after a checker type fix. It remains blocked by the checkout's missing declared `@anthropic-ai/sdk` package: two TS2307 errors in `src/lib/ai/providers/anthropic.ts` and a related TS7006 callback parameter. No package was installed or changed.
