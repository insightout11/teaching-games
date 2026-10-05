# Library round 11 brief (for Codex)

_Written Oct 5 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–10). Never rewrite history; follow-up
commits are fine. Load env from the main checkout's `.env.local` without copying it._

## Round 10 review (merged to main)
Good round: 530 Flight Questions, all distinct, mostly specific to their item; series and ladder as asked. Claude removed
11 questions that were transcript fragments ("But how do they glow?", "So what does that mean for free will?"). Two
weaker patterns remain, fixed in task 1. Also: your summary said 1,390 items, your log and the data say 1,380. Report the
validator's own numbers.

## Tasks, in this order

### 1. Flight Question polish
- **No title copies:** a `flightQuestion` must not repeat the item's title (case/punctuation-insensitive), e.g.
  "Street Food: Why Is It Becoming Popular?" → "Should cities give street food sellers more space?". Rewrite these.
- **Debatable, not comprehension:** rewrite questions with one factual answer from the material ("How do desert plants
  save water?", "Why does Nita hang upside down?") into ones with two or more defensible answers ("Would you rather live
  in a desert or a rainforest?", "Was Nita right to …?"). For A1 kids, a simple choice question is fine ("Is a cat or a
  dog a better friend for Nita?").
- Validator hard rules: not equal to the title; doesn't start with But/So/And; ends with `?`; ≤ 12 words; unique.
- Report: how many rewritten, how many left flagged.

### 2. Speak situations bank (new file, 40 situations)
Speak's lesson opens and closes with a **situation check** (see `src/lib/speak-check.ts`, type `SpeakSituation`). The AI
writes one per lesson; we want hand-checked ones for common topics so the check is always good.
- New file `src/data/speak-situations.json`: an array of
  `{ id, topics: string[], ageBand: "kids" | "teens", cefr, situation, canDo, before: { replies: string[4], natural },
  after: { replies: string[4], natural } }`.
- 40 situations across everyday topics: food/café/restaurant, shopping, school, friends/plans, hobbies, sport, travel,
  weather, family, technology, health/doctor, animals/pets, music, holidays/festivals, environment, the weekend.
  20 kids (A1–A2), 20 teens (A2–B2).
- Each set: exactly ONE natural reply a fluent speaker would say; the other three are typical learner errors (too short
  or rude, too formal or stiff, a grammar mistake, off-topic). `after` replies are all different from `before`, natural at
  a different index. `canDo` starts with a verb, no question mark.
- Add a validator check for the file (same rules as `validSpeakSituation` in `src/lib/speak-check.ts`, which you may
  import). Don't wire it into the app; Claude will.

### 3. Listening packs for 30 short clips
For the coming Listening Flight (Radio Check plays a video segment and asks one question). Pick 30 short clips already in
the library with verified transcripts (mix of `listening:*`, kids, VOA, TED-Ed; 10 kids A1–A2, 12 B1, 8 B2) and add
`listeningPack: { segments: [{ start, end, question, options: string[3–4], correctIndex, keyLine }] }` with **3 segments
each**: 10–30 seconds long, the answer clearly audible in that segment, `keyLine` = the exact transcript line holding the
answer. Times in seconds from the transcript timestamps. Options are plausible (same type of thing), only one correct.

## Rules
- Branch `codex/library-round-11` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge; report
  the validator's counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-11-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
