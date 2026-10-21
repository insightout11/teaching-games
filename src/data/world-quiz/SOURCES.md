# World Quiz data sources

Snapshot prepared on 21 October 2026. These files contain data only. Claude owns game integration; no component, game,
live-room library or world-quiz library is changed. Source URLs are review references and are never fetched by these files.

## Country facts and numbers

- Country identity and continent follow `QUIZ_COUNTRIES` exactly, including its choices for transcontinental countries.
- Population is the **2024 World Bank World Development Indicators estimate**, indicator `SP.POP.TOTL`, in people.
  Each value includes its year and country-specific API URL. This official international statistical series draws on national
  statistical offices, the UN Population Division and other statistical agencies; it is not a live count or a claim that all
  observations are national censuses. See the [population metadata](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.POP.TOTL).
- Area is the **2023 WDI surface area**, indicator `AG.SRF.TOTL.K2`, in square kilometres, sourced from FAO. It includes
  inland water and some coastal waterways. It is not land-only area. See the [surface-area metadata](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/AG.SRF.TOTL.K2).
  Coverage follows the source's statistical geography; the values do not define borders. Comparisons use the same indicator
  and year on both sides, rather than mixing census years or land-only and total areas.
- The World Bank data are attributed to World Bank / WDI and the underlying statistical providers, under
  [CC BY 4.0](https://datacatalog.worldbank.org/public-licenses#cc-by). The dated observations have been selected and
  reformatted into the teaching schema, without rounding the supplied numbers.
- Capital, currency-code and language/border reference data are adapted from
  [GeoNames country information](https://download.geonames.org/export/dump/countryInfo.txt), © GeoNames,
  [CC BY 4.0](https://www.geonames.org/export/). Country pages are linked in the records. This is a community gazetteer,
  so recent changes were checked separately: Astana, Sri Jayawardenepura Kotte, Bulgaria's euro and Zimbabwe Gold.
- Capital roles are explicit for Pretoria (administrative), Sucre (constitutional), Kotte (legislative) and Bern (federal
  city). The South Africa question asks for **a** capital; the Swiss question asks about the government's home city.
  Kuala Lumpur is retained as Malaysia's capital, not confused with Putrajaya. Jakarta is retained during Indonesia's
  transition; this should be rechecked when that transition takes legal effect.
- Neighbours are **up to three examples**, not an exhaustive list. Countries with only one or two land neighbours are not
  padded with sea neighbours. Independent neighbours outside the quiz roster can appear as factual references, but do not
  become playable countries. Dependencies and disputed areas are not added. Australia is labelled `none`, not incorrectly
  called an island; genuine island countries without land neighbours are labelled `island`.
- Language lists give examples of major/official languages without claiming an exhaustive list, a national ranking or a
  single language for everyone. Greeting records identify one language and one useful greeting. The English-speaker
  pronunciations are approximations, not IPA, audio or a complete account of tones. Word references use Wiktionary,
  Bhutan's tourism board or the Vashona dictionary; no
  dictionary prose has been copied. Māori for New Zealand, French for Canada and Tok Pisin for Papua New Guinea provide
  useful examples from those countries' language lists.
- Food, animal and landmark examples are authored selections with article references. Shared foods and animals are not
  claimed as unique inventions or exclusive national species. A reference is not a promise of a wildlife sighting or an
  assurance that a dish is safe for every learner.

## Local flag assets

Every `public/flags/<iso2>.svg` has a record in `flag-sources.ts`: pinned source URL, upstream commit, public-domain
statement, byte size and SHA-256. The files come from
[hampusborgos/country-flags](https://github.com/hampusborgos/country-flags), pinned at
`c09927e63705529bbf59ca6684cd9b23225dddad`. Its README states that its national-flag renders are public domain and describes
their Wikimedia Commons origins. XML comments and inter-tag whitespace were removed; paths, proportions and colours were
preserved. No packages or upstream scripts were installed or executed.

All files are below 256 KiB; the entire set is about 2.2 MB uncompressed. Detailed coats of arms account for the largest
files. Each flag was rendered locally and inspected on a contact sheet. The tests reject active content and external asset
references and verify hashes, size limits and country coverage.

Afghanistan uses the pinned upstream **black-red-green international-reference variant**, consistent with the existing
Flagpedia/flagcdn reference. See [Flagpedia's variant note](https://flagpedia.net/afghanistan). It is not described as the
de facto flag in use inside the country. That distinction belongs in the handoff, not a political classroom question.

The files make local assets available. The existing `flagUrl` still points to flagcdn because the brief prohibits editing
`src/lib/world-quiz/`. Claude must switch that consumer to the local path to make the existing flag mode offline.

## New question banks

- `which-is-bigger.ts`: 60 authored pairs, with numbers, units, years, sources, the larger country and a short explanation.
  Pair identity ignores left/right order and metric, so even a reversed or cross-metric duplicate is rejected by the tests.
- `capitals.ts`: one simply worded question per quiz country, with four distinct city choices and the source for its answer.
- `hello.ts`: one question per country. Choices are **greeting words**, not country names: languages are shared by many
  countries, so asking which country alone says “Hola” would be ambiguous. Every wrong choice comes from another quiz country
  on the same continent, uses a different language from the target, and differs from the answer. Common English spelling
  variants are excluded as distractors for English. Answer positions vary across the bank.
- `pin-drop.ts`: 80 places, combining 58 city centres from the existing `major-cities.ts` and 22 single-country landmarks
  from the checked `landmark-catalog.ts`. The new file records WGS84 lat/lng, country, a short authored fact and separate
  coordinate/fact reference URLs. Points are representative: rounded city centres and large natural areas must not be
  treated as survey coordinates or used with a tiny scoring tolerance. Border-spanning/disputed features and territories
  were omitted from this selection.

No runtime downloads, AI calls, ranking logic, pair work or classroom-results claims are introduced.

## Picture landmarks (21 October 2026)

`landmarks.ts` exports `LANDMARK_QUESTIONS`: 80 static country questions about named buildings, statues,
archaeological sites and natural features. `picture-question.ts` defines the shared schema. Level 1 means especially
widely recognised subjects; levels 2 and 3 introduce less familiar places. Difficulty is an editorial judgment.
Country names and continent groupings follow `QUIZ_COUNTRIES`; the four choices are distinct and on the same continent.
The `iso2` country is the answer at the zero-based `correctIndex`. Options are materialised data, not generated at runtime.

Each `sourceUrl` is a subject-specific reference for location and the short authored reveal fact, usually an encyclopedia
article. For example: [Eiffel Tower](https://en.wikipedia.org/wiki/Eiffel_Tower),
[Machu Picchu](https://en.wikipedia.org/wiki/Machu_Picchu), and [Borobudur](https://en.wikipedia.org/wiki/Borobudur).
No source is fetched by these modules. Shared-border landmarks such as Niagara, Iguazu and Victoria Falls, Everest and
the Matterhorn are omitted from this single-country bank.

`picture` is a two-to-five-word Wikimedia Commons search phrase for the physical subject, not an image URL, a person,
or a caption to display as an answer hint. Landmark names and geographic qualifiers distinguish similarly named places.
The bank supplies no image-fetching code or selected asset. Image selection belongs to game integration: a search can
also return maps, drawings or tourists, so the eventual consumer must choose a clear photograph of the named subject.
Nyhavn, Seoraksan and Charyn Canyon replace tentative subjects whose reviewed Commons references did not give a clear
subject photograph. No claim of classroom performance or universal recognition is made.

## Picture foods (21 October 2026)

`food.ts` exports `FOOD_QUESTIONS`: 60 static questions about named dishes with a clear modern culinary home.
They ask about the dish or regional style, not who first invented every ingredient, bread, noodle or cooking technique.
Fusion dishes such as banh mi and lomo saltado retain their Vietnamese and Peruvian culinary homes without erasing
outside influences. Local debates about a restaurant or inventor within the same country do not create two country answers.
Country choices are distinct and on the answer's quiz continent.

Most records link to a dish-specific article. Stronger direct cultural references are used for
[tom yum kung](https://ich.unesco.org/en/RL/tom-yum-kung-01879),
[attiéké](https://ich.unesco.org/en/RL/skills-related-to-attieke-production-in-cote-d-ivoire-02086),
[ceebu jën / thieboudienne](https://ich.unesco.org/en/RL/ceebu-jen-a-culinary-art-of-senegal-01748), and
[budae jjigae](https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=904&vcontsId=221258).
UNESCO listing is used as cultural provenance, not as proof that no other country cooks the food.

Disputed or broadly shared candidates were left out, including baklava, hummus, jollof rice, couscous, tamales, plov,
laksa and injera. Generic kimchi does not have a unique modern South Korean origin, so budae jjigae is used instead.
Quiche Lorraine and gazpacho were replaced after reviewing historical/shared regional origins; the report gives the full
omission list. Brussels waffles were replaced with the more visually specific stroopwafel. Short facts describe typical
ingredients without claiming every recipe is identical. The modules never fetch these references or food pictures.
