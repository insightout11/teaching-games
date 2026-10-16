# Activity quick wins — implementation plan (for Codex)

Written 16 October 2026 by Claude, from `docs/activity-quality-audit-report.md` (branch `codex/activity-quality-audit`) and the owner's decisions. **Do exactly these changes and nothing else.** No refactors, no new libraries, no new tables, no new settings.

## How the owner teaches (read first; the audit missed the second point)

- One shared window (the lesson screen) on Zoom or a projector. Everything on it is seen by the class. Never show answers or private information there.
- **There is no pair work. Ever.** No "say it to a partner", no pairs, no breakout rooms. Speaking happens in one of three ways only:
  1. **The teacher calls on a student**: the screen names who speaks (a random pick from the students who are present, or the student who answered).
  2. **Turns**: each student in order.
  3. **On phones**: the phone shows "Say it out loud, then tap" with one button, **I said it**. No typing.
- The teacher does not use a phone during lessons. Each change adds at most one tap for the teacher.
- Lucide icons only, never emoji. Short plain wording. Junior classes (`useSessionStore((s) => s.junior)`) are never ranked.

## Rules

- Branch `codex/activity-quick-wins` from `origin/main`. One local commit per numbered item, message starting `Quick win N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file: `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- If a step below does not fit the code as you find it, do the closest small version and say so in the report. Do not redesign.

## The shared "Say it" step (build first, use in items 2–7)

One small shared piece, so every activity's speaking step looks and works the same:

- `src/components/session/say-it-step.tsx`: shows on the lesson screen a short instruction ("Use “harbour” in a sentence about your town"), the names of students who have tapped **I said it** (as small chips, no order, no counts compared), an optional **Pick a student** button (random pick from present students, shows the name large), and **Next**. Present students come from the activity's existing `students`/participants.
- The phone side: set the input spec to the existing `confirm` type with the instruction as the prompt and the confirm button labelled `I said it` (the spec already has the field `buttonLabel` for this). Collect taps with the activity's existing remote vote handler. Clear the spec on Next.
- Never shows anything a student typed.

## The changes

1. **The Say it step** (above), with a short unit test for any pure helper you add (for example the random pick never returning a student who is absent).

2. **Connections** (`src/games/connections/`): when a group is solved, before showing the next round, show the Say it step: "Why do these four belong together?" with the solver's name as the one called. Teacher taps Next.

3. **Sentence Scramble** (`src/games/sentence-scramble/`): after the correct order is shown, the Say it step: "Change one detail so it's true for you, and say it." Phones get **I said it**; the teacher can Pick a student to say theirs aloud.

4. **VocabSprint** (`src/games/vocab-sprint/`): after each item's answer is revealed, the Say it step: "Use “{word}” in a sentence." The student(s) who chose that word are named; the teacher calls one.

5. **Static** (`src/activities/static/`): after the wrong word is revealed, the Say it step: "Read the corrected message aloud." The teacher picks one student to read it.

6. **Comms Check** (`src/activities/vocab-micro/`, key `vocab-micro`): do not show the example sentence at first. Show the Say it step ("Say your own sentence with “{word}”") first; the example appears only after Next.

7. **Situation Check** (`src/activities/speak-check/`, key `speak-check`): before the four replies appear, a 10-second Say it step: "What would you say? Say it out loud." Then the existing choice appears as now.

8. **GridRush** (`src/games/grid-rush/`): in the sentence phase, replace the fixed minimum-length target with "a complete sentence": accept any sentence with a subject and a verb that uses the word, at any length. Keep everything else, including the Junior result screen.

9. **Retire Team Debate into Tag-team Debate**: add `team-debate` to `RETIRED_PLUGIN_KEYS` in `src/lib/retired-plugins.ts` with the comment `// into Tag-team Debate (a turn for everyone)`. In `src/lib/flight-plan-presets.ts` replace every `team-debate` slot with `tag-team-debate` (check the Debate preset still builds a full plan; the tests in `src/lib/` cover presets). Remove `team-debate` from `src/lib/junior.ts` only if `tag-team-debate` is already there (it is). Saved lessons still open, because retired keys stay resolvable.

10. **Retire Grammar Clarify into Grammar Spotlight**: add `grammar-clarify` to `RETIRED_PLUGIN_KEYS` (`// rule card now part of Grammar Spotlight`). Grammar Spotlight gets the Clarify card's content (form, examples) as its first screen, before its existing discovery step: reuse the existing grammar-clarify generator output in `src/app/api/lesson-plan/generate/route.ts` rather than writing a new prompt. In the Grammar preset, replace the `grammar-clarify` slot with nothing (the Spotlight slot now covers it) and make sure the preset's stage list still reads sensibly.

11. **Retire Contribution Break**: add `contribution-break` to `RETIRED_PLUGIN_KEYS` (`// Final Answer covers written contributions`). Remove it from any preset or default list in `src/lib/flight-plan-config.ts` and `src/lib/flight-plan-presets.ts` so new plans never include it.

Not in this round (bigger, decided later): merging VocabSprint and Synonym Showdown; a harder *task* at C1 across prompts; new activity types.

## Report back

For each item: the commit, the files changed, and anything you could not do exactly as written (and why). Do not claim anything works on the live site; it has not been run there.
