# Library round 4 progress

Branch: `codex/library-round-4` from `origin/main` (`1f3a794a`). No pushes or merges.

## Targets and current totals

| Task | Target | Completed |
|---|---:|---:|
| Flight Question videos, 3–8 min, verified transcripts | 40 | 40 |
| Ordered course series | 10 × 4–6 items | 10 series × 5 items |
| Non-BBC listening sources, 2–8 min, verified transcripts | 30 | 30 |
| Review queue | 299 initial | 6 cleared; 293 retained with review notes |

## Batch log

- 2026-10-01 · task 1 batch 1 · +40 Flight Question videos: 10 A2/kids and 30 B1/B2/teens. All 40 existing raw transcripts were verified by `scripts/prefetch-library-transcripts.ts`. The validator enforces 180–480 seconds for Flight Question videos.
- 2026-10-01 · task 2 · +10 ordered course series × 5 items (50 memberships), each single-age-band and within one CEFR step. The validator checks 4–6 members, shared title and ageBand, unique positive order, and CEFR span.
- 2026-10-01 · task 3 batch 1 · +30 non-BBC, 2–8-minute spoken sources: 27 World Flight features, one LinguaTV hotel dialogue, one British Council competency-interview dialogue, and one TED-Ed musician interview montage. The local transcript prefetch script reported all 30 as `VERIFIED`; no failures.
- 2026-10-01 · task 4 triage batch 1 · cleared six records after checking in-catalog source text and matching grammar tags; repaired mojibake and recalculated word counts for five VOA text records. 293 remain flagged: BBC 21, destination readings 37, grammar 2, hooks 1, kids 3, African Storybook 40, public domain 60, StoryWeaver 120, TED-Ed 4, VOA 4, Vox 1. These remaining notes require off-catalog video/context screening, external current-fact checks, or educator review of reading level/cultural context. No records were deleted.

## Series

1. Earth and Weather for Young Learners
2. How Engineers Solve Problems
3. Animals and Their Habitats
4. Space for Beginners
5. Everyday Science: Materials and Measurement
6. Space and Exploration
7. Technology, Games and Human Choices
8. Food, Health and the Environment
9. Music, Learning and Performance
10. Animals in a Changing World

## Review queue disposition

Cleared five grammar clips whose existing title, summary, description, and exact grammar tag agreed, plus the complete VOA text “Tip Your Tour Guide” after screening its in-catalog dialogue. Fixed encoding damage in the five flagged VOA text records without clearing the other four flags, which cover potentially sensitive health or relationship material. Other remaining items retain their existing `needsReview` flags and notes until the specified review evidence is available.
