# Country items v2 — review draft

The 50 destinations yield 1,942 eligible directed routes at the 13,000 km maximum range. We sample endpoints and equal intervals no more than 25 km apart using `greatCirclePoint` and `countryAt`. The 1:110m map and sampling can miss small islands and narrow borders. A route is counted once per map name per direction; the two directions count separately. The original 39 entries remain unchanged.

The exact map name `CÃ´te d'Ivoire` is mojibake in the polygon data; matching it literally would propagate the display error. The three previous draft additions are included below. The list is incomplete during batching: the automated coverage test is expected to fail until all eligible names have items. Existing app code currently requires sticker strings and will need Claude's separate null-sticker handling before these art-prompt entries can display safely.

## Excluded map names

These are skipped under Matt's instruction; the labels are listed for transparency and do not express a view on territorial claims.

| Map name | Directed routes | Reason |
|---|---:|---|
| Antarctica | 6 | Uninhabited continent, not a country. |
| Greenland | 80 | Self-governing territory within the Kingdom of Denmark. |
| Kosovo | 12 | Disputed statehood. |
| N. Cyprus | 2 | Disputed status. |
| New Caledonia | 6 | French territory, not an independent country. |
| Palestine | 10 | Disputed statehood and borders. |
| Puerto Rico | 4 | United States territory, not an independent country. |
| Somaliland | 26 | Disputed statehood. |
| Taiwan | 8 | Disputed status. |
| W. Sahara | 34 | Disputed territory. |

## New items for review

Items are sorted alphabetically; links identify the source used for each fact. Generic sticker matches are noted as such; missing art has a prompt.

