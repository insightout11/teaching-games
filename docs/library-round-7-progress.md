# Library round 7 progress

Branch: `codex/library-round-7`, based on `codex/library-round-6` because Round 5–6 are not yet in `origin/main`. The Round 7 brief was cherry-picked from `origin/main`. No pushes or merges.

## Tasks

| Task | Target | Status |
|---|---:|---|
| Grammar clips | Every used `grammar:*` tag: 5+ clips, including 2+ kids at A1–A2 | Complete; 21 new clips |
| Short listening clips | 30 total: 10 A1–A2, 12 B1, 8 B2; at least 10 kids; 1–3 min; clean local transcripts | Complete; 30 clips |
| Local phrases | 4 phrases × 50 cities = 200 | Pending |

## Batch log

- 2026-10-02 · baseline audit · grammar library has 68 clips across 17 exact grammar tags; 17 tags currently miss the 5-clip and/or two-kids threshold. Starting counts are being retained in the task notes while additions are verified.
- 2026-10-02 · task 1 · added 21 grammar clips; all 17 points now have at least 5 clips and at least 2 A1–A2 kids clips. The local transcript prefetcher fetched and verified every kept Round 7 clip. Two candidates with disabled transcripts and one throttled/disabled candidate were removed before the batch was finalized. Validator passed.
- 2026-10-02 · task 2 · added 30 short dialogue clips: 10 A2 (all kids-suitable), 12 B1, and 8 B2; runtimes are 1:08–2:58. The local prefetch pipeline fetched and verified English captions for all 30. Transcript review found substantial English dialogue and only brief music cues; three dramatic/satirical clips carry needsReview notes. Library validator passed.

### Grammar coverage after task 1

CEFR counts are total clips by level; Kids is the A1–A2 kids subset.

| Tag | Total | A1 | A2 | B1 | B2 | C1 | Kids |
|---|---:|---:|---:|---:|---:|---:|---:|
| grammar:prepositions | 5 | 0 | 4 | 1 | 0 | 0 | 2 |
| grammar:conditionals | 5 | 0 | 2 | 3 | 0 | 0 | 2 |
| grammar:future-will | 5 | 0 | 5 | 0 | 0 | 0 | 3 |
| grammar:present-perfect | 8 | 0 | 2 | 6 | 0 | 0 | 2 |
| grammar:questions | 5 | 0 | 3 | 2 | 0 | 0 | 2 |
| grammar:past-simple | 7 | 1 | 4 | 1 | 1 | 0 | 3 |
| grammar:modals | 7 | 0 | 5 | 2 | 0 | 0 | 3 |
| grammar:present-simple | 6 | 1 | 5 | 0 | 0 | 0 | 2 |
| grammar:present-continuous | 5 | 1 | 4 | 0 | 0 | 0 | 3 |
| grammar:comparatives-superlatives | 5 | 0 | 5 | 0 | 0 | 0 | 3 |
| grammar:future-going-to | 5 | 0 | 5 | 0 | 0 | 0 | 2 |
| grammar:past-continuous | 5 | 0 | 5 | 0 | 0 | 0 | 4 |
| grammar:passive | 5 | 0 | 2 | 3 | 0 | 0 | 2 |
| grammar:articles | 5 | 0 | 4 | 1 | 0 | 0 | 2 |
| grammar:past-perfect | 5 | 0 | 2 | 3 | 0 | 0 | 2 |
| grammar:reported-speech | 5 | 0 | 3 | 2 | 0 | 0 | 3 |
| grammar:relative-clauses | 5 | 0 | 3 | 2 | 0 | 0 | 3 |
