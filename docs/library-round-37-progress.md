# Library Round 37 — city listening packs and proposed course videos

Completed 13 October 2026. Branch: `codex/library-round-37`, based on `origin/main`. No push or merge.

## Results

- **83 new listening packs**, taking World Flight from 17 to **100 packs across 150 videos**.
- **50/50 cities covered; 0 cities without a pack.** 48 cities have two packs, Singapore has three, and Dakar has one.
- New packs by level: **A2 37, B1 41, B2 5**. All packs by level: **A2 37, B1 49, B2 14**.
- Repaired overlapping detail segments in **five existing packs**: Dubai Airport, Lagos transit, Hong Kong transport, Lima strike and Transperth. Their Static and Black Box fields are preserved.
- **0 structural failures, 0 caption/key-line evidence failures, 0 words absent from the heard window, 0 duplicate new detail questions, 0 duplicate new gist questions.**
- Two proposed course entries will be recorded in a report-only follow-up. Neither will be added to a library; caption verification limits will be explicit.

## Method and scope

Read the brief, ListeningPack schema, existing packs and tests. Read all 150 existing World Flight cache rows from Supabase, using the main checkout’s existing environment file in memory. No credentials were copied or printed. No YouTube caption request, AI call, package installation or cache write was made. The cache snapshot and temporary authoring/evidence helpers are outside the repo.

Each new pack was written from a selected timed caption window. Questions, distractors, gist, inference and vocabulary were authored for that content. Exact key lines use the caption words inside their segment; transcription errors are not silently repaired in quotes. Where the answer needs adjoining lines, the quote includes them. Every new pack has three non-overlapping segments, three gist questions, one inference question and four or five vocabulary words, with spoken timestamps. Detail answer positions use 0, 1 and 2. Gist questions concern the stretch actually heard, not an unseen part of the full source.

New A2 packs fit the padded 90-second window, and other new packs fit the padded 180-second window. Some clips contain other languages, music or uncertain proper-name spellings; questions use understandable English passages rather than the garbled parts. The report does not certify the entire video or silently infer what an unintelligible interview says.

Only `listeningPack` fields changed in library entries. Compared all 150 entries with the base: IDs, order, titles, YouTube IDs, URLs, durations and every other field are unchanged. Existing Static and Black Box data were preserved.

## Packs by city

