# Library round 2 progress

Branch: `codex/library-round-2`, created from fetched `origin/main` (`c405b115`).

| Task | Target | Baseline | Complete |
|---|---:|---:|---:|
| Metadata backfill | 446 | 446 missing `cefr` or `ageBand` | 446 / 446 |
| Grammar videos | +60 | 17 | 60 / 60 |
| Short hooks under 180 seconds | +60 | 43 | 60 / 60 |
| Opinion/discussion texts | +40 | 10 | 40 / 40 |

## Batch log

Metadata backfill: 446 / 446 complete across 23 validated commits. Grammar videos are in progress; short hooks and opinion/discussion texts follow.

## Notes

- Baseline validation passes for 1,033 items in 23 library JSON files.
- The owner approved installing the already-declared `@mozilla/readability@0.6.0` locally; `package.json` and lockfiles remain unchanged. `npx tsc --noEmit -p .` passes.
- `scripts/validate-library.ts` now treats records with only `cefr`/`ageBand` as metadata-backfilled legacy records. This lets the task add only the requested metadata without forcing unrelated schema migration; records with `kind` or `license` still receive the full expanded-schema validation.
- Video additions require English captions and locally prefetched transcripts per the expansion brief. Do not count any video until its transcript has been verified in Supabase.

## Task 1 — metadata backfill

- Batch 1 of 23: 20 metadata backfills (`bbc-ideas` 10, `bbc` 10); validator passes at 1,033 records.
- CEFR values use the existing `difficultyLevel`; age bands use source audience and intended class fit. None of these 20 lacked enough title/description evidence to require a new review flag.
- `npx tsc --noEmit -p .` passes after the owner-approved local install of already-declared `@mozilla/readability@0.6.0`; package.json and lockfile are unchanged.
- Both required checks pass. Commit: `cb094c00` (`Backfill library metadata batch 1`).

- 2026-09-30 · metadata batch 2 · +20 (bbc-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed (see branch history).

- 2026-09-30 · metadata batch 3 · +20 (bbc-library.json, bigthink-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 4 · +20 (bigthink-library.json, business-english-library.json, crash-course-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 5 · +20 (crash-course-library.json, internet-memes-library.json, kids-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 6 · +20 (kids-library.json, kurzgesagt-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 7 · +20 (kurzgesagt-library.json, minecraft-library.json, natgeo-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 8 · +20 (natgeo-library.json, picture-books-library.json, sports-library.json, stories-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 9 · +20 (stories-library.json, ted-library.json) · validator and tsc pass after correcting a test type to allow the schema's null duration for text records · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 10 · +20 (ted-library.json, teded-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 11 · +20 (teded-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 12 · +20 (teded-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 13 · +20 (teded-library.json, travel-english-library.json, voa-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 14 · +20 (voa-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 15 · +20 (voa-library.json, vox-library.json, world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 16 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 17 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 18 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 19 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 20 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 21 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 22 · +20 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- 2026-09-30 · metadata batch 23 · +6 (world-flight-library.json) · validator and tsc pass · needsReview added only where source text is too limited · committed on branch.

- Metadata closeout: all 446 records missing `cefr` or `ageBand` now have both fields. Existing metadata was preserved; uncertain cases were flagged where source text was insufficient.

## Task 2 — grammar videos

- Batch 1: +18 BBC Learning English 6 Minute Grammar clips; two candidates were rejected because the linked official pages had no extractable transcript. The retained entries use exact `grammar:*` tags and have prefetched `raw_transcript` rows verified in Supabase.
- BBC transcript extraction now reads the nested rich-text widget with JSDOM so nested markup does not truncate the transcript.

- Batch 2: +14 BBC Learning English grammar clips. Four candidates were dropped because the linked BBC pages returned no transcript; all 14 retained transcripts were prefetched and verified in Supabase.

- Batch 3: +18 captioned grammar videos: 14 BBC Learning English Grammar Gameshow clips and 4 British Council Grammar Snacks. All English transcripts were prefetched and verified in Supabase.
- VOA Everyday Grammar candidates were rejected because their YouTube videos have captions disabled; none were counted.

- Batch 4: +10 captioned grammar videos; all transcripts were prefetched and verified in Supabase. Six clips longer than six minutes are marked `needsReview` for class-pacing review.
- Grammar video closeout: 60 / 60 new clips have the exact grammar-point tags and verified transcripts.

## Task 3 — short hooks

- Batch 1: +20 captioned clips under 180 seconds from Nat Geo Kids, National Geographic, and NASA. Topics include animals, Earth science, space, and destinations; all 20 transcripts were prefetched and verified in Supabase.

- Batch 2: +20 captioned clips under 180 seconds from Nat Geo Kids and NASA, covering wildlife, simple experiments, animal communication, Earth observation, and space. All 20 transcripts were prefetched and verified in Supabase.

- Batch 3: +20 captioned clips under 180 seconds from National Geographic, BBC Earth, NASA, Nat Geo Kids, and the Smithsonian. Topics include landscapes, architecture, wildlife, conservation, space, and culture; all 20 transcripts were prefetched and verified in Supabase.
- Hook closeout: 60 / 60 new clips meet the under-180-second limit and carry the `hook` tag. One destination clip is marked `needsReview` for historical and political context.

## Task 4 — opinion and discussion texts

- Batch 1: +20 original LessonCaptain texts, each 150–400 words, tagged `CC BY 4.0`, leveled A2–B1, and written to present both sides of a classroom debate.
- The validator now accepts the brief’s `discussion` genre. The new grammar, hook, and debate shelves are connected to the Library UI, source recommender, extraction route, and transcript grounding.

- Batch 2: +20 original LessonCaptain debate texts. Topics include practical money skills, school schedules, media literacy, food, arts, public spaces, and community choices. All items pass the 150–400 word limit and carry original CC BY 4.0 attribution.
- Opinion/discussion closeout: 40 / 40 new texts are included in the Debate Texts library and source-grounding flow.
