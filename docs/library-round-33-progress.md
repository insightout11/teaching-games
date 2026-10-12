# Library Round 33 progress

Branch: `codex/library-round-33`, based on `origin/main` after Round 32 work was completed.

Scope: `src/data/world-flight/focus-evidence.json`, `scripts/validate-focus-evidence.ts`, and this log. The destination definitions and runtime remain unchanged.

## Material audit

Read access to `source_extractions` succeeded using the main checkout's existing environment file, without copying or changing it. All 150 World Flight video source keys have cached transcript rows. Each entry is authored against its own reading text or video transcript. Unsupported summary-only material is marked `thin`; a directly implied limit is marked `tradeoffInferred`.

The validator checks all 300 exact lesson keys, fields, word counts, one-sentence values, imperative design instructions, allowed tags, duplicates, design-instruction word overlap, and city coverage for all 15 investigation requirements. `--partial` supports intermediate city batches; final checks use the complete mode.

## Batch 1: Bangkok, Tokyo, Seoul, Singapore, Paris

Authored 30 entries after reading all 15 cached video transcripts and all 15 lesson texts. One Bangkok food video is marked thin because the usable caption evidence is sparse and partly garbled. Six tradeoffs are direct inferences and are flagged. The partial validator passes with zero field, count, tag, duplicate, or similarity failures. Tokyo transport evidence uses connected railway tracks and payment cards actually stated in the captions; it does not repeat the unsupported property-income claim from the brief example.

## Batch 2: London, New York, Cairo, Dubai, Sydney

Authored 30 more entries (60 total) from all six lesson materials per city. Important source mismatch: `london/chinatown-restaurant-video` captions explicitly refer to Excellent Dumpling House at 111 Lafayette Street and American customers, not a London restaurant. Its entry is marked thin and describes the lease/community mechanism without making a London-specific claim. No destination definition was changed. Partial checks pass with zero failures.

## Batch 3: Beijing, Shanghai, Berlin, Moscow, Istanbul

Authored 30 more entries (90 total) and read all corresponding texts/captions. Thin flags identify Beijing’s heavily garbled hutong captions, Shanghai’s sightseeing montage and literary plot overview (little city-specific mechanism), and Moscow’s tower vlog with tentative explanations. Moscow’s lesson labelled city history actually contains a modern tower tour; evidence follows the captions rather than the title. Inferred limits are explicitly flagged, including winter upkeep and ceremonial building interpretation. Partial checks pass.

## Batch 4: Vancouver, Toronto, Mumbai, Cape Town, Rome

Authored 30 more entries (120 total) from each lesson’s own material. Strong mechanisms include Vancouver’s combined storm/sewage overflow, Mumbai’s coded lunchbox handovers, and Rome’s numbered arena entrances. Thin entries are identified where the source is a promotional montage, lacks translated interview speech, or provides only a short general link to city planning. Partial checks pass; every design instruction remains distinct.

## Batch 5: Rio de Janeiro, Mexico City, Buenos Aires, Los Angeles, Jakarta

Authored 30 more entries (150 total). Entries distinguish Carnival’s shared cultural influences from samba schools’ project work, and preserve Rio’s housing-clearance mechanism without presenting residents through a poverty stereotype. Mexico City’s food-tour interviews are untranslated in the English captions, so that entry stays narrow and thin. Jakarta’s flood evidence includes land/relocation disagreements actually stated in the report. Partial checks pass.

## Batch 6: Lagos, Hong Kong, Amsterdam, Honolulu, Miami

Authored 30 more entries (180 total), reading all captions and lesson texts. Hong Kong’s rail/property model is grounded in its own transcript; housing-standard costs are grounded in tenants’ reported displacement fears. Honolulu’s entries distinguish regional Hawaiian cultural material from specific coast and watershed mechanisms. No historical video claims are presented as new forecasts or current numerical rankings. Partial checks pass with zero errors.

## Batch 7: Bogota, Reykjavik, Nairobi, Lima, Perth

Authored 30 more entries (210 total), grounded in all associated captions/texts. Future project claims remain plans rather than completed results (Nairobi Railway City and UN expansion). Reykjavik’s national history is flagged thin for its city-specific link. Evidence includes direct, stated limits on fog collection, wildlife movement, historic repairs, and desalination; inferred limits remain marked. Partial checks pass.

## Batch 8: Auckland, Suva, Ulaanbaatar, Almaty, Madrid

Authored 30 more entries (240 total). Auckland’s ancestral-mountain management and Ulaanbaatar’s user-led transport upgrades use specific decision mechanisms. Suva’s national history and coral-coast village video are flagged thin for their city-specific connection and retain their actual regional setting. Almaty’s city-introduction evidence uses the mountain-camp example actually shown rather than invented garden policy. Partial checks pass.

## Batch 9: Lisbon, Dublin, Dakar, Recife, Panama City

