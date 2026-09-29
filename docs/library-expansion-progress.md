# Library expansion progress

Baseline from Sep 30, 2026: **446 items** across 19 library files. Targets below are additions for this round.

| Category | Target additions | Current additions | Remaining |
|---|---:|---:|---:|
| VOA Learning English texts | 150 | 40 | 110 |
| StoryWeaver texts (levels 1–4) | 120 | 0 | 120 |
| African Storybook texts | 40 | 0 | 40 |
| Public-domain myths, legends, and fables | 60 | 0 | 60 |
| Kids videos (A1–A2, 3–6 minutes) | 80 | 0 | 80 |
| Teen-interest videos (A2–B2, 3–10 minutes) | 100 | 0 | 100 |
| Place metadata coverage | Every place-related item | 15 new VOA records checked | Audit legacy libraries and continue with new batches |
| Picture books | Included in text targets | 0 | Counted above |

## Batch log

2026-09-30 · batch 1 · +20 (voa-level1-dialogues 20) · 0 needsReview · totals 466 (voa 52)
2026-09-30 · batch 2 · +20 (voa-level2-dialogues 20) · 2 needsReview · totals 486 (voa 72)

Baseline includes world-flight 150, teded 50, bbc 46, voa 32, stories 24, ted 20, kids 20, natgeo 15, crash-course 14, kurzgesagt 13, bbc-ideas 10, bigthink 10, business-english 10, vox 9, picture-books 8, travel-english 6, internet-memes 4, minecraft 4, and sports 1.

## Notes

- The validator applies the expanded schema to records carrying any new-schema marker (`kind`, `cefr`, `ageBand`, or `license`) while checking IDs and URL uniqueness across all legacy and expanded records. Existing legacy records have not yet been migrated.
- Batch 1 screened Level 1 lesson candidates and added lessons 20–29 and 32–41. Held candidates include song-centered material and later lessons reserved for a varied topical mix. The selected source lessons are VOA beginner course dialogues; CEFR is A1 for lessons 20–29 and A2 for lessons 32–41.
- Batch 2 screened all 30 Level 2 lessons and added lessons 1–3, 5–16, 19–22, and 30. Twenty new Level 2 readings are assigned B1/teens. Ten candidates were held, including “Rock Star”: its transcript contains third-party song lyrics, so it was excluded. Two selected entries are marked `needsReview` for a child-safety pass.
- Place metadata was reviewed on the 40 new VOA entries; 15 mention a specific location and have coordinates. Legacy libraries still need the broader place audit.
- The AI tag enricher could not start because this worktree has no installed `@google/generative-ai` dependency. No software was installed. The batch has manually curated six-topic tags and dialogue genres; rerun the existing enrichment scripts after the dependency is available.
- No batch is counted until its content, license/attribution, safety/level fields, and (for videos) transcript prefetch have been checked.
