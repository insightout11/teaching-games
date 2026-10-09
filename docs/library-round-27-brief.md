# Library round 27 brief (for Codex): a Speak situation for every topic

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–26._

## Round 26 review: merged and wired in
Merged. Your two runtime notes are fixed on main: the 22 course tasks now load into the older ready courses
(`src/lib/course-presets.ts`), and Junior classes now get Junior Speak situations, with the scene pictures shown on
the teacher screen (`bankSituationFor(topic, level, junior)` in `src/lib/speak-check.ts`). The sticker swaps look right.

## Why this round
Speak is the flight teachers will use most, and it opens and closes with a hand-checked situation from
`src/data/speak-situations.json` when the topic matches one; otherwise the AI writes one, and AI replies are weaker.
Today there are 110 situations (40 kids, 40 teens, 30 junior), mostly A1–A2 (only 14 at B2), so most of the 150
banked topics fall back to the AI.

## Task 1: topic links on every situation
Add `"topicIds": [...]` to every existing situation: the ids from `src/data/topic-briefings.json` it fits (can be
empty).

## Task 2: cover every banked topic
Add situations so **every topic in `topic-briefings.json` has at least one situation** for its age band:
- kids topics: `ageBand: "kids"`, A1 or A2;
- teen topics: `ageBand: "teens"`, B1 or B2 (aim for half B2 among the new ones).
Same shape and rules as the existing situations (round 11 notes): one natural, friendly reply and three replies wrong
in typical learner ways, `after` replies all different from `before`, situations a kid or teen recognises.
Include the topic's `topicIds` on each new situation.

## Task 3: check the old ones
Re-read the existing 80 kids/teens situations against the same rules and fix any that fail (ambiguous "natural"
reply, too adult, repeated wording between before and after). List what you changed in the progress log.

## Validator: extend `scripts/validate-speak-situations.ts` (fail on any)
- Every situation has `topicIds` (all real briefing ids).
- Every briefing topic has at least one situation of its age band.
- Existing shape checks (exactly one natural reply, no before/after overlap, reply counts) all 0; junior checks
  unchanged.
- Report: totals by age band and CEFR, topics covered, situations changed in task 3.

## Rules
- Branch `codex/library-round-27` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/speak-situations.json`, validators in `scripts/`, and `docs/`.
