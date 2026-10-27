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
| Algeria | 100 | Fennec fox | sticker-style Fennec fox, no text, no people's faces | A fennec fox has large ears that help it lose heat. | [Source](https://en.wikipedia.org/wiki/Fennec_fox) |
| Armenia | 22 | Lavash bread | `bread` | Lavash is a traditional thin Armenian bread. | [Source](https://ich.unesco.org/en/RL/lavash-the-preparation-meaning-and-appearance-of-traditional-bread-as-an-expression-of-culture-in-armenia-00985) |
| Austria | 68 | Apple strudel | sticker-style Apple strudel, no text, no people's faces | Apple strudel is a pastry with an apple filling. | [Source](https://en.wikipedia.org/wiki/Apfelstrudel) |
| Belarus | 84 | Draniki | sticker-style Draniki, no text, no people's faces | Draniki are pancakes made with grated potatoes. | [Source](https://en.wikipedia.org/wiki/Potato_pancake) |
| Chile | 82 | Pastel de choclo | sticker-style Pastel de choclo, no text, no people's faces | Pastel de choclo is baked with a topping made from maize. | [Source](https://en.wikipedia.org/wiki/Pastel_de_choclo) |
| Colombia | 120 | Arepa | sticker-style Arepa, no text, no people's faces | Arepas are round maize cakes that can be split and filled. | [Source](https://en.wikipedia.org/wiki/Arepa) |
| Finland | 68 | Karelian pasty | sticker-style Karelian pasty, no text, no people's faces | A Karelian pasty has a thin rye crust and often a rice filling. | [Source](https://en.wikipedia.org/wiki/Karelian_pasty) |
| Georgia | 32 | Khachapuri | `bread` | Khachapuri is a Georgian cheese bread. | [Source](https://ich.unesco.org/doc/src/45726.pdf) |
| Iceland | 106 | Volcano | `volcano` | Iceland has both volcanoes and glaciers. | [Source](https://en.wikipedia.org/wiki/Iceland) |
| Iraq | 72 | Masgouf | sticker-style Masgouf, no text, no people's faces | Masgouf is a fish dish cooked beside a fire. | [Source](https://en.wikipedia.org/wiki/Masgouf) |
| Ireland | 124 | Colcannon | sticker-style Colcannon, no text, no people's faces | Colcannon mixes mashed potatoes with cabbage or kale. | [Source](https://en.wikipedia.org/wiki/Colcannon) |
| Kazakhstan | 242 | Wild apple | `apple` | Wild apple trees grow in the mountains of Kazakhstan. | [Source](https://en.wikipedia.org/wiki/Malus_sieversii) |
| Kyrgyzstan | 80 | Shyrdak felt rug | sticker-style Shyrdak felt rug, no text, no people's faces | Shyrdak rugs are made with pieces of coloured felt. | [Source](https://ich.unesco.org/en/USL/ala-kiyiz-and-shyrdak-art-of-kyrgyz-traditional-felt-carpets-00693) |
| Libya | 86 | Bazeen | sticker-style Bazeen, no text, no people's faces | Bazeen is a Libyan dish made with barley flour. | [Source](https://en.wikipedia.org/wiki/Bazin_(bread)) |
| Malaysia | 114 | Nasi lemak | sticker-style Nasi lemak, no text, no people's faces | Nasi lemak is made with rice cooked in coconut milk. | [Source](https://en.wikipedia.org/wiki/Nasi_lemak) |
| Mali | 70 | Balafon | sticker-style Balafon, no text, no people's faces | A balafon has wooden keys that players strike to make music. | [Source](https://ich.unesco.org/en/RL/cultural-practices-and-expressions-linked-to-balafon-and-kolintang-in-mali-burkina-faso-cote-d-ivoire-and-indonesia-02131) |
| Mauritania | 70 | Shorebird | sticker-style Shorebird, no text, no people's faces | Migrating birds feed in the shallow waters of Mauritania's Banc d'Arguin. | [Source](https://whc.unesco.org/en/list/506/) |
| Mongolia | 188 | Przewalski's horse | sticker-style Przewalski's horse, no text, no people's faces | Przewalski's horses have short upright manes. | [Source](https://en.wikipedia.org/wiki/Przewalski%27s_horse) |
| Myanmar | 130 | Mohinga | sticker-style Mohinga, no text, no people's faces | Mohinga is a noodle soup often made with fish broth. | [Source](https://en.wikipedia.org/wiki/Mohinga) |
| Niger | 86 | West African giraffe | `giraffe` | West African giraffes live in Niger and eat leaves from trees. | [Source](https://en.wikipedia.org/wiki/West_African_giraffe) |
| Pakistan | 168 | Markhor | sticker-style Markhor, no text, no people's faces | The markhor is a wild goat with twisting horns. | [Source](https://en.wikipedia.org/wiki/Markhor) |
| Panama | 78 | Canal lock | sticker-style Canal lock, no text, no people's faces | Locks on the Panama Canal raise and lower ships. | [Source](https://pancanal.com/en/) |
| Poland | 132 | Pierogi | sticker-style Pierogi, no text, no people's faces | Pierogi are dumplings with a filling wrapped in dough. | [Source](https://en.wikipedia.org/wiki/Pierogi) |
| Russia | 436 | Lake Baikal | `lake` | Lake Baikal is the deepest lake in the world. | [Source](https://whc.unesco.org/en/list/754/) |
| Senegal | 86 | Thieboudienne | sticker-style Thieboudienne, no text, no people's faces | Thieboudienne combines rice, fish and vegetables. | [Source](https://ich.unesco.org/en/RL/ceebu-jen-a-culinary-art-of-senegal-01602) |
| Sudan | 92 | Kisra flatbread | sticker-style Kisra flatbread, no text, no people's faces | Kisra is a thin flatbread often made from sorghum. | [Source](https://en.wikipedia.org/wiki/Kisra) |
| Sweden | 98 | Moose | sticker-style Moose, no text, no people's faces | A moose is a large deer whose males grow broad antlers. | [Source](https://en.wikipedia.org/wiki/Moose) |
| Turkmenistan | 74 | Akhal-Teke horse | `horse` | Some Akhal-Teke horses have coats with a shiny appearance. | [Source](https://en.wikipedia.org/wiki/Akhal-Teke) |
| Ukraine | 102 | Borscht | `soup` | Many versions of borscht are red because they contain beetroot. | [Source](https://ich.unesco.org/en/USL/culture-of-ukrainian-borscht-cooking-01852) |
| Uzbekistan | 96 | Palov | sticker-style Palov, no text, no people's faces | Uzbek palov combines rice with ingredients such as carrots and meat. | [Source](https://ich.unesco.org/en/RL/palov-culture-and-tradition-01166) |
| Venezuela | 70 | Angel Falls | `waterfall` | Angel Falls drops from a steep-sided mountain in Venezuela's Canaima National Park. | [Source](https://whc.unesco.org/en/list/701/) |
| Zambia | 12 | Victoria Falls | `waterfall` | The Zambezi River flows over Victoria Falls between Zambia and Zimbabwe. | [Source](https://whc.unesco.org/en/list/509) |

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
