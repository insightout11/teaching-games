# Codex brief: make "+30s" reach student phones

## Problem
Many games and activities have a "+30s" button that only adds time on the teacher screen (`setTimeLeft(t => t + 30)`). The student phone's countdown comes from the published input spec (`timerSeconds` + server-stamped `startedAt`), which never changes, so phones say "Time's up" while the teacher screen still runs.

## The fix pattern (already done in `src/games/vocab-sprint/game.tsx`, commit 6d3e0cc7; copy it)
1. Add `const [extraSeconds, setExtraSeconds] = useState(0);`
2. Wherever the spec is published with `timerSeconds: X`, send `timerSeconds: X + extraSeconds` and add `extraSeconds` to that effect's dependency list.
3. Keep the SAME `startedAt` (client nonce) when republishing. `stampTimedSpec` in `src/lib/input-spec.ts` then keeps the original server start, so phones simply get a longer timer. Never reset the startedAt ref because of +30s.
4. The +30s button calls both `setTimeLeft(t => t + 30)` and `setExtraSeconds(x => x + 30)`.
5. Reset `extraSeconds` to 0 wherever a new round or question starts (the same place `timeLeft` is reset to the base timer).
6. If a progress bar or ring divides by the base timer, divide by `base + extraSeconds`.

## Files
- `src/games/dialogue-detective/game.tsx`
- `src/games/error-hunter/game.tsx`
- `src/games/grammar-boss/game.tsx`
- `src/games/grid-rush/game.tsx`
- `src/games/sentence-scramble/game.tsx`
- `src/activities/expert-panel/activity.tsx`
- `src/activities/final-answer/activity.tsx`
- `src/activities/in-your-words/activity.tsx`
- `src/activities/lightning-round/activity.tsx`
- `src/activities/listening-gap-fill/activity.tsx`
- `src/activities/mic-drop/activity.tsx`
- `src/activities/mission-selector/activity.tsx`
- `src/activities/opinion-shift/activity.tsx`
- `src/activities/prediction-round/activity.tsx`
- `src/activities/problem-solvers/activity.tsx`
- `src/activities/quick-pulse/activity.tsx`
- `src/activities/scenario-simulator/activity.tsx`
- `src/activities/vocab-radar/activity.tsx`

Some of these may not publish a timed spec at all (the button only affects a teacher-side clock). Leave those unchanged and list them in your report. Also check the shared timer route (`src/app/api/session/timer/route.ts`) and anything that uses it. If a file extends time through that route already, note it and skip it.

## Rules
- Branch `codex/timer-extend-sweep`; small commits (one per file or a few files each); do not push or merge. Claude reviews and merges.
- Touch only the listed files. No restyling, no refactors, no other behaviour changes.
- Do NOT touch `vocab-sprint`, `conversation-rounds`, `hot-take-arena`, or `taboo-sprint`: Claude is working on them.
- Our tsc target is ES5: no `/u` regex flags, no iterating a Set or Map directly (use `Array.from`).
- Before reporting: `npx tsc --noEmit -p .` passes (ignore `@mozilla/readability` if missing), `pnpm next lint --file <each changed file>`, `pnpm test`.
- Report: each file, whether it published a timed spec, and what you changed.