| City | Before | Added | Final | Packed entry IDs (without `world-flight-`) |
|---|---:|---:|---:|---|
| Bangkok, Thailand | 0 | 2 | 2 | `bangkok-creative-renaissance-video`, `bangkok-river-transport-video` |
| Tokyo, Japan | 0 | 2 | 2 | `tokyo-metro-economics-video`, `tokyo-vending-machines-video` |
| Seoul, South Korea | 0 | 2 | 2 | `seoul-subway-system-video`, `seoul-gyeongbokgung-video` |
| Singapore, Singapore | 1 | 2 | 3 | `singapore-urban-design-video`, `singapore-hawker-culture-video`, `singapore-changi-jewel-video` |
| Paris, France | 0 | 2 | 2 | `paris-city-history-video`, `paris-cafe-culture-video` |
| London, United Kingdom | 1 | 1 | 2 | `london-sightseeing-english-video`, `london-tube-engineering-video` |
| New York, United States | 0 | 2 | 2 | `new-york-ellis-island-video`, `new-york-street-vendors-video` |
| Cairo, Egypt | 1 | 1 | 2 | `cairo-ancient-egypt-video`, `cairo-nile-explainer-video` |
| Dubai, United Arab Emirates | 1 | 1 | 2 | `dubai-airport-history-video`, `dubai-metro-route-2020-video` |
| Sydney, Australia | 0 | 2 | 2 | `sydney-harbour-ecology-video`, `sydney-opera-house-history-video` |
| Beijing, China | 0 | 2 | 2 | `beijing-city-history-video`, `beijing-subway-system-video` |
| Shanghai, China | 0 | 2 | 2 | `shanghai-food-culture-shock-video`, `shanghai-journey-to-the-west-video` |
| Berlin, Germany | 0 | 2 | 2 | `berlin-berlin-wall-video`, `berlin-public-transport-video` |
| Moscow, Russia | 0 | 2 | 2 | `moscow-metro-video`, `moscow-kremlin-red-square-video` |
| Istanbul, Turkey | 0 | 2 | 2 | `istanbul-mosques-architecture-video`, `istanbul-two-continents-video` |
| Vancouver, Canada | 0 | 2 | 2 | `vancouver-underground-streams-video`, `vancouver-skytrain-video` |
| Toronto, Canada | 0 | 2 | 2 | `toronto-growth-video`, `toronto-public-transit-video` |
| Mumbai, India | 1 | 1 | 2 | `mumbai-city-history-video`, `mumbai-dabbawalas-video` |
| Cape Town, South Africa | 0 | 2 | 2 | `cape-town-founded-video`, `cape-town-table-mountain-video` |
| Rome, Italy | 0 | 2 | 2 | `rome-ancient-rome-video`, `rome-food-market-video` |
| Rio de Janeiro, Brazil | 1 | 1 | 2 | `rio-de-janeiro-favela-history-video`, `rio-de-janeiro-carnival-video` |
| Mexico City, Mexico | 0 | 2 | 2 | `mexico-city-complex-history-video`, `mexico-city-metro-tips-video` |
| Buenos Aires, Argentina | 0 | 2 | 2 | `buenos-aires-tango-video`, `buenos-aires-landmarks-video` |
| Los Angeles, United States | 0 | 2 | 2 | `los-angeles-metro-rail-video`, `los-angeles-smog-history-video` |
| Jakarta, Indonesia | 0 | 2 | 2 | `jakarta-flood-control-video`, `jakarta-transport-video` |
| Lagos, Nigeria | 1 | 1 | 2 | `lagos-mass-transit-video`, `lagos-market-video` |
| Hong Kong, China | 2 | 0 | 2 | `hong-kong-transport-system-video`, `hong-kong-housing-video` |
| Amsterdam, Netherlands | 1 | 1 | 2 | `amsterdam-cycling-video`, `amsterdam-canals-video` |
| Honolulu, United States | 0 | 2 | 2 | `honolulu-hula-story-video`, `honolulu-spam-musubi-video` |
| Miami, United States | 1 | 1 | 2 | `miami-little-havana-video`, `miami-rapid-transit-video` |
| Bogota, Colombia | 1 | 1 | 2 | `bogota-gold-museum-video`, `bogota-graffiti-projects-video` |
| Reykjavik, Iceland | 0 | 2 | 2 | `reykjavik-city-landmarks-video`, `reykjavik-culture-night-video` |
| Nairobi, Kenya | 0 | 2 | 2 | `nairobi-capital-history-video`, `nairobi-un-hub-video` |
| Lima, Peru | 1 | 1 | 2 | `lima-city-history-video`, `lima-transport-strike-video` |
| Perth, Australia | 1 | 1 | 2 | `perth-quokkas-video`, `perth-transperth-video` |
| Auckland, New Zealand | 0 | 2 | 2 | `auckland-volcanic-field-video`, `auckland-electric-bus-video` |
| Suva, Fiji | 0 | 2 | 2 | `suva-city-geography-video`, `suva-rugby-climate-video` |
| Ulaanbaatar, Mongolia | 0 | 2 | 2 | `ulaanbaatar-changing-capital-video`, `ulaanbaatar-ger-area-transport-video` |
| Almaty, Kazakhstan | 0 | 2 | 2 | `almaty-garden-city-video`, `almaty-metro-video` |
| Madrid, Spain | 1 | 1 | 2 | `madrid-city-exploration-video`, `madrid-prado-collections-video` |
| Lisbon, Portugal | 0 | 2 | 2 | `lisbon-city-guide-video`, `lisbon-azulejos-video` |
| Dublin, Ireland | 1 | 1 | 2 | `dublin-irish-dance-video`, `dublin-oscar-wilde-video` |
| Dakar, Senegal | 0 | 1 | 1 | `dakar-ladoum-sheep-video` |
| Recife, Brazil | 0 | 2 | 2 | `recife-brazil-for-kids-video`, `recife-frevo-video` |
| Panama City, Panama | 0 | 2 | 2 | `panama-city-mola-art-video`, `panama-city-amphibian-conservation-video` |
| Santiago, Chile | 1 | 1 | 2 | `santiago-chile-for-kids-video`, `santiago-moai-video` |
| Addis Ababa, Ethiopia | 0 | 2 | 2 | `addis-ababa-ethiopia-culture-video`, `addis-ababa-lucy-fossil-video` |
| Delhi, India | 0 | 2 | 2 | `delhi-indian-food-video`, `delhi-red-fort-video` |
| Manila, Philippines | 0 | 2 | 2 | `manila-philippines-for-kids-video`, `manila-filipino-identity-video` |
| Ho Chi Minh City, Vietnam | 0 | 2 | 2 | `ho-chi-minh-city-tet-for-kids-video`, `ho-chi-minh-city-vietnam-culture-video` |