| Map name | Directed routes | Item | Sticker or art prompt | Fact | Source |
|---|---:|---|---|---|---|
| Afghanistan | 122 | Kabuli palaw | sticker-style Kabuli palaw, no text, no people's faces | Kabuli palaw is a rice dish often topped with carrots and raisins. | [Source](https://en.wikipedia.org/wiki/Kabuli_pulao) |
| Albania | 40 | Tavë kosi | sticker-style Tavë kosi, no text, no people's faces | Tavë kosi is a baked dish with a yogurt topping. | [Source](https://en.wikipedia.org/wiki/Tav%C3%AB_kosi) |
| Algeria | 100 | Fennec fox | sticker-style Fennec fox, no text, no people's faces | A fennec fox has large ears that help it lose heat. | [Source](https://en.wikipedia.org/wiki/Fennec_fox) |
| Angola | 36 | Kalandula Falls | `waterfall` | Kalandula Falls is a broad waterfall on the Lucala River. | [Source](https://en.wikipedia.org/wiki/Kalandula_Falls) |
| Armenia | 22 | Lavash bread | `bread` | Lavash is a traditional thin Armenian bread. | [Source](https://ich.unesco.org/en/RL/lavash-the-preparation-meaning-and-appearance-of-traditional-bread-as-an-expression-of-culture-in-armenia-00985) |
| Austria | 68 | Apple strudel | sticker-style Apple strudel, no text, no people's faces | Apple strudel is a pastry with an apple filling. | [Source](https://en.wikipedia.org/wiki/Apfelstrudel) |
| Azerbaijan | 44 | Carpet | sticker-style Carpet, no text, no people's faces | Azerbaijani carpets can have repeated patterns made with coloured yarn. | [Source](https://ich.unesco.org/en/RL/traditional-art-of-azerbaijani-carpet-weaving-in-the-republic-of-azerbaijan-00389) |
| Bahamas | 18 | Flamingo | `flamingo` | Flamingos use their curved bills to filter food from water. | [Source](https://en.wikipedia.org/wiki/American_flamingo) |
| Bangladesh | 52 | Bengal tiger | `tiger` | Bengal tigers can swim across rivers. | [Source](https://en.wikipedia.org/wiki/Bengal_tiger) |
| Belarus | 84 | Draniki | sticker-style Draniki, no text, no people's faces | Draniki are pancakes made with grated potatoes. | [Source](https://en.wikipedia.org/wiki/Potato_pancake) |
| Belgium | 66 | Belgian waffle | sticker-style Belgian waffle, no text, no people's faces | Waffle irons leave a pattern of little pockets on waffles. | [Source](https://en.wikipedia.org/wiki/Belgian_waffle) |
| Belize | 8 | Cacao pod | sticker-style Cacao pod, no text, no people's faces | Cacao beans are fermented and dried before they are made into chocolate. | [Source](https://en.wikipedia.org/wiki/Cocoa_bean) |
| Benin | 44 | Ganvié stilt house | sticker-style Ganvié stilt house, no text, no people's faces | Many houses in Ganvié stand on stilts above Lake Nokoué. | [Source](https://en.wikipedia.org/wiki/Ganvi%C3%A9) |
| Bhutan | 24 | Ema datshi | sticker-style Ema datshi, no text, no people's faces | Ema datshi is a Bhutanese dish made with chillies and cheese. | [Source](https://en.wikipedia.org/wiki/Ema_datshi) |
| Bolivia | 34 | Llama | sticker-style Llama, no text, no people's faces | Llamas have thick coats that provide wool. | [Source](https://en.wikipedia.org/wiki/Llama) |
| Bosnia and Herz. | 44 | Mostar bridge | sticker-style Mostar bridge, no text, no people's faces | Mostar’s stone bridge crosses the Neretva River. | [Source](https://whc.unesco.org/en/list/946/) |
| Botswana | 14 | Okavango Delta | sticker-style Okavango Delta, no text, no people's faces | The Okavango spreads into an inland delta instead of reaching the sea. | [Source](https://whc.unesco.org/en/list/1432/) |
| Brunei | 4 | Proboscis monkey | sticker-style Proboscis monkey, no text, no people's faces | Adult male proboscis monkeys have large noses. | [Source](https://en.wikipedia.org/wiki/Proboscis_monkey) |
| Bulgaria | 66 | Rose | sticker-style Rose, no text, no people's faces | Bulgaria's Rose Valley grows fragrant roses used to make rose oil. | [Source](https://en.wikipedia.org/wiki/Rose_Valley,_Bulgaria) |
| Burkina Faso | 32 | Tô porridge | sticker-style Tô porridge, no text, no people's faces | Tô is a thick porridge that can be made from millet or sorghum. | [Source](https://en.wikipedia.org/wiki/Burkinab%C3%A9_cuisine) |
| Burundi | 4 | Lake Tanganyika | `lake` | Lake Tanganyika is a deep freshwater lake shared by several countries. | [Source](https://en.wikipedia.org/wiki/Lake_Tanganyika) |
| Cambodia | 60 | Fish amok | sticker-style Fish amok, no text, no people's faces | Fish amok is a Cambodian fish dish made with coconut milk. | [Source](https://en.wikipedia.org/wiki/Amok_trei) |
| Cameroon | 48 | Mount Cameroon | `volcano` | Mount Cameroon is a volcano near the coast. | [Source](https://en.wikipedia.org/wiki/Mount_Cameroon) |
| Central African Rep. | 32 | Western lowland gorilla | sticker-style Western lowland gorilla, no text, no people's faces | Western lowland gorillas eat fruit and other plants. | [Source](https://en.wikipedia.org/wiki/Western_lowland_gorilla) |
| Chad | 66 | Lake Chad | `lake` | Lake Chad is shallow and its size changes with the water level. | [Source](https://en.wikipedia.org/wiki/Lake_Chad) |
| Chile | 82 | Pastel de choclo | sticker-style Pastel de choclo, no text, no people's faces | Pastel de choclo is baked with a topping made from maize. | [Source](https://en.wikipedia.org/wiki/Pastel_de_choclo) |
| Colombia | 120 | Arepa | sticker-style Arepa, no text, no people's faces | Arepas are round maize cakes that can be split and filled. | [Source](https://en.wikipedia.org/wiki/Arepa) |
| Congo | 22 | Saka-saka | sticker-style Saka-saka, no text, no people's faces | Saka-saka is made with cooked cassava leaves. | [Source](https://www.untourism.int/africa/african-gastronomy/republic-of-congo) |
| Costa Rica | 2 | Brown-throated sloth | sticker-style Brown-throated sloth, no text, no people's faces | Brown-throated sloths have long claws that help them hang from branches. | [Source](https://en.wikipedia.org/wiki/Brown-throated_sloth) |
| Croatia | 56 | Plitvice waterfalls | `waterfall` | Plitvice has a chain of lakes connected by waterfalls. | [Source](https://whc.unesco.org/en/list/98/) |
| Cuba | 34 | Cuban crocodile | `crocodile` | Cuban crocodiles use their strong tails to swim. | [Source](https://en.wikipedia.org/wiki/Cuban_crocodile) |
| Czechia | 52 | Astronomical clock | sticker-style Astronomical clock, no text, no people's faces | The astronomical clock on Prague’s Old Town Hall shows more than ordinary time. | [Source](https://en.wikipedia.org/wiki/Prague_astronomical_clock) |
| CÃ´te d'Ivoire | 24 | Attiéké | sticker-style Attiéké, no text, no people's faces | Attiéké is made from fermented cassava. | [Source](https://ich.unesco.org/en/RL/know-how-related-to-attieke-production-in-cote-d-ivoire-02086) |
| Dem. Rep. Congo | 50 | Bonobo | sticker-style Bonobo, no text, no people's faces | Bonobos are apes that live in forests in the Democratic Republic of the Congo. | [Source](https://en.wikipedia.org/wiki/Bonobo) |
| Denmark | 52 | Viking ship | sticker-style Viking ship, no text, no people's faces | Some Viking ships travelled using both sails and oars. | [Source](https://en.wikipedia.org/wiki/Viking_ship) |
| Djibouti | 10 | Whale shark | sticker-style Whale shark, no text, no people's faces | A whale shark is a fish that filters tiny food from the water. | [Source](https://en.wikipedia.org/wiki/Whale_shark) |
| Dominican Rep. | 18 | Mangú | sticker-style Mangú, no text, no people's faces | Mangú is made by boiling and mashing green plantains. | [Source](https://en.wikipedia.org/wiki/Mang%C3%BA) |
| Ecuador | 18 | Galápagos giant tortoise | sticker-style Galápagos giant tortoise, no text, no people's faces | Galápagos giant tortoises eat plants. | [Source](https://en.wikipedia.org/wiki/Gal%C3%A1pagos_giant_tortoise) |
| El Salvador | 6 | Pupusa | sticker-style Pupusa, no text, no people's faces | Pupusas are thick griddle cakes with fillings such as cheese or beans. | [Source](https://en.wikipedia.org/wiki/Pupusa) |
| Eq. Guinea | 4 | Pico Basilé | `volcano` | Pico Basilé is a volcanic mountain on the island of Bioko. | [Source](https://en.wikipedia.org/wiki/Pico_Basil%C3%A9) |
| Eritrea | 26 | Ostrich | sticker-style Ostrich, no text, no people's faces | An ostrich cannot fly but can run on its long legs. | [Source](https://en.wikipedia.org/wiki/Common_ostrich) |
| Estonia | 32 | Kama | sticker-style Kama, no text, no people's faces | Kama is a mixture of roasted grains ground into flour. | [Source](https://en.wikipedia.org/wiki/Kama_(food)) |
| Fiji | 58 | Coral reef | `coral` | Coral reefs surround many islands in Fiji. | [Source](https://en.wikipedia.org/wiki/Fiji) |
| Finland | 68 | Karelian pasty | sticker-style Karelian pasty, no text, no people's faces | A Karelian pasty has a thin rye crust and often a rice filling. | [Source](https://en.wikipedia.org/wiki/Karelian_pasty) |
| Gabon | 18 | Canoe | `canoe` | A canoe can be moved through water with paddles. | [Source](https://en.wikipedia.org/wiki/Canoe) |
| Gambia | 8 | Kora | sticker-style Kora, no text, no people's faces | A kora is a string instrument with a body made from a large gourd. | [Source](https://en.wikipedia.org/wiki/Kora_(instrument)) |
| Georgia | 32 | Khachapuri | `bread` | Khachapuri is a Georgian cheese bread. | [Source](https://ich.unesco.org/doc/src/45726.pdf) |
| Ghana | 32 | Banku | sticker-style Banku, no text, no people's faces | Banku is made with fermented maize and cassava dough. | [Source](https://en.wikipedia.org/wiki/Banku) |
| Guatemala | 18 | Marimba | sticker-style Marimba, no text, no people's faces | A marimba has wooden keys that players strike with mallets. | [Source](https://en.wikipedia.org/wiki/Marimba) |
| Guinea | 20 | Djembe | sticker-style Djembe, no text, no people's faces | A djembe is a drum played with the hands. | [Source](https://en.wikipedia.org/wiki/Djembe) |
| Guinea-Bissau | 10 | Mangrove | sticker-style Mangrove, no text, no people's faces | Mangrove roots provide shelter for fish in coastal waters. | [Source](https://en.wikipedia.org/wiki/Mangrove) |
| Guyana | 22 | Kaieteur Falls | `waterfall` | Kaieteur Falls is on the Potaro River. | [Source](https://en.wikipedia.org/wiki/Kaieteur_Falls) |
| Haiti | 18 | Hispaniolan solenodon | sticker-style Hispaniolan solenodon, no text, no people's faces | The Hispaniolan solenodon uses its long nose to help find food. | [Source](https://en.wikipedia.org/wiki/Hispaniolan_solenodon) |
| Honduras | 12 | Scarlet macaw | sticker-style Scarlet macaw, no text, no people's faces | A scarlet macaw has red, yellow and blue feathers. | [Source](https://en.wikipedia.org/wiki/Scarlet_macaw) |
| Hungary | 54 | Rubik’s Cube | sticker-style Rubik’s Cube, no text, no people's faces | Ernő Rubik designed the colourful twisting cube in Hungary. | [Source](https://www.britannica.com/topic/Rubiks-Cube) |
| Iceland | 106 | Volcano | `volcano` | Iceland has both volcanoes and glaciers. | [Source](https://en.wikipedia.org/wiki/Iceland) |
| Iraq | 72 | Masgouf | sticker-style Masgouf, no text, no people's faces | Masgouf is a fish dish cooked beside a fire. | [Source](https://en.wikipedia.org/wiki/Masgouf) |
| Ireland | 124 | Colcannon | sticker-style Colcannon, no text, no people's faces | Colcannon mixes mashed potatoes with cabbage or kale. | [Source](https://en.wikipedia.org/wiki/Colcannon) |
| Israel | 30 | Nubian ibex | sticker-style Nubian ibex, no text, no people's faces | A Nubian ibex uses its hooves to climb rocky slopes. | [Source](https://en.wikipedia.org/wiki/Nubian_ibex) |
| Jamaica | 8 | Dunn's River Falls | `waterfall` | Water at Dunn's River Falls flows over natural rock terraces. | [Source](https://en.wikipedia.org/wiki/Dunn%27s_River_Falls) |
| Kazakhstan | 242 | Wild apple | `apple` | Wild apple trees grow in the mountains of Kazakhstan. | [Source](https://en.wikipedia.org/wiki/Malus_sieversii) |
| Kuwait | 10 | Kuwait Towers | sticker-style Kuwait Towers, no text, no people's faces | The Kuwait Towers include water storage and a viewing sphere. | [Source](https://en.wikipedia.org/wiki/Kuwait_Towers) |
| Kyrgyzstan | 80 | Shyrdak felt rug | sticker-style Shyrdak felt rug, no text, no people's faces | Shyrdak rugs are made with pieces of coloured felt. | [Source](https://ich.unesco.org/en/USL/ala-kiyiz-and-shyrdak-art-of-kyrgyz-traditional-felt-carpets-00693) |
| Laos | 56 | Laap | sticker-style Laap, no text, no people's faces | Laap is a chopped salad often flavoured with herbs and toasted rice. | [Source](https://en.wikipedia.org/wiki/Larb) |
| Latvia | 54 | Rye bread | sticker-style Rye bread, no text, no people's faces | Rye flour is used to make Latvian rye bread. | [Source](https://en.wikipedia.org/wiki/Rye_bread) |
| Lebanon | 4 | Cedar tree | sticker-style Cedar tree, no text, no people's faces | Cedar trees grow in the mountains of Lebanon. | [Source](https://whc.unesco.org/en/list/850/) |
| Liberia | 12 | Pygmy hippopotamus | sticker-style Pygmy hippopotamus, no text, no people's faces | Pygmy hippos live near forest streams in West Africa. | [Source](https://en.wikipedia.org/wiki/Pygmy_hippopotamus) |
| Libya | 86 | Bazeen | sticker-style Bazeen, no text, no people's faces | Bazeen is a Libyan dish made with barley flour. | [Source](https://en.wikipedia.org/wiki/Bazin_(bread)) |
| Lithuania | 48 | Cepelinai | sticker-style Cepelinai, no text, no people's faces | Cepelinai are filled potato dumplings. | [Source](https://en.wikipedia.org/wiki/Cepelinai) |
| Luxembourg | 16 | Mullerthal sandstone rocks | `rock` | Weathering has shaped the sandstone rocks of the Mullerthal region. | [Source](https://en.wikipedia.org/wiki/Little_Switzerland_(Luxembourg)) |
| Macedonia | 30 | Ajvar | sticker-style Ajvar, no text, no people's faces | Ajvar is a spread made with roasted peppers. | [Source](https://en.wikipedia.org/wiki/Ajvar) |
| Madagascar | 8 | Ring-tailed lemur | sticker-style Ring-tailed lemur, no text, no people's faces | A ring-tailed lemur has dark and light rings on its tail. | [Source](https://en.wikipedia.org/wiki/Ring-tailed_lemur) |
| Malawi | 6 | Lake Malawi cichlid | sticker-style Lake Malawi cichlid, no text, no people's faces | Some Lake Malawi cichlids carry their young in their mouths. | [Source](https://whc.unesco.org/en/list/289/) |
| Malaysia | 114 | Nasi lemak | sticker-style Nasi lemak, no text, no people's faces | Nasi lemak is made with rice cooked in coconut milk. | [Source](https://en.wikipedia.org/wiki/Nasi_lemak) |
| Mali | 70 | Balafon | sticker-style Balafon, no text, no people's faces | A balafon has wooden keys that players strike to make music. | [Source](https://ich.unesco.org/en/RL/cultural-practices-and-expressions-linked-to-balafon-and-kolintang-in-mali-burkina-faso-cote-d-ivoire-and-indonesia-02131) |
| Mauritania | 70 | Shorebird | sticker-style Shorebird, no text, no people's faces | Migrating birds feed in the shallow waters of Mauritania's Banc d'Arguin. | [Source](https://whc.unesco.org/en/list/506/) |
| Moldova | 18 | Plăcintă | sticker-style Plăcintă, no text, no people's faces | Plăcintă is a pastry that can have a sweet or savoury filling. | [Source](https://en.wikipedia.org/wiki/Pl%C4%83cint%C4%83) |
| Mongolia | 188 | Przewalski's horse | sticker-style Przewalski's horse, no text, no people's faces | Przewalski's horses have short upright manes. | [Source](https://en.wikipedia.org/wiki/Przewalski%27s_horse) |
| Montenegro | 18 | Dalmatian pelican | sticker-style Dalmatian pelican, no text, no people's faces | A pelican has a pouch below its bill that helps it catch fish. | [Source](https://en.wikipedia.org/wiki/Dalmatian_pelican) |
| Mozambique | 14 | Dhow | sticker-style Dhow, no text, no people's faces | A dhow is a sailing boat used along the coast of Mozambique. | [Source](https://en.wikipedia.org/wiki/Dhow) |
| Myanmar | 130 | Mohinga | sticker-style Mohinga, no text, no people's faces | Mohinga is a noodle soup often made with fish broth. | [Source](https://en.wikipedia.org/wiki/Mohinga) |
| Namibia | 30 | Welwitschia | sticker-style Welwitschia, no text, no people's faces | Welwitschia plants grow long leaves that can keep growing for years. | [Source](https://en.wikipedia.org/wiki/Welwitschia) |
| Nicaragua | 14 | Masaya volcano | `volcano` | Masaya is an active volcano in Nicaragua. | [Source](https://en.wikipedia.org/wiki/Masaya_Volcano) |
| Niger | 86 | West African giraffe | `giraffe` | West African giraffes live in Niger and eat leaves from trees. | [Source](https://en.wikipedia.org/wiki/West_African_giraffe) |
| North Korea | 68 | Kimchi | sticker-style Kimchi, no text, no people's faces | Kimchi is made by fermenting vegetables. | [Source](https://ich.unesco.org/en/RL/tradition-of-kimchi-making-in-the-democratic-peoples-republic-of-korea-01063) |
| Oman | 46 | Frankincense tree | sticker-style Frankincense tree, no text, no people's faces | Frankincense is a fragrant resin that comes from trees. | [Source](https://whc.unesco.org/en/list/1010/) |
| Pakistan | 168 | Markhor | sticker-style Markhor, no text, no people's faces | The markhor is a wild goat with twisting horns. | [Source](https://en.wikipedia.org/wiki/Markhor) |
| Panama | 78 | Canal lock | sticker-style Canal lock, no text, no people's faces | Locks on the Panama Canal raise and lower ships. | [Source](https://pancanal.com/en/) |
| Papua New Guinea | 24 | Outrigger canoe | sticker-style Outrigger canoe, no text, no people's faces | The side float of an outrigger canoe helps it stay balanced. | [Source](https://en.wikipedia.org/wiki/Outrigger_boat) |
| Paraguay | 28 | Sopa paraguaya | sticker-style Sopa paraguaya, no text, no people's faces | Sopa paraguaya is a maize bread despite the word soup in its name. | [Source](https://en.wikipedia.org/wiki/Sopa_paraguaya) |
| Poland | 132 | Pierogi | sticker-style Pierogi, no text, no people's faces | Pierogi are dumplings with a filling wrapped in dough. | [Source](https://en.wikipedia.org/wiki/Pierogi) |
| Qatar | 8 | Arabian oryx | sticker-style Arabian oryx, no text, no people's faces | Arabian oryx have long, straight horns. | [Source](https://en.wikipedia.org/wiki/Arabian_oryx) |
| Romania | 62 | Mămăligă | sticker-style Mămăligă, no text, no people's faces | Mămăligă is a porridge made from maize meal. | [Source](https://en.wikipedia.org/wiki/M%C4%83m%C4%83lig%C4%83) |
| Russia | 436 | Lake Baikal | `lake` | Lake Baikal is the deepest lake in the world. | [Source](https://whc.unesco.org/en/list/754/) |
| S. Sudan | 50 | Shoebill | sticker-style Shoebill, no text, no people's faces | The shoebill is a wetland bird with a large shoe-shaped bill. | [Source](https://en.wikipedia.org/wiki/Shoebill) |
| Senegal | 86 | Thieboudienne | sticker-style Thieboudienne, no text, no people's faces | Thieboudienne combines rice, fish and vegetables. | [Source](https://ich.unesco.org/en/RL/ceebu-jen-a-culinary-art-of-senegal-01748) |
| Serbia | 58 | Gibanica | sticker-style Gibanica, no text, no people's faces | Gibanica is a baked pastry often filled with cheese and eggs. | [Source](https://en.wikipedia.org/wiki/Gibanica) |
| Sierra Leone | 10 | Cassava leaf stew | sticker-style Cassava leaf stew, no text, no people's faces | Cassava leaf stew is made with cooked cassava leaves. | [Source](https://en.wikipedia.org/wiki/Sierra_Leonean_cuisine) |
| Slovakia | 40 | Spiš Castle | sticker-style Spiš Castle, no text, no people's faces | Spiš Castle stands on a hill above the surrounding land. | [Source](https://whc.unesco.org/en/list/620/) |
| Slovenia | 16 | Potica | sticker-style Potica, no text, no people's faces | Potica is a rolled cake that can have a walnut filling. | [Source](https://en.wikipedia.org/wiki/Slovenian_potica) |
| Solomon Is. | 4 | Dugong | sticker-style Dugong, no text, no people's faces | Dugongs are sea mammals that eat seagrass. | [Source](https://en.wikipedia.org/wiki/Dugong) |
| Somalia | 44 | Canjeero | sticker-style Canjeero, no text, no people's faces | Canjeero is a pancake with small holes on its surface. | [Source](https://en.wikipedia.org/wiki/Lahoh) |
| Sri Lanka | 6 | Hopper | sticker-style Hopper, no text, no people's faces | A hopper is a bowl-shaped pancake made with rice flour. | [Source](https://en.wikipedia.org/wiki/Appam) |
| Sudan | 92 | Kisra flatbread | sticker-style Kisra flatbread, no text, no people's faces | Kisra is a thin flatbread often made from sorghum. | [Source](https://en.wikipedia.org/wiki/Kisra) |
| Suriname | 12 | Dugout canoe | `canoe` | A dugout canoe is made by hollowing out a log. | [Source](https://en.wikipedia.org/wiki/Dugout_canoe) |
| Sweden | 98 | Moose | sticker-style Moose, no text, no people's faces | A moose is a large deer whose males grow broad antlers. | [Source](https://en.wikipedia.org/wiki/Moose) |
| Syria | 52 | Hama waterwheel | sticker-style Hama waterwheel, no text, no people's faces | The wooden waterwheels in Hama lift water as they turn. | [Source](https://en.wikipedia.org/wiki/Norias_of_Hama) |
| Tajikistan | 50 | Yak | sticker-style Yak, no text, no people's faces | Yaks have thick coats that help them stay warm in the mountains. | [Source](https://en.wikipedia.org/wiki/Yak) |
| Tanzania | 20 | Mount Kilimanjaro | `mountain` | Kilimanjaro is a high volcanic mountain in Tanzania. | [Source](https://whc.unesco.org/en/list/403/) |
| Timor-Leste | 4 | Saltwater crocodile | `crocodile` | Saltwater crocodiles can live in both fresh and salty water. | [Source](https://en.wikipedia.org/wiki/Saltwater_crocodile) |
| Togo | 30 | Koutammakou tower house | sticker-style Koutammakou tower house, no text, no people's faces | Koutammakou has distinctive earthen tower houses. | [Source](https://whc.unesco.org/en/list/1140/) |
| Trinidad and Tobago | 4 | Steelpan | sticker-style Steelpan, no text, no people's faces | A steelpan is a musical instrument made from shaped metal. | [Source](https://en.wikipedia.org/wiki/Steelpan) |
| Tunisia | 28 | Harissa | sticker-style Harissa, no text, no people's faces | Harissa is a paste made from peppers and other seasonings. | [Source](https://ich.unesco.org/en/RL/harissa-knowledge-skills-and-culinary-and-social-practices-01710) |
| Turkmenistan | 74 | Akhal-Teke horse | `horse` | Some Akhal-Teke horses have coats with a shiny appearance. | [Source](https://en.wikipedia.org/wiki/Akhal-Teke) |
| Uganda | 24 | Matoke | sticker-style Matoke, no text, no people's faces | Matoke is made with green cooking bananas. | [Source](https://en.wikipedia.org/wiki/Matoke) |
| Ukraine | 102 | Borscht | `soup` | Many versions of borscht are red because they contain beetroot. | [Source](https://ich.unesco.org/en/USL/culture-of-ukrainian-borscht-cooking-01852) |
| Uruguay | 38 | Capybara | sticker-style Capybara, no text, no people's faces | Capybaras have partly webbed feet that help them swim. | [Source](https://en.wikipedia.org/wiki/Capybara) |
| Uzbekistan | 96 | Palov | sticker-style Palov, no text, no people's faces | Uzbek palov combines rice with ingredients such as carrots and meat. | [Source](https://ich.unesco.org/en/RL/palov-culture-and-tradition-01166) |
| Vanuatu | 4 | Mount Yasur | `volcano` | Mount Yasur is an active volcano on the island of Tanna. | [Source](https://en.wikipedia.org/wiki/Mount_Yasur) |
| Venezuela | 70 | Angel Falls | `waterfall` | Angel Falls drops from a steep-sided mountain in Venezuela's Canaima National Park. | [Source](https://whc.unesco.org/en/list/701/) |
| Yemen | 38 | Shibam houses | sticker-style Shibam houses, no text, no people's faces | The old houses of Shibam are built from earth bricks. | [Source](https://whc.unesco.org/en/list/192/) |
| Zambia | 12 | Victoria Falls | `waterfall` | The Zambezi River flows over Victoria Falls between Zambia and Zimbabwe. | [Source](https://whc.unesco.org/en/list/509) |
| Zimbabwe | 10 | Great Zimbabwe stone walls | sticker-style Great Zimbabwe stone walls, no text, no people's faces | The builders of Great Zimbabwe fitted stones together without mortar. | [Source](https://whc.unesco.org/en/list/364/) |

## All sampled map names and directed route counts

| Map name | Routes |
|---|---:|
| Afghanistan | 122 |
| Albania | 40 |
| Algeria | 100 |
| Angola | 36 |
| Antarctica | 6 |
| Argentina | 104 |
| Armenia | 22 |
| Australia | 126 |
| Austria | 68 |
| Azerbaijan | 44 |
| Bahamas | 18 |
| Bangladesh | 52 |
| Belarus | 84 |
| Belgium | 66 |
| Belize | 8 |
| Benin | 44 |
| Bhutan | 24 |
| Bolivia | 34 |
| Bosnia and Herz. | 44 |
| Botswana | 14 |
| Brazil | 230 |
| Brunei | 4 |
| Bulgaria | 66 |
| Burkina Faso | 32 |
| Burundi | 4 |
| Cambodia | 60 |
| Cameroon | 48 |
| Canada | 288 |
| Central African Rep. | 32 |
| Chad | 66 |
| Chile | 82 |
| China | 472 |
| Colombia | 120 |
| Congo | 22 |
| Costa Rica | 2 |
| Croatia | 56 |
| Cuba | 34 |
| Cyprus | 2 |
| Czechia | 52 |
| CÃ´te d'Ivoire | 24 |
| Dem. Rep. Congo | 50 |
| Denmark | 52 |
| Djibouti | 10 |
| Dominican Rep. | 18 |
| Ecuador | 18 |
| Egypt | 146 |
| El Salvador | 6 |
| Eq. Guinea | 4 |
| Eritrea | 26 |
| Estonia | 32 |
| eSwatini | 2 |
| Ethiopia | 118 |
| Fiji | 58 |
| Finland | 68 |
| France | 254 |
| Gabon | 18 |
| Gambia | 8 |
| Georgia | 32 |
| Germany | 256 |
| Ghana | 32 |
| Greece | 76 |
| Greenland | 80 |
| Guatemala | 18 |
| Guinea | 20 |
| Guinea-Bissau | 10 |
| Guyana | 22 |
| Haiti | 18 |
| Honduras | 12 |
| Hungary | 54 |
| Iceland | 106 |
| India | 336 |
| Indonesia | 154 |
| Iran | 138 |
| Iraq | 72 |
| Ireland | 124 |
| Israel | 30 |
| Italy | 188 |
| Jamaica | 8 |
| Japan | 104 |
| Jordan | 38 |
| Kazakhstan | 242 |
| Kenya | 94 |
| Kosovo | 12 |
| Kuwait | 10 |
| Kyrgyzstan | 80 |
| Laos | 56 |
| Latvia | 54 |
| Lebanon | 4 |
| Lesotho | 2 |
| Liberia | 12 |
| Libya | 86 |
| Lithuania | 48 |
| Luxembourg | 16 |
| Macedonia | 30 |
| Madagascar | 8 |
| Malawi | 6 |
| Malaysia | 114 |
| Mali | 70 |
| Mauritania | 70 |
| Mexico | 100 |
| Moldova | 18 |
| Mongolia | 188 |
| Montenegro | 18 |
| Morocco | 56 |
| Mozambique | 14 |
| Myanmar | 130 |
| N. Cyprus | 2 |
| Namibia | 30 |
| Nepal | 62 |
| Netherlands | 148 |
| New Caledonia | 6 |
| New Zealand | 58 |
| Nicaragua | 14 |
| Niger | 86 |
| Nigeria | 118 |
| North Korea | 68 |
| Norway | 72 |
| Oman | 46 |
| Pakistan | 168 |
| Palestine | 10 |
| Panama | 78 |
| Papua New Guinea | 24 |
| Paraguay | 28 |
| Peru | 86 |
| Philippines | 92 |
| Poland | 132 |
| Portugal | 130 |
| Puerto Rico | 4 |
| Qatar | 8 |
| Romania | 62 |
| Russia | 436 |
| Rwanda | 2 |
| S. Sudan | 50 |
| Saudi Arabia | 68 |
| Senegal | 86 |
| Serbia | 58 |
| Sierra Leone | 10 |
| Slovakia | 40 |
| Slovenia | 16 |
| Solomon Is. | 4 |
| Somalia | 44 |
| Somaliland | 26 |
| South Africa | 82 |
| South Korea | 106 |
| Spain | 206 |
| Sri Lanka | 6 |
| Sudan | 92 |
| Suriname | 12 |
| Sweden | 98 |
| Switzerland | 48 |
| Syria | 52 |
| Taiwan | 8 |
| Tajikistan | 50 |
| Tanzania | 20 |
| Thailand | 154 |
| Timor-Leste | 4 |
| Togo | 30 |
| Trinidad and Tobago | 4 |
| Tunisia | 28 |
| Turkey | 152 |
| Turkmenistan | 74 |
| Uganda | 24 |
| Ukraine | 102 |
| United Arab Emirates | 94 |
| United Kingdom | 224 |
| United States of America | 400 |
| Uruguay | 38 |
| Uzbekistan | 96 |
| Vanuatu | 4 |
| Venezuela | 70 |
| Vietnam | 134 |
| W. Sahara | 34 |
| Yemen | 38 |
| Zambia | 12 |
| Zimbabwe | 10 |
