# Library round 35 brief (for Codex): does every library video match what we say it is?

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. This round is an AUDIT: it produces a report and review
flags. It writes no new teaching content._

## Round 34 review: merged
The Imposter questions are now real neighbouring questions with overlapping answers (crew: "What could you ask a
household robot to do?" / imposter: "Which chores might you give a new helper?"). That is what was needed. Hot Seat
is mostly single words now. One weakness to know about, no action this round: to reach single words, some decks
picked generic ones that are not really the topic's words ("pencil", "toy", "case", "plastic" under Robots;
"hose", "pencil" under Rainbows).

## A change of direction (owner's rule, 12 Oct)
> "This is a live lesson, so we need the AI to produce on the exact topic for most cases, not pre-made close enough
> answers. That would kill the product."

So no more rounds of pre-written topic content. The lessons are written live by the AI, from the material the
teacher picks. What matters now is that **the material itself is right**, because every activity is built from it.

## Why this round
In round 33 you found two library videos that are not what their titles say:
- `london/chinatown-restaurant-video`: the captions are about a restaurant on Lafayette Street, New York.
- Moscow's "city history" video: the captions are a modern tower tour.

A lesson built from either is built on the wrong thing, and nobody would know. There are 791 library videos across
19 libraries. You have checked the 150 World Flight ones. This round checks the rest.

## Task
For every video entry in `src/data/*-library.json` (an entry with a `youtubeId`) that is **not** in
`world-flight-library.json`, compare what the entry claims with the stored captions.

Read the captions the same way you did in round 33 (the cached transcripts). Do not fetch captions from YouTube and
do not call any paid transcript service: if an entry has no cached captions, record that and move on.

For each entry decide one status:
- `ok`: the captions are about what the title and description say.
- `mismatch`: the captions are about something else (wrong place, wrong subject, a different video).
- `partial`: on the subject, but the description promises something the video does not deliver, or the title's
  main claim is not in it.
- `weak-captions`: captions exist but are too garbled, too short, or mostly music/noise to build a lesson from.
- `no-captions`: nothing cached.
- `level-off`: the entry's level (`cefr` / `difficultyLevel`) is clearly wrong for the language in the captions
  (an "Easy" video with dense academic speech, or the reverse). Use this only when it is obvious.

## Deliverables
1. `docs/library-video-audit.md`: a table of every entry that is **not** `ok`, grouped by library, with: id,
   title, status, one sentence of evidence quoting or closely paraphrasing the captions, and a suggested action
   (retitle to X / rewrite description / lower level to X / remove). Then totals per library and per status.
2. `src/data/library-video-audit.json`: `{ "<library file>/<id>": { "status": "...", "note": "..." } }` for every
   audited entry, including `ok` ones, so the app can hide or warn later.
3. `scripts/audit-library-videos.ts`: the script that produced the mechanical parts (which entries have captions,
   caption length, words per minute against `durationSecs`). The judgement calls are yours, entry by entry.

## Rules for judgement
- **Evidence or nothing.** Every non-`ok` status needs evidence from the captions in the note. If you are unsure,
  the status is `ok` and the note says what made you hesitate.
- Do not judge quality, taste, or whether the video is "good for class". Only: is it what the entry says it is,
  can a lesson be built from its captions, and is the level plausible.
- Kids' libraries (`kids-library.json`, `hooks-library.json`): also flag, as `partial`, any video whose captions
  contain content unsuitable for children (violence described in detail, adult themes). Quote the line.
- **Change no library entry.** Do not retitle, remove or re-level anything. This round reports; the owner decides.

## Checks to run and report
- Every non-World-Flight video entry appears once in the audit JSON; no unknown keys.
- Counts per status per library; the 20 shortest caption sets; the 20 with the fewest words per minute.
- Entries whose `durationSecs` differs from the captions' last timestamp by more than 25% (a sign the entry points
  at a different video than the captions came from).
- `pnpm test src/lib` and `tsc` still pass (same known typecheck exception as before).

## Rules
- Branch `codex/library-round-35` off `origin/main`. Commit library by library; don't push or merge; report.
- Only add the three files above. Touch nothing else.
- Paste the full non-`ok` table for the three largest libraries in the progress log.
