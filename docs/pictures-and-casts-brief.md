# Pictures across the activities, and bigger Scene Igniter casts — brief for Codex

Written 20 October 2026 by Claude, from `docs/design-direction-plan-v4.md` sections 2.5–2.7 (on branch
`claude/adoring-gauss-7a18kq`). Claude reviews the branch; the owner tests in real classes.

## Why

Many activity screens are words only. Kids and teens read pictures faster than text, and quiz apps like Kahoot get
much of their appeal from a picture on every question. LessonCaptain already has a free picture source:
`src/lib/sources/wikimedia-images.ts` (`freePictures(query)`: Wikipedia's page picture plus a Wikimedia Commons
search, with a child-safety word filter and a credit on every picture). The facts board already uses it through
`POST /api/sessions/[sessionId]/sources/free-pictures`.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), one shared screen. **Never answers or private
  information on the shared screen.** No pair work, ever: speaking is one student at a time, the class listening.
- Lucide icons only, never emoji. Short, plain wording. Junior classes (`classes.junior`) are never ranked and need
  very little reading: pictures matter most there.

## Rules

- Branch `codex/pictures-casts` from `origin/main`. One local commit per numbered item, message starting
  `Pictures N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** run `pnpm install`. **Do not touch** `src/components/live-room/`, `src/components/session/live-room/`,
  `src/lib/live-room/` or `src/data/world/` (Claude is working there).
- **Pictures must never give away an answer.** A Flash Quiz question "What is the capital of France?" must not show
  the Eiffel Tower before the reveal. Pick the picture from the question's subject, never from the correct option; when
  the only sensible picture would reveal the answer, show it **after** the reveal instead (or not at all).
- Free pictures only (no Serper, no paid calls). Every shown picture carries its credit (small text). A picture that
  fails to load disappears; the screen still works without pictures (they are a bonus, never required).
- No new AI calls just for pictures: where the content is AI-generated, add a short `picture` search phrase (2-5 words)
  to the existing generation schema and prompt, the way `src/lib/live-room/fact-cards.ts` does.
- Cache-friendly: one picture lookup per card/question, at most 6 in parallel; never re-fetch the same query in a round.

## The work

1. **A shared helper** — a small client hook or function (e.g. `src/lib/use-free-picture.ts`) that takes a query and
   returns a picture (or null), using the existing free-pictures route, with a per-session in-memory cache. Tests for
   the pure parts.
2. **Flash Quiz** (`src/games/flash-quiz/`): a picture on each question on the shared screen (and on the phone's
   question if there is room), following the no-spoiler rule above. Add the `picture` phrase to its question
   generation.
3. **Vocabulary cards**: wherever a word is shown with its meaning (Vocab Sprint, Vocab Radar, Vocab Micro, the
   Language Toolkit word cards): a picture for concrete words only (things you can photograph). Abstract words
   ("honesty", "although") get none; decide in the generation step (`picture: ""`).
4. **Taboo Sprint and Hot Seat cards** (`src/activities/taboo-sprint/`, `src/activities/hot-seat/`): a picture on the
   card **only where the card is not secret**. If the card's word is hidden from the class (the describer's word), the
   picture must not appear on the shared screen either; it may appear on the describer's own phone.
5. **Scene Igniter** (`src/activities/scene-igniter/`): today a scene casts at most 4 (a bigger class gets a second
   scene). Add bigger casts (5–8 characters) and **audience jobs** for everyone not in the scene: a director who calls
   "Cut!", critics who give one compliment and one tip, a narrator. Jobs go to phones (one-phone rule: the phone shows
   the job and what to do). Optionally set the scene in the class's destination city when one is known (look for how
   other activities read the destination; skip if it is not available without touching the protected directories).
6. **Survey**: list every other words-only screen where a picture would help (shared screen or phone), in
   `docs/pictures-survey.md`, most valuable first. Report only; no code.
7. **Tests** for each item where the logic is testable (no-spoiler choice, concrete-word rule, secret cards never on the
   shared screen, cast sizes and job assignment).

## Report back

For each item: the commit, the files changed, anything you could not do exactly as written (and why). Name every place
where a picture could have spoiled an answer and how you avoided it. Do not claim anything works in a real class.
