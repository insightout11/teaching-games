# Activity quick wins — implementation plan (for Codex)

Written 16 October 2026 by Claude, from `docs/activity-quality-audit-report.md` (branch `codex/activity-quality-audit`) and the owner's decisions. **Do exactly these changes and nothing else.** No refactors, no new libraries, no new tables, no new settings.

## How the owner teaches (read first; the audit missed the second point)

- One shared window (the lesson screen) on Zoom or a projector. Everything on it is seen by the class. Never show answers or private information there.
- **There is no pair work. Ever.** No "say it to a partner", no pairs, no breakout rooms. Speaking happens one student at a time, out loud, with the class listening: the screen names who speaks next.
- **No "I said it" buttons.** A tap that only claims a student spoke is pointless (the teacher hears them). The phone is not used for speaking steps.
- The teacher does not use a phone during lessons. Each change adds at most one tap for the teacher.
- Lucide icons only, never emoji. Short plain wording. Junior classes (`useSessionStore((s) => s.junior)`) are never ranked.

## Rules

- Branch `codex/activity-quick-wins` from `origin/main`. One local commit per numbered item, message starting `Quick win N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file: `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- If a step below does not fit the code as you find it, do the closest small version and say so in the report. Do not redesign.

## The shared "Next speaker" step (build first, use in items 2–7)

One small shared piece, so every activity's speaking moment looks and works the same:

- `src/components/session/next-speaker-step.tsx`, on the lesson screen: the speaking task in large type ("Use “harbour” in a sentence about your town"), **one student's name, large**, and two buttons: **Next speaker** (another name, same task) and **Done** (back to the activity).
- Who is named: a student who is present and has not been named yet in this lesson; when everyone has been named, start again. Students named least recently come first, so quiet students are not skipped. An activity can pass a preferred first name (for example the student who solved a group).
- Each name shown counts as that student taking part (feed the existing participation/score path the activities already use for spoken turns, so the Everyone Aboard star sees it). No typing, no phone step: clear any phone input while the step is showing.
- Never shows anything a student typed.

## The changes

1. **The Next speaker step** (above), with a unit test for the picking helper: never an absent student, nobody twice before everyone has had a turn, least recent first.

2. **Connections** (`src/games/connections/`): when a group is solved, before showing the next round, show the Next speaker step: "Why do these four belong together?" with the solver as the first speaker.

3. **Sentence Scramble** (`src/games/sentence-scramble/`): after the correct order is shown, the Next speaker step: "Change one detail so it's true for you, and say it."

4. **VocabSprint** (`src/games/vocab-sprint/`): after each item's answer is revealed, the Next speaker step: "Use “{word}” in a sentence." A student who chose that word speaks first.

5. **Static** (`src/activities/static/`): after the wrong word is revealed, the Next speaker step: "Read the corrected message aloud."

6. **Comms Check** (`src/activities/vocab-micro/`, key `vocab-micro`): do not show the example sentence at first. Show the Next speaker step ("Say your own sentence with “{word}”") first; the example appears only after Done.

7. **Situation Check** (`src/activities/speak-check/`, key `speak-check`): before the four replies appear, the Next speaker step: "What would you say?" One or two students answer out loud; then the existing choice appears on phones as now.

8. **GridRush** (`src/games/grid-rush/`): in the sentence phase, replace the fixed minimum-length target with "a complete sentence": accept any sentence with a subject and a verb that uses the word, at any length. Keep everything else, including the Junior result screen.

9. **Retire Team Debate into Tag-team Debate**: add `team-debate` to `RETIRED_PLUGIN_KEYS` in `src/lib/retired-plugins.ts` with the comment `// into Tag-team Debate (a turn for everyone)`. In `src/lib/flight-plan-presets.ts` replace every `team-debate` slot with `tag-team-debate` (check the Debate preset still builds a full plan; the tests in `src/lib/` cover presets). Remove `team-debate` from `src/lib/junior.ts` only if `tag-team-debate` is already there (it is). Saved lessons still open, because retired keys stay resolvable.

10. **Retire Grammar Clarify into Grammar Spotlight**: add `grammar-clarify` to `RETIRED_PLUGIN_KEYS` (`// rule card now part of Grammar Spotlight`). Grammar Spotlight gets the Clarify card's content (form, examples) as its first screen, before its existing discovery step: reuse the existing grammar-clarify generator output in `src/app/api/lesson-plan/generate/route.ts` rather than writing a new prompt. In the Grammar preset, replace the `grammar-clarify` slot with nothing (the Spotlight slot now covers it) and make sure the preset's stage list still reads sensibly.

11. **Retire Contribution Break**: add `contribution-break` to `RETIRED_PLUGIN_KEYS` (`// Final Answer covers written contributions`). Remove it from any preset or default list in `src/lib/flight-plan-config.ts` and `src/lib/flight-plan-presets.ts` so new plans never include it.

Not in this round (bigger, decided later): merging VocabSprint and Synonym Showdown; a harder *task* at C1 across prompts; new activity types.

## Report back

For each item: the commit, the files changed, and anything you could not do exactly as written (and why). Do not claim anything works on the live site; it has not been run there.
