# Library round 36 brief (for Codex): correct the library entries the audit flagged

_Written Oct 13 2026. Owner: LessonCaptain. Executor: Codex. This round EDITS library entries, using your own
round 35 audit as the work list._

## Round 35 review: merged, and already acted on
The audit was exactly what was needed. What has happened since:
- **Wrong-language transcripts: fixed.** 112 stored transcripts were translations (Arabic and others). They have
  been fetched again in English and saved. The app also now ignores any stored transcript that is not English.
  Three videos have no English captions at all: `hooks/hook-r2-iTHUUjTA-LI` and two teacher-pasted YouTube videos.
- **The 13 mismatched videos are hidden** from every picker and recommendation with a new flag, `hidden: true`
  (plus `hiddenNote`). `needsReview` was not used because it already means "not yet human-reviewed" on hundreds of
  good entries. Leave `needsReview` alone.

So `weak-captions` entries whose only problem was a translated transcript are now fine. Re-run your caption checks
first (see step 1) before trusting the round 35 statuses.

## Task
Work through `src/data/library-video-audit.json` and correct the entries in the library files.

1. **Re-check captions.** Re-run `scripts/audit-library-videos.ts` against the refreshed transcripts and update
   the audit file: most `weak-captions` should now be `ok` or reveal a real status. Report the new counts.
2. **The 13 hidden entries (`hidden: true`).** For each, choose one, in this order of preference:
   - **Retitle and re-describe** the entry so it says what the video really is, when the video is still a good
     classroom video for that library (e.g. `travel-shopping` is really hotel check-in English: title it that,
     fix tags, level and description). Then remove `hidden` and `hiddenNote`.
   - **Leave it hidden** when the video does not belong in that library at all (a Titanic survivor account in the
     grammar library). Say so in `hiddenNote`.
   - Do **not** search for replacement videos or add new entries this round.
   Note: the built-in course presets in `src/lib/course-presets.ts` point at `travel-restaurant`,
   `travel-directions` and `travel-airport` by id and expect a restaurant, directions and airport video. If you
   retitle `travel-restaurant` to what it really is, list that preset lesson in your report as now lacking a
   matching video. Do not edit `course-presets.ts`.
3. **The 11 `level-off` entries.** Set `cefr` and `difficultyLevel` to what the captions support. The app's
   levels are now: Beginner A1, Easy A2, Intermediate B1, Advanced B2, Expert C1.
4. **The 32 `partial` entries.** Rewrite `description` (and `summary` where present) so it promises only what the
   video delivers. Retitle only when the title's main claim is not in the video.
5. **Kids' libraries:** any entry you flagged for content unsuitable for children stays or becomes `hidden: true`
   with the quoted line in `hiddenNote`.

## Rules for the edits
- **Evidence or nothing**, as in round 35: every change is backed by the captions. If unsure, leave the entry and
  say why in the report.
- Change only these fields: `title`, `description`, `summary`, `topicTags`, `cefr`, `difficultyLevel`, `hidden`,
  `hiddenNote`. Never change `id`, `youtubeId`, `url` or `durationSecs`.
- Keep each library file's formatting (2-space JSON, same key order) so the diff shows only real changes.
- Titles stay short and plain, in the style of their library. No clickbait, no "(updated)".

## Checks and report
- Extend the audit script to fail if any `hidden` entry lacks a `hiddenNote`, or any entry's `cefr` and
  `difficultyLevel` disagree under the mapping above.
- `pnpm test src/lib src/data` and `tsc` (same known typecheck exception). Some tests name library ids
  (`src/lib/source-library.test.ts`): if a retitle changes what a test expects, report it, do not edit the test.
- Report: a table of every entry changed (id, what changed, the caption evidence), the entries left hidden and
  why, the new status counts, and the 67 duration discrepancies from round 35 re-counted after step 1.

## Rules
- Branch `codex/library-round-36` off `origin/main`. Commit library by library; don't push or merge; report.
- Only touch `src/data/*-library.json`, `src/data/library-video-audit.json`, `scripts/audit-library-videos.ts`
  and `docs/`.
