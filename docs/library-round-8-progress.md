# Library Round 8 Progress

Branch: `codex/library-round-8` (based on `origin/main`, `8e28907e`). No push or merge.

## Transcript check (Task 0)

Confirmed all 51 Round 7 transcripts in Supabase: 22 grammar items and 29 listening items. The removed “Greatest Invention Yet” record was excluded.

## Task 1 — Beginner listening

Added 15 A1 YouTube dialogue clips (all 30–120 seconds; at least 10 tagged for kids) and 10 A2 announcement clips from the Sinjhuang Elementary School public-address playlist. All 25 were fetched or verified through `scripts/prefetch-library-transcripts.ts` and have clean stored transcripts. The playlist has 13 videos, but three run longer than two minutes; after checking additional YouTube sources, only 10 qualifying short announcements were available. Five of the requested 15 announcement entries remain outstanding under the YouTube-only, 30–120-second, verified-transcript constraints. No duration or transcript was guessed.

Updated the library validator to apply the Round 8 30–120-second range to `listening-r8-*` entries while retaining Round 7’s existing range. `npx tsx scripts/validate-library.ts` passes with 1,347 items across 28 files. `npx tsc --noEmit -p .` passes.

## Task 2 — Attraction tiers and prices

Complete. Added optional `tier` and `price` fields and populated all 150 attractions across 50 cities. Tiers use broad absolute categories; displayed prices are generated local-currency estimates from the existing city price profiles, so treat them as approximate. `pnpm test src/lib/world-flight` passes (14 files, 79 tests); `npx tsc --noEmit -p .` passes.

## Task 3 — Absolute dish tiers

In progress. Replaced per-city rank tiers with absolute price bands normalized across currencies. Next: run World Flight checks, review all city/dish counts, and commit.
