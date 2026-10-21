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
    "pictureFile": "File:Sushi platter.jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:小料理バルさくら 特製おにぎり.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Takoyaki-1.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Okonomiyaki 001.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:\"Amai-Yuwaku\" Special Loin Pork Cutlet1.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Pizza-3007395.jpg",
    "pictureLicense": "CC0",
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
    "pictureFile": "File:Risotto with speck and goat cheese (6101067436).jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Lasagne - stonesoup.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Tiramisu - Raffaele Diomede.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:001 Tacos de carnitas, carne asada y al pastor.jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:Enchilada Rice Beans.jpg",
    "pictureLicense": "Public domain",
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
    "pictureFile": "File:Green pozole, dressed (29161841908) (cropped).jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:ChickRedMole.JPG",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Cochinita pibil 2.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Bowl of Meatball pho.jpg",
    "pictureLicense": "CC BY 4.0",
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
    "pictureFile": "File:Bánh mì thịt nướng.png",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Bún bò huê close-up - Dakao Hoang.jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:Phat Thai kung Chang Khien street stall.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Tom yam kung maenam.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Kaeng matsaman kai.JPG",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Butter Chicken & Butter Naan - Home - Chandigarh - India - 0006.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Masala Dosa 2023.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Dhokla on Gujrart.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Bambayya Pav bhaji.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Peking Duck, 2014 (02).jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Chen Mapo Tofu.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:A Xiaolongbao from The Modern Shanghai.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Dolsot-bibimbap.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Budae jjigae (28587380901).jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Tteokbokki.JPG",
    "pictureLicense": "CC0",
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
    "pictureFile": "File:Gado gado jakarta.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Pempek Kuah Cuko.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Nasi Gudeg.jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:Adobo DSCF4391.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:A plate of Nasi Kandar.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Chicken Kottu.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Ratatouille home cooked.jpg",
    "pictureLicense": "CC0",
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
    "pictureFile": "File:Bullabessa.jpg",
    "pictureLicense": "CC BY 3.0",
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
    "pictureFile": "File:Bacon and Cheddar Cheese Soufflé.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Franse tarte tatin.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:01 Paella Valenciana original.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Creme catalane.jpg",
    "pictureLicense": "CC0",
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
    "pictureFile": "File:Tart telur Portugis (Pastéis de nata) 20230409 194702.jpg",
    "pictureLicense": "CC0",
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
    "pictureFile": "File:Stroopwafels 01.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Yorkshire Puddings on plate.jpg",
    "pictureLicense": "CC BY 2.0",
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
    "pictureFile": "File:Cornish Pasty (cropped).jpeg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Heldrunger Sauerbraten 2.JPG",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:2015 0731 Kaiserschmarrn Apfelsoße Edelweisshütte Sölden.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Gulyas080.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Ελληνικό Σουβλάκι - panoramio.jpg",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Menemen in a sahan.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Old Tbilisi, Georgian khachapuri, Georgia.jpg",
    "pictureLicense": "CC BY 4.0",
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
    "pictureFile": "File:Brigadeiro.jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:Cheesebread.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Lomo Saltado - Lima, Peru Miraflores (Tiendecita Blanca).jpg",
    "pictureLicense": "CC BY-SA 2.0",
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
    "pictureFile": "File:Food at WIkimanian 2017 02.jpg",
    "pictureLicense": "CC BY-SA 4.0",
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
    "pictureFile": "File:Homemade Jambalaya.JPG",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Attieke.JPG",
    "pictureLicense": "CC BY-SA 3.0",
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
    "pictureFile": "File:Thieboudienne.JPG",
    "pictureLicense": "Public domain",
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
    "pictureFile": "File:Madagaskar stew 2019-10-01.jpg",
    "pictureLicense": "CC BY-SA 4.0",
    "fact": "Romazava is a Malagasy stew made with meat and leafy greens.",
    "sourceUrl": "https://en.wikipedia.org/wiki/Romazava"
  },
];
