# Library round 3 progress

Branch: `codex/library-round-3`, created from `origin/main` at `5868779bfdf6ffeae277a3cd076fdf741e81bd98`.

| Task | Target | Baseline | Current |
|---|---:|---:|---:|
| Grammar clips | +40 | 28 in `grammar-library.json` | +40 / 40; 68 total clips |
| Listening sources | +40 | 0 marked as round-three listening sources | 40 / 40 marked; all raw transcripts verified |
| Flight Question sources | +30 | 0 with `flightQuestion` | 30 / 30 qualified discussion texts |
| Needs-review queue | 298 flagged | 298 | 299 triaged with notes; 0 cleared |

## Batch log

- 2026-10-01 · start · `origin/main` baseline: 1,193 library items, 28 grammar clips, 298 items flagged `needsReview`. Baseline `npx tsx scripts/validate-library.ts` and `npx tsc --noEmit -p .` passed.
- 2026-10-01 · grammar batch 1 · +33 clips moved into the Grammar Spotlight shelf from the BBC catalogue, retaining their unique URLs and BBC transcript identity; each received exact round-three grammar tags. Existing 28 clips were taxonomy-checked; unsupported “Some and Any” and “Phrasal Verbs” clips remain flagged with notes. Prefetch script phase A skipped and verified all 33 existing `bbc` raw transcript rows. Seven prospective new BBC grammar clips were rejected because captions were disabled; they were removed from the data.
- 2026-10-01 · grammar batch 2 · brought the shelf to 68 clips (+40 from baseline): retained 10 migrated BBC clips at or under 6 minutes, added 30 distinct 2–6 minute videos, and restored 23 over-six-minute migrated clips to the BBC shelf. Phase A fetched and verified timestamped English transcripts for all 30 distinct additions; segment counts ranged from 23 to 117. The seven disabled-caption candidates remain excluded. Every exact taxonomy tag now has at least two clips.
- 2026-10-01 · listening batch 1 · 40 existing BBC Learning English items (2–8 minutes) received `listening:podcast` or `listening:dialogue` tags. Phase A skipped and verified all 40 existing `bbc` raw transcript rows in Supabase. No runtime transcript fetching was added.
- 2026-10-01 · Flight Question batch 1 · added 30 short, debatable `flightQuestion` fields to existing original LessonCaptain opinion texts in `discussion-library.json`; all questions are at most 12 words and the records use `genre: opinion`.
- 2026-10-01 · needs-review triage · added a concise unresolved-review note to every flagged item that lacked one (297 notes added); preserved all original 298 `needsReview: true` flags and added one new flag for the untaggable “Phrasal Verbs” clip. All 299 flagged items have notes; none were deleted or cleared.

## Notes and outstanding work

- The seven failed grammar candidates were `vyvGJrB7WNM`, `L-wTVCByxzk`, `1iC_rULeuZc`, `ppyws3GdZ2E`, `ZXN3wROCpfs`, `CzoxIVPtPgI`, and `TWw8We_ElLo`; YouTube reported transcripts disabled for all seven. They are not in the library.
- Grammar additions preserve `transcriptSourceType: "bbc"` for migrated BBC catalogue entries so the local prefetch script verifies their existing rows under the original source identity. This field is for the prefetch script only; transcript fetching remains local.
- The 10 migrated BBC grammar items use `transcriptSourceType: "bbc"` for verification; the 30 newly curated grammar videos use the local YouTube transcript pipeline and have timestamped English segments in Supabase.
- Flight Question and listening counts describe newly qualified catalogue records, not newly copied media. Video URLs remain embeds; no media or transcript text was copied into the repository.
- Queue triage added notes rather than clearing flags when the available summary, description, and tags did not settle the remaining review concern. No flagged item was deleted.
- Allowed edit scope is limited to `src/data/`, library scripts under `scripts/`, and `docs/`.
