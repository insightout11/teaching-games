# Library expansion progress

Baseline from Sep 30, 2026: **446 items** across 19 library files. Targets below are additions for this round.

| Category | Target additions | Current additions | Remaining |
|---|---:|---:|---:|
| VOA Learning English texts | 150 | 90 | 60 |
| StoryWeaver texts (levels 1–4) | 120 | 50 | 70 |
| African Storybook texts | 40 | 0 | 40 |
| Public-domain myths, legends, and fables | 60 | 0 | 60 |
| Kids videos (A1–A2, 3–6 minutes) | 80 | 20 | 60 |
| Teen-interest videos (A2–B2, 3–10 minutes) | 100 | 20 | 80 |
| Place metadata coverage | Every place-related item | 38 new records tagged across VOA, StoryWeaver, and teen videos | Audit legacy libraries and continue with new batches |
| Picture books | Included in text targets | 0 | Counted above |

## Batch log

2026-09-30 · batch 1 · +20 (voa-level1-dialogues 20) · 0 needsReview · totals 466 (voa 52)
2026-09-30 · batch 2 · +20 (voa-level2-dialogues 20) · 2 needsReview · totals 486 (voa 72)
2026-09-30 · batch 3 · +20 (storyweaver-picture-books 20) · 20 needsReview · totals 506 (storyweaver 20)
2026-09-30 · batch 4 · +20 (voa-level1 18, voa-level2 2) · 1 needsReview · totals 526 (voa additions 60)
2026-09-30 · batch 5 · +20 (storyweaver-picture-books 20) · 20 needsReview · totals 546 (storyweaver 40)
2026-09-30 · batch 6 · +20 (teen-interest videos: BBC Learning English 6, TED-Ed 14) · 1 needsReview · totals 566 (teen videos 20)
2026-09-30 · batch 7 · +20 (VOA Level 1 dialogues 10, StoryWeaver picture books 10) · 10 needsReview · totals 586 (VOA additions 70, StoryWeaver 50)
2026-09-30 · batch 8 · +20 (VOA Learning English original articles 20) · 0 needsReview · totals 606 (VOA additions 90)
2026-09-30 · batch 9 · +20 (kids videos: Crash Course Kids 20) · 0 needsReview · totals 626 (kids videos 20)

Baseline includes world-flight 150, teded 50, bbc 46, voa 32, stories 24, ted 20, kids 20, natgeo 15, crash-course 14, kurzgesagt 13, bbc-ideas 10, bigthink 10, business-english 10, vox 9, picture-books 8, travel-english 6, internet-memes 4, minecraft 4, and sports 1.

## Notes

