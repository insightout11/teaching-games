# Library round 6 progress

Branch: `codex/library-round-6` from `origin/main` (`a4e3518a`). No pushes or merges.

## Tasks and counts

| Task | Result | Status |
|---|---:|---|
| Prices for all World Flight cities | 50 currencies, 150 dish prices/tiers, 150 generic stays across 3 tiers, and 150 transport tiers (149 local fare prices; one shuttle fare omitted because it varies/is often free) | Complete |
| Station/airport announcements | 50 destinations | Complete |
| Teen book courses | Added six B1/B2 teen courses and 24 reading lessons; 12 book courses/48 book lessons total with round 5 | Complete |

## Batch log

- 2026-10-02 · task 1 · added local currency, approximate dish/transport fares, and generic nightly hotel prices for 50 cities; one variable/free Addis Ababa shuttle has a tier but no price. World Flight tests passed (72 tests), library validator passed (1,223 items across 26 files), `npx tsc --noEmit -p .` passed, and `git diff --check` passed.
- 2026-10-02 · task 2 · added a five-field synthetic announcement packet for all 50 destinations, using named airport rail/metro services where available and local airport bus/shuttle services where not; platform and time are fictional. World Flight tests passed (72 tests), library validator passed (1,223 items across 26 files), `npx tsc --noEmit -p .` passed, and `git diff --check` passed.
- 2026-10-02 · task 3 · carried the three local Round 5 commits onto this branch per owner direction (`806748db`, `bb745450`, `083f9510`), then added 24 teen reading lessons across Treasure Island, The Time Machine, Frankenstein, The Call of the Wild, Around the World in Eighty Days, and The Secret Garden. Each has B1/B2 retellings, each 300–500 words; sources link to Project Gutenberg. Updated the validator for both Round 5 A2/B1 courses and Round 6 B1/B2 courses, while checking retelling age bands against their items. Library validation passed (1,271 items across 27 files), typecheck passed, World Flight tests passed (72 tests), and `git diff --check` passed.

## Price notes

All listed amounts are rounded planning estimates, not quotes; hotel amounts are per room-night and food amounts are per typical serving. Existing airport fare estimates were retained and normalized to local currency. General restaurant comparisons use [Numbeo's 2026 city price index](https://www.numbeo.com/cost-of-living/rankings.jsp); hotel ranges are broad estimates informed by [2025 city hotel-rate comparisons](https://cheaphotels.org/press/cities-world-2025.html). Exact prices vary by date, neighborhood, and provider.

Announcement examples and service names were checked against the existing city transport catalog and official operator references, including [Bangkok Airport Rail Link](https://www.btsgroup.co.th/en/document/viewer/stream/24926/annual-report-2016-17), [Mexico City Metro Line 5](https://metro.cdmx.gob.mx/la-red/linea-5), [Hong Kong Airport Express](https://www.mtr.com.hk/en/customer/services/aestations_hk.html), and [Perth Airport Line](https://www.transperth.wa.gov.au/using-transperth/station-facilities/stations-maps?sid=90). Platform labels and times are made-up prompts for synthetic listening, not timetable information.
