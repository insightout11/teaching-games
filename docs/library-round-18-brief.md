# Library round 18 brief (for Codex)

_Written Oct 7 2026. Owner: LessonCaptain. Executor: Codex. Same licences, safety rules, validator and pipeline as the
earlier briefs (`docs/library-expansion-brief.md` and rounds 2–17). Never rewrite history; follow-up commits are fine.
Load env from the main checkout's `.env.local` without copying it._

## Round 17 review (merged to main)
Very good. The A1 retellings are genuinely simple and still tell the story; the Beatrix Potter and First fairy tales
courses follow the real Gutenberg texts; all 136 packs pass. The test-count change was the right call. You can commit
your own files task by task without asking, as long as you stage only your own files.

## Why this round is different
A competitor review (`docs/competitive-landscape-oct-2026.md`) found that prepared lesson content is becoming cheap
everywhere. LessonCaptain's edge is the **Live Room**: the class talks about anything, it becomes the topic, and
activities follow. Today every new topic costs one AI call (`src/app/api/session/[sessionId]/focus/route.ts`) and a
few seconds. This round builds a **bank of ready briefings** for the topics classes bring up most, so those are instant
and better than a quick AI draft. Claude will wire the bank into the Focus route after you deliver it.

## Task 1: choose 150 topics
New file `src/data/topic-briefings.json`. Topics that kids (6–12) and teens (13–17) really raise in English classes
worldwide, evergreen (no news events, no living public figures, no "the newest/current" anything):
- **Kids (about 80)**: animals (by kind and habitat), dinosaurs, space and planets, volcanoes, oceans, weather, seasons,
  food and cooking, festivals around the world, sports, toys and games, pets, school, family, superheroes (generic),
  robots, the body, jobs, transport, music, art, holidays, insects, rainforests, deserts.
- **Teens (about 70)**: video games (generic, no single brand as the topic), social media, music genres, films (genres,
  not titles), friendship, future jobs, AI and technology, climate and environment, travel, sports, fashion, food
  culture, part-time jobs, school life, mysteries and unexplained things, space exploration, inventions, healthy
  habits, money, cities of the future.
Each topic: `{ id, title, aliases: string[3–8], ageBand: 'kids' | 'teens', category }`. Aliases are what a teacher
might type ("volcano", "volcanoes", "eruption", "lava"). No alias may belong to two topics.

## Task 2: write the briefings
For each topic, `levels`: kids topics **A1, A2, B1**; teen topics **B1, B2**. Each level has exactly the Focus route's
shape:
- `briefing`: 3–4 sentences a teacher could read out, real substance (facts, not fluff), at that level.
- `facts`: exactly 4 short, interesting, **accurate, evergreen** facts (no records that change, no prices, no "this
  year").
- `angles`: exactly 3 open questions or opinions the class could argue about (kids: simple "would you rather" or
  "which is better" style).
- `vocab`: exactly 7 items `{ word, definition, partOfSpeech, example, starter }` (see `PHRASEBOOK_FIELDS_PROMPT` in
  `src/lib/reference-materials.ts`): definition ≤ 15 words; example about this topic; starter ends with "…".
- `expressions`: exactly 6 `{ phrase, example }` sentence stems for discussing it, each example about this topic.
Language: A1 ≤ 10 words a sentence, everyday words; A2 ≤ 14; B1 natural; B2 richer. Safety: nothing frightening or
graphic for kids (volcanoes and sharks are fine; injuries and deaths are not), no politics or religion arguments, no
brands as the subject.

## Validator additions
- Exact counts per level; required levels per age band; no duplicate ids, titles or aliases (case-insensitive).
- A1/A2 sentence-length limits; definitions ≤ 15 words; starters end with "…"; every vocab `word` appears in that
  level's briefing, facts or examples.
- Flag time-sensitive wording for review ("currently", "this year", "the newest", "record", years after 2000).
- Report counts per age band and level.

## Rules
- Branch `codex/library-round-18` off `origin/main`. One commit per task (Task 1 may be one commit with a first batch
  of briefings); follow-ups fine. Don't push or merge; report the validator's counts.
- Run `scripts/validate-library.ts` (add the new file to it), `pnpm test src/lib` (use `--maxWorkers=1` if the World
  Flight test times out) and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-18-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