Authored 30 more entries (270 total). Source limitations: Dublin’s dance activity is explicitly filmed in California; Lisbon’s tile video discusses Portuguese/Algarve craft generally; Recife’s kids introduction covers Brazil broadly; Recife’s silent-drums report is in Olinda; Panama’s frog center is in El Valle. These entries keep the actual setting and carry thin flags for the weak city connection. Dakar’s biennale and electricity captions are largely garbled: evidence uses only the clear passages (distributed art spaces and the Goree-to-Dakar grid cable), with thin and inferred flags. Partial checks pass.

## Batch 10: Santiago, Addis Ababa, Delhi, Manila, Ho Chi Minh City

Authored the final 30 entries (300 total). The Addis coffee video is explicitly set in New York/Brooklyn, so its thin entry keeps that setting and does not claim an Addis cafe practice. National introductions, recipes, and out-of-city science/heritage videos are marked thin where they lack a concrete city mechanism. Delhi’s Qutub Minar entry preserves the source’s uncertainty rather than asserting speculative origins. Every lesson has been read before its entry was written. Full checks pass; final editorial review and required test results follow below.

## Final editorial pass and verification

Simplified 37 Easy key ideas to use shorter, more familiar wording while keeping the same evidence. Rechecked tags against the actual lesson subject; Cairo’s market language lesson uses culture rather than a food-culture tag. The validator also detects duplicate raw JSON keys (which normal JSON parsing would silently overwrite), and compares design instructions by the shared proportion of the longer normalized word set. Both punctuation and word order are ignored; overlap above 70% fails.

### Validator’s own counts

```text
Focus evidence: 300/300; thin 32; tradeoffInferred 83.
Evidence checks: missing 0, unknown 0, duplicateEntry 0, fields 0, wordCount 0, sentence 0, starts 0, tags 0, duplicateKeyIdea 0, duplicateDesignUse 0, similarDesignUse 0, coverage 0.
Focus-evidence validation passed.
```

All 150 reading entries use their own supplied reading text; all 150 video entries were checked against cached captions. There were no unavailable transcript rows. Thin does not mean a made-up claim: these 32 entries remain deliberately limited where captions are weak, the scope is national/regional, or the linked source is actually elsewhere. All 83 inferred tradeoffs describe a direct limit implied by the material and are explicitly flagged. No external facts or unsupported numbers were added.

### Requirement coverage: different cities

“Before” uses only the current focus skills; “after” uses skills plus the new evidence tags, matching the runtime’s combination. The final column counts the new evidence tags alone. No requirement was filled by adding unrelated tags.

| Investigation / requirement | Before | After | New evidence tags only |
| --- | ---: | ---: | ---: |
| How Cities Move / network | 29 | 39 | 39 |
| How Cities Move / access | 27 | 50 | 49 |
| How Cities Move / tradeoff | 36 | 43 | 42 |
| Cities and Change / past | 43 | 44 | 42 |
| Cities and Change / cause | 22 | 26 | 14 |
| Cities and Change / preserve | 35 | 47 | 47 |
| Living With Nature / setting | 28 | 42 | 42 |
| Living With Nature / pressure | 24 | 28 | 28 |
| Living With Nature / response | 27 | 44 | 43 |
| Belonging and Identity / expression | 35 | 42 | 40 |
| Belonging and Identity / daily culture | 23 | 40 | 40 |
| Belonging and Identity / mixed city | 27 | 47 | 47 |
| Designing Fair Cities / design choice | 38 | 43 | 43 |
| Designing Fair Cities / competing needs | 16 | 46 | 46 |
| Designing Fair Cities / improvement | 30 | 44 | 44 |

- Library validator: passed, 1,388 items across 28 files.
- City-pack validator: passed, 50/50 cities, 250 souvenirs, 47 existing review flags.
- `pnpm test src/lib src/data`: 94 test files, 418 tests passed.
- `npx tsc --noEmit -p .`: failed on the existing missing `@anthropic-ai/sdk` dependency in `src/lib/ai/providers/anthropic.ts` (lines 1 and 32), plus the resulting implicit-`any` callback at line 53. No Round 33 file appears in the diagnostics. Dependencies were not installed or modified.

### Thin entries for owner review

- `bangkok/food-identity-video`
- `london/chinatown-restaurant-video`
- `beijing/hutong-culture-video`
- `shanghai/towers-temples-food-video`
- `shanghai/journey-to-the-west-video`
- `moscow/city-history-video`
- `vancouver/city-in-nature-video`
- `mumbai/street-food-video`
- `cape-town/robben-island`
- `cape-town/fynbos-biodiversity`
- `mexico-city/street-food-video`
- `jakarta/old-batavia`
- `reykjavik/iceland-history-video`
- `suva/city-history-video`
- `suva/rugby-climate-video`
- `lisbon/azulejos-video`
- `dublin/irish-dance-video`
- `dakar/ladoum-sheep-video`
- `dakar/biennale-video`
- `dakar/goree-electricity-video`
- `recife/brazil-for-kids-video`
- `recife/silent-drums-video`
- `panama-city/mola-art-video`
- `panama-city/amphibian-conservation-video`
- `santiago/chile-for-kids-video`
- `santiago/marraqueta-video`
- `santiago/moai-video`
- `addis-ababa/ethiopia-culture-video`
- `addis-ababa/coffee-traditions-video`
- `addis-ababa/lucy-fossil-video`
- `manila/philippines-for-kids-video`
- `ho-chi-minh-city/vietnam-history-video`

