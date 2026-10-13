# Library Round 37 — progress and report

Branch: `codex/library-round-37`, based on `origin/main`. No push or merge.

## Method

Read all 150 World Flight caption cache rows from Supabase on 13 October 2026. No YouTube captions were fetched and no cache rows were changed. The cache snapshot and authoring helpers are outside the repository. Questions are written from timed English caption windows; key lines are copied from the cache. Existing library metadata is preserved.

New A2 packs fit within a 90-second padded window; other new packs fit within 180 seconds. Detail answer positions rotate through 0, 1 and 2. Gist and inference questions concern the material heard in that window, rather than unseen parts of the source.

## Progress

- Batch 1: 19 new packs across Bangkok, Tokyo, Seoul, Singapore, Paris, London, New York, Cairo, Dubai, Sydney and Beijing.
- Repaired overlapping detail segments in five existing packs, preserving their Static and Black Box fields.
- Narrow check: all six listening-pack tests pass; 36 World Flight packs checked.
- Owner approved commits of the three listed files throughout this round.
- Extended `src/lib/listening-pack.test.ts` to check World Flight pack structure, question counts, segment length, overlap, window cap and answer positions.

## Files touched

- `src/data/world-flight-library.json` — only `listeningPack` fields.
- `src/lib/listening-pack.test.ts` — data checks.
- `docs/library-round-37-progress.md` — this report, including proposed course entries when researched.

Final city counts, skipped videos, checks and proposed course entries will be recorded below.

- Batch 2: 22 new packs across Shanghai, Berlin, Moscow, Istanbul, Vancouver, Toronto, Mumbai, Cape Town, Rome, Rio de Janeiro, Mexico City and Buenos Aires. Narrow check: 58 packs checked; all six tests pass.

- Batch 3: 20 new packs from Los Angeles through Suva, including the remaining practical transit and nature choices. Narrow check: 78 packs checked; all six tests pass.
