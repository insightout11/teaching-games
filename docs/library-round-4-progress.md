# Library round 4 progress

Branch: `codex/library-round-4` from `origin/main` (`1f3a794a`).

## Targets and current totals

| Task | Target | Current |
|---|---:|---:|
| Flight Question videos with verified transcripts | 40 | 40 |
| Ordered course series | 10 × 4–6 items | 0 |
| Non-BBC listening sources with verified transcripts | 30 | 0 |
| `needsReview` queue | 299 initial | 0 cleared (triage pending) |

## Batches

- 2026-10-01 · task 1 batch 1 · +40 Flight Question videos (10 A2/kids, 30 B1/B2/teens) · all 40 pre-existing raw transcripts verified by `scripts/prefetch-library-transcripts.ts` · validator now enforces 180–480 seconds for Flight Question videos.

## Course series

Pending.

## Listening sources

Pending. Non-BBC candidates must match their actual format and have timestamped transcripts verified via the local prefetch script.

## Review queue

Pending; flagged records will remain flagged with their review notes unless their own metadata or content supports a correction.
- 2026-10-01 · task 2 · +10 ordered course series × 5 items (50 memberships), all internally level-consistent and single-age-band; validator now enforces 4–6 members, shared title/ageBand, unique positive order, and CEFR span of at most one step.

Series: Earth and Weather for Young Learners; How Engineers Solve Problems; Animals and Their Habitats; Space for Beginners; Everyday Science: Materials and Measurement; Space and Exploration; Technology, Games and Human Choices; Food, Health and the Environment; Music, Learning and Performance; Animals in a Changing World.
- 2026-10-01 · task 3 batch 1 · +30 non-BBC, 2–8-minute spoken sources (27 World Flight features, 1 LinguaTV hotel dialogue, 1 British Council competency-interview dialogue, 1 TED-Ed musician interview montage) · all 30 reported `VERIFIED` by the local transcript prefetch script; no transcript failures.
