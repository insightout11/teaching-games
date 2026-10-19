# One-phone audit and fixes — brief for Codex

Written 19 October 2026 by Claude, for Phase 4.6 of `docs/design-direction-plan-v4.md`. **Audit every phone step, then
fix the ones that fail.** Claude reviews the branch; the owner tests in real classes.

## Why

LessonCaptain classes are mostly online (Zoom). Many students have **one device**: they are on the Zoom call and switch
to LessonCaptain in the browser to answer. **While a student is answering on the phone, they cannot see the shared
screen.** So every phone step must carry what the student needs to answer: the question, the choices, and any text the
answer depends on (a clue, a fact, a story so far, a proposal). A phone that shows only "A / B / C / D" or "Your turn"
fails a one-device student.

## How the owner teaches (read first)

- One shared window (the lesson screen) on Zoom or a projector. Never put answers or private information on it.
- **No pair work, ever.** Speaking is one student at a time with the class listening.
- Teachers do not use a phone during lessons.
- Lucide icons only, never emoji. Short, plain wording. Junior classes (`classes.junior`) are never ranked and need very
  little reading: pictures where they help.

## Rules

- Branch `codex/one-phone` from `origin/main`. One local commit per numbered item, message starting `One phone N:`. No push,
  no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** run `pnpm install`. **Do not touch** `src/components/session/live-room/` or `src/components/live-room/`
  (Claude is working there), nor `src/lib/live-room/`.
- Keep phone text short and readable on a small screen (the phone input kit in `src/components/student/` sets the
  style). Add the text to the existing input spec (`src/lib/input-spec.ts`); do not invent a new phone screen when an
  existing input type can carry it (`prompt`, `context`, option labels…).
- Never send the answer to phones before the reveal (the shared screen and the phones must not give it away).

## The work

1. **Audit** (report only, no code): for every game in `src/games/registry.ts` and activity in
   `src/activities/registry.ts` (skip retired ones in `src/lib/retired-plugins.ts`), list each phone step: what the phone
   shows (trace `onSetInputSpec` and `src/components/student/dynamic-input.tsx`), and whether a student who cannot see the
   shared screen can answer it. Mark each step **passes**, **fails** (and what is missing), or **not needed** (no phone
   step). Write it to `docs/one-phone-audit.md` as a table, most important failures first.

2. **Mystery Flight** (`src/games/mystery-flight/`): the clues arrive on the shared screen only. Show the clues so far on
   the phone above the map pin (newest first, short), so a student can pin without seeing Zoom.

3. **Rank It** (`src/activities/rank-it/`): in the second round the new facts appear only on the shared screen. Put them
   on the phone with the ranking.

4. **Sector Strike** (`src/games/sector-strike/`): the phone has no board. Show a compact version of the board the
   student needs to choose a sector (labels only, no answers).

5. **Story Sprint** (`src/games/story-sprint/`): in the written branch the phone lacks the story so far. Show the last
   two or three lines above the writing box.

6. **Decision Council** (`src/activities/decision-council/`): the challenge step shows letters without the proposal
   text. Show each proposal's short text next to its letter.

7. **Every other failure** from the audit: fix it the same way, smallest change first. If a fix needs a redesign, leave it
   and explain in the report.

8. **A test or two per fix** where the logic is testable (the input spec now carries the text), in
   `src/__tests__/lib/` or next to the plugin as the repo already does.

## Report back

For each item: the commit, the files changed, and anything you could not do exactly as written (and why). Include the
audit table. Do not claim anything works in a real class; it has not been tried there.
