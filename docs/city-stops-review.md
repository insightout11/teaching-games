# City stops and souvenirs — DRAFT for Matt's review

Data only; no room, phone, inventory, voting or rendering changes. Branch `codex/city-stops`, based on local `origin/main` at `0215d0ac`. `city-packs.json` is unchanged. Phase 2: **50 cities, 200 stops, 600 rewards**.

## Dubai-first coverage

The actual `WORLD_FLIGHT_RANGE_TIERS` are 5200 km, 6800 km, 8500 km, 10500 km, 13000 km. The longest is **13,000 km**. Great-circle distances use the existing `routeLengthKm` function and the coordinates in `WORLD_DESTINATIONS`, joined to all 50 city-pack IDs. There are **39 reachable destinations other than Dubai**, plus Dubai's own stop data: 40 cities in step 1. This is the maximum-tier list, not a claim that Matt's particular class already has that tier. Minimum tiers are shown below.

| Step 1 city | City id | Distance from Dubai, km | First tier that reaches it |
| --- | --- | --- | --- |
| Dubai | dubai | 0 | departure city |
| Mumbai | mumbai | 1935 | Starter range |
| Delhi | delhi | 2205 | Starter range |
| Cairo | cairo | 2423 | Starter range |
| Addis Ababa | addis-ababa | 2511 | Starter range |
| Almaty | almaty | 2803 | Starter range |
| Istanbul | istanbul | 2994 | Starter range |
| Nairobi | nairobi | 3553 | Starter range |
| Moscow | moscow | 3687 | Starter range |
| Rome | rome | 4321 | Starter range |
| Berlin | berlin | 4624 | Starter range |
| Bangkok | bangkok | 4885 | Starter range |
| Ulaanbaatar | ulaanbaatar | 5134 | Starter range |
| Amsterdam | amsterdam | 5159 | Starter range |
| Paris | paris | 5247 | Regional reach |
| London | london | 5473 | Regional reach |
| Ho Chi Minh City | ho-chi-minh-city | 5625 | Regional reach |
| Madrid | madrid | 5656 | Regional reach |
| Singapore | singapore | 5837 | Regional reach |
| Beijing | beijing | 5842 | Regional reach |
| Lagos | lagos | 5883 | Regional reach |
| Dublin | dublin | 5915 | Regional reach |
| Hong Kong | hong-kong | 5955 | Regional reach |
| Lisbon | lisbon | 6133 | Regional reach |
| Shanghai | shanghai | 6426 | Regional reach |
| Jakarta | jakarta | 6576 | Regional reach |
| Seoul | seoul | 6783 | Regional reach |
| Reykjavik | reykjavik | 6886 | Ocean reach |
| Manila | manila | 6909 | Ocean reach |
| Dakar | dakar | 7608 | Ocean reach |
| Cape Town | cape-town | 7640 | Ocean reach |
| Tokyo | tokyo | 7930 | Ocean reach |
| Perth | perth | 9038 | Intercontinental reach |
| Recife | recife | 10402 | Intercontinental reach |
| New York | new-york | 11008 | Global reach |
| Toronto | toronto | 11071 | Global reach |
| Vancouver | vancouver | 11731 | Global reach |
| Rio de Janeiro | rio-de-janeiro | 11870 | Global reach |
| Sydney | sydney | 12050 | Global reach |
| Miami | miami | 12600 | Global reach |

Step 2: Los Angeles, Bogota, Buenos Aires, Honolulu, Panama City, Suva, Auckland, Mexico City, Santiago, Lima.

## Reuse versus new

- **237 shelf rewards reuse city-pack souvenir concepts/facts**, with their exact existing ID in `fromCityPacks`.
- **213 new shelf rewards** fill the restaurant/station/sights choices to three each.
- **150 new avatar accessories**, three different allowed types per city. These use the requested accessory schema, which has no `fromCityPacks` field.
- Total new reward entries: **363**. New IDs are namespaced with `-stop-` to avoid collisions with legacy landing rewards. Each reused source appears at most once within its city.

“Reused” means a source-backed adaptation, not necessarily a byte-for-byte copy. Existing descriptions and art prompts are preserved where suitable; pins, leaves, instruments and other sight concepts become model/tile/magnet designs. 72 reused entries have adapted names. Food-themed pins/bibs/charms become edible portions or cups. Ordinary pantry ingredients sometimes provide a third food reward using the existing recipe fact, rather than inventing a dish.

## Editorial decisions and things to check

- These are classroom souvenir designs, not claims about a venue's current gift-shop stock, exact menu, ticket format, fares or opening hours. All stickers are null until suitable artwork is selected; icon names come from the existing city packs. Food includes drinks and ingredients, as well as meals. Sight rewards are models, tiles or magnets.
- Market rewards are modern accessories, never national dress, uniforms or ceremonial clothing. The exact hex shades are illustration choices inspired by real city materials/landmarks/nature, **not official municipal colours or measured colour samples**. Each city's basis is given below; motifs are design interpretations, not claims that a local artisan already sells that product.
- Market scenes ask about prices and budgets without requiring bargaining everywhere. Fixed-price craft stalls, Tokyo shops and department stores should not be portrayed as places where haggling is expected.
- Recipe ingredients vary. Scenes ask what is in a dish rather than promising any dish is suitable for an allergy or diet. No particular menu, schedule, booking or live service is asserted.
- Periodic markets include Chatuchak, Mauerpark, El Rastro, the High Court Maasai Market, Feira da Ladra, Kolaportid, Feira Hippie, The Rocks Markets, Plaza Dorrego, Aloha Stadium Swap Meet and Otara. The classroom setting is not a claim they operate on the lesson's real weekday. Some are weekend markets.
- Greater-city scope is explicit where needed: the Giza pyramids are in Greater Cairo, Saint-Ouen is just outside Paris proper, Fremantle is in metropolitan Perth, and Aloha Stadium is in the Honolulu metropolitan area on Oahu. These are not silently moved into a different city's centre.
- **Corrected legacy details without changing city-packs.json:** Almaty's cathedral description uses the supported wooden structure and drops the “without metal nails” claim; Santiago's `avocado-toast` source describes a completo hot dog, so this reward's name/art now match that fact; Addis Ababa's Lucy wording states where the fossil is held and does not promise an original fossil is on public display; food-themed pins/bibs become actual food designs. Copying a source ID does not endorse every old label or illustration.
- **Current venue checks changed the draft:** Cape Town uses Time Out Market rather than the former V&A Food Market; Hong Kong uses the Tourism Board's current Lin Heung Tea House location on Des Voeux Road Central rather than an old Wellington Street address. Addis uses a full-service Ethiopian restaurant rather than treating a coffee-only stop as a meal venue.
- **Check with Matt:** the brief says “Friday 7 November”; 7 November 2026 is a Saturday (7 November 2025 was Friday). This does not affect the Dubai range calculation or stop data, and no lesson date has been changed.
- Names retain familiar English transliterations for A2–B1 readability. Local pronunciations and simplified names may need teacher guidance. The broad city palettes and souvenir adaptations are an editorial draft for Matt, not locally certified merchandise.
- Research links below support place identity/context and flag useful primary operator/tourism pages. They are not guarantees of current menus, stocks or services. Dakar's Chez Loutcha and Nairobi's rotating market location also use secondary local listings; reconfirm those operational details if planning a real visit. No one was contacted.

## City tables

### Dubai (`dubai`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Arabian Tea House in Al Fahidi | Order a meal for your group and ask what is in each dish. | Luqaimat sweets (reused); Date bowl (reused); Arabic coffee cup |
| market | the Textile Souk in Bur Dubai | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Dubai sun hat; Dubai scarf; Dubai bracelet |
| station | Bur Dubai Abra Station | Ask how to buy a ticket and find the right departure point for your group. | Abra boat charm (reused); Dhow sail model (reused); Dubai boat ticket |
| sights | Al Fahidi Historical Neighbourhood | Describe what you can see and ask a guide two questions about this place. | Wind tower model (reused); Dubai sight model; Dubai view magnet |

Accessory palette: `#C79B52` / `#205C78`, inspired by sand-coloured buildings and blue Dubai Creek; motif: wind-tower shapes.