- The validator applies the expanded schema to records carrying any new-schema marker (`kind`, `cefr`, `ageBand`, or `license`) while checking IDs and URL uniqueness across all legacy and expanded records. Existing legacy records have not yet been migrated.
- Batch 1 screened Level 1 lesson candidates and added lessons 20–29 and 32–41. Held candidates include song-centered material and later lessons reserved for a varied topical mix. The selected source lessons are VOA beginner course dialogues; CEFR is A1 for lessons 20–29 and A2 for lessons 32–41.
- Batch 2 screened all 30 Level 2 lessons and added lessons 1–3, 5–16, 19–22, and 30. Twenty new Level 2 readings are assigned B1/teens. Ten candidates were held, including “Rock Star”: its transcript contains third-party song lyrics, so it was excluded. Two selected entries are marked `needsReview` for a child-safety pass.
- Place metadata was reviewed on the 40 new VOA entries; 15 mention a specific location and have coordinates. Legacy libraries still need the broader place audit.
- Batch 3 screened 30 English StoryWeaver candidates from the English Pratham Books source archive; 20 were selected at official StoryWeaver reading levels 2–3, and 10 were held for a later level mix, additional safety screening, or contributor-credit review. The 20 entries carry complete text, cover image, exact CC BY 4.0 source links, and writer/illustrator/translator/publisher attribution. The archive did not list donor/funder credits, so all 20 are marked `needsReview` for owner confirmation. Six stories with explicit India/Srinagar/Delhi settings received place coordinates; all 20 were checked for place references.
- StoryWeaver reading levels do not map directly to CEFR; the importer assigns a conservative working CEFR estimate from the official level, and all entries remain flagged for review. The source archive's plain-text extraction needed minor spacing cleanup; the original story wording is retained.
- Batch 4 screened the remaining Level 1 course lessons plus 10 Level 2 candidates. Eighteen eligible Level 1 dialogues and Level 2 “Flour Baby” parts 1–2 were selected. Short lessons below 150 words, songs with third-party lyrics, a circus lesson needing animal-safety review, and pages without an extractable dialogue were held. “Flour Baby, Part 2” remains flagged for a safety review because its humor involves a flour-bag “baby” getting cut and burned.
- Batch 5 screened 30 licensed StoryWeaver text candidates, selected 20 with exact English catalog matches and official reading levels, and held 10: eight without a verified catalog record plus “The Brave Girl” (war separation) and “Life’s Lighter Moments” (a hand-trapping incident) for content review. Selected stories span reading levels 1–4. Two explicitly India-set stories received map pins; all 20 were checked for locations and contributor credits. Donor/funder data was absent from the source archive, so all 20 remain marked `needsReview`.
- Batch 6 screened 30 BBC Learning English and TED-Ed video candidates; all selected videos are 3–6 minutes and have English captions. Fourteen TED-Ed and six BBC Learning English videos were selected across gaming, music, food, climate, space, wildlife, social media, creativity, and careers. Ten candidates were held: two were already in the catalog, and eight were rejected for AI/crime, addiction, sexism in gaming, insufficient topic value, or sensational framing. Phase A locally prefetched 20 transcripts and verified every corresponding Supabase `raw_transcript` row; paid AI enrichment was not run. The African-American social dance lesson received a US map pin. “Social media and teenage health” is flagged for review because it discusses depression, anxiety, and cyberbullying.
- Batch 7 selected 10 eligible VOA Level 1 dialogues (lessons 42–44 and 46–52) and 10 English StoryWeaver picture books. The VOA lesson index was screened through its last available lessons; lesson 45 was held because it is song-centered, and Level 2 lessons 4/23 onward either raised animal-safety/song lyric concerns or lacked an extractable dialogue. StoryWeaver candidates were screened for CC BY/public-domain status, exact English catalog matches, word count, cover art, and classroom suitability; short works below 150 words were excluded. All ten StoryWeaver additions remain `needsReview` because the source archive omits donor/funder credits and CEFR must be reviewed. Three additions have explicit place metadata (Washington, D.C. in two VOA dialogues; India in “Susheela’s Kolams”).
- Batch 8 screened more than 30 VOA Learning English candidates and selected 20 original Everyday Grammar and Words and Their Stories lessons at 150–900 words. Candidates that exceeded the limit, included third-party song lyrics, or contained sensitive material were held. Selected texts cover grammar, speaking, writing, and common American expressions. VOA's usage page confirms Learning English texts are public domain, with third-party material excluded. The batch adds no place pins because its lesson topics are general rather than destination-tied.
- Batch 9 screened 30 Crash Course Kids candidates across Earth, engineering, life, physical, and space science. Twenty non-duplicate videos were selected (3:03–5:17); three were already in the library and seven were held for later topical balancing. The channel identifies its audience as grades 3–5, and every selected item appears in the channel's captioned catalog and passed the local English-caption check. Phase A prefetched all 20 transcripts into Supabase and verified every `raw_transcript` row; paid Phase B was skipped. The videos teach general science concepts and were not given destination pins.
- The existing AI tag enricher could not start because this worktree has no installed `@google/generative-ai` dependency. No software was installed. Batch 3 has source/title-curated StoryWeaver topic tags and narratives; batch 4 has manually curated six-topic tags and dialogue genres. Rerun the existing enrichment scripts after the dependency is available.
- No batch is counted until its content, license/attribution, safety/level fields, and (for videos) transcript prefetch have been checked.