## Reviewed candidates skipped or deferred

These are reasons for not preparing the candidate windows reviewed in this round, not claims that every second of a video is unusable. Other unpacked videos are third choices deferred after city coverage was achieved. No entry is retitled, hidden or removed.

| Entry ID (without `world-flight-`) | Decision and cached evidence |
|---|---|
| dakar-biennale-video | Skip for caption quality. Sparse English islands separated by long gaps; later passages are heavily mistranscribed, including “we’re gonna have to leave modern gonna” at 352.76s and non-English speech at the end. No reliable second pack prepared. |
| dakar-goree-electricity-video | Skip for caption quality. A clear 62.37–72.70s explanation of generators and an underwater cable is surrounded by unusable speech-to-text such as “Mexico bonobos affair yeah video” at 40.31s. Cannot form three checked rounds from this cache. Dakar retains one pack. |
| mumbai-street-food-video | Sparse English: 183 caption words over a listed 294s, with four explicit foreign-language markers. The reviewed food interviews have no usable English answer captions. Use the city-history and dabbawala packs. |
| mexico-city-street-food-video | Sparse English bridges with six explicit foreign-language markers over 419s. The interviews are not captioned in usable English. Use the metro and local-guide packs. |
| lima-ancient-ruins-video | Sparse English: 206 caption words over 281s. The reviewed 36–71s and 151–165s passages do not provide three well-separated, grounded A2 rounds within a short window. Use city history and the existing strike pack. |
| ulaanbaatar-sustainable-gers-video | Several English passages are understandable, but intervening captions include “she knocked our janitor sequester” at 99.32s. Prefer the changing-capital and checked transport-project packs; no question written from garbled translations. |
| cairo-food-tour-video | The reviewed interview around 146–164s is heavily mistranscribed, including a spurious reference to the Philippines and California. Chose ancient Egypt and the existing Nile pack rather than infer the interview’s food explanation. |
| cape-town-water-crisis-video | Reviewed passages include lost or substituted words about water collection and household routines. Chose the clearer foundation-history and cable-car guidance captions. This is a candidate-window deferral, not a claim the whole report is unusable. |
| shanghai-towers-temples-food-video | The reviewed opening has narration around 20–52s followed by long gaps and fragments. Chose the restaurant culture discussion and literary explainer, which support separated rounds without using visual guesses. |
| london-chinatown-restaurant-video | **Cache/source alignment needs owner review.** Captions discuss Excellent Dumpling House at **111 Lafayette** (156.32s) and a restaurant opened in 1983; they do not establish the London setting claimed by this entry. The NYC reference may indicate a wrong source label or wrong cache association. No pack or metadata edit made here. |
| buenos-aires-city-history-video | Deferred in favour of the dance and landmarks sources. The reviewed history contains spoken profanity at 113.24s; this is a content choice, not a caption failure. |
| suva-city-history-video | Deferred in favour of the city-geography and climate/rugby sources. The reviewed passage uses mocking comments about violence and cannibalism; this is a content choice, not a caption failure. |

## Checks

- `pnpm test src/lib/listening-pack.test.ts`: **6/6 pass**. Checker output: **100 packs; 50/50 cities covered; 0 cities without a pack**.
- `pnpm test src/lib src/data`: **449/449 pass across 98 test files**.
- `npx tsc --noEmit -p .`: only the known missing `@anthropic-ai/sdk` errors at `src/lib/ai/providers/anthropic.ts:1` and `:32`, plus the consequent implicit-any `b` at `:53`. No dependency installed.
- `git diff --check`: pass.
- Caption evidence check: each key-line quote is copied from captions inside its segment; every word occurs inside its listening window; protected entry fields unchanged. All failure counts **0**.
- The repository test checks the raw and parsed pack counts, exact gist count, valid gist/inference options, 3–5 detail segments, 12–30s lengths, non-overlap, 180s cap, nonempty key lines, 4–6 words, all answer positions and city coverage. Caption-content checks use the read-only cache snapshot outside the repository; no secret or caption fetching is added to tests.

