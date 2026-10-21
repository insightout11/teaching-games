/** Static picture-round data. Source URLs are review provenance, never runtime downloads. */
import type { PictureQuestion } from './picture-question';

export const FOOD_QUESTIONS: readonly PictureQuestion[] = [
  {
    "id": "food-sushi",
    "iso2": "jp",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Japan",
      "China",
      "South Korea",
      "Mongolia"
    ],
    "correctIndex": 0,
    "picture": "Sushi rice rolls",
    "fact": "Sushi combines seasoned rice with toppings in Japanese cooking.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sushi"
  },
  {
    "id": "food-onigiri",
    "iso2": "jp",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "South Korea",
      "Japan",
      "Mongolia",
      "India"
    ],
    "correctIndex": 1,
    "picture": "Onigiri rice balls",
    "fact": "Onigiri are Japanese rice balls, often wrapped with seaweed.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Onigiri"
  },
  {
    "id": "food-takoyaki",
    "iso2": "jp",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Mongolia",
      "India",
      "Japan",
      "Thailand"
    ],
    "correctIndex": 2,
    "picture": "Takoyaki octopus balls",
    "fact": "Takoyaki are round Japanese snacks containing pieces of octopus.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Takoyaki"
  },
  {
    "id": "food-okonomiyaki",
    "iso2": "jp",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "India",
      "Thailand",
      "Vietnam",
      "Japan"
    ],
    "correctIndex": 3,
    "picture": "Okonomiyaki pancake",
    "fact": "Okonomiyaki is a Japanese savoury pancake often made with cabbage.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Okonomiyaki"
  },
  {
    "id": "food-tonkatsu",
    "iso2": "jp",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Japan",
      "Thailand",
      "Vietnam",
      "Indonesia"
    ],
    "correctIndex": 0,
    "picture": "Tonkatsu pork cutlet",
    "fact": "Tonkatsu is a Japanese breaded, deep-fried pork cutlet.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tonkatsu"
  },
  {
    "id": "food-pizza",
    "iso2": "it",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Netherlands",
      "Italy",
      "Switzerland",
      "Belgium"
    ],
    "correctIndex": 1,
    "picture": "Neapolitan pizza",
    "fact": "Modern pizza developed in Naples, Italy.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pizza"
  },
  {
    "id": "food-risotto",
    "iso2": "it",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Switzerland",
      "Belgium",
      "Italy",
      "Austria"
    ],
    "correctIndex": 2,
    "picture": "Risotto rice dish",
    "fact": "Risotto is an Italian rice dish cooked with broth.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Risotto"
  },
  {
    "id": "food-lasagne",
    "iso2": "it",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Belgium",
      "Austria",
      "Greece",
      "Italy"
    ],
    "correctIndex": 3,
    "picture": "Lasagne pasta dish",
    "fact": "Lasagne layers pasta sheets with fillings and sauce.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Lasagne"
  },
  {
    "id": "food-tiramisu",
    "iso2": "it",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Italy",
      "Austria",
      "Greece",
      "Russia"
    ],
    "correctIndex": 0,
    "picture": "Tiramisu dessert",
    "fact": "Tiramisu is an Italian dessert with coffee-soaked biscuits and mascarpone.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tiramisu"
  },
  {
    "id": "food-tacos",
    "iso2": "mx",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "El Salvador",
      "Mexico",
      "Haiti",
      "Dominican Republic"
    ],
    "correctIndex": 1,
    "picture": "Mexican tacos",
    "fact": "Tacos place fillings inside folded tortillas.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Taco"
  },
  {
    "id": "food-enchiladas",
    "iso2": "mx",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Haiti",
      "Dominican Republic",
      "Mexico",
      "Bahamas"
    ],
    "correctIndex": 2,
    "picture": "Enchiladas tortillas",
    "fact": "Enchiladas are Mexican tortillas rolled around fillings and covered with sauce.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Enchilada"
  },
  {
    "id": "food-pozole",
    "iso2": "mx",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Dominican Republic",
      "Bahamas",
      "Belize",
      "Mexico"
    ],
    "correctIndex": 3,
    "picture": "Pozole soup",
    "fact": "Pozole is a Mexican soup made with hominy maize.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pozole"
  },
  {
    "id": "food-mole-poblano",
    "iso2": "mx",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Mexico",
      "Bahamas",
      "Belize",
      "United States"
    ],
    "correctIndex": 0,
    "picture": "Mole poblano sauce",
    "fact": "Mole poblano is a Mexican sauce associated with Puebla.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mole_poblano"
  },
  {
    "id": "food-cochinita-pibil",
    "iso2": "mx",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Belize",
      "Mexico",
      "United States",
      "Canada"
    ],
    "correctIndex": 1,
    "picture": "Cochinita pibil pork",
    "fact": "Cochinita pibil is a slow-cooked pork dish from Mexico's Yucatán Peninsula.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Cochinita_pibil"
  },
  {
    "id": "food-pho",
    "iso2": "vn",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "United Arab Emirates",
      "Pakistan",
      "Vietnam",
      "Bangladesh"
    ],
    "correctIndex": 2,
    "picture": "Pho noodle soup",
    "fact": "Pho is a Vietnamese soup with broth, rice noodles, and herbs.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pho"
  },
  {
    "id": "food-banh-mi",
    "iso2": "vn",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Pakistan",
      "Bangladesh",
      "Nepal",
      "Vietnam"
    ],
    "correctIndex": 3,
    "picture": "Banh mi sandwich",
    "fact": "Banh mi is a Vietnamese sandwich served in a baguette.",
    "sourceUrl": "https://en.wikipedia.org/wiki/B%C3%A1nh_m%C3%AC"
  },
  {
    "id": "food-bun-bo-hue",
    "iso2": "vn",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Vietnam",
      "Bangladesh",
      "Nepal",
      "Sri Lanka"
    ],
    "correctIndex": 0,
    "picture": "Bun bo Hue",
    "fact": "Bun bo Hue is a spicy noodle soup from Hue, Vietnam.",
    "sourceUrl": "https://en.wikipedia.org/wiki/B%C3%BAn_b%C3%B2_Hu%E1%BA%BF"
  },
  {
    "id": "food-pad-thai",
    "iso2": "th",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Nepal",
      "Thailand",
      "Sri Lanka",
      "Mongolia"
    ],
    "correctIndex": 1,
    "picture": "Pad thai noodles",
    "fact": "Pad thai is a Thai stir-fried rice noodle dish.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pad_Thai"
  },
  {
    "id": "food-tom-yum-kung",
    "iso2": "th",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Sri Lanka",
      "Mongolia",
      "Thailand",
      "Iran"
    ],
    "correctIndex": 2,
    "picture": "Tom yum kung",
    "fact": "Tom yum kung is a Thai hot and sour prawn soup.",
    "sourceUrl": "https://ich.unesco.org/en/RL/tom-yum-kung-01879"
  },
  {
    "id": "food-massaman-curry",
    "iso2": "th",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Mongolia",
      "Iran",
      "Iraq",
      "Thailand"
    ],
    "correctIndex": 3,
    "picture": "Massaman curry bowl",
    "fact": "Massaman is a Thai curry with spices, coconut milk, and potatoes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Massaman_curry"
  },
  {
    "id": "food-butter-chicken",
    "iso2": "in",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "India",
      "Iran",
      "Iraq",
      "Israel"
    ],
    "correctIndex": 0,
    "picture": "Butter chicken curry",
    "fact": "Butter chicken developed in Delhi, with chicken in a tomato-based sauce.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Butter_chicken"
  },
  {
    "id": "food-masala-dosa",
    "iso2": "in",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Iraq",
      "India",
      "Israel",
      "Jordan"
    ],
    "correctIndex": 1,
    "picture": "Masala dosa",
    "fact": "Masala dosa is a South Indian crepe filled with spiced potatoes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Masala_dosa"
  },
  {
    "id": "food-dhokla",
    "iso2": "in",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Israel",
      "Jordan",
      "India",
      "Qatar"
    ],
    "correctIndex": 2,
    "picture": "Dhokla snack",
    "fact": "Dhokla is a steamed savoury dish from Gujarat, India.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Dhokla"
  },
  {
    "id": "food-pav-bhaji",
    "iso2": "in",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Jordan",
      "Qatar",
      "Kuwait",
      "India"
    ],
    "correctIndex": 3,
    "picture": "Pav bhaji",
    "fact": "Pav bhaji pairs spiced mashed vegetables with bread rolls in Mumbai cooking.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pav_bhaji"
  },
  {
    "id": "food-peking-duck",
    "iso2": "cn",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "China",
      "Kuwait",
      "Oman",
      "Kazakhstan"
    ],
    "correctIndex": 0,
    "picture": "Peking duck platter",
    "fact": "Peking duck is a roasted duck dish associated with Beijing.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Peking_duck"
  },
  {
    "id": "food-mapo-tofu",
    "iso2": "cn",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Oman",
      "China",
      "Kazakhstan",
      "Uzbekistan"
    ],
    "correctIndex": 1,
    "picture": "Mapo tofu",
    "fact": "Mapo tofu is a spicy tofu dish from Sichuan, China.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Mapo_tofu"
  },
  {
    "id": "food-xiaolongbao",
    "iso2": "cn",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Kazakhstan",
      "Uzbekistan",
      "China",
      "Afghanistan"
    ],
    "correctIndex": 2,
    "picture": "Xiaolongbao dumplings",
    "fact": "Xiaolongbao are Chinese steamed dumplings associated with the Shanghai region.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Xiaolongbao"
  },
  {
    "id": "food-bibimbap",
    "iso2": "kr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Uzbekistan",
      "Afghanistan",
      "Bhutan",
      "South Korea"
    ],
    "correctIndex": 3,
    "picture": "Bibimbap rice bowl",
    "fact": "Bibimbap mixes rice with vegetables and other toppings in Korean cooking.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Bibimbap"
  },
  {
    "id": "food-budae-jjigae",
    "iso2": "kr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "South Korea",
      "Afghanistan",
      "Bhutan",
      "Brunei"
    ],
    "correctIndex": 0,
    "picture": "Budae jjigae stew",
    "fact": "Budae jjigae is a South Korean stew with sausages and other ingredients.",
    "sourceUrl": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=904&vcontsId=221258"
  },
  {
    "id": "food-tteokbokki",
    "iso2": "kr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Bhutan",
      "South Korea",
      "Brunei",
      "Lebanon"
    ],
    "correctIndex": 1,
    "picture": "Tteokbokki rice cakes",
    "fact": "Tteokbokki is a Korean dish made with chewy rice cakes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tteokbokki"
  },
  {
    "id": "food-gado-gado",
    "iso2": "id",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Bhutan",
      "Lebanon",
      "Indonesia",
      "Georgia"
    ],
    "correctIndex": 2,
    "picture": "Gado gado salad",
    "fact": "Gado-gado is an Indonesian vegetable dish served with peanut sauce.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gado-gado"
  },
  {
    "id": "food-pempek",
    "iso2": "id",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Lebanon",
      "Georgia",
      "Armenia",
      "Indonesia"
    ],
    "correctIndex": 3,
    "picture": "Pempek fish cakes",
    "fact": "Pempek are fish cakes from Palembang in Indonesia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pempek"
  },
  {
    "id": "food-gudeg",
    "iso2": "id",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Indonesia",
      "Georgia",
      "Armenia",
      "Thailand"
    ],
    "correctIndex": 0,
    "picture": "Gudeg jackfruit dish",
    "fact": "Gudeg is a young jackfruit dish associated with Yogyakarta, Indonesia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Gudeg"
  },
  {
    "id": "food-filipino-adobo",
    "iso2": "ph",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Armenia",
      "Philippines",
      "Thailand",
      "Vietnam"
    ],
    "correctIndex": 1,
    "picture": "Filipino adobo chicken",
    "fact": "Filipino adobo simmers meat in vinegar, soy sauce, and garlic.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Philippine_adobo"
  },
  {
    "id": "food-nasi-kandar",
    "iso2": "my",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Thailand",
      "Vietnam",
      "Malaysia",
      "Indonesia"
    ],
    "correctIndex": 2,
    "picture": "Nasi kandar rice",
    "fact": "Nasi kandar is a rice meal from Penang, Malaysia.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Nasi_kandar"
  },
  {
    "id": "food-kottu",
    "iso2": "lk",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Pakistan",
      "Bangladesh",
      "Nepal",
      "Sri Lanka"
    ],
    "correctIndex": 3,
    "picture": "Kottu roti dish",
    "fact": "Kottu combines chopped flatbread with vegetables, eggs, or meat in Sri Lanka.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kottu"
  },
  {
    "id": "food-ratatouille",
    "iso2": "fr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "France",
      "Spain",
      "United Kingdom",
      "Portugal"
    ],
    "correctIndex": 0,
    "picture": "Ratatouille vegetables",
    "fact": "Ratatouille is a vegetable dish from Provence, France.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Ratatouille"
  },
  {
    "id": "food-bouillabaisse",
    "iso2": "fr",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "United Kingdom",
      "France",
      "Portugal",
      "Netherlands"
    ],
    "correctIndex": 1,
    "picture": "Bouillabaisse fish stew",
    "fact": "Bouillabaisse is a fish stew associated with Marseille, France.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Bouillabaisse"
  },
  {
    "id": "food-souffle",
    "iso2": "fr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Portugal",
      "Netherlands",
      "France",
      "Switzerland"
    ],
    "correctIndex": 2,
    "picture": "Cheese souffle",
    "fact": "A soufflé is a French baked dish made with beaten egg whites.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Souffl%C3%A9"
  },
  {
    "id": "food-tarte-tatin",
    "iso2": "fr",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Netherlands",
      "Switzerland",
      "Belgium",
      "France"
    ],
    "correctIndex": 3,
    "picture": "Tarte Tatin apple",
    "fact": "Tarte Tatin is a French upside-down caramelised apple tart.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Tarte_Tatin"
  },
  {
    "id": "food-paella",
    "iso2": "es",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Spain",
      "Switzerland",
      "Belgium",
      "Austria"
    ],
    "correctIndex": 0,
    "picture": "Valencian paella",
    "fact": "Paella is a rice dish from Valencia, Spain.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Paella"
  },
  {
    "id": "food-crema-catalana",
    "iso2": "es",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Belgium",
      "Spain",
      "Austria",
      "Greece"
    ],
    "correctIndex": 1,
    "picture": "Crema catalana dessert",
    "fact": "Crema catalana is a Catalan custard dessert with a crisp sugar top.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Crema_catalana"
  },
  {
    "id": "food-pastel-de-nata",
    "iso2": "pt",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Austria",
      "Greece",
      "Portugal",
      "Russia"
    ],
    "correctIndex": 2,
    "picture": "Pastel de nata",
    "fact": "Pastel de nata is a Portuguese custard tart.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Pastel_de_nata"
  },
  {
    "id": "food-stroopwafel",
    "iso2": "nl",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Greece",
      "Russia",
      "Sweden",
      "Netherlands"
    ],
    "correctIndex": 3,
    "picture": "Stroopwafel waffle",
    "fact": "Stroopwafels are Dutch waffles with a syrup filling.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Stroopwafel"
  },
  {
    "id": "food-yorkshire-pudding",
    "iso2": "gb",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "United Kingdom",
      "Russia",
      "Sweden",
      "Norway"
    ],
    "correctIndex": 0,
    "picture": "Yorkshire pudding",
    "fact": "Yorkshire pudding is a baked batter dish from England.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Yorkshire_pudding"
  },
  {
    "id": "food-cornish-pasty",
    "iso2": "gb",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Sweden",
      "United Kingdom",
      "Norway",
      "Finland"
    ],
    "correctIndex": 1,
    "picture": "Cornish pasty",
    "fact": "A Cornish pasty is a filled pastry associated with Cornwall, England.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Cornish_pasty"
  },
  {
    "id": "food-sauerbraten",
    "iso2": "de",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Norway",
      "Finland",
      "Germany",
      "Denmark"
    ],
    "correctIndex": 2,
    "picture": "Sauerbraten roast",
    "fact": "Sauerbraten is a German pot roast made with marinated meat.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Sauerbraten"
  },
  {
    "id": "food-kaiserschmarrn",
    "iso2": "at",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Finland",
      "Denmark",
      "Ireland",
      "Austria"
    ],
    "correctIndex": 3,
    "picture": "Kaiserschmarrn pancake",
    "fact": "Kaiserschmarrn is an Austrian shredded pancake dessert.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kaiserschmarrn"
  },
  {
    "id": "food-goulash",
    "iso2": "hu",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Hungary",
      "Slovakia",
      "Slovenia",
      "Lithuania"
    ],
    "correctIndex": 0,
    "picture": "Hungarian goulash",
    "fact": "Goulash is a soup or stew originating in Hungary.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Goulash"
  },
  {
    "id": "food-souvlaki",
    "iso2": "gr",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Ireland",
      "Greece",
      "Poland",
      "Ukraine"
    ],
    "correctIndex": 1,
    "picture": "Greek souvlaki",
    "fact": "Souvlaki is a Greek dish of grilled pieces on skewers.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Souvlaki"
  },
  {
    "id": "food-menemen",
    "iso2": "tr",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "China",
      "India",
      "Turkey",
      "Thailand"
    ],
    "correctIndex": 2,
    "picture": "Menemen eggs",
    "fact": "Menemen is a Turkish egg dish cooked with tomatoes and peppers.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Menemen_(food)"
  },
  {
    "id": "food-khachapuri",
    "iso2": "ge",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "India",
      "Thailand",
      "South Korea",
      "Georgia"
    ],
    "correctIndex": 3,
    "picture": "Khachapuri cheese bread",
    "fact": "Khachapuri is a Georgian bread filled with cheese.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Khachapuri"
  },
  {
    "id": "food-brigadeiro",
    "iso2": "br",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "Brazil",
      "Paraguay",
      "Guyana",
      "Suriname"
    ],
    "correctIndex": 0,
    "picture": "Brigadeiro chocolate sweets",
    "fact": "Brigadeiros are Brazilian sweets made with condensed milk, cocoa, and butter.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Brigadeiro"
  },
  {
    "id": "food-pao-de-queijo",
    "iso2": "br",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Guyana",
      "Brazil",
      "Suriname",
      "Argentina"
    ],
    "correctIndex": 1,
    "picture": "Pao de queijo",
    "fact": "Pão de queijo is a Brazilian cheese bread made with cassava starch.",
    "sourceUrl": "https://en.wikipedia.org/wiki/P%C3%A3o_de_queijo"
  },
  {
    "id": "food-lomo-saltado",
    "iso2": "pe",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Suriname",
      "Brazil",
      "Peru",
      "Argentina"
    ],
    "correctIndex": 2,
    "picture": "Lomo saltado",
    "fact": "Lomo saltado is a Peruvian stir-fry combining beef, onions, and tomatoes.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Lomo_saltado"
  },
  {
    "id": "food-poutine",
    "iso2": "ca",
    "level": 1,
    "prompt": "Where does this food come from?",
    "options": [
      "Belize",
      "United States",
      "Mexico",
      "Canada"
    ],
    "correctIndex": 3,
    "picture": "Poutine fries cheese",
    "fact": "Poutine combines fries, cheese curds, and gravy and originated in Quebec.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Poutine"
  },
  {
    "id": "food-jambalaya",
    "iso2": "us",
    "level": 2,
    "prompt": "Where does this food come from?",
    "options": [
      "United States",
      "Canada",
      "Mexico",
      "Cuba"
    ],
    "correctIndex": 0,
    "picture": "Jambalaya rice dish",
    "fact": "Jambalaya is a rice dish associated with Louisiana in the United States.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Jambalaya"
  },
  {
    "id": "food-attieke",
    "iso2": "ci",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Rwanda",
      "Ivory Coast",
      "DR Congo",
      "Cameroon"
    ],
    "correctIndex": 1,
    "picture": "Attieke cassava",
    "fact": "Attiéké is a dish of fermented cassava from Ivory Coast.",
    "sourceUrl": "https://ich.unesco.org/en/RL/skills-related-to-attieke-production-in-cote-d-ivoire-02086"
  },
  {
    "id": "food-thieboudienne",
    "iso2": "sn",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "DR Congo",
      "Cameroon",
      "Senegal",
      "Nigeria"
    ],
    "correctIndex": 2,
    "picture": "Thieboudienne rice fish",
    "fact": "Thieboudienne is a Senegalese dish combining fish, rice, and vegetables.",
    "sourceUrl": "https://ich.unesco.org/en/RL/ceebu-jen-a-culinary-art-of-senegal-01748"
  },
  {
    "id": "food-romazava",
    "iso2": "mg",
    "level": 3,
    "prompt": "Where does this food come from?",
    "options": [
      "Namibia",
      "Botswana",
      "Zimbabwe",
      "Madagascar"
    ],
    "correctIndex": 3,
    "picture": "Romazava stew",
    "fact": "Romazava is a Malagasy stew made with meat and leafy greens.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Romazava"
  },
];
