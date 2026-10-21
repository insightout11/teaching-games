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

## Picture animals (21 October 2026)

`animals.ts` exports `ANIMAL_QUESTIONS`: 60 static questions about living wild animals. Species and subspecies names
are used where a broad label would be ambiguous: red kangaroo, ring-tailed lemur, Cape mountain zebra, Sumatran orangutan
and Bornean orangutan. The queries identify the animal itself; for ambiguous common names the scientific name is used,
such as `Trachelophorus giraffa` for Madagascar's giraffe weevil. A photograph from a zoo can identify a species but is
not evidence that the species lives wild in the photograph's country.

Every entry has a species reference and `rangeIso2`: reviewed countries/territories excluded from wrong answers, including
native range and known introduced populations or visitors where relevant. It is a conservative exclusion list, not a
complete, timeless range atlas. The answer must be in the list, and none of the other options may be in it. All four
options follow the answer's quiz continent. Territories outside the playable roster can occur only as range metadata.
No exclusive-country claim is made merely because the list has one entry.

Shared-range guards include Indonesia/Malaysia for Bornean orangutans; Indonesia/Malaysia/Brunei for proboscis monkeys;
Rwanda/Uganda/DR Congo for mountain gorillas; and South Africa/Namibia plus reviewed visitors for African penguins.
Introduced radiated tortoises on Réunion/Mauritius and Japanese macaques in Texas are conservatively excluded too.
References include each species article and these cross-checks:
[proboscis monkey range](https://primate.wisc.edu/primate-info-net/pin-factsheets/pin-factsheet-proboscis-monkey/),
[radiated tortoise](https://museum.wa.gov.au/explore/articles/meet-radiated-tortoise),
[kiwi](https://www.doc.govt.nz/kiwi), and [koala](https://australian.museum/learn/animals/mammals/koala/).

Extinct animals, generic multi-country families and uncertain wild-range candidates were omitted or narrowed; see the
handoff report. No changing population numbers, danger levels or promised sightings are added. The static provenance
and search phrases add no runtime network requests, and no game integration is included.


## Exact photo review — 21 October 2026

`pictureFile` is an optional, exact Commons filename, paired with `pictureLicense`.
The selected images were displayed remotely and visually inspected for subject,
framing, daylight for landmarks, and visible answer-giving country names, national
flags or place captions. File descriptions and licence metadata were checked via
the Commons API. No image assets were downloaded or added to this repository.
The existing `picture` search phrases remain unchanged. Uncertain selections have
both optional fields omitted; this is not a claim of complete coverage.

The tables link the original file pages for full authorship, licence terms and
attribution. CC BY/CC BY-SA use still requires the displayed credit and licence
link; these data fields do not implement attribution or game rendering. See
[Commons licensing](https://commons.wikimedia.org/wiki/Commons:Licensing).
Continuous photographic panoramas are retained; separate-image montages are not.
Large natural features and archaeological sites use a coherent, recognizable view
of the feature or its main monuments, rather than claiming every kilometre or
building fits into one frame. Boudhanath's religious prayer flags are not national
answer flags. Captive settings are documented below; none has a visible zoo sign.

### Landmarks exact files

| Question | Exact file / original source | Licence | Author / credit |
| --- | --- | --- | --- |
| `landmark-eiffel-tower` | [File:Tour Eiffel Wikimedia Commons (cropped).jpg](https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons_(cropped).jpg) | Public domain | Benh LIEU SONG |
| `landmark-statue-of-liberty` | [File:Front view of Statue of Liberty (cropped).jpg](https://commons.wikimedia.org/wiki/File:Front_view_of_Statue_of_Liberty_(cropped).jpg) | CC0 | AskALotl |
| `landmark-great-wall` | [File:The Great Wall of China at Jinshanling-edit.jpg](https://commons.wikimedia.org/wiki/File:The_Great_Wall_of_China_at_Jinshanling-edit.jpg) | CC BY-SA 3.0 | Severin.stalder |
| `landmark-taj-mahal` | [File:Taj Mahal (Edited).jpeg](https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg) | CC BY-SA 4.0 | Yann ; edited by Jim Carter |
| `landmark-pyramids-of-giza` | [File:Pyramids of the Giza Necropolis.jpg](https://commons.wikimedia.org/wiki/File:Pyramids_of_the_Giza_Necropolis.jpg) | CC BY-SA 4.0 | KennyOMG |
| `landmark-colosseum` | [File:Colosseo 2020.jpg](https://commons.wikimedia.org/wiki/File:Colosseo_2020.jpg) | CC BY-SA 4.0 | FeaturedPics |
| `landmark-sydney-opera-house` | [File:Sydney Australia. (21339175489).jpg](https://commons.wikimedia.org/wiki/File:Sydney_Australia._(21339175489).jpg) | CC0 | Bernard Spragg. NZ from Christchurch, New Zealand |
| `landmark-big-ben` | [File:Elizabeth Tower and the north front of the Palace of Westminster, London.jpg](https://commons.wikimedia.org/wiki/File:Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster,_London.jpg) | CC BY-SA 4.0 | Christian David |
| `landmark-christ-the-redeemer` | [File:Christ the Redeemer - Cristo Redentor.jpg](https://commons.wikimedia.org/wiki/File:Christ_the_Redeemer_-_Cristo_Redentor.jpg) | CC BY-SA 3.0 de | Arne Müseler |
| `landmark-machu-picchu` | [File:Machu Picchu, 2023 (012).jpg](https://commons.wikimedia.org/wiki/File:Machu_Picchu,_2023_(012).jpg) | CC BY-SA 4.0 | Draceane |
| `landmark-angkor-wat` | [File:Angkor Wat.jpg](https://commons.wikimedia.org/wiki/File:Angkor_Wat.jpg) | CC BY-SA 4.0 | Bjørn Christian Tørrissen |
| `landmark-mount-fuji` | [File:View of Mount Fuji from Ōwakudani 20211202.jpg](https://commons.wikimedia.org/wiki/File:View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg) | CC BY-SA 4.0 | Suicasmo |
| `landmark-acropolis` | [File:View of the Acropolis of Athens from Mt Lycabettus on April 22, 2022.jpg](https://commons.wikimedia.org/wiki/File:View_of_the_Acropolis_of_Athens_from_Mt_Lycabettus_on_April_22,_2022.jpg) | CC BY-SA 4.0 | George E. Koronaios |
| `landmark-sagrada-familia` | [File:SF maig 2 cropped.jpg](https://commons.wikimedia.org/wiki/File:SF_maig_2_cropped.jpg) | CC BY-SA 4.0 | Canaan |
| `landmark-leaning-tower-of-pisa` | [File:The Leaning Tower of Pisa SB.jpeg](https://commons.wikimedia.org/wiki/File:The_Leaning_Tower_of_Pisa_SB.jpeg) | CC BY-SA 3.0 | Saffron Blaze |
| `landmark-stonehenge` | [File:Stonehenge2007 07 30.jpg](https://commons.wikimedia.org/wiki/File:Stonehenge2007_07_30.jpg) | CC BY 2.0 | garethwiscombe |
| `landmark-moai` | [File:AhuTongariki.JPG](https://commons.wikimedia.org/wiki/File:AhuTongariki.JPG) | CC BY 2.5 | Ian Sewell |
| `landmark-golden-gate-bridge` | [File:Golden Gate Bridge as seen from Battery East.jpg](https://commons.wikimedia.org/wiki/File:Golden_Gate_Bridge_as_seen_from_Battery_East.jpg) | CC BY-SA 4.0 | Frank Schulenburg |
| `landmark-grand-canyon` | [File:Canyon River Tree (165872763).jpeg](https://commons.wikimedia.org/wiki/File:Canyon_River_Tree_(165872763).jpeg) | CC BY 3.0 | Lennart Sikkema |
| `landmark-mount-rushmore` | [File:Mount Rushmore detail view (100MP).jpg](https://commons.wikimedia.org/wiki/File:Mount_Rushmore_detail_view_(100MP).jpg) | CC BY-SA 3.0 | Thomas Wolf , www.foto-tw.de |
| `landmark-cn-tower` | [File:CN Tower from Puente de Luz, Toronto, Ontario, 2025-08-25 01.jpg](https://commons.wikimedia.org/wiki/File:CN_Tower_from_Puente_de_Luz,_Toronto,_Ontario,_2025-08-25_01.jpg) | CC BY-SA 4.0 | Chris Woodrich |
| `landmark-chichen-itza` | [File:Chichen Itza 3.jpg](https://commons.wikimedia.org/wiki/File:Chichen_Itza_3.jpg) | CC BY-SA 4.0 | Daniel Schwen |
| `landmark-teotihuacan` | [File:ZA77 Teotihuacán edo de mex Herberto de la rosa.jpg](https://commons.wikimedia.org/wiki/File:ZA77_Teotihuac%C3%A1n_edo_de_mex_Herberto_de_la_rosa.jpg) | CC BY-SA 4.0 | Hdlrosa |
| `landmark-arenal-volcano` | [File:Arenal volcano (70785p) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Arenal_volcano_(70785p)_(cropped).jpg) | CC BY-SA 4.0 | Rhododendrites |
| `landmark-tikal` | [File:Tikal 3.jpg](https://commons.wikimedia.org/wiki/File:Tikal_3.jpg) | CC BY-SA 4.0 | Mundo Maya |
| `landmark-angel-falls` | [File:SaltoAngel1.jpg](https://commons.wikimedia.org/wiki/File:SaltoAngel1.jpg) | CC BY 2.0 | Rich Childs |
| `landmark-salar-de-uyuni` | [File:Salar de Uyuni-5 (53641294827).jpg](https://commons.wikimedia.org/wiki/File:Salar_de_Uyuni-5_(53641294827).jpg) | CC BY 2.0 | Otávio Nogueira from Fortaleza, BR |
| `landmark-sugarloaf-mountain` | [File:Pão de Açucar - Sugarloaf Mountain - Zuckerhut - 2022.jpg](https://commons.wikimedia.org/wiki/File:P%C3%A3o_de_A%C3%A7ucar_-_Sugarloaf_Mountain_-_Zuckerhut_-_2022.jpg) | CC BY-SA 3.0 de | Arne Müseler |
| `landmark-torres-del-paine` | [File:Mirador Base de Las Torres.jpg](https://commons.wikimedia.org/wiki/File:Mirador_Base_de_Las_Torres.jpg) | CC BY-SA 4.0 | RobertTarantino |
| `landmark-neuschwanstein-castle` | [File:Schloss Neuschwanstein 2013.jpg](https://commons.wikimedia.org/wiki/File:Schloss_Neuschwanstein_2013.jpg) | CC BY-SA 3.0 de | Thomas Wolf , www.foto-tw.de |
| `landmark-brandenburg-gate` | [File:Berlin-Brandenburg Gate overview.jpg](https://commons.wikimedia.org/wiki/File:Berlin-Brandenburg_Gate_overview.jpg) | CC BY-SA 3.0 | Cezary p at Polish Wikipedia |
| `landmark-kinderdijk` | [File:KinderdijkMolens02.jpg](https://commons.wikimedia.org/wiki/File:KinderdijkMolens02.jpg) | CC BY-SA 3.0 | Lucas Hirschegger |
| `landmark-saint-basil-s-cathedral` | [File:Saint Basil's Cathedral in Moscow.jpg](https://commons.wikimedia.org/wiki/File:Saint_Basil%27s_Cathedral_in_Moscow.jpg) | CC BY-SA 4.0 | Tsy1980 |
| `landmark-blue-mosque` | [File:Istanbul (34223582516) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Istanbul_(34223582516)_(cropped).jpg) | CC BY-SA 2.0 | Pedro Szekely from Los Angeles, USA |
| `landmark-hagia-sophia` | [File:Hagia Sophia (228968325).jpeg](https://commons.wikimedia.org/wiki/File:Hagia_Sophia_(228968325).jpeg) | CC BY-SA 3.0 | Adli Wahid |
| `landmark-himeji-castle` | [File:Himeji castle in may 2015.jpg](https://commons.wikimedia.org/wiki/File:Himeji_castle_in_may_2015.jpg) | CC BY-SA 4.0 | Nikos Kitsakis |
| `landmark-terracotta-army` | [File:51714-Terracota-Army.jpg](https://commons.wikimedia.org/wiki/File:51714-Terracota-Army.jpg) | CC BY 2.0 | xiquinhosilva |
| `landmark-borobudur` | [File:Borobudur-Nothwest-view.jpg](https://commons.wikimedia.org/wiki/File:Borobudur-Nothwest-view.jpg) | Public domain | Gunawan Kartapranata |
| `landmark-prambanan` | [File:Prambanan Temple Yogyakarta Indonesia.jpg](https://commons.wikimedia.org/wiki/File:Prambanan_Temple_Yogyakarta_Indonesia.jpg) | CC BY-SA 4.0 | Christopher Michel |
| `landmark-batu-caves` | [File:Batu Caves stairs 2022-05.jpg](https://commons.wikimedia.org/wiki/File:Batu_Caves_stairs_2022-05.jpg) | CC BY-SA 4.0 | Chainwit. |
| `landmark-chocolate-hills` | [File:Chocolate Hills Bohol.JPG](https://commons.wikimedia.org/wiki/File:Chocolate_Hills_Bohol.JPG) | CC BY-SA 3.0 | P199 |
| `landmark-banaue-rice-terraces` | [File:Banaue-terrace.JPG](https://commons.wikimedia.org/wiki/File:Banaue-terrace.JPG) | Public domain | User: (WT-shared) Roundtheworld at wts wikivoyage |
| `landmark-shwedagon-pagoda` | [File:Shwedagon Pagoda 2017.jpg](https://commons.wikimedia.org/wiki/File:Shwedagon_Pagoda_2017.jpg) | CC BY-SA 4.0 | Bjørn Christian Tørrissen |
| `landmark-pha-that-luang` | [File:Pha Than Luang stupa.jpg](https://commons.wikimedia.org/wiki/File:Pha_Than_Luang_stupa.jpg) | CC BY 2.0 | Wakxy |
| `landmark-ha-long-bay` | [File:Ha Long Bay in 2019.jpg](https://commons.wikimedia.org/wiki/File:Ha_Long_Bay_in_2019.jpg) | CC BY-SA 4.0 | Taewangkorea |
| `landmark-seoraksan` | [File:Seoraksan National Park panorama 3.jpg](https://commons.wikimedia.org/wiki/File:Seoraksan_National_Park_panorama_3.jpg) | CC BY-SA 4.0 | kallerna |
| `landmark-sigiriya` | [File:Sigiriya (141688197).jpeg](https://commons.wikimedia.org/wiki/File:Sigiriya_(141688197).jpeg) | CC BY-SA 3.0 | Wrobell |
| `landmark-lahore-fort` | [File:Lahore Fort view from Baradari.jpg](https://commons.wikimedia.org/wiki/File:Lahore_Fort_view_from_Baradari.jpg) | CC BY-SA 3.0 | Rohaan Bhatti |
| `landmark-badshahi-mosque` | [File:Badshahi Mosque front picture.jpg](https://commons.wikimedia.org/wiki/File:Badshahi_Mosque_front_picture.jpg) | CC BY-SA 4.0 | Romero Maia |
| `landmark-paro-taktsang` | [File:Paro Taktsang, Bhutan (edited).jpg](https://commons.wikimedia.org/wiki/File:Paro_Taktsang,_Bhutan_(edited).jpg) | CC BY 2.0 | Original: Nina R from Africa Derivative work: UnpetitproleX |
| `landmark-boudhanath` | [File:Boudhanath stupa , Kathmandu, Nepal.jpg](https://commons.wikimedia.org/wiki/File:Boudhanath_stupa_,_Kathmandu,_Nepal.jpg) | CC BY-SA 4.0 | Sumitbhatt222 |
| `landmark-registan` | [File:RegistanSquare Samarkand.jpg](https://commons.wikimedia.org/wiki/File:RegistanSquare_Samarkand.jpg) | CC BY 2.0 | Registan_-_Gusjer.jpg : Gustavo Jeronimo from Aranjuez, Spain derivative work: MrPanyGoff |
| `landmark-charyn-canyon` | [File:Charyn Canyon, Kazakhstan 03.jpg](https://commons.wikimedia.org/wiki/File:Charyn_Canyon,_Kazakhstan_03.jpg) | CC0 | Bgag |
| `landmark-gergeti-trinity-church` | [File:Gergeti Trinity Church 09.23.jpg](https://commons.wikimedia.org/wiki/File:Gergeti_Trinity_Church_09.23.jpg) | CC BY 4.0 | Full attribution on linked file page |
| `landmark-temple-of-garni` | [File:Garni temple 2021 drone.jpg](https://commons.wikimedia.org/wiki/File:Garni_temple_2021_drone.jpg) | CC BY-SA 4.0 | Yerevantsi |
| `landmark-naqsh-e-jahan-square` | [File:Naqsh-i Jahan Square, Jan. 2018.jpg](https://commons.wikimedia.org/wiki/File:Naqsh-i_Jahan_Square,_Jan._2018.jpg) | CC BY-SA 4.0 | احمد جمالی مقدم |
| `landmark-timgad` | [File:Timgad (15685889550).jpg](https://commons.wikimedia.org/wiki/File:Timgad_(15685889550).jpg) | CC BY-SA 2.0 | Dan Sloan |
| `landmark-koutoubia-mosque` | [File:Marokko0112 (retouched).jpg](https://commons.wikimedia.org/wiki/File:Marokko0112_(retouched).jpg) | CC BY-SA 4.0 | Rol1000 |
| `landmark-abu-simbel` | [File:Ramsis, Aswan Governorate, Egypt - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Ramsis,_Aswan_Governorate,_Egypt_-_panoramio.jpg) | CC BY 3.0 | youssef_alam |
| `landmark-lalibela-churches` | [File:Lalibela, san giorgio, esterno 24.jpg](https://commons.wikimedia.org/wiki/File:Lalibela,_san_giorgio,_esterno_24.jpg) | CC BY 3.0 | Sailko |
| `landmark-mount-kilimanjaro` | [File:Kilimanjaro from Amboseli.jpg](https://commons.wikimedia.org/wiki/File:Kilimanjaro_from_Amboseli.jpg) | CC BY-SA 4.0 | Sergey Pesterev |
| `landmark-table-mountain` | [File:Table Mountain DanieVDM.jpg](https://commons.wikimedia.org/wiki/File:Table_Mountain_DanieVDM.jpg) | CC BY 2.0 | Danie van der Merwe from Cape Town, South Africa |
| `landmark-sossusvlei` | [File:Sossusvlei south view.jpg](https://commons.wikimedia.org/wiki/File:Sossusvlei_south_view.jpg) | CC BY-SA 3.0 | Hans Hillewaert |
| `landmark-avenue-of-the-baobabs` | [File:Walking the Avenue of the Baobabs.jpg](https://commons.wikimedia.org/wiki/File:Walking_the_Avenue_of_the_Baobabs.jpg) | CC BY-SA 3.0 | Gavinevans |
| `landmark-great-zimbabwe` | [File:Conical Tower - Great Enclosure III (33736918448).jpg](https://commons.wikimedia.org/wiki/File:Conical_Tower_-_Great_Enclosure_III_(33736918448).jpg) | CC BY-SA 2.0 | Andrew Moore from Johannesburg, South Africa |

Without a selected photo:

- `landmark-petra` — Reviewed night scene, cropped facade and architectural-detail candidates; no verified whole daylight view selected.
- `landmark-burj-khalifa` — Reviewed sunset silhouette, distant skyline and view-from-the-tower candidates; none clearly shows the whole tower as main subject.
- `landmark-hollywood-sign` — The sign itself spells HOLLYWOOD, a readable place name; cannot retain the whole landmark and remove this clue without editing the image.
- `landmark-panama-canal` — Lock photo visibly says PANAMA CANAL; alternative aerial entrance view is dark/distant and does not clearly show the landmark.
- `landmark-galapagos-islands` — First island view offers only Copyrighted free use; the astronaut photograph is annotated with GALAPAGOS and island names.
- `landmark-atomium` — Reviewed twilight, cropped sphere and cropped archival/construction views; none verifies a complete daylight landmark.
- `landmark-nyhavn` — Reviewed canal photographs show or may show national flags; no confidently flag-free selection.
- `landmark-fushimi-inari-shrine` — Reviewed torii passages show only part of the shrine and readable donor/place inscriptions; no verified whole, clue-free view.
- `landmark-forbidden-city` — Reviewed sunset panorama, isolated corner tower and cropped gate views; no clear whole daylight site selected.
- `landmark-leshan-giant-buddha` — Reviewed boat-obstructed, feet-cropped and head-cropped views; none shows the whole Buddha unobstructed.
- `landmark-petronas-towers` — Reviewed twilight, night panorama and cropped shopping-centre/tower views; no complete daylight pair selected.
- `landmark-wat-arun` — Riverfront view contains national flags; alternative gate/ordination-hall views do not clearly show the whole landmark/main prang.
- `landmark-grand-palace` — Reviewed night scenes and cropped palace details; no verified whole daylight landmark selected.
- `landmark-golden-bridge` — Reviewed close-up and low-sun aerial view; bridge runs out of frame, and daylight requirement is uncertain for aerial.
- `landmark-gyeongbokgung` — Overview offers KOGL Type 1, outside the allowed list; alternative shows only the throne hall and its readable name plaque.