## Commit progress

Owner approved staging only the three listed files throughout this round. City batches: 19 new packs, then 22, then 20, then 22. Caption quote/timing refinements and the five repairs are included in these local commits. The report-only proposal follow-up is a separate commit.

## Files touched

1. `src/data/world-flight-library.json` — only `listeningPack` fields.
2. `src/lib/listening-pack.test.ts` — checks for every city pack and coverage.
3. `docs/library-round-37-progress.md` — this report and proposed entries.

## New-pack evidence index

The entry’s JSON contains the complete copied key lines and answer options. Times below identify the exact caption windows used for each new pack.

| Entry ID (without `world-flight-`) | Level | Detail windows (seconds) |
|---|---|---|
| bangkok-creative-renaissance-video | B1 | 39–55, 100–113, 154–167 |
| tokyo-metro-economics-video | B1 | 58–71, 75–88, 105–118 |
| tokyo-vending-machines-video | B1 | 24–37, 49–62, 121–134 |
| seoul-subway-system-video | B1 | 67–80, 120–133, 144–157 |
| seoul-gyeongbokgung-video | A2 | 18–31, 39–52, 62–75 |
| singapore-urban-design-video | B1 | 33–46, 97–110, 126–139 |
| singapore-hawker-culture-video | A2 | 34–47, 56–69, 78–93 |
| paris-city-history-video | B1 | 24–37, 71–84, 134–147 |
| paris-cafe-culture-video | A2 | 26–39, 57–70, 77–90 |
| london-sightseeing-english-video | A2 | 31–44, 47–60, 86–99 |
| new-york-ellis-island-video | B1 | 45–58, 74–87, 127–140 |
| new-york-street-vendors-video | B1 | 49–62, 100–113, 132–145 |
| cairo-ancient-egypt-video | B1 | 41–54, 68–81, 121–134 |
| dubai-metro-route-2020-video | B1 | 134–146, 156–169, 220–233 |
| sydney-harbour-ecology-video | B1 | 56–69, 81–94, 130–143 |
| sydney-opera-house-history-video | B1 | 64–77, 103–116, 134–147 |
| beijing-city-history-video | B1 | 23–36, 44–57, 75–88 |
| beijing-subway-system-video | B1 | 53–66, 82–95, 119–132 |
| shanghai-food-culture-shock-video | B1 | 81–94, 118–131, 142–155 |
| shanghai-journey-to-the-west-video | B2 | 22–35, 85–98, 129–142 |
| berlin-berlin-wall-video | B1 | 30–43, 65–78, 96–109 |
| berlin-public-transport-video | A2 | 30–43, 65–77, 83–96 |
| moscow-metro-video | B1 | 26–39, 41–56, 95–108 |
| moscow-kremlin-red-square-video | B1 | 22–35, 75–88, 121–134 |
| istanbul-mosques-architecture-video | B1 | 19–32, 58–71, 100–112 |
| istanbul-two-continents-video | A2 | 35–48, 54–67, 81–94 |
| vancouver-underground-streams-video | B1 | 23–36, 82–95, 137–150 |
| vancouver-skytrain-video | A2 | 30–43, 53–66, 81–94 |
| toronto-growth-video | B1 | 52–65, 83–96, 131–144 |
| toronto-public-transit-video | A2 | 32–45, 47–60, 85–98 |
| mumbai-city-history-video | B1 | 57–72, 83–96, 128–141 |
| cape-town-founded-video | B1 | 25–38, 65–78, 107–119 |
| cape-town-table-mountain-video | A2 | 31–44, 53–66, 91–104 |
| rome-ancient-rome-video | B1 | 14–27, 53–66, 68–81 |
| rome-food-market-video | A2 | 18–31, 47–60, 78–91 |
| rio-de-janeiro-carnival-video | A2 | 20–33, 42–55, 63–76 |
| mexico-city-complex-history-video | B1 | 24–36, 91–104, 114–127 |
| mexico-city-metro-tips-video | A2 | 39–52, 57–70, 77–90 |
| buenos-aires-tango-video | A2 | 32–48, 53–66, 88–101 |
| buenos-aires-landmarks-video | A2 | 36–49, 54–67, 68–81 |
| los-angeles-metro-rail-video | A2 | 23–36, 40–54, 64–77 |
| los-angeles-smog-history-video | B1 | 44–57, 97–110, 125–141 |
| jakarta-flood-control-video | B2 | 34–47, 67–80, 117–130 |
| jakarta-transport-video | B1 | 27–40, 51–64, 115–127 |
| lagos-market-video | A2 | 29–42, 58–71, 76–89 |
| amsterdam-canals-video | A2 | 22–35, 51–64, 75–88 |
| honolulu-hula-story-video | B1 | 63–76, 86–100, 123–136 |
| honolulu-spam-musubi-video | A2 | 50–63, 76–89, 104–117 |
| miami-rapid-transit-video | A2 | 21–34, 62–75, 80–93 |
| bogota-gold-museum-video | A2 | 35–48, 56–69, 83–96 |
| reykjavik-city-landmarks-video | B1 | 39–52, 95–108, 142–154 |
| reykjavik-culture-night-video | A2 | 8–21, 23–36, 58–71 |
| nairobi-capital-history-video | B1 | 49–62, 82–95, 114–127 |
| nairobi-un-hub-video | B1 | 21–34, 47–60, 83–96 |
| lima-city-history-video | B1 | 29–42, 92–105, 138–151 |
| perth-quokkas-video | A2 | 39–52, 58–71, 71–84 |
| auckland-volcanic-field-video | A2 | 35–48, 50–63, 81–94 |
| auckland-electric-bus-video | B1 | 25–38, 71–84, 91–104 |
| suva-city-geography-video | B1 | 60–73, 94–107, 123–136 |
| suva-rugby-climate-video | B1 | 56–69, 87–100, 131–144 |
| ulaanbaatar-changing-capital-video | A2 | 33–46, 50–63, 79–92 |
| ulaanbaatar-ger-area-transport-video | B2 | 73–86, 125–138, 141–154 |
| almaty-garden-city-video | A2 | 23–36, 39–52, 77–90 |
| almaty-metro-video | B1 | 41–54, 62–75, 145–158 |
| madrid-city-exploration-video | A2 | 16–29, 36–49, 66–79 |
| lisbon-city-guide-video | A2 | 31–44, 51–64, 83–96 |
| lisbon-azulejos-video | B1 | 13–26, 48–61, 102–115 |
| dublin-irish-dance-video | A2 | 23–36, 46–59, 75–88 |
| dakar-ladoum-sheep-video | A2 | 58–71, 73–86, 94–107 |
| recife-brazil-for-kids-video | A2 | 38–51, 58–71, 87–100 |
| recife-frevo-video | B1 | 34–47, 68–81, 121–134 |
| panama-city-mola-art-video | A2 | 44–57, 60–73, 91–104 |
| panama-city-amphibian-conservation-video | B2 | 91–104, 118–131, 154–167 |
| santiago-chile-for-kids-video | A2 | 20–33, 40–53, 75–88 |
| addis-ababa-ethiopia-culture-video | A2 | 21–34, 54–67, 74–87 |
| addis-ababa-lucy-fossil-video | B2 | 82–95, 100–113, 148–161 |
| delhi-indian-food-video | A2 | 33–46, 68–81, 91–104 |
| delhi-red-fort-video | B1 | 38–51, 62–75, 82–95 |
| manila-philippines-for-kids-video | A2 | 36–49, 53–66, 80–93 |
| manila-filipino-identity-video | B1 | 38–51, 101–114, 141–154 |
| ho-chi-minh-city-tet-for-kids-video | A2 | 26–39, 44–57, 60–75 |
| ho-chi-minh-city-vietnam-culture-video | B1 | 182–195, 198–210, 210–222 |
| bangkok-river-transport-video | A2 | 47–60, 68–81, 91–104 |
