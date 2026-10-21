# Second check: teaching-data accuracy report

**Date:** 21 October 2026

This is an independent re-check of four teaching-data areas. The previous accuracy report was treated as context, not evidence. Each correction below was checked against the cited source.

## Scope and result

| Area | Content reviewed | Confirmed corrections |
| --- | ---: | ---: |
| Part 1: world landmark catalogue | 86 landmarks | 0 |
| Part 2: animal migrations and regional animals | 28 migrations; 150 regions with 298 entries | 0 |
| Part 3: place cards | 40 places; 800 cards | 1 |
| Part 4: world quiz | 522 questions: 131 capitals, 80 landmarks, 60 food, 60 animals, 60 size comparisons, 131 greetings | 4 |

Five confirmed errors were corrected. Other doubtful or disputed items were left unchanged and are listed below.

## Confirmed corrections

### Part 3: place cards

1. **Gerardo de León was named a National Artist in 1982, not 1973.**
   - File: `src/data/lenses/place-cards.json`, Philippines films card.
   - Before: "He was named a National Artist of the Philippines in 1973."
   - After: "He was named a National Artist of the Philippines in 1982."
   - Gerardo de León died in 1981 and received the award posthumously in 1982. The NCCA profile was also added to the card's sources.
   - Source: <https://www.ncca.gov.ph/about-culture-and-arts/culture-profile/national-artists-of-the-philippines/gerardo-gerry-de-leon/>

### Part 4: world quiz

2. **The CN Tower was built on Toronto's former Railway Lands.**
   - File: `src/data/world-quiz/landmarks.ts`, `landmark-cn-tower`.
   - Before: "The CN Tower stands beside downtown Toronto's railway lands."
   - After: "The CN Tower was built on downtown Toronto's former Railway Lands."
   - The site was formerly the Railway Lands; the tower is not merely beside them.
   - Source: <https://en.wikipedia.org/wiki/CN_Tower>

3. **The emu question used ambiguous "live in the wild" wording.**
   - File: `src/data/world-quiz/animals.ts`, `animal-emu`.
   - Before: "Where does this animal live in the wild?"
   - After: "Where is this animal native?"
   - New Zealand has a feral emu population on the Chatham Islands. With New Zealand as a distractor, the old wording could be read as correct. The answer remains Australia.
   - Source: <https://www.unitec.ac.nz/epress/wp-content/uploads/2025/05/PBD-Klein-etal-2025.pdf>

4. **The Icelandic greeting pronunciation was wrong.**
   - Files: `src/data/world-quiz/hello.ts` and `src/data/world-quiz/country-facts.ts`.
   - Before: "hat-LOH"
   - After: "HAH-loh"
   - Icelandic `halló` as a greeting is pronounced approximately [ˈhalːou]. The old value matched the separate slang adjective pronunciation [ˈhatlou].
   - Source: <https://en.wiktionary.org/wiki/hall%C3%B3>

5. **The Dzongkha greeting used a phonetic spelling rather than standard Tibetan-script orthography.**
   - Files: `src/data/world-quiz/hello.ts` and `src/data/world-quiz/country-facts.ts`.
   - Before: `ཀུ་ཟུ་བཟང་པོ།`
   - After: `སྐུ་གཟུགས་བཟང་པོ།`
   - Source: <https://glosbe.com/en/dz/hello>

`country-facts.ts` was changed only to keep the shared greeting text and pronunciation in sync with `hello.ts`.

## No-change findings

### Part 1: world landmark catalogue

- All 86 entries were reviewed.
- No confirmed user-facing factual error was found.
- No entries were added, removed, or reordered.

### Part 2: animal migrations and regional animals

- All 28 migration profiles and all 298 regional-animal entries were reviewed.
- Season windows, habitat labels, and spatial envelopes were checked for valid ranges and plausible placement.
- No confirmed factual error was found.
- No entries or counts were changed.

### Part 3: place cards

- All 40 places and 800 cards were reviewed across the full bank.
- Apart from the Gerardo de León year, no confirmed factual error was found.
- No photographs or licences were changed. Existing Commons and card-structure tests pass.

### Part 4: world quiz

- All 131 capital questions were checked. No confirmed error was found.
- All 80 landmark questions were checked. Only the CN Tower fact was changed.
- All 60 food questions were checked. No confirmed error was found.
- All 60 animal questions were checked. Only the emu prompt was changed.
- All 60 size-comparison questions were checked. No confirmed error was found.
- All 131 greeting questions were checked. Only the Icelandic pronunciation and Dzongkha script were changed.
- Question counts and answer-key structure were not changed.

## Doubtful or disputed items left unchanged

| Area | Item | Reason left unchanged |
| --- | --- | --- |
| Part 1 | Salak, Indonesia: south-west vs south-east flank | Sources disagree on the flank description. |
| Part 1 | Loire Valley note and coordinates | Coordinates match Chenonceau, while the note names Chaumont-sur-Loire. |
| Part 2 | Scottish ospreys catching fish "at sea" | Ospreys mainly use fresh water and coastal waters; "at sea" is potentially misleading but not clearly false in context. |
| Part 3 | *My Name Is Kozha* release year | Sources give 1963 or 1964 depending on release definition. |
| Part 3 | *Kyz-Zhibek* release year | Sources give 1970 or 1972. |
| Part 3 | *The Story of the Weeping Camel* genre label | Described as both documentary and docudrama. |
| Part 3 | Evernew Studios founding decade | Sources give the 1930s or 1950s. |
| Part 3 | *Bakkar* credit for Mona Abou El-Nasr | Described as creator in some sources and director in others. |
| Part 3 | Argentina's Las Leonas honours | The card omits a 2026 title; this is incomplete rather than false. |
| Part 4 | Israel: Jerusalem capital wording | Politically disputed; the existing qualified wording was not changed. |
| Part 4 | Sri Lanka: Sri Jayawardenepura Kotte role | The existing administrative-capital wording is defensible. |
| Part 4 | Butter chicken origin | Delhi origin is disputed in food-history sources. |
| Part 4 | Yellow-eyed penguin range | Australia records are vagrant sightings rather than a resident range. |

## Verification

- `npx tsc --noEmit -p .`: only the known missing `@mozilla/readability` error in `src/lib/sources/extractor.ts`.
- `pnpm lint`: passes with two unrelated existing warnings in `src/activities/final-answer/activity.tsx`.
- `pnpm next lint --file` passed for the four changed TypeScript files. Passing the JSON file directly to ESLint is not meaningful because the default parser treats JSON as JavaScript; `place-cards.json` was validated with `JSON.parse` instead.
- `npx vitest run src/data/world-quiz/world-quiz-data.test.ts`: 945 passed.
- `npx vitest run src/__tests__/lib/lens-content.test.ts`: 108 passed.
- Full suite with a 15-second timeout: 3,611 passed, 3 skipped; the only failing suite was the allowed `source-extractor.test.ts` missing-package failure.
- The default 5-second full-suite run hit two unrelated timeouts in `route-place-briefings.test.ts` and `terrain-map-data.test.ts`; both passed when rerun in isolation (790 and 24 tests).
- `git diff --check`: clean.
- No catalogue counts, application code, or test assertions were changed.

## Files changed

- `src/data/lenses/place-cards.json`
- `src/data/world-quiz/landmarks.ts`
- `src/data/world-quiz/animals.ts`
- `src/data/world-quiz/hello.ts`
- `src/data/world-quiz/country-facts.ts`
