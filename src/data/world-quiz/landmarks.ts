/** Static picture-round data. Source URLs are review provenance, never runtime downloads. */
import type { PictureQuestion } from './picture-question';

export const LANDMARK_QUESTIONS: readonly PictureQuestion[] = [
  {
    "id": "landmark-eiffel-tower",
    "iso2": "fr",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "France",
      "Germany",
      "Italy",
      "Spain"
    ],
    "correctIndex": 0,
    "picture": "Eiffel Tower",
    "fact": "The Eiffel Tower stands beside the Seine in Paris.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Eiffel_Tower"
  },
  {
    "id": "landmark-statue-of-liberty",
    "iso2": "us",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Mexico",
      "United States",
      "Cuba",
      "Jamaica"
    ],
    "correctIndex": 1,
    "picture": "Statue of Liberty",
    "fact": "The Statue of Liberty stands on Liberty Island in New York Harbor.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Statue_of_Liberty"
  },
  {
    "id": "landmark-great-wall",
    "iso2": "cn",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Mongolia",
      "India",
      "China",
      "Thailand"
    ],
    "correctIndex": 2,
    "picture": "Great Wall China",
    "fact": "The Great Wall stretches across northern China.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Great_Wall_of_China"
  },
  {
    "id": "landmark-taj-mahal",
    "iso2": "in",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Sri Lanka",
      "Bhutan",
      "Japan",
      "India"
    ],
    "correctIndex": 3,
    "picture": "Taj Mahal mausoleum",
    "fact": "The Taj Mahal stands beside the Yamuna River in Agra.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Taj_Mahal"
  },
  {
    "id": "landmark-pyramids-of-giza",
    "iso2": "eg",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Egypt",
      "South Africa",
      "Kenya",
      "Nigeria"
    ],
    "correctIndex": 0,
    "picture": "Giza pyramids",
    "fact": "The pyramids of Giza stand near Cairo.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Giza_pyramid_complex"
  },
  {
    "id": "landmark-colosseum",
    "iso2": "it",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Netherlands",
      "Italy",
      "Switzerland",
      "Belgium"
    ],
    "correctIndex": 1,
    "picture": "Colosseum Rome",
    "fact": "The Colosseum is an ancient amphitheatre in Rome.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Colosseum"
  },
  {
    "id": "landmark-sydney-opera-house",
    "iso2": "au",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "New Zealand",
      "Papua New Guinea",
      "Australia",
      "Fiji"
    ],
    "correctIndex": 2,
    "picture": "Sydney Opera House",
    "fact": "The Sydney Opera House stands beside Sydney Harbour.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sydney_Opera_House"
  },
  {
    "id": "landmark-big-ben",
    "iso2": "gb",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Belgium",
      "Austria",
      "Greece",
      "United Kingdom"
    ],
    "correctIndex": 3,
    "picture": "Big Ben tower",
    "fact": "Big Ben is the great bell inside London's Elizabeth Tower.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Big_Ben"
  },
  {
    "id": "landmark-christ-the-redeemer",
    "iso2": "br",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Brazil",
      "Paraguay",
      "Guyana",
      "Suriname"
    ],
    "correctIndex": 0,
    "picture": "Christ Redeemer statue",
    "fact": "Christ the Redeemer overlooks Rio de Janeiro from Corcovado mountain.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"
  },
  {
    "id": "landmark-machu-picchu",
    "iso2": "pe",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Guyana",
      "Peru",
      "Suriname",
      "Brazil"
    ],
    "correctIndex": 1,
    "picture": "Machu Picchu ruins",
    "fact": "Machu Picchu is an Inca site high in the Andes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Machu_Picchu"
  },
  {
    "id": "landmark-angkor-wat",
    "iso2": "kh",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "India",
      "South Korea",
      "Cambodia",
      "Turkey"
    ],
    "correctIndex": 2,
    "picture": "Angkor Wat temple",
    "fact": "Angkor Wat is a temple complex near Siem Reap.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Angkor_Wat"
  },
  {
    "id": "landmark-petra",
    "iso2": "jo",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Armenia",
      "Kazakhstan",
      "Uzbekistan",
      "Jordan"
    ],
    "correctIndex": 3,
    "picture": "Petra Treasury",
    "fact": "Petra's Treasury was carved into sandstone cliffs.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Al-Khazneh"
  },
  {
    "id": "landmark-mount-fuji",
    "iso2": "jp",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Japan",
      "Pakistan",
      "Bangladesh",
      "Nepal"
    ],
    "correctIndex": 0,
    "picture": "Mount Fuji summit",
    "fact": "Mount Fuji is Japan's highest mountain.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Fuji"
  },
  {
    "id": "landmark-acropolis",
    "iso2": "gr",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Finland",
      "Greece",
      "Denmark",
      "Ireland"
    ],
    "correctIndex": 1,
    "picture": "Acropolis Athens",
    "fact": "The Acropolis rises above Athens.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Acropolis_of_Athens"
  },
  {
    "id": "landmark-sagrada-familia",
    "iso2": "es",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Denmark",
      "Ireland",
      "Spain",
      "Poland"
    ],
    "correctIndex": 2,
    "picture": "Sagrada Familia basilica",
    "fact": "The Sagrada Familia is a basilica in Barcelona.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sagrada_Fam%C3%ADlia"
  },
  {
    "id": "landmark-burj-khalifa",
    "iso2": "ae",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Japan",
      "China",
      "India",
      "United Arab Emirates"
    ],
    "correctIndex": 3,
    "picture": "Burj Khalifa tower",
    "fact": "The Burj Khalifa rises above Dubai.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Burj_Khalifa"
  },
  {
    "id": "landmark-leaning-tower-of-pisa",
    "iso2": "it",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Italy",
      "Poland",
      "Ukraine",
      "Iceland"
    ],
    "correctIndex": 0,
    "picture": "Leaning Tower Pisa",
    "fact": "The Leaning Tower of Pisa is a cathedral bell tower.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Leaning_Tower_of_Pisa"
  },
  {
    "id": "landmark-stonehenge",
    "iso2": "gb",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Ukraine",
      "United Kingdom",
      "Iceland",
      "Czechia"
    ],
    "correctIndex": 1,
    "picture": "Stonehenge stones",
    "fact": "Stonehenge stands on Salisbury Plain in England.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Stonehenge"
  },
  {
    "id": "landmark-moai",
    "iso2": "cl",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Uruguay",
      "Paraguay",
      "Chile",
      "Guyana"
    ],
    "correctIndex": 2,
    "picture": "Rapa Nui moai",
    "fact": "Moai are stone statues on Rapa Nui, an island belonging to Chile.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Moai"
  },
  {
    "id": "landmark-golden-gate-bridge",
    "iso2": "us",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Panama",
      "Guatemala",
      "Honduras",
      "United States"
    ],
    "correctIndex": 3,
    "picture": "Golden Gate Bridge",
    "fact": "The Golden Gate Bridge links San Francisco with Marin County.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Golden_Gate_Bridge"
  },
  {
    "id": "landmark-grand-canyon",
    "iso2": "us",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "United States",
      "Guatemala",
      "Honduras",
      "Nicaragua"
    ],
    "correctIndex": 0,
    "picture": "Grand Canyon cliffs",
    "fact": "The Colorado River flows through the Grand Canyon.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Grand_Canyon"
  },
  {
    "id": "landmark-mount-rushmore",
    "iso2": "us",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Honduras",
      "United States",
      "Nicaragua",
      "El Salvador"
    ],
    "correctIndex": 1,
    "picture": "Mount Rushmore sculpture",
    "fact": "Mount Rushmore has four presidents' faces carved into granite.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Rushmore"
  },
  {
    "id": "landmark-hollywood-sign",
    "iso2": "us",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Nicaragua",
      "El Salvador",
      "United States",
      "Haiti"
    ],
    "correctIndex": 2,
    "picture": "Hollywood Sign",
    "fact": "The Hollywood Sign stands in the hills above Los Angeles.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Hollywood_Sign"
  },
  {
    "id": "landmark-cn-tower",
    "iso2": "ca",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "El Salvador",
      "Haiti",
      "Dominican Republic",
      "Canada"
    ],
    "correctIndex": 3,
    "picture": "CN Tower Toronto",
    "fact": "The CN Tower stands beside downtown Toronto's railway lands.",
    "sourceUrl": "https://en.wikipedia.org/wiki/CN_Tower"
  },
  {
    "id": "landmark-chichen-itza",
    "iso2": "mx",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Mexico",
      "Haiti",
      "Dominican Republic",
      "Bahamas"
    ],
    "correctIndex": 0,
    "picture": "Chichen Itza pyramid",
    "fact": "El Castillo is a step pyramid at Chichen Itza.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Chichen_Itza"
  },
  {
    "id": "landmark-teotihuacan",
    "iso2": "mx",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Dominican Republic",
      "Mexico",
      "Bahamas",
      "Belize"
    ],
    "correctIndex": 1,
    "picture": "Teotihuacan pyramids",
    "fact": "Teotihuacan includes the Pyramid of the Sun.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Teotihuacan"
  },
  {
    "id": "landmark-panama-canal",
    "iso2": "pa",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Bahamas",
      "Belize",
      "Panama",
      "United States"
    ],
    "correctIndex": 2,
    "picture": "Panama Canal locks",
    "fact": "The Panama Canal connects the Atlantic and Pacific oceans.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Panama_Canal"
  },
  {
    "id": "landmark-arenal-volcano",
    "iso2": "cr",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Belize",
      "United States",
      "Canada",
      "Costa Rica"
    ],
    "correctIndex": 3,
    "picture": "Arenal volcano cone",
    "fact": "Arenal is a cone-shaped volcano in northern Costa Rica.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Arenal_Volcano"
  },
  {
    "id": "landmark-tikal",
    "iso2": "gt",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Guatemala",
      "United States",
      "Canada",
      "Mexico"
    ],
    "correctIndex": 0,
    "picture": "Tikal temples",
    "fact": "Tikal was a Maya city surrounded by tropical forest.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tikal"
  },
  {
    "id": "landmark-angel-falls",
    "iso2": "ve",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Uruguay",
      "Venezuela",
      "Paraguay",
      "Guyana"
    ],
    "correctIndex": 1,
    "picture": "Angel Falls waterfall",
    "fact": "Angel Falls drops from the Auyán-tepui plateau.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Angel_Falls"
  },
  {
    "id": "landmark-galapagos-islands",
    "iso2": "ec",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Paraguay",
      "Guyana",
      "Ecuador",
      "Suriname"
    ],
    "correctIndex": 2,
    "picture": "Galapagos volcanic islands",
    "fact": "The Galapagos Islands lie in the Pacific Ocean west of Ecuador.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gal%C3%A1pagos_Islands"
  },
  {
    "id": "landmark-salar-de-uyuni",
    "iso2": "bo",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Guyana",
      "Suriname",
      "Brazil",
      "Bolivia"
    ],
    "correctIndex": 3,
    "picture": "Salar Uyuni salt",
    "fact": "The Salar de Uyuni is a vast salt flat in Bolivia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Salar_de_Uyuni"
  },
  {
    "id": "landmark-sugarloaf-mountain",
    "iso2": "br",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Brazil",
      "Suriname",
      "Argentina",
      "Chile"
    ],
    "correctIndex": 0,
    "picture": "Sugarloaf Mountain Rio",
    "fact": "Sugarloaf Mountain rises beside Guanabara Bay in Rio de Janeiro.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sugarloaf_Mountain"
  },
  {
    "id": "landmark-torres-del-paine",
    "iso2": "cl",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Brazil",
      "Chile",
      "Argentina",
      "Peru"
    ],
    "correctIndex": 1,
    "picture": "Torres del Paine",
    "fact": "The granite towers of Torres del Paine rise in Chilean Patagonia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Torres_del_Paine_National_Park"
  },
  {
    "id": "landmark-neuschwanstein-castle",
    "iso2": "de",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "France",
      "Italy",
      "Germany",
      "Spain"
    ],
    "correctIndex": 2,
    "picture": "Neuschwanstein Castle",
    "fact": "Neuschwanstein Castle stands in Bavaria near the Alps.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Neuschwanstein_Castle"
  },
  {
    "id": "landmark-brandenburg-gate",
    "iso2": "de",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Italy",
      "Spain",
      "United Kingdom",
      "Germany"
    ],
    "correctIndex": 3,
    "picture": "Brandenburg Gate",
    "fact": "The Brandenburg Gate stands in Berlin.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Brandenburg_Gate"
  },
  {
    "id": "landmark-kinderdijk",
    "iso2": "nl",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Netherlands",
      "Italy",
      "Spain",
      "United Kingdom"
    ],
    "correctIndex": 0,
    "picture": "Kinderdijk windmills",
    "fact": "Kinderdijk's windmills helped manage water in low-lying land.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kinderdijk"
  },
  {
    "id": "landmark-atomium",
    "iso2": "be",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Spain",
      "Belgium",
      "United Kingdom",
      "Portugal"
    ],
    "correctIndex": 1,
    "picture": "Atomium Brussels",
    "fact": "The Atomium was built for the 1958 Brussels World's Fair.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Atomium"
  },
  {
    "id": "landmark-nyhavn",
    "iso2": "dk",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Ireland",
      "Poland",
      "Denmark",
      "Ukraine"
    ],
    "correctIndex": 2,
    "picture": "Nyhavn canal houses",
    "fact": "Colourful old houses line Copenhagen's Nyhavn canal.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Nyhavn"
  },
  {
    "id": "landmark-saint-basil-s-cathedral",
    "iso2": "ru",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Poland",
      "Ukraine",
      "Iceland",
      "Russia"
    ],
    "correctIndex": 3,
    "picture": "Saint Basil cathedral",
    "fact": "Saint Basil's Cathedral stands on Moscow's Red Square.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Saint_Basil's_Cathedral"
  },
  {
    "id": "landmark-blue-mosque",
    "iso2": "tr",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Turkey",
      "Kuwait",
      "Oman",
      "Lebanon"
    ],
    "correctIndex": 0,
    "picture": "Blue Mosque Istanbul",
    "fact": "The Blue Mosque has six minarets in Istanbul.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Blue_Mosque,_Istanbul"
  },
  {
    "id": "landmark-hagia-sophia",
    "iso2": "tr",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Oman",
      "Turkey",
      "Lebanon",
      "Israel"
    ],
    "correctIndex": 1,
    "picture": "Hagia Sophia exterior",
    "fact": "Hagia Sophia stands in Istanbul's historic centre.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Hagia_Sophia"
  },
  {
    "id": "landmark-himeji-castle",
    "iso2": "jp",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Malaysia",
      "Turkey",
      "Japan",
      "Saudi Arabia"
    ],
    "correctIndex": 2,
    "picture": "Himeji Castle",
    "fact": "Himeji Castle is known for its white walls.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Himeji_Castle"
  },
  {
    "id": "landmark-fushimi-inari-shrine",
    "iso2": "jp",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Turkey",
      "Saudi Arabia",
      "United Arab Emirates",
      "Japan"
    ],
    "correctIndex": 3,
    "picture": "Fushimi Inari gates",
    "fact": "Fushimi Inari Shrine has paths lined with red torii gates.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha"
  },
  {
    "id": "landmark-terracotta-army",
    "iso2": "cn",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "China",
      "Saudi Arabia",
      "United Arab Emirates",
      "Pakistan"
    ],
    "correctIndex": 0,
    "picture": "Terracotta Army warriors",
    "fact": "The Terracotta Army guards the tomb of China's first emperor.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Terracotta_Army"
  },
  {
    "id": "landmark-forbidden-city",
    "iso2": "cn",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "United Arab Emirates",
      "China",
      "Pakistan",
      "Bangladesh"
    ],
    "correctIndex": 1,
    "picture": "Forbidden City palace",
    "fact": "The Forbidden City was an imperial palace in Beijing.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Forbidden_City"
  },
  {
    "id": "landmark-leshan-giant-buddha",
    "iso2": "cn",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Pakistan",
      "Bangladesh",
      "China",
      "Nepal"
    ],
    "correctIndex": 2,
    "picture": "Leshan Giant Buddha",
    "fact": "The Leshan Giant Buddha is carved into a riverside cliff.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Leshan_Giant_Buddha"
  },
  {
    "id": "landmark-borobudur",
    "iso2": "id",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Saudi Arabia",
      "United Arab Emirates",
      "Pakistan",
      "Indonesia"
    ],
    "correctIndex": 3,
    "picture": "Borobudur temple",
    "fact": "Borobudur is a Buddhist temple on Java.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Borobudur"
  },
  {
    "id": "landmark-prambanan",
    "iso2": "id",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Indonesia",
      "United Arab Emirates",
      "Pakistan",
      "Bangladesh"
    ],
    "correctIndex": 0,
    "picture": "Prambanan temples",
    "fact": "Prambanan is a Hindu temple complex on Java.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Prambanan"
  },
  {
    "id": "landmark-petronas-towers",
    "iso2": "my",
    "level": 1,
    "prompt": "Which country is this in?",
    "options": [
      "Pakistan",
      "Malaysia",
      "Bangladesh",
      "Nepal"
    ],
    "correctIndex": 1,
    "picture": "Petronas Twin Towers",
    "fact": "The Petronas Towers stand in Kuala Lumpur.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Petronas_Towers"
  },
  {
    "id": "landmark-batu-caves",
    "iso2": "my",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Bangladesh",
      "Nepal",
      "Malaysia",
      "Sri Lanka"
    ],
    "correctIndex": 2,
    "picture": "Batu Caves entrance",
    "fact": "Batu Caves contains Hindu shrines inside limestone caves.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Batu_Caves"
  },
  {
    "id": "landmark-chocolate-hills",
    "iso2": "ph",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Nepal",
      "Sri Lanka",
      "Mongolia",
      "Philippines"
    ],
    "correctIndex": 3,
    "picture": "Chocolate Hills",
    "fact": "The Chocolate Hills are rounded hills on Bohol.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Chocolate_Hills"
  },
  {
    "id": "landmark-banaue-rice-terraces",
    "iso2": "ph",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Philippines",
      "Sri Lanka",
      "Mongolia",
      "Iran"
    ],
    "correctIndex": 0,
    "picture": "Banaue rice terraces",
    "fact": "Banaue's rice terraces follow the mountain slopes of Luzon.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Banaue_Rice_Terraces"
  },
  {
    "id": "landmark-shwedagon-pagoda",
    "iso2": "mm",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Mongolia",
      "Myanmar",
      "Iran",
      "Iraq"
    ],
    "correctIndex": 1,
    "picture": "Shwedagon Pagoda",
    "fact": "The Shwedagon Pagoda has a golden stupa in Yangon.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Shwedagon_Pagoda"
  },
  {
    "id": "landmark-pha-that-luang",
    "iso2": "la",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Iran",
      "Iraq",
      "Laos",
      "Israel"
    ],
    "correctIndex": 2,
    "picture": "Pha That Luang",
    "fact": "Pha That Luang is a golden stupa in Vientiane.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pha_That_Luang"
  },
  {
    "id": "landmark-wat-arun",
    "iso2": "th",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Iraq",
      "Israel",
      "Jordan",
      "Thailand"
    ],
    "correctIndex": 3,
    "picture": "Wat Arun temple",
    "fact": "Wat Arun stands beside the Chao Phraya River in Bangkok.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Wat_Arun"
  },
  {
    "id": "landmark-grand-palace",
    "iso2": "th",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Thailand",
      "Israel",
      "Jordan",
      "Qatar"
    ],
    "correctIndex": 0,
    "picture": "Bangkok Grand Palace",
    "fact": "Bangkok's Grand Palace once housed the kings of Siam.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Grand_Palace"
  },
  {
    "id": "landmark-ha-long-bay",
    "iso2": "vn",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Jordan",
      "Vietnam",
      "Qatar",
      "Kuwait"
    ],
    "correctIndex": 1,
    "picture": "Ha Long Bay",
    "fact": "Limestone islands rise from the water in Ha Long Bay.",
    "sourceUrl": "https://en.wikipedia.org/wiki/H%E1%BA%A1_Long_Bay"
  },
  {
    "id": "landmark-golden-bridge",
    "iso2": "vn",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Qatar",
      "Kuwait",
      "Vietnam",
      "Oman"
    ],
    "correctIndex": 2,
    "picture": "Golden Bridge hands",
    "fact": "Giant stone-like hands appear to support the Golden Bridge near Da Nang.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Golden_Bridge_(Vietnam)"
  },
  {
    "id": "landmark-gyeongbokgung",
    "iso2": "kr",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Oman",
      "Kazakhstan",
      "Uzbekistan",
      "South Korea"
    ],
    "correctIndex": 3,
    "picture": "Gyeongbokgung palace",
    "fact": "Gyeongbokgung was a royal palace of the Joseon dynasty in Seoul.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gyeongbokgung"
  },
  {
    "id": "landmark-seoraksan",
    "iso2": "kr",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "South Korea",
      "Kazakhstan",
      "Uzbekistan",
      "Afghanistan"
    ],
    "correctIndex": 0,
    "picture": "Seoraksan mountain peaks",
    "fact": "Seoraksan is a mountain in northeastern South Korea.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Seoraksan"
  },
  {
    "id": "landmark-sigiriya",
    "iso2": "lk",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Kazakhstan",
      "Sri Lanka",
      "Uzbekistan",
      "Afghanistan"
    ],
    "correctIndex": 1,
    "picture": "Sigiriya rock fortress",
    "fact": "Sigiriya's ancient fortress stands on a great rock.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sigiriya"
  },
  {
    "id": "landmark-lahore-fort",
    "iso2": "pk",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Uzbekistan",
      "Afghanistan",
      "Pakistan",
      "Brunei"
    ],
    "correctIndex": 2,
    "picture": "Lahore Fort",
    "fact": "Lahore Fort contains palaces, gardens, and gateways.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Lahore_Fort"
  },
  {
    "id": "landmark-badshahi-mosque",
    "iso2": "pk",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Afghanistan",
      "Brunei",
      "Lebanon",
      "Pakistan"
    ],
    "correctIndex": 3,
    "picture": "Badshahi Mosque",
    "fact": "The Badshahi Mosque stands opposite Lahore Fort.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Badshahi_Mosque"
  },
  {
    "id": "landmark-paro-taktsang",
    "iso2": "bt",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Bhutan",
      "Brunei",
      "Lebanon",
      "Georgia"
    ],
    "correctIndex": 0,
    "picture": "Paro Taktsang monastery",
    "fact": "Paro Taktsang is a monastery on a cliff above Paro Valley.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Paro_Taktsang"
  },
  {
    "id": "landmark-boudhanath",
    "iso2": "np",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Lebanon",
      "Nepal",
      "Georgia",
      "Armenia"
    ],
    "correctIndex": 1,
    "picture": "Boudhanath stupa",
    "fact": "Boudhanath is a large Buddhist stupa in Kathmandu.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Boudhanath"
  },
  {
    "id": "landmark-registan",
    "iso2": "uz",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Bhutan",
      "Brunei",
      "Uzbekistan",
      "Turkey"
    ],
    "correctIndex": 2,
    "picture": "Registan Samarkand",
    "fact": "Three madrasas frame the Registan square in Samarkand.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Registan"
  },
  {
    "id": "landmark-charyn-canyon",
    "iso2": "kz",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Brunei",
      "Turkey",
      "Saudi Arabia",
      "Kazakhstan"
    ],
    "correctIndex": 3,
    "picture": "Charyn Canyon cliffs",
    "fact": "The Charyn River flows through Charyn Canyon in southeastern Kazakhstan.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Charyn_Canyon"
  },
  {
    "id": "landmark-gergeti-trinity-church",
    "iso2": "ge",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Georgia",
      "Turkey",
      "Saudi Arabia",
      "United Arab Emirates"
    ],
    "correctIndex": 0,
    "picture": "Gergeti Trinity Church",
    "fact": "Gergeti Trinity Church stands beneath Mount Kazbek.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gergeti_Trinity_Church"
  },
  {
    "id": "landmark-temple-of-garni",
    "iso2": "am",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Saudi Arabia",
      "Armenia",
      "United Arab Emirates",
      "Iran"
    ],
    "correctIndex": 1,
    "picture": "Garni temple",
    "fact": "The Temple of Garni has columns built from grey basalt.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Temple_of_Garni"
  },
  {
    "id": "landmark-naqsh-e-jahan-square",
    "iso2": "ir",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "United Arab Emirates",
      "Iraq",
      "Iran",
      "Jordan"
    ],
    "correctIndex": 2,
    "picture": "Naqsh Jahan Square",
    "fact": "Naqsh-e Jahan Square is a historic square in Isfahan.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Naqsh-e_Jahan_Square"
  },
  {
    "id": "landmark-timgad",
    "iso2": "dz",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Uganda",
      "Somalia",
      "Sudan",
      "Algeria"
    ],
    "correctIndex": 3,
    "picture": "Timgad Roman ruins",
    "fact": "Timgad preserves the street grid of an ancient Roman town.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Timgad"
  },
  {
    "id": "landmark-koutoubia-mosque",
    "iso2": "ma",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Morocco",
      "Somalia",
      "Sudan",
      "Chad"
    ],
    "correctIndex": 0,
    "picture": "Koutoubia Mosque",
    "fact": "The Koutoubia Mosque has a tall minaret in Marrakesh.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kutubiyya_Mosque"
  },
  {
    "id": "landmark-abu-simbel",
    "iso2": "eg",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Sudan",
      "Egypt",
      "Chad",
      "Mali"
    ],
    "correctIndex": 1,
    "picture": "Abu Simbel temples",
    "fact": "Giant statues of Ramesses II sit outside Abu Simbel's main temple.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Abu_Simbel"
  },
  {
    "id": "landmark-lalibela-churches",
    "iso2": "et",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Sudan",
      "Chad",
      "Ethiopia",
      "Mali"
    ],
    "correctIndex": 2,
    "picture": "Lalibela rock churches",
    "fact": "Lalibela's churches were cut from rock.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Rock-Hewn_Churches,_Lalibela"
  },
  {
    "id": "landmark-mount-kilimanjaro",
    "iso2": "tz",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "Chad",
      "Mali",
      "Niger",
      "Tanzania"
    ],
    "correctIndex": 3,
    "picture": "Mount Kilimanjaro",
    "fact": "Kilimanjaro is Africa's highest mountain.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Kilimanjaro"
  },
  {
    "id": "landmark-table-mountain",
    "iso2": "za",
    "level": 2,
    "prompt": "Which country is this in?",
    "options": [
      "South Africa",
      "Uganda",
      "Libya",
      "Somalia"
    ],
    "correctIndex": 0,
    "picture": "Table Mountain summit",
    "fact": "Table Mountain has a flat summit above Cape Town.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Table_Mountain"
  },
  {
    "id": "landmark-sossusvlei",
    "iso2": "na",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Libya",
      "Namibia",
      "Somalia",
      "Sudan"
    ],
    "correctIndex": 1,
    "picture": "Sossusvlei dunes",
    "fact": "Red sand dunes surround the clay pan at Sossusvlei.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sossusvlei"
  },
  {
    "id": "landmark-avenue-of-the-baobabs",
    "iso2": "mg",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Somalia",
      "Sudan",
      "Madagascar",
      "Chad"
    ],
    "correctIndex": 2,
    "picture": "Avenue Baobabs trees",
    "fact": "Tall baobab trees line this road in western Madagascar.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Avenue_of_the_Baobabs"
  },
  {
    "id": "landmark-great-zimbabwe",
    "iso2": "zw",
    "level": 3,
    "prompt": "Which country is this in?",
    "options": [
      "Sudan",
      "Chad",
      "Mali",
      "Zimbabwe"
    ],
    "correctIndex": 3,
    "picture": "Great Zimbabwe ruins",
    "fact": "Great Zimbabwe is known for its dry-stone walls.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Great_Zimbabwe"
  },
];
