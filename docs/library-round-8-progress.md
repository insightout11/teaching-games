# Library Round 8 Progress

Branch: `codex/library-round-8` (based on `origin/main`, `8e28907e`). No push or merge.

## Transcript check (Task 0)

Confirmed all 51 Round 7 transcripts in Supabase: 22 grammar items and 29 listening items. The removed “Greatest Invention Yet” record was excluded.

## Task 1 — Beginner listening

Added 15 A1 YouTube dialogue clips (30–120 seconds; 14 tagged for kids) and 15 A2–B1 YouTube announcement clips (30–120 seconds). One additional A2 announcement-related dialogue is included as `listening:dialogue`, not counted toward the announcement total. All 31 Round 8 entries have locally fetched or verified transcripts in Supabase. Items with time-sensitive forecast details, an undated event date, or gender-specific uniform guidance have `needsReview` notes. The validator now checks the Round 8 minimum counts, age band, transcript flag, and duration range.

`npx tsx scripts/validate-library.ts` passes with 1,353 items across 28 files. `npx tsc --noEmit -p .` passes.

## Task 2 — Attraction tiers and prices

Complete. Added optional `tier` and `price` fields and populated all 150 attractions across 50 cities. Tiers use broad absolute categories; displayed prices are generated local-currency estimates from the existing city price profiles, so treat them as approximate. `pnpm test src/lib/world-flight` passes (14 files, 79 tests); `npx tsc --noEmit -p .` passes.

## Task 3 — Absolute dish tiers

Complete. Re-tiered all 150 dishes in 50 cities by absolute approximate USD value using rounded local-currency conversion: `$` at up to about US$10, `$$` above US$10 through US$40, and `$$$` above US$40. Result: 107 `$`, 40 `$$`, 3 `$$$`; no dishes are missing a price or tier. `pnpm test src/lib/world-flight` passes (14 files, 79 tests); `npx tsc --noEmit -p .` and `npx tsx scripts/validate-library.ts` pass.