## Ten complete examples

One video and one reading from each of five cities, copied from the final evidence file.

### Bangkok

```json
{
  "bangkok/creative-renaissance-video": {
    "keyIdea": "Bangkok creatives restore older buildings and mix traditional culture with new art rather than replacing everything.",
    "tradeoff": "Making art welcoming takes work beyond simply saving an old building.",
    "designUse": "Turn restored buildings into welcoming places for local creative work.",
    "investigationTags": [
      "heritage",
      "art",
      "urban culture"
    ],
    "tradeoffInferred": true
  },
  "bangkok/green-escape": {
    "keyIdea": "Bangkok's Benjakitti Park turns former industrial land into green public space with water, walking routes, and shade.",
    "tradeoff": "Parks need valuable land and upkeep, reducing space available for short-term profit.",
    "designUse": "Keep useful land for free green spaces that manage heat and water.",
    "investigationTags": [
      "urban design",
      "public space",
      "water"
    ]
  }
}
```

### Tokyo

```json
{
  "tokyo/metro-economics-video": {
    "keyIdea": "Tokyo connects commuter trains directly with subway tracks, reducing transfers, while shared payment cards simplify journeys.",
    "tradeoff": "Distance-based fares mean people making longer journeys must pay more.",
    "designUse": "Join rail routes and payment systems so passengers change less often.",
    "investigationTags": [
      "transport",
      "systems thinking",
      "economics"
    ]
  },
  "tokyo/earthquake-readiness": {
    "keyIdea": "Tokyo protects emergency roads by strengthening nearby buildings, linking city rescue plans with everyday household preparation.",
    "tradeoff": "Dense housing, damaged services, and stranded commuters can still make disaster response difficult.",
    "designUse": "Protect rescue routes while helping households plan supplies and communication.",
    "investigationTags": [
      "engineering",
      "problem solving",
      "community"
    ]
  }
}
```

### Seoul

```json
{
  "seoul/subway-system-video": {
    "keyIdea": "Seoul's subway uses platform doors and camera inspections to improve safety, while stations also host shops and performances.",
    "tradeoff": "Safety equipment alone cannot replace ongoing cleaning, inspection, and customer service.",
    "designUse": "Combine transport safety features with regular checks and welcoming station spaces.",
    "investigationTags": [
      "transport",
      "engineering",
      "community"
    ],
    "tradeoffInferred": true
  },
  "seoul/cheonggyecheon-restoration": {
    "keyIdea": "Seoul removed road infrastructure to uncover Cheonggyecheon, bringing water and pedestrian space back into the city center.",
    "tradeoff": "Removing roads can affect drivers, nearby shops, and the public budget.",
    "designUse": "Replace selected traffic spaces with water routes where people can walk and rest.",
    "investigationTags": [
      "urban design",
      "water",
      "urban change"
    ]
  }
}
```

### Singapore

```json
{
  "singapore/urban-design-video": {
    "keyIdea": "Singapore's public housing puts schools, shops, parks, and transport near homes, making many daily needs easier to reach.",
    "tradeoff": "Residents receive long leases, but the state still owns the apartments.",
    "designUse": "Place everyday services near homes and connect them to public transport.",
    "investigationTags": [
      "housing",
      "urban planning",
      "transport"
    ]
  },
  "singapore/water-security": {
    "keyIdea": "Singapore uses several water sources, including cleaned used water, to reduce dependence on any single supply.",
    "tradeoff": "Desalination needs energy and infrastructure, while local water collection requires protected land.",
    "designUse": "Combine different water supplies and protect the places that collect rain.",
    "investigationTags": [
      "water",
      "engineering",
      "geography"
    ]
  }
}
```

### Paris

```json
{
  "paris/louvre-history-video": {
    "keyIdea": "The Louvre changed from a fortress into a royal home and then a museum, reflecting changing public roles.",
    "tradeoff": "Reusing the building involved repeated extensions and construction across many generations.",
    "designUse": "Adapt important buildings for new public roles while showing earlier uses.",
    "investigationTags": [
      "history",
      "architecture",
      "museums"
    ],
    "tradeoffInferred": true
  },
  "paris/cycling-city": {
    "keyIdea": "Paris adds bike lanes, slower streets, and pedestrian areas to make short journeys easier without a car.",
    "tradeoff": "Quieter streets can help residents but inconvenience drivers and delivery workers.",
    "designUse": "Balance safer short journeys with practical access for deliveries and businesses.",
    "investigationTags": [
      "transport",
      "urban design",
      "debate"
    ]
  }
}
```
