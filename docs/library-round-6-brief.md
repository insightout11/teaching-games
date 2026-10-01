# Library round 6 brief (for Codex)

_Written Oct 2 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–5)._

## Why

Travel v2 (`docs/travel-v2-concept.md`) gives every student a **Traveller Card** with a budget tier
(`$` tight · `$$` comfortable · `$$$` big; see `src/lib/world-flight/traveller-cards.ts`). Choices on the trip
(transport, food, a hotel) should cost something, but the city data has **no prices**: transport has only free-text
`approxCost`, and dishes have none. Travel also gains a **listening break**: a station/airport announcement per city.
Reading courses from books (round 5) are popular, so the book shelf grows too.

## Tasks, in this order

### 1. Price tiers + local prices for all 50 World Flight cities
Data lives in `src/data/world-flight/destinations.ts` (types in `src/lib/world-flight/types.ts`).
- Add **optional** fields only, so nothing existing breaks:
  - `currency?: { code: string; symbol: string; name: string }` on the destination (e.g. `JPY`, `¥`, `yen`);
  - `tier?: '$' | '$$' | '$$$'` and `price?: string` on each `TravelTransportOption` (`price` is a short local
    amount, e.g. `"¥3,200"`; cheapest mode = `$`, taxi/private = `$$$`);
  - `tier?` and `price?` on each `TravelDish` (street food `$`, restaurant main `$$`, fine dining `$$$`).
- Also add `hotels?: Array<{ name: string; tier: '$' | '$$' | '$$$'; price: string; note?: string }>`: three
  **generic** stays per city (one per tier, e.g. "Hostel near the station", "Business hotel", "Riverside luxury hotel").
  No real hotel brand names.
- Prices are approximate, rounded, typical for 2025–2026, and clearly "about". If you can't source a figure sensibly,
  leave `price` out and still set `tier`.

### 2. Announcement facts for all 50 cities
Add optional `announcement?: { place: string; line: string; destination: string; platform: string; time: string }`
to each destination: one realistic, **plausible** airport-train or metro announcement (e.g. place "Narita Airport
Terminal 1 station", line "Narita Express", destination "Shinjuku", platform "2", time "10:45"). Real line and
station names where they exist; platform and time can be invented. This feeds a synthetic-voice listening break, so keep
names pronounceable and short.

### 3. Six more book courses (teens, B1–B2)
Same shape as round 5 (`src/data/book-library.json`, 4–6 lessons per book, A2/B1 → **B1/B2** retellings of 300–500 words
in your own words, `flightQuestion`, public-domain source link, `series`). Suggested: *Treasure Island*,
*The Time Machine*, *Frankenstein* (teen-safe retelling), *The Call of the Wild*, *Around the World in Eighty Days*,
*The Secret Garden*. `ageBand: "teens"`.

## Rules
- Branch `codex/library-round-6` off `origin/main`. One commit per task. Don't push or merge; report back with counts.
- Tasks 1–2 touch only `destinations.ts` and `types.ts` (optional fields). Run the existing world-flight tests
  (`pnpm test src/lib/world-flight`) plus `scripts/validate-library.ts` and `tsc` (ES5: no `/u` regex, no direct
  Set/Map iteration).
- Progress log: `docs/library-round-6-progress.md`.
- Only touch `src/data/`, `src/lib/world-flight/types.ts`, library scripts in `scripts/`, and `docs/`.
