# Accuracy check report

- Scope: fact-check existing teaching content, fix only confirmed clear errors, keep wording style.
- Base: `muse/accuracy-check` at `8f2c5cb9` (base commit message: "Route fact cards use Codex's exact checked Commons photos (916 cards, 795 photos, all verified to exist)…").
- Result: **zero factual errors found in Parts 1–2; 2 photo swaps in Part 3; commit `b4220366` "Accuracy 3: replace two mismatched Commons photos"** (Parts 1 and 2 made no changes, so no commits were created for them).

## Part 1 — World Quiz answer keys (`src/data/world-quiz/`)

Checked all 8 data files end to end:

- capitals, landmarks, food, animals, which-is-bigger, hello, country-facts, football flags.

Findings:

- country-facts: 131 population/area figures all match World Bank/official 2024 (pop) and 2023 (area) values exactly — no errors.
- football flags: all 32 flags match FIFA 2026 host/emblem expectations — no errors.
- pin-drop: ~57 cities and 21 landmarks — all coordinates match location — no errors.
- capitals/landmarks/food/animals/which-is-bigger/hello: no errors.
- Verdict: **no changes, no commit.**

## Part 2 — Route fact cards text (`src/data/route-place-briefings.json` from `scripts/dev/data/route-place-editorial.tsv`)

Read the full editorial digest (300 places, 1,500 card rows) and verified names, numbers, dates and claims. No factual errors found.

Two flagged claims were web-verified against primary/authoritative sources and are **correct as written**:

1. Dubai card: Palm Monorail → opened 30 April 2009 (Wikipedia, n:monorail).
2. Mongolia card: Burkhan Khaldun → UNESCO inscribed in 2015 (UNESCO World Heritage list id 1440, decision 39 COM 8B.15, 4 July 2015). A much-repeated side belief of a 2016 inscription is wrong; the TSV is right.

Editorial-only notes (not fixed — grammar/style, not factual errors):

- Four A1 headlines say "an large" where B1 correctly reads "extensive" (likely a find/replace artifact):
  - `route-place-editorial.tsv:51` — "Africa has an large rift system"
  - `route-place-editorial.tsv:421` — "Paris has an large underground railway"
  - `route-place-editorial.tsv:600` — "Hong Kong has an large rail network"
  - `route-place-editorial.tsv:711` — "New York has an large subway system"
- Verdict: **no factual changes, no commit** (part 2 build unchanged; the artifact `src/data/route-place-briefings.json` was later rebuilt byte-consistently during Part 3).

## Part 3 — Route place photos (Wikimedia Commons)

Method:

- Extracted all pictureFile references: 916 non-empty references → **795 unique files**.
- Existence check: batch Commons API queries (`action=query&titles=File:…`, 50 per batch, retry with backoff on 429/503) — **missing = 0; every referenced file exists on Commons**.
- Subject check: spot-verified flagged and odd-titled files against Commons descriptions:
  - `File:"Eine beeindruckende Festung". 09.jpg` → "The Kasbah of the Udayas in Rabat" — correct for Morocco/Rabat.
  - `File:5628442718 b10fc2c47f o.jpg` → aerial view of the Republican Palace, Baghdad — correct for Iraq.
  - `File:Ville de Conaky.jpg` → Conakry for Guinea; `File:Libreville frond de mer.jpg` → Libreville seafront; `File:C'est Lomé.jpg` → Lomé — correct.
- Note on reuse: files repeat across places (12 dromedary cards share one photo, 8 cards reuse one kodiak-bear photo, etc.). This is by design: 916 cards reuse 795 verified photos and 16 cards carry recorded omission reasons, per the base commit's own statement and the `route-place-briefings.test.ts` ledger checks.

### Fixes (commit `b4220366`)

1. **Australia card 5 — Great Barrier Reef image showed a different reef.**
   - Was: `File:Belize Barrier Reef from space.png` (NASA photo of the Belize barrier reef; the matched picture-search line is "Great Barrier Reef coral fish").
   - Now: `File:Great Barrier Reef 011 (5441015088).jpg` — "Small blue fish swim among the coral of the Great Barrier Reef, Australia", CC BY 2.0, author Steve Evans. Subject-exact replacement; licence column updated to CC BY 2.0.
2. **Saudi Arabia card 3 — Kabsa card showed the wrong dish.**
   - Was: `File:Machboos (cropped).JPG` (machboos is a similar Gulf rice dish but is not kabsa; the matched line is "Kabsa Saudi Arabia").
   - Now: `File:Kabsa 1.JPG` — "Kabsa is a National Dish of Saudi Arabia", CC0, author Miansari66. Licence column unchanged (CC0).

Files touched by the commit (TSV row for Australia card 5 / Saudi card 3, rebuilt `src/data/route-place-briefings.json`, and the photo ledger `scripts/dev/data/route-place-photo-sources.json`):

- The ledger is validated by `route-place-briefings.test.ts` ("keeps a Commons source and matching licence for every selected photograph"), so the two entries were swapped there too with `reviewed: 2026-10-21` and the existing standard reviewNote string. Re-run of that test file passes 790/790.

### Pre-existing test failures (not caused by this work)

- `pnpm exec vitest run` baseline at `8f2c5cb9` and after the fix is identical: **2 failed files / 6 failed tests**:
  - `src/__tests__/sources/source-extractor.test.ts` — suite-level failure from the missing `@mozilla/readability` dependency (also the single allowed `npx tsc --noEmit -p .` error, `TS2307` in `src/lib/sources/extractor.ts`).
  - `src/__tests__/api/route-place-cards.test.ts` — 6 failures: the test's `publicCards` projection strips `pictureFile` while served cards include it. Upstream fix exists in commit `d25c7e97` on `claude/lesson-captain-strategy-f5b782` (updates the projection to include `pictureFile`). Not merged here and not cherry-picked, per task rules — flag it for follow-up.
- One intermediate full run had **7 failed tests**; that extra failure (`route-place-briefings.test.ts` ledger lookup) was caused by my two photo changes and is resolved by the ledger update in the same commit.

## Checks run

- `pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts` → "Built 300 places from explicit, validated cards; no prose/photo/question defaults." Rebuild diff touches only the two intended card blocks (Saudi row appears twice because A1 and B1 share the row's photo).
- `npx tsc --noEmit -p .` → only the pre-existing allowed `extractor.ts` TS2307 error.
- `pnpm exec vitest run` → same 2-file/6-test pre-existing baseline; briefings suite green (790 passed).
- `git status` clean after commit; nothing staged or untracked.

## Commit summary

- `b4220366` Accuracy 3: replace two mismatched Commons photos — 3 files, +15/−15
  - `scripts/dev/data/route-place-editorial.tsv`
  - `scripts/dev/data/route-place-photo-sources.json`
  - `src/data/route-place-briefings.json`
- Parts 1 and 2: no errors found → no commits (documented above).