Place-check references: [reference 1](https://www.visitdubai.com/articles/dubai-cultural-walking-tour), [reference 2](https://arabianteahouse.com/al-fahidi/), [reference 3](https://www.visitdubai.com/en/places-to-visit/the-textile-souk).

Reused source IDs: `dubai-luqaimat`, `dubai-date-bowl`, `dubai-abra-boat`, `dubai-dhow-sail`, `dubai-wind-tower`.

### Mumbai (`mumbai`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a snack stall at Girgaum Chowpatty | Order a meal for your group and ask what is in each dish. | Vada pav snack (reused); Bhelpuri paper cone (reused); Potato fritter |
| market | the stalls on Colaba Causeway | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Mumbai umbrella; Mumbai bag; Mumbai bracelet |
| station | Chhatrapati Shivaji Maharaj Terminus | Ask how to buy a ticket and find the right platform for your group. | Local train charm (reused); Mumbai train ticket; Mumbai route-map card |
| sights | the Gateway of India | Describe what you can see and ask a guide two questions about this place. | Harbor arch magnet (reused); Mumbai sight model; Mumbai view magnet |

Accessory palette: `#D5B68B` / `#246678`, inspired by stone at the Gateway of India and the blue waterfront; motif: stone-arch shapes.

Place-check references: [reference 1](https://mumbaicity.gov.in/en/tourism/places-of-interest/).

Reused source IDs: `mumbai-vada-pav`, `mumbai-bhelpuri-cone`, `mumbai-local-train`, `mumbai-harbor-tram`.

### Delhi (`delhi`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall in Paranthe Wali Gali | Order a meal for your group and ask what is in each dish. | Stuffed paratha (reused); Spice scoop charm (reused); Potato filling bowl |
| market | Dilli Haat at INA | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Delhi sun hat; Delhi scarf; Delhi bracelet |
| station | New Delhi railway station | Ask how to buy a ticket and find the right platform for your group. | Metro token (reused); Delhi train ticket; Delhi route-map card |
| sights | the Red Fort | Describe what you can see and ask a guide two questions about this place. | Red fort arch tile (reused); Peacock feather pin tile (reused); Delhi sight model |

Accessory palette: `#A84433` / `#D5AA66`, inspired by the Red Fort's red stone and pale sandstone details; motif: red-sandstone arches.

Place-check references: [reference 1](https://www.incredibleindia.gov.in/en/delhi/delhi), [reference 2](https://www.incredibleindia.gov.in/en/delhi/delhi/dilli-haat), [reference 3](https://srdc.delhi.gov.in/en/srdc/1600-1700).

Reused source IDs: `delhi-paratha`, `delhi-spice-scoop`, `delhi-metro-token`, `delhi-fort-arch`, `delhi-peacock-feather`.

### Cairo (`cairo`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Koshary Abou Tarek in downtown Cairo | Order a meal for your group and ask what is in each dish. | Koshari bowl (reused); Lentil bowl; Chickpea bowl |
| market | Khan el-Khalili market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Cairo sun hat; Cairo scarf; Cairo bracelet |
| station | Ramses railway station | Ask how to buy a ticket and find the right platform for your group. | Nile felucca (reused); Cairo train ticket; Cairo route-map card |
| sights | the Giza pyramids in Greater Cairo | Describe what you can see and ask a guide two questions about this place. | Pyramid model (reused); Papyrus bookmark tile (reused); Market lantern tile (reused) |

Accessory palette: `#D8BB7A` / `#27768A`, inspired by the pyramids' sandy stone and blue Nile water; motif: pyramid outlines.

Place-check references: [reference 1](https://www.koshary-aboutarek.com/en/contact-us), [reference 2](https://www.experienceegypt.eg/en/office/list), [reference 3](https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau/).

Reused source IDs: `cairo-koshari-bowl`, `cairo-nile-felucca`, `cairo-pyramid-model`, `cairo-papyrus-bookmark`, `cairo-market-lantern`.

### Addis Ababa (`addis-ababa`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Yod Abyssinia restaurant in Bole | Order a meal for your group and ask what is in each dish. | Injera bread (reused); Ethiopian coffee cup (reused); Berbere spice bowl (reused) |
| market | Merkato market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Addis Ababa sun hat; Addis Ababa scarf; Addis Ababa bracelet |
| station | Legehar light-rail station | Ask how to buy a ticket and find the right platform for your group. | Addis Ababa tram ticket; Addis Ababa route-map card; Addis Ababa tram model |
| sights | the National Museum of Ethiopia | Describe what you can see and ask a guide two questions about this place. | Fossil replica charm tile (reused); Highland flower pin tile (reused); Addis Ababa sight model |

Accessory palette: `#774F35` / `#E8D8B8`, inspired by brown coffee beans and pale injera; motif: coffee-bean shapes.

Place-check references: [reference 1](https://yodabyssiniaplc.com/cultural-restaurant/), [reference 2](https://aatc.gov.et/), [reference 3](https://www.aalrt.gov.et/), [reference 4](https://www.transit.land/explore/stops/s-scee3be99f-leghar).

Reused source IDs: `addis-ababa-injera-basket`, `addis-ababa-coffee-pot`, `addis-ababa-spice-bowl`, `addis-ababa-fossil-replica`, `addis-ababa-highland-flower`.

### Almaty (`almaty`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at the Green Bazaar | Order a meal for your group and ask what is in each dish. | Almaty apple basket (reused); Lagman noodle bowl (reused); Apple slices |
| market | the Green Bazaar | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Almaty scarf; Almaty cap; Almaty badge |
| station | the lower Kok Tobe cable-car station | Ask how to buy a ticket and find the right departure point for your group. | Mountain cable car (reused); Almaty cable car ticket; Almaty route-map card |
| sights | Ascension Cathedral in Panfilov Park | Describe what you can see and ask a guide two questions about this place. | Wooden cathedral charm tile (reused); Mountain ski pin tile (reused); Almaty sight model |

Accessory palette: `#A9C65A` / `#D9B14C`, inspired by green apples and yellow cathedral walls; motif: apple branches.

Place-check references: [reference 1](https://www.kazakhstan.travel/en/regions/almaty), [reference 2](https://kazakhstan.travel/en/attractions/403), [reference 3](https://kazakhstan.travel/en/attractions/404).

Reused source IDs: `almaty-apple-basket`, `almaty-noodle-bowl`, `almaty-cable-car`, `almaty-cathedral-dome`, `almaty-mountain-ski`.

### Istanbul (`istanbul`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a simit stall at Eminonu Square | Order a meal for your group and ask what is in each dish. | Simit bread ring (reused); Tea glass charm (reused); Sesame seed pouch |
| market | the Grand Bazaar | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Istanbul sun hat; Istanbul scarf; Istanbul bracelet |
| station | Sirkeci Marmaray station | Ask how to buy a ticket and find the right platform for your group. | Ferry token (reused); Istanbul train ticket; Istanbul route-map card |
| sights | the courtyard of the Blue Mosque | Describe what you can see and ask a guide two questions about this place. | Ceramic tulip tile (reused); Istanbul sight model; Istanbul view magnet |

Accessory palette: `#2669A0` / `#EFE5CB`, inspired by blue ceramic decoration and pale stone; motif: blue floral tiles.

Place-check references: [reference 1](https://istanbul.ktb.gov.tr/?_Dil=2), [reference 2](https://visit.istanbul/spice-bazaar).

Reused source IDs: `istanbul-simit-ring`, `istanbul-tea-glass`, `istanbul-ferry-token`, `istanbul-ceramic-tile`.

### Nairobi (`nairobi`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Carnivore restaurant in Langata | Order a meal for your group and ask what is in each dish. | Nyama choma skewer (reused); Ugali serving bowl (reused); Maize flour bowl |
| market | the Maasai Market at the High Court car park | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Nairobi sun hat; Nairobi scarf; Nairobi bracelet |
| station | Nairobi Central railway station | Ask how to buy a ticket and find the right platform for your group. | Matatu model (reused); Nairobi train ticket; Nairobi route-map card |
| sights | Nairobi National Park | Describe what you can see and ask a guide two questions about this place. | Giraffe park badge tile (reused); Acacia tree charm tile (reused); Nairobi sight model |

Accessory palette: `#BF985C` / `#507548`, inspired by dry grass and green acacia trees near the city; motif: acacia branches.

Place-check references: [reference 1](https://krc.co.ke/nairobi-central-station-gets-a-face-lift/), [reference 2](https://app.carnivore.tamarind.co.ke/booking), [reference 3](https://www.nairobibreaks.com/city/nairobi/articles/where-to-find-kenyan-made-souvenirs-at-nairobi-s-maasai-market).

Reused source IDs: `nairobi-nyama-choma-skewer`, `nairobi-ugali-bowl`, `nairobi-matatu-model`, `nairobi-giraffe-badge`, `nairobi-acacia-tree`.

### Moscow (`moscow`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Danilovsky Market | Order a meal for your group and ask what is in each dish. | Blini stack (reused); Jam pot; Sour cream pot |
| market | the craft stalls at Izmailovo Kremlin | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Moscow scarf; Moscow cap; Moscow badge |
| station | Komsomolskaya metro station | Ask how to buy a ticket and find the right platform for your group. | Metro map case (reused); Moscow train ticket; Moscow route-map card |
| sights | Saint Basil's Cathedral on Red Square | Describe what you can see and ask a guide two questions about this place. | Domed cathedral model (reused); Park snow globe tile (reused); Nested wooden dolls tile (reused) |

Accessory palette: `#A53F3D` / `#D5AF58`, inspired by red cathedral brick and golden dome details; motif: onion-dome outlines.

Place-check references: [reference 1](https://danilovskymarket.ru/ru/contacts), [reference 2](https://www.mos.ru/upload/documents/files/321/KartaMoskvinaangliiskomyazikeA3.pdf).

Reused source IDs: `moscow-blini-stack`, `moscow-metro-map`, `moscow-domed-cathedral`, `moscow-park-snowglobe`, `moscow-matryoshka`.

### Rome (`rome`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Testaccio Market | Order a meal for your group and ask what is in each dish. | Supplì snack (reused); Espresso cup (reused); Cacio e pepe bowl (reused) |
| market | Testaccio Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Rome sun hat; Rome scarf; Rome bracelet |
| station | Roma Termini railway station | Ask how to buy a ticket and find the right platform for your group. | Rome train ticket; Rome route-map card; Rome train model |
| sights | the Colosseum | Describe what you can see and ask a guide two questions about this place. | Stone arch model (reused); Arena miniature (reused); Rome sight model |

Accessory palette: `#C2764D` / `#E8D4AD`, inspired by warm brick and pale stone around ancient Rome; motif: stone arches.

Place-check references: [reference 1](https://www.mercatoditestaccio.it/), [reference 2](https://www.turismoroma.it/it/luoghi/piazza-testaccio), [reference 3](https://www.turismoroma.it/sites/default/files/zetema_mappa_2022_2.pdf).

Reused source IDs: `rome-suppli-snack`, `rome-espresso-cup`, `rome-cacio-pepe-bowl`, `rome-stone-arch`, `rome-colosseum-miniature`.

### Berlin (`berlin`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Markthalle Neun | Order a meal for your group and ask what is in each dish. | Currywurst fork (reused); Döner wrap (reused); Curry sauce pot |
| market | the flea market at Mauerpark | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Berlin scarf; Berlin cap; Berlin badge |
| station | Berlin Hauptbahnhof | Ask how to buy a ticket and find the right platform for your group. | S-Bahn ticket (reused); Park bicycle bell (reused); Berlin train ticket |
| sights | the Brandenburg Gate | Describe what you can see and ask a guide two questions about this place. | Column gate miniature (reused); Berlin sight model; Berlin view magnet |

Accessory palette: `#D1BB91` / `#50776B`, inspired by the Gate's pale sandstone and green bronze sculpture; motif: gate columns.

Place-check references: [reference 1](https://www.visitberlin.de/de/markthalle-neun), [reference 2](https://www.berlin.de/special/shopping/markthallen/).

Reused source IDs: `berlin-currywurst-fork`, `berlin-doner-wrap`, `berlin-sbahn-ticket`, `berlin-park-bicycle`, `berlin-gate-miniature`.

### Bangkok (`bangkok`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | the food court at Or Tor Kor Market | Order a meal for your group and ask what is in each dish. | Noodle bowl (reused); Peanut topping pouch; Tamarind sauce jar |
| market | Chatuchak Weekend Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Bangkok sun hat; Bangkok scarf; Bangkok bracelet |
| station | Saphan Taksin BTS station | Ask how to buy a ticket and find the right platform for your group. | Tuk-tuk model (reused); River boat token (reused); Bangkok train ticket |
| sights | Wat Arun by the Chao Phraya River | Describe what you can see and ask a guide two questions about this place. | Porcelain temple spire tile (reused); Bangkok sight model; Bangkok view magnet |

Accessory palette: `#E5D4B2` / `#3593A4`, inspired by pale porcelain on Wat Arun and blue-green river water; motif: porcelain-flower shapes.

Place-check references: [reference 1](https://www.tourismthailand.org/Destinations/Provinces/Bangkok/219), [reference 2](https://www.tourismthailand.org/Attraction/wat-arun-ratchawararam-ratchawaramahawihan).

Reused source IDs: `bangkok-noodle-bowl`, `bangkok-tuk-tuk`, `bangkok-river-boat`, `bangkok-temple-spire`.

### Ulaanbaatar (`ulaanbaatar`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at the State Department Store | Order a meal for your group and ask what is in each dish. | Buuz steamer basket (reused); Dumpling filling bowl; Milk tea cup |
| market | Narantuul Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Ulaanbaatar scarf; Ulaanbaatar cap; Ulaanbaatar badge |
| station | Ulaanbaatar railway station | Ask how to buy a ticket and find the right platform for your group. | Ulaanbaatar train ticket; Ulaanbaatar route-map card; Ulaanbaatar train model |
| sights | Gandantegchinlen Monastery | Describe what you can see and ask a guide two questions about this place. | Ger tent model (reused); Monastery bell charm tile (reused); Ulaanbaatar sight model |

Accessory palette: `#E8DFCD` / `#3770A0`, inspired by pale felt on gers and blue sky; motif: round ger outlines.

Place-check references: [reference 1](https://tourism.ub.gov.mn/wp-content/uploads/Ulaanbaatar-english-2025-hewleh_compressed.pdf), [reference 2](https://visitulaanbaatar.net/storage/files/Guide%20book%2020211026.pdf).

Reused source IDs: `ulaanbaatar-buuz-steamer`, `ulaanbaatar-yurt-model`, `ulaanbaatar-monastery-bell`.

### Amsterdam (`amsterdam`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Albert Cuyp Market | Order a meal for your group and ask what is in each dish. | Stroopwafel pair (reused); Bitterballen plate (reused); Syrup jar |
| market | Albert Cuyp Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Amsterdam sun hat; Amsterdam scarf; Amsterdam bracelet |
| station | Amsterdam Centraal station | Ask how to buy a ticket and find the right platform for your group. | Bicycle bell (reused); Houseboat charm (reused); Amsterdam train ticket |
| sights | the canal houses on Herengracht | Describe what you can see and ask a guide two questions about this place. | Canal house model (reused); Amsterdam sight model; Amsterdam view magnet |

Accessory palette: `#9C4C3B` / `#42798B`, inspired by red-brown canal-house bricks and blue canal water; motif: stepped canal-house roofs.

Place-check references: [reference 1](https://www.iamsterdam.com/en/see-and-do/shopping-and-markets/top-markets-in-amsterdam-for-food-and-flowers), [reference 2](https://www.iamsterdam.com/uit/agenda/winkelen/markten/albert-cuypmarkt).

Reused source IDs: `amsterdam-stroopwafel`, `amsterdam-bitterballen`, `amsterdam-bicycle-bell`, `amsterdam-houseboat`, `amsterdam-canal-house`.

### Paris (`paris`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a bakery on Rue Montorgueil | Order a meal for your group and ask what is in each dish. | Butter croissant (reused); Café cup (reused); Baguette |
| market | the stalls at Marche aux Puces de Saint-Ouen | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Paris sun hat; Paris scarf; Paris bracelet |
| station | Gare de Lyon railway station | Ask how to buy a ticket and find the right platform for your group. | Seine boat (reused); Paris train ticket; Paris route-map card |
| sights | the Louvre's pyramid courtyard | Describe what you can see and ask a guide two questions about this place. | Glass pyramid model (reused); River bridge tile (reused); Paris sight model |

Accessory palette: `#D6C5A4` / `#6A91A8`, inspired by pale Louvre stone and blue reflections in its glass pyramid; motif: glass-pyramid lines.

Place-check references: [reference 1](https://www.maison-collet.com/), [reference 2](https://files.parisjetaime.com/pro/carte-paris-a-pied-en.pdf).

Reused source IDs: `paris-croissant`, `paris-cafe-cup`, `paris-river-boat`, `paris-glass-pyramid`, `paris-bridge-tile`.

### London (`london`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Borough Market | Order a meal for your group and ask what is in each dish. | Afternoon tea cup (reused); Pie and mash plate (reused); Scone |
| market | the Apple Market in Covent Garden | Compare three accessories, ask about sizes and colours, and choose one within your budget. | London sun hat; London scarf; London bracelet |
| station | London Waterloo station | Ask how to buy a ticket and find the right platform for your group. | Double-decker bus (reused); Black cab token (reused); London train ticket |
| sights | Tower Bridge | Describe what you can see and ask a guide two questions about this place. | Red phone box tile (reused); London sight model; London view magnet |

Accessory palette: `#CA4944` / `#739CAB`, inspired by red buses and pale blue details on Tower Bridge; motif: bridge-tower outlines.

Place-check references: [reference 1](https://www.visitlondon.com/things-to-do/london-attractions-map).

Reused source IDs: `london-tea-cup`, `london-pie-mash-plate`, `london-double-decker`, `london-black-cab`, `london-phone-box`.

### Ho Chi Minh City (`ho-chi-minh-city`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Ben Thanh Market | Order a meal for your group and ask what is in each dish. | Banh mi sandwich (reused); Drip coffee filter (reused); Pickled vegetable bowl |
| market | Ben Thanh Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Ho Chi Minh City umbrella; Ho Chi Minh City bag; Ho Chi Minh City bracelet |
| station | Ben Thanh metro station | Ask how to buy a ticket and find the right platform for your group. | City scooter model (reused); Ho Chi Minh City train ticket; Ho Chi Minh City route-map card |
| sights | the Saigon Central Post Office | Describe what you can see and ask a guide two questions about this place. | Market clock charm tile (reused); Ho Chi Minh City sight model; Ho Chi Minh City view magnet |

Accessory palette: `#E3C56E` / `#4A7B67`, inspired by the post office's yellow walls and green details; motif: post-office arch shapes.

Place-check references: [reference 1](https://vietnam.travel/things-to-do/7-must-see-attractions-hcmc), [reference 2](https://tphcm.chinhphu.vn/chinh-thuc-van-hanh-metro-so-1-101241222121342133.htm).

Reused source IDs: `ho-chi-minh-city-banh-mi`, `ho-chi-minh-city-coffee-filter`, `ho-chi-minh-city-scooter`, `ho-chi-minh-city-market-clock`.

### Madrid (`madrid`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Chocolateria San Gines | Order a meal for your group and ask what is in each dish. | Churros cup (reused); Chocolate cup; Sugar pouch |
| market | El Rastro market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Madrid sun hat; Madrid scarf; Madrid bracelet |
| station | Atocha railway station | Ask how to buy a ticket and find the right platform for your group. | Metro ticket case (reused); Madrid train ticket; Madrid route-map card |
| sights | the Prado Museum | Describe what you can see and ask a guide two questions about this place. | Museum paintbrush tile (reused); Football scarf tile (reused); Madrid sight model |

Accessory palette: `#AA6553` / `#65816C`, inspired by warm brick and green trees around the Prado; motif: museum-window shapes.

Place-check references: [reference 1](https://www.esmadrid.com/sites/default/files/documentos/student_guide_2017_en.pdf).

Reused source IDs: `madrid-churros`, `madrid-metro-ticket`, `madrid-museum-brush`, `madrid-football`.

### Singapore (`singapore`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Maxwell Food Centre | Order a meal for your group and ask what is in each dish. | Kaya toast charm (reused); Hawker meal tray (reused); Chilli crab plate (reused) |
| market | Bugis Street market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Singapore umbrella; Singapore bag; Singapore bracelet |
| station | City Hall MRT station | Ask how to buy a ticket and find the right platform for your group. | Singapore train ticket; Singapore route-map card; Singapore train model |
| sights | the Supertree Grove at Gardens by the Bay | Describe what you can see and ask a guide two questions about this place. | Garden tree magnet (reused); Orchid garden pin tile (reused); Singapore sight model |

Accessory palette: `#8C5B95` / `#64A57B`, inspired by purple orchids and green leaves in the city's gardens; motif: orchid flowers.

Place-check references: [reference 1](https://chinatown.sg/dine/maxwell-hawker-centre/), [reference 2](https://www.visitsingapore.com/content/dam/desktop/global/about-singapore/traveller-information/tos_SingaporeLBBB-Full.pdf).

Reused source IDs: `singapore-kaya-toast`, `singapore-hawker-tray`, `singapore-chili-crab-bib`, `singapore-garden-tree`, `singapore-orchid-pin`.

### Beijing (`beijing`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Huguosi Snack Street | Order a meal for your group and ask what is in each dish. | Roast duck plate (reused); Jianbing wrap (reused); Duck pancake |
| market | Panjiayuan market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Beijing sun hat; Beijing scarf; Beijing bracelet |
| station | Beijing South railway station | Ask how to buy a ticket and find the right platform for your group. | Bicycle bell (reused); Beijing train ticket; Beijing route-map card |
| sights | the Forbidden City | Describe what you can see and ask a guide two questions about this place. | Courtyard gate tile (reused); Golden roof model (reused); Beijing sight model |

Accessory palette: `#B7493F` / `#D4AD51`, inspired by red palace walls and golden roof tiles; motif: palace-roof lines.

Place-check references: [reference 1](https://english.beijing.gov.cn/consuminginbeijing/onedayinbeijing/abiteofbeijing/updatesofabiteofbeijing/202508/t20250803_4165167.html), [reference 2](https://english.beijing.gov.cn/latest/news/202506/t20250605_4106583.html).

Reused source IDs: `beijing-duck-plate`, `beijing-jianbing-wrap`, `beijing-bicycle-bell`, `beijing-courtyard-gate`, `beijing-palace-roof`.

### Lagos (`lagos`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Terra Kulture in Victoria Island | Order a meal for your group and ask what is in each dish. | Jollof rice pot (reused); Suya skewer (reused); Ground-peanut spice pouch |
| market | Lekki Arts and Crafts Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Lagos sun hat; Lagos scarf; Lagos bracelet |
| station | Marina Blue Line station | Ask how to buy a ticket and find the right platform for your group. | Minibus token (reused); Lagos train ticket; Lagos route-map card |
| sights | the National Museum Lagos | Describe what you can see and ask a guide two questions about this place. | Carved art mask tile (reused); Lagos sight model; Lagos view magnet |

Accessory palette: `#C6A26C` / `#3D7F83`, inspired by sandy beaches and blue-green lagoon water; motif: lagoon waves.

Place-check references: [reference 1](https://restaurant.terrakulture.com/), [reference 2](https://museum.ng/museums/national-museums/), [reference 3](https://www.lagosppa.gov.ng/wp-content/uploads/2022/01/LAMATA-Advert-for-Blue-Line.pdf).

Reused source IDs: `lagos-jollof-pot`, `lagos-suya-skewer`, `lagos-minibus-token`, `lagos-art-mask`.

### Dublin (`dublin`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | The Boxty House in Temple Bar | Order a meal for your group and ask what is in each dish. | Irish stew bowl (reused); Potato bowl; Bread slice |
| market | George's Street Arcade | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Dublin sun hat; Dublin scarf; Dublin bracelet |
| station | Dublin Connolly station | Ask how to buy a ticket and find the right platform for your group. | Double decker token (reused); Dublin train ticket; Dublin route-map card |
| sights | Trinity College's Book of Kells exhibition | Describe what you can see and ask a guide two questions about this place. | Manuscript quill tile (reused); Park leaf badge tile (reused); Celtic harp pin tile (reused) |

Accessory palette: `#6A8C6A` / `#BCB18B`, inspired by green park leaves and pale manuscript pages; motif: manuscript-knot lines.

Place-check references: [reference 1](https://www.visitdublin.com/the-boxty-house), [reference 2](https://georgesstreetarcade.ie/stores/), [reference 3](https://www.irishrail.ie/station/dublin-connolly).

Reused source IDs: `dublin-stew-bowl`, `dublin-bus-token`, `dublin-manuscript-quill`, `dublin-park-leaf`, `dublin-harp-pin`.

### Hong Kong (`hong-kong`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Lin Heung Tea House on Des Voeux Road Central | Order a meal for your group and ask what is in each dish. | Dim sum basket (reused); Egg tart tin (reused); Tea pot |
| market | Ladies' Market in Mong Kok | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Hong Kong sun hat; Hong Kong scarf; Hong Kong bracelet |
| station | Central Star Ferry Pier | Ask how to buy a ticket and find the right departure point for your group. | Ding ding tram bell (reused); Harbor ferry ticket (reused); Hong Kong boat ticket |
| sights | the Peak Tower viewing area | Describe what you can see and ask a guide two questions about this place. | Peak viewfinder tile (reused); Hong Kong sight model; Hong Kong view magnet |

Accessory palette: `#BD4A44` / `#367C74`, inspired by red signs and green trams in the city; motif: double-decker tram shapes.

Place-check references: [reference 1](https://www.discoverhongkong.com/eng/place-to-go/travel.guide-lin-heung-tea-house.html), [reference 2](https://www.mtr.com.hk/en/customer/main/local-flavors-dim-sum.html).

Reused source IDs: `hong-kong-dim-sum-basket`, `hong-kong-egg-tart`, `hong-kong-tram-bell`, `hong-kong-ferry-ticket`, `hong-kong-peak-viewfinder`.

### Lisbon (`lisbon`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Pasteis de Belem bakery | Order a meal for your group and ask what is in each dish. | Custard tart tin (reused); Custard bowl; Pastry shell |
| market | Feira da Ladra market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Lisbon sun hat; Lisbon scarf; Lisbon bracelet |
| station | Cais do Sodre station | Ask how to buy a ticket and find the right platform for your group. | Yellow tram token (reused); Lisbon train ticket; Lisbon route-map card |
| sights | Belem Tower from the riverside | Describe what you can see and ask a guide two questions about this place. | Blue tile square (reused); Riverside tower model (reused); Fado guitar charm tile (reused) |

Accessory palette: `#E9BC4D` / `#467EA3`, inspired by yellow trams and blue ceramic tiles; motif: azulejo tile shapes.

Place-check references: [reference 1](https://www.visitlisboa.com/en/places/feira-da-ladra-flea-market), [reference 2](https://www.lisboa.pt/pontos-de-interesse/detalhe/feira-da-ladra).

Reused source IDs: `lisbon-pastry-tin`, `lisbon-tram-token`, `lisbon-tile-square`, `lisbon-river-tower`, `lisbon-fado-guitar`.

### Shanghai (`shanghai`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter in Yuyuan Bazaar | Order a meal for your group and ask what is in each dish. | Soup dumpling steamer (reused); Dumpling broth cup; Noodle bowl |
| market | Yuyuan Bazaar | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Shanghai sun hat; Shanghai scarf; Shanghai bracelet |
| station | Longyang Road Maglev station | Ask how to buy a ticket and find the right platform for your group. | Maglev ticket (reused); River ferry charm (reused); Shanghai train ticket |
| sights | the riverside promenade on the Bund | Describe what you can see and ask a guide two questions about this place. | Garden window tile (reused); River crab pin tile (reused); Shanghai sight model |

Accessory palette: `#A64D3C` / `#C6A86C`, inspired by red-brown buildings and warm stone around Yuyuan; motif: garden-window outlines.

Place-check references: [reference 1](https://wx.smtdc.com/wx_en/DisplayShow.aspx?Id=35), [reference 2](https://www.smtdc.com/en/pdf/Notice%20to%20passengers%20of%20Shanghai%20Maglev%20Demonstration%20Line.pdf).

Reused source IDs: `shanghai-soup-dumpling`, `shanghai-maglev-ticket`, `shanghai-river-ferry`, `shanghai-garden-window`, `shanghai-crab-pin`.

### Jakarta (`jakarta`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Pasar Santa | Order a meal for your group and ask what is in each dish. | Nasi goreng bowl (reused); Kerak telor pan (reused); Sweet soy sauce bottle |
| market | Pasar Seni at Ancol | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Jakarta umbrella; Jakarta bag; Jakarta bracelet |
| station | Jakarta Kota railway station | Ask how to buy a ticket and find the right platform for your group. | Commuter train token (reused); Jakarta train ticket; Jakarta route-map card |
| sights | the National Monument at Merdeka Square | Describe what you can see and ask a guide two questions about this place. | Golden flame model (reused); Batik cloth square tile (reused); Jakarta sight model |

Accessory palette: `#D7AE52` / `#67866A`, inspired by the Monument's golden flame and green park lawns; motif: monument-flame shapes.

Place-check references: [reference 1](https://enjoy.jakarta.go.id/article/ancol-art-market).

Reused source IDs: `jakarta-nasi-goreng`, `jakarta-kerak-telor-pan`, `jakarta-commuter-train`, `jakarta-monument-flame`, `jakarta-batik-square`.

### Seoul (`seoul`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Gwangjang Market | Order a meal for your group and ask what is in each dish. | Rice cake skewer (reused); Market pancake plate (reused); Mung bean bowl |
| market | Namdaemun Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Seoul sun hat; Seoul scarf; Seoul bracelet |
| station | Seoul Station | Ask how to buy a ticket and find the right platform for your group. | Subway card case (reused); Seoul train ticket; Seoul route-map card |
| sights | Gyeongbokgung Palace | Describe what you can see and ask a guide two questions about this place. | Hanok roof tile (reused); Palace gate charm tile (reused); Seoul sight model |

Accessory palette: `#A5483F` / `#4E887D`, inspired by red columns and green painted palace details; motif: painted palace-roof shapes.

Place-check references: [reference 1](https://english.visitseoul.net/City-Hall-Area/Namdaemun-Market/ENP000085), [reference 2](https://english.seoul.go.kr/wp-content/uploads/2026/03/2026_guidebook_EN.pdf).

Reused source IDs: `seoul-rice-cake-skewer`, `seoul-market-pancake`, `seoul-subway-card`, `seoul-hanok-roof`, `seoul-palace-gate`.

### Reykjavik (`reykjavik`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Hlemmur Matholl | Order a meal for your group and ask what is in each dish. | Skyr cup (reused); Rúgbrauð loaf (reused); Rye flour pouch |
| market | Kolaportid flea market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Reykjavik scarf; Reykjavik cap; Reykjavik badge |
| station | BSI bus terminal | Ask how to buy a ticket and find the right departure point for your group. | Reykjavik bus ticket; Reykjavik route-map card; Reykjavik bus model |
| sights | Hallgrimskirkja church | Describe what you can see and ask a guide two questions about this place. | Basalt tower model (reused); Hot pool token tile (reused); Reykjavik sight model |

Accessory palette: `#9DADB7` / `#3D667C`, inspired by grey church walls and blue harbour water; motif: basalt-column shapes.

Place-check references: [reference 1](https://www.hlemmurmatholl.is/).

Reused source IDs: `reykjavik-skyr-cup`, `reykjavik-rugbraud-loaf`, `reykjavik-church-tower`, `reykjavik-hot-pool-token`.

### Manila (`manila`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Barbara's in Intramuros | Order a meal for your group and ask what is in each dish. | Garlic rice bowl (reused); Garlic pouch; Rice bowl |
| market | Divisoria market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Manila umbrella; Manila bag; Manila bracelet |
| station | Carriedo LRT station | Ask how to buy a ticket and find the right platform for your group. | Jeepney model (reused); Manila train ticket; Manila route-map card |
| sights | Fort Santiago in Intramuros | Describe what you can see and ask a guide two questions about this place. | Walled city gate tile (reused); Bay sunset charm tile (reused); Sampaguita flower pin tile (reused) |

Accessory palette: `#C6AE84` / `#E7CF78`, inspired by warm stone walls and golden Manila Bay sunsets; motif: stone-gate shapes.

Place-check references: [reference 1](https://www.barbaras.ph/), [reference 2](https://intramuros.gov.ph/fs/).

Reused source IDs: `manila-garlic-rice`, `manila-jeepney-model`, `manila-walled-gate`, `manila-bay-sunset`, `manila-sampaguita-flower`.

### Dakar (`dakar`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a lunch counter at Chez Loutcha | Order a meal for your group and ask what is in each dish. | Fish rice bowl (reused); Rice bowl; Vegetable bowl |
| market | Marche Kermel | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Dakar sun hat; Dakar scarf; Dakar bracelet |
| station | Dakar TER railway station | Ask how to buy a ticket and find the right platform for your group. | Fishing boat model (reused); Dakar train ticket; Dakar route-map card |
| sights | the African Renaissance Monument | Describe what you can see and ask a guide two questions about this place. | Bronze monument model (reused); Sabar drum charm tile (reused); Dakar sight model |

Accessory palette: `#D2AD5B` / `#3F7892`, inspired by colourful fishing boats and blue Atlantic water; motif: painted pirogue waves.

Place-check references: [reference 1](https://tourisme.sn/portfolio/le-marche-kermel-a-dakar/), [reference 2](https://seter.sn/), [reference 3](https://senefinder.com/fr/business/food-restaurant-chez-loutcha-dakar-wcke).

Reused source IDs: `dakar-fish-rice-bowl`, `dakar-fishing-pirogue`, `dakar-monument-model`, `dakar-drum`.

### Cape Town (`cape-town`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Time Out Market Cape Town | Order a meal for your group and ask what is in each dish. | Gatsby sandwich roll (reused); Koeksister twist (reused); Syrup jar |
| market | the Watershed at the V&A Waterfront | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Cape Town sun hat; Cape Town scarf; Cape Town bracelet |
| station | the Lower Cable Station at Table Mountain | Ask how to buy a ticket and find the right departure point for your group. | Cape Town cable car ticket; Cape Town route-map card; Cape Town cable car model |
| sights | Table Mountain's upper viewing paths | Describe what you can see and ask a guide two questions about this place. | Mountain cloud globe tile (reused); Fynbos flower pin tile (reused); Penguin beach shell tile (reused) |

Accessory palette: `#5A8690` / `#D3B481`, inspired by blue ocean water and the mountain's warm rock; motif: flat mountain outlines.

Place-check references: [reference 1](https://www.waterfront.co.za/eat-and-drink/time-out-market-cape-town), [reference 2](https://www.waterfront.co.za/shop-watershed).

Reused source IDs: `cape-town-gatsby-roll`, `cape-town-koeksister`, `cape-town-mountain-cloud`, `cape-town-fynbos-flower`, `cape-town-penguin-shell`.

### Tokyo (`tokyo`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a sushi counter at Tsukiji Outer Market | Order a meal for your group and ask what is in each dish. | Sushi plate (reused); Nakamise snack bag (reused); Sushi rice bowl |
| market | Nakamise shopping street in Asakusa | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Tokyo sun hat; Tokyo scarf; Tokyo bracelet |
| station | Tokyo Station | Ask how to buy a ticket and find the right platform for your group. | Train pass case (reused); Tokyo train ticket; Tokyo route-map card |
| sights | Senso-ji Temple and Kaminarimon gate | Describe what you can see and ask a guide two questions about this place. | Temple lantern tile (reused); Folding fan tile (reused); Tokyo sight model |

Accessory palette: `#BD4C43` / `#567E9E`, inspired by the red Kaminarimon lantern and blue Tokyo Bay water; motif: temple-lantern shapes.

Place-check references: [reference 1](https://www.tsukiji.or.jp/english/), [reference 2](https://www.japan.travel/en/spot/1691/), [reference 3](https://www.senso-ji.jp/english/).

Reused source IDs: `tokyo-sushi-set`, `tokyo-nakamise-snack`, `tokyo-train-pass`, `tokyo-lantern`, `tokyo-folding-fan`.

### Perth (`perth`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Fremantle Markets | Order a meal for your group and ask what is in each dish. | Rock lobster shell (reused); Marron serving pot (reused); Seafood lemon wedge |
| market | Fremantle Markets | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Perth sunglasses; Perth bag; Perth cap |
| station | Perth railway station | Ask how to buy a ticket and find the right platform for your group. | River ferry token (reused); Perth train ticket; Perth route-map card |
| sights | Kings Park overlooking the Swan River | Describe what you can see and ask a guide two questions about this place. | Park wildflower pin tile (reused); Beach shell charm tile (reused); Perth sight model |

Accessory palette: `#BF9A62` / `#507D9A`, inspired by golden sand and blue river water; motif: wildflower petals.

Place-check references: [reference 1](https://fremantlemarkets.com.au/), [reference 2](https://fremantlemarkets.com.au/faq).

Reused source IDs: `perth-rock-lobster`, `perth-marron-pot`, `perth-river-ferry`, `perth-park-wildflower`, `perth-beach-shell`.

### Recife (`recife`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food stall at Mercado da Boa Vista | Order a meal for your group and ask what is in each dish. | Rolled cake slice (reused); Tapioca pan (reused); Guava paste pot |
| market | Mercado de Sao Jose | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Recife sun hat; Recife scarf; Recife bracelet |
| station | Recife metro station | Ask how to buy a ticket and find the right platform for your group. | Canal boat model (reused); Recife train ticket; Recife route-map card |
| sights | Marco Zero square in Recife Antigo | Describe what you can see and ask a guide two questions about this place. | Bridge charm tile (reused); Carnival mask tile (reused); Recife sight model |

Accessory palette: `#CFAB4D` / `#467F91`, inspired by golden frevo umbrellas and blue river water; motif: bridge-and-wave lines.

Place-check references: [reference 1](https://www2.recife.pe.gov.br/servico/mercado-da-boa-vista?op=NTI2OQ%3D%3D), [reference 2](https://visit.recife.pe.gov.br/lugar/mercado-sao-jose/).

Reused source IDs: `recife-roll-cake`, `recife-tapioca-pan`, `recife-canal-boat`, `recife-bridge-charm`, `recife-carnival-mask`.

### New York (`new-york`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a bagel counter at Essex Market | Order a meal for your group and ask what is in each dish. | Bagel breakfast (reused); Cream cheese pot; Sesame bagel |
| market | Artists & Fleas at Chelsea Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | New York sun hat; New York scarf; New York bracelet |
| station | Grand Central Terminal | Ask how to buy a ticket and find the right platform for your group. | Yellow taxi model (reused); Subway route token (reused); New York train ticket |
| sights | the Bethesda Terrace area of Central Park | Describe what you can see and ask a guide two questions about this place. | Park squirrel badge tile (reused); Bodega shopfront tile (reused); New York sight model |

Accessory palette: `#D5A745` / `#467564`, inspired by yellow taxis and green Central Park trees; motif: park-leaf shapes.

Place-check references: [reference 1](https://www.essexmarket.nyc/vendors), [reference 2](https://www.chelseamarket.com/directory-shopping-and-services).

Reused source IDs: `new-york-bagel`, `new-york-yellow-taxi`, `new-york-subway-token`, `new-york-park-squirrel`, `new-york-bodega-cat`.

### Toronto (`toronto`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at St. Lawrence Market | Order a meal for your group and ask what is in each dish. | Peameal sandwich (reused); Butter tart tin (reused); Soft sandwich bun |
| market | the stalls in Kensington Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Toronto scarf; Toronto cap; Toronto badge |
| station | Union Station | Ask how to buy a ticket and find the right platform for your group. | Streetcar token (reused); Toronto train ticket; Toronto route-map card |
| sights | the CN Tower | Describe what you can see and ask a guide two questions about this place. | Tower viewfinder tile (reused); Market basket token tile (reused); Toronto sight model |

Accessory palette: `#6B9AB5` / `#D0C19D`, inspired by blue Lake Ontario and pale stone at Union Station; motif: tower outlines.

Place-check references: [reference 1](https://www.destinationontario.com/en-ca/attractions/st-lawrence-market), [reference 2](https://www.ttc.ca/riding-the-ttc/Explore-Toronto).

Reused source IDs: `toronto-peameal-sandwich`, `toronto-butter-tart`, `toronto-streetcar-token`, `toronto-tower-viewfinder`, `toronto-market-basket`.

### Vancouver (`vancouver`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Granville Island Public Market | Order a meal for your group and ask what is in each dish. | Pacific salmon portion (reused); Nanaimo bar (reused); Chocolate square |
| market | the craft shops at Granville Island | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Vancouver scarf; Vancouver cap; Vancouver badge |
| station | Waterfront Station | Ask how to buy a ticket and find the right platform for your group. | Seawall bicycle bell (reused); Vancouver train ticket; Vancouver route-map card |
| sights | the Stanley Park seawall | Describe what you can see and ask a guide two questions about this place. | Orca tail badge tile (reused); Rainforest leaf tile (reused); Vancouver sight model |

Accessory palette: `#4D806D` / `#5386A5`, inspired by green coastal forest and blue harbour water; motif: forest-and-water lines.

Place-check references: [reference 1](https://granvilleisland.com/public-market), [reference 2](https://granvilleisland.com/wp-content/uploads/2025/07/GIVisitorMaps_ENGLISHMay2025.pdf).

Reused source IDs: `vancouver-salmon-pin`, `vancouver-nanaimo-bar`, `vancouver-seawall-bike`, `vancouver-orca-sticker`, `vancouver-rainforest-leaf`.

### Rio de Janeiro (`rio-de-janeiro`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Cadeg market | Order a meal for your group and ask what is in each dish. | Beach snack ring (reused); Feijoada pot (reused); Rice side bowl |
| market | the craft stalls at Feira Hippie de Ipanema | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Rio de Janeiro sunglasses; Rio de Janeiro bag; Rio de Janeiro cap |
| station | the lower Sugarloaf cable-car station at Praia Vermelha | Ask how to buy a ticket and find the right departure point for your group. | Cable car model (reused); Rio de Janeiro cable car ticket; Rio de Janeiro route-map card |
| sights | Sugarloaf Mountain | Describe what you can see and ask a guide two questions about this place. | Copacabana shell tile (reused); Tijuca forest leaf tile (reused); Rio de Janeiro sight model |

Accessory palette: `#E1C77D` / `#467C96`, inspired by pale beach sand and blue Guanabara Bay; motif: rounded mountain outlines.

Place-check references: [reference 1](https://cadeg.com.br/).

Reused source IDs: `rio-de-janeiro-biscoito-globo`, `rio-de-janeiro-feijoada-pot`, `rio-de-janeiro-sugarloaf-cable-car`, `rio-de-janeiro-copacabana-shell`, `rio-de-janeiro-tijuca-leaf`.

### Sydney (`sydney`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at the Sydney Fish Market | Order a meal for your group and ask what is in each dish. | Meat pie charm (reused); Rock oyster shell (reused); Lamington cake cube (reused) |
| market | The Rocks Markets | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Sydney sunglasses; Sydney bag; Sydney cap |
| station | Circular Quay ferry wharves | Ask how to buy a ticket and find the right departure point for your group. | Harbour ferry token (reused); Sydney boat ticket; Sydney route-map card |
| sights | the Sydney Opera House forecourt | Describe what you can see and ask a guide two questions about this place. | Harbour shell ornament tile (reused); Sydney sight model; Sydney view magnet |

Accessory palette: `#E4DED0` / `#39768F`, inspired by the Opera House's pale shells and blue harbour water; motif: harbour-sail shapes.

Place-check references: [reference 1](https://www.sydneyfishmarket.com.au/), [reference 2](https://therocks.com/whats-on/market-overview).

Reused source IDs: `sydney-meat-pie`, `sydney-rock-oyster`, `sydney-lamington-cube`, `sydney-ferry-token`, `sydney-harbour-shells`.

### Miami (`miami`) — step 1

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | the walk-up counter at Versailles on Calle Ocho | Order a meal for your group and ask what is in each dish. | Cuban sandwich (reused); Cafecito cup (reused); Key lime pie slice (reused) |
| market | the Bayside Marketplace stalls | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Miami sunglasses; Miami bag; Miami cap |
| station | Government Center Metrorail station | Ask how to buy a ticket and find the right platform for your group. | Miami train ticket; Miami route-map card; Miami train model |
| sights | the Art Deco buildings on Ocean Drive | Describe what you can see and ask a guide two questions about this place. | Art Deco keychain tile (reused); Miami sight model; Miami view magnet |

Accessory palette: `#D79DAD` / `#70ADAD`, inspired by pink and turquoise Art Deco buildings; motif: Art Deco fan shapes.

Place-check references: [reference 1](https://www.versaillesrestaurant.com/), [reference 2](https://baysidemarketplace.com/visit/), [reference 3](https://www.miamidade.gov/global/transportation/metrorail.page).

Reused source IDs: `miami-cuban-sandwich`, `miami-cafecito-cup`, `miami-key-lime-pie`, `miami-art-deco-keychain`.

### Los Angeles (`los-angeles`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Philippe the Original near Chinatown | Order a meal for your group and ask what is in each dish. | French dip sandwich (reused); Korean taco (reused); Broth cup |
| market | Olvera Street market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Los Angeles sunglasses; Los Angeles bag; Los Angeles cap |
| station | Los Angeles Union Station | Ask how to buy a ticket and find the right platform for your group. | Freeway map fold (reused); Los Angeles train ticket; Los Angeles route-map card |
| sights | Griffith Observatory | Describe what you can see and ask a guide two questions about this place. | Hilltop observatory model (reused); Los Angeles sight model; Los Angeles view magnet |

Accessory palette: `#C59B65` / `#5F8C96`, inspired by warm hills and blue Pacific water; motif: observatory-dome outlines.

Place-check references: [reference 1](https://philippes.com/store/).

Reused source IDs: `los-angeles-french-dip`, `los-angeles-korean-taco`, `los-angeles-freeway-map`, `los-angeles-observatory-view`.

### Bogota (`bogota`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at La Perseverancia Market | Order a meal for your group and ask what is in each dish. | Ajiaco soup bowl (reused); Changua breakfast cup (reused); Tamal leaf parcel (reused) |
| market | the Usaquen Sunday market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Bogota sun hat; Bogota scarf; Bogota bracelet |
| station | Museo Nacional TransMilenio station | Ask how to buy a ticket and find the right departure point for your group. | Red bus pass (reused); Bogota bus ticket; Bogota route-map card |
| sights | Monserrate's upper viewing area | Describe what you can see and ask a guide two questions about this place. | Hilltop view token tile (reused); Bogota sight model; Bogota view magnet |

Accessory palette: `#B59266` / `#5A7E69`, inspired by warm brick and green mountain slopes; motif: mountain-ridge shapes.

Place-check references: [reference 1](https://bogota.gov.co/mi-ciudad/desarrollo-economico/bogota-celebra-el-cumpleanos-81-de-la-plaza-la-perseverancia).

Reused source IDs: `bogota-ajiaco-bowl`, `bogota-changua-cup`, `bogota-tamal-leaf`, `bogota-bus-pass`, `bogota-hilltop-view`.

### Buenos Aires (`buenos-aires`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Mercado de San Telmo | Order a meal for your group and ask what is in each dish. | Empanada pocket (reused); Mate gourd set (reused); Dulce de leche alfajor (reused) |
| market | the craft stalls at Plaza Dorrego | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Buenos Aires sun hat; Buenos Aires scarf; Buenos Aires bracelet |
| station | Retiro Mitre railway station | Ask how to buy a ticket and find the right platform for your group. | Buenos Aires train ticket; Buenos Aires route-map card; Buenos Aires train model |
| sights | Teatro Colon | Describe what you can see and ask a guide two questions about this place. | Opera house token tile (reused); Tango shoe ornament tile (reused); Buenos Aires sight model |

Accessory palette: `#CABBA4` / `#669AAF`, inspired by pale theatre stone and blue reflections on the river; motif: theatre-arch shapes.

Place-check references: [reference 1](https://turismo.buenosaires.gob.ar/en/atractivo/san-telmo-market), [reference 2](https://www.argentina.gob.ar/plaza-dorrego).

Reused source IDs: `buenos-aires-empanada`, `buenos-aires-mate-gourd`, `buenos-aires-alfajor`, `buenos-aires-opera-mask`, `buenos-aires-tango-shoe`.

### Honolulu (`honolulu`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at the Diamond Head Market & Grill | Order a meal for your group and ask what is in each dish. | Poke bowl (reused); Spam musubi (reused); Sea salt pouch |
| market | the stalls at Aloha Stadium Swap Meet | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Honolulu sunglasses; Honolulu bag; Honolulu cap |
| station | Alapai Transit Center | Ask how to buy a ticket and find the right departure point for your group. | Canoe paddle (reused); Honolulu bus ticket; Honolulu route-map card |
| sights | Iolani Palace | Describe what you can see and ask a guide two questions about this place. | Palace column model (reused); Ukulele charm tile (reused); Honolulu sight model |

Accessory palette: `#457B96` / `#6F996F`, inspired by blue ocean water and green palms; motif: outrigger-and-wave shapes.

Place-check references: [reference 1](https://alohastadium.hawaii.gov/new-swap-meet-marketplace-relocation/), [reference 2](https://alohastadium.hawaii.gov/wp-content/uploads/2025/10/SM-Public-Map-10.30.25.pdf).

Reused source IDs: `honolulu-poke-bowl`, `honolulu-spam-musubi`, `honolulu-outrigger-paddle`, `honolulu-palace-column`, `honolulu-ukulele`.

### Panama City (`panama-city`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a breakfast counter at Mercado San Felipe Neri | Order a meal for your group and ask what is in each dish. | Corn cake plate (reused); Hojaldra; Corn tortilla |
| market | the craft stalls at Mercado de Artesanias de Balboa | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Panama City sun hat; Panama City scarf; Panama City bracelet |
| station | Albrook Metro station | Ask how to buy a ticket and find the right platform for your group. | Canal ship model (reused); Panama City train ticket; Panama City route-map card |
| sights | the Miraflores Visitor Center at the Panama Canal | Describe what you can see and ask a guide two questions about this place. | Old town tile (reused); Tropical bird pin tile (reused); Panama City sight model |

Accessory palette: `#517F89` / `#C8AE77`, inspired by blue canal water and pale stone in Casco Viejo; motif: canal-lock lines.

Place-check references: [reference 1](https://servicioscomunidad.mupa.gob.pa/subdireccion-de-mercados/), [reference 2](https://mercados.mupa.gob.pa/).

Reused source IDs: `panama-city-corn-cake`, `panama-city-lock-ship`, `panama-city-casco-tile`, `panama-city-tropical-bird`.

### Suva (`suva`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at the Suva Municipal Market | Order a meal for your group and ask what is in each dish. | Coconut serving bowl (reused); Kokoda dish (reused); Coconut milk cup |
| market | Suva Municipal Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Suva umbrella; Suva bag; Suva bracelet |
| station | Suva Bus Station | Ask how to buy a ticket and find the right departure point for your group. | Harbor boat model (reused); Suva bus ticket; Suva route-map card |
| sights | the Fiji Museum at Thurston Gardens | Describe what you can see and ask a guide two questions about this place. | Rainforest leaf tile (reused); Market basket tile (reused); Suva sight model |

Accessory palette: `#569A93` / `#D9BB81`, inspired by green tropical leaves and blue harbour water; motif: leaf-and-wave lines.

Place-check references: [reference 1](https://fijimuseum.org.fj/), [reference 2](https://www.fiji.travel/places-to-go/suva-and-surrounds/locations/top-things-to-do-in-suva).

Reused source IDs: `suva-coconut-bowl`, `suva-kokoda-dish`, `suva-harbor-boat`, `suva-forest-leaf`, `suva-market-basket`.

### Auckland (`auckland`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Auckland Fish Market | Order a meal for your group and ask what is in each dish. | Green mussel shell (reused); Pavlova plate (reused); Meringue nest |
| market | the stalls at Otara Market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Auckland sun hat; Auckland scarf; Auckland bracelet |
| station | Waitemata railway station at Britomart | Ask how to buy a ticket and find the right platform for your group. | Harbor ferry token (reused); Auckland train ticket; Auckland route-map card |
| sights | the Sky Tower | Describe what you can see and ask a guide two questions about this place. | Sky tower charm tile (reused); Harbor postcard tile (reused); Auckland sight model |

Accessory palette: `#507F91` / `#77956A`, inspired by blue harbour water and green volcanic hills; motif: harbour-sail lines.

Place-check references: [reference 1](https://at.govt.nz/projects-initiatives/city-centre-projects-and-initiatives/city-rail-link-auckland-s-new-network-in-2026/about-the-city-rail-link-stations/waitemata-station), [reference 2](https://www.otaramarkets.co.nz/), [reference 3](https://www.sanford.co.nz/afm/).

Reused source IDs: `auckland-mussel-shell`, `auckland-pavlova-plate`, `auckland-ferry-token`, `auckland-sky-tower`, `auckland-harbor-postcard`.

### Mexico City (`mexico-city`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Mercado de San Juan | Order a meal for your group and ask what is in each dish. | Taco al pastor (reused); Tlacoyo snack (reused); Corn tortilla |
| market | the La Ciudadela craft market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Mexico City sun hat; Mexico City scarf; Mexico City bracelet |
| station | Bellas Artes metro station | Ask how to buy a ticket and find the right platform for your group. | Mexico City train ticket; Mexico City route-map card; Mexico City train model |
| sights | the Xochimilco canals | Describe what you can see and ask a guide two questions about this place. | Axolotl charm tile (reused); Papel picado strand tile (reused); Market flower bundle tile (reused) |

Accessory palette: `#D0A24B` / `#A85A65`, inspired by colourful market flowers and painted canal boats; motif: flower-and-canal lines.

Place-check references: [reference 1](https://mexicocity.cdmx.gob.mx/venues/san-juan-market/).

Reused source IDs: `mexico-city-taco-al-pastor`, `mexico-city-tlacoyo`, `mexico-city-axolotl`, `mexico-city-papel-picado`, `mexico-city-market-flower`.

### Santiago (`santiago`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | Domino restaurant on Agustinas | Order a meal for your group and ask what is in each dish. | Completo hot dog (reused); Mate cup (reused); Avocado topping bowl |
| market | the Santa Lucia craft market | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Santiago sun hat; Santiago scarf; Santiago bracelet |
| station | Universidad de Chile metro station | Ask how to buy a ticket and find the right platform for your group. | Metro card sleeve (reused); Hill funicular model (reused); Santiago train ticket |
| sights | the summit of Cerro San Cristobal | Describe what you can see and ask a guide two questions about this place. | Andes snow globe tile (reused); Santiago sight model; Santiago view magnet |

Accessory palette: `#B78165` / `#A7B7BF`, inspired by warm city stone and pale Andean snow; motif: mountain-peak outlines.

Place-check references: [reference 1](https://domino.cl/locales/), [reference 2](https://www.santiagoturismo.cl/es/mercado-central-de-santiago/), [reference 3](https://www.santiagoturismo.cl/es/centro-artesanal-santa-lucia/).

Reused source IDs: `santiago-avocado-toast`, `santiago-mate-cup`, `santiago-metro-card`, `santiago-hill-funicular`, `santiago-mountain-snow`.

### Lima (`lima`) — step 2

| Stop | Real place | One-sentence scene | Three rewards |
| --- | --- | --- | --- |
| restaurant | a food counter at Mercado de Surquillo No. 1 | Order a meal for your group and ask what is in each dish. | Ceviche bowl (reused); Causa limeña mold (reused); Chicha morada cup (reused) |
| market | the craft stalls on Avenida Petit Thouars in Miraflores | Compare three accessories, ask about sizes and colours, and choose one within your budget. | Lima sun hat; Lima scarf; Lima bracelet |
| station | Estacion Central del Metropolitano | Ask how to buy a ticket and find the right departure point for your group. | Coastal bike token (reused); Lima bus ticket; Lima route-map card |
| sights | Huaca Pucllana | Describe what you can see and ask a guide two questions about this place. | Adobe temple model (reused); Lima sight model; Lima view magnet |

Accessory palette: `#C8AD7A` / `#738B9B`, inspired by warm adobe walls and grey-blue Pacific water; motif: adobe-step shapes.

Place-check references: [reference 1](https://visitalima.pe/atractivos/mercado-de-surquillo/).

Reused source IDs: `lima-ceviche-bowl`, `lima-causa-limena`, `lima-chicha-morada`, `lima-coastal-bike`, `lima-adobe-temple`.

## Validation and commit record

- Step 1: `f7a50a4b` — `City stops 1: add Dubai-reachable city stops and souvenirs`. Dubai plus its 39 reachable destinations: 40 cities, 160 stops and 480 rewards; 189 reused and 291 new. Five validation tests passed; lint clean; TypeScript and full tests hit only the known missing `@mozilla/readability`. Full suite: 3,728 tests passed, 3 skipped.
- Step 2 (this commit): `City stops 2: complete all 50 cities and review tables`. Adds the other ten cities; the original 40 entries are unchanged. All six city-stop validation tests pass. Changed-file lint is clean. `pnpm exec tsc --noEmit -p .` reports only the known missing `@mozilla/readability` import. Full `pnpm test --maxWorkers=2`: 3,729 tests pass, 3 skipped, and only the existing source-extractor suite fails to import that missing module.
- No packages were installed. `city-packs.json`, dependency manifests and existing application code are unchanged. No UI integration, push or merge. The two-worker limit runs the full suite and avoids an existing timeout under high parallel load.
