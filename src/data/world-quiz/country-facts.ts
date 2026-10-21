/** Checked teaching snapshot, 21 October 2026; no runtime fetching.
 * Population: World Bank WDI 2024 estimates, not live counters or a claim that every
 * figure is a national census. Surface area: WDI 2023, including inland water.
 * Coverage follows each source; these statistics do not define political borders.
 * Languages are examples of main/official languages, not an exhaustive ranking.
 * Greetings show one language example with approximate English pronunciation.
 * Neighbours are up to three examples; dependencies/disputed areas are not added.
 * See SOURCES.md for attribution, capital roles and deliberate exceptions.
 */
import type { Continent } from '@/lib/world-quiz/countries';

export type SourcedNumber = { readonly value: number; readonly year: number; readonly unit: string; readonly basis: string; readonly sourceUrl: string };
export type NamedCountryFact = { readonly name: string; readonly sourceUrl: string };
export interface CountryFacts {
 readonly iso2: string;
 readonly name: string;
 readonly capital: NamedCountryFact & { readonly role: string };
 readonly population: SourcedNumber;
 readonly areaKm2: SourcedNumber;
 readonly languages: readonly string[];
 readonly hello: { readonly language: string; readonly text: string; readonly pronunciation: string; readonly sourceUrl: string };
 readonly currency: { readonly code: string; readonly name: string; readonly sourceUrl: string };
 readonly continent: Continent;
 readonly neighbours: { readonly kind: 'land' | 'island' | 'none'; readonly countries: readonly { readonly iso2: string; readonly name: string }[]; readonly sourceUrl: string };
 readonly food: NamedCountryFact;
 readonly animal: NamedCountryFact;
 readonly landmark: NamedCountryFact;
 readonly sources: { readonly languages: string; readonly continent: string };
 readonly reviewedOn: string;
}

export const COUNTRY_FACTS: Readonly<Record<string, CountryFacts>> = {
  "eg": {
    "iso2": "eg",
    "name": "Egypt",
    "capital": {
      "name": "Cairo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/EG/"
    },
    "population": {
      "value": 116538258,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/eg/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1001450,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/eg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "EGP",
      "name": "Egyptian Pound",
      "sourceUrl": "https://www.geonames.org/countries/EG/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ly",
          "name": "Libya"
        },
        {
          "iso2": "sd",
          "name": "Sudan"
        },
        {
          "iso2": "il",
          "name": "Israel"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Koshary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Koshary"
    },
    "animal": {
      "name": "Nile crocodile",
      "sourceUrl": "https://en.wikipedia.org/wiki/Nile_crocodile"
    },
    "landmark": {
      "name": "Great Pyramid of Giza",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/EG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "za": {
    "iso2": "za",
    "name": "South Africa",
    "capital": {
      "name": "Pretoria",
      "role": "administrative capital",
      "sourceUrl": "https://www.gov.za/south-africa-glance"
    },
    "population": {
      "value": 64007187,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/za/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1219090,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/za/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Zulu",
      "Xhosa",
      "Afrikaans",
      "English"
    ],
    "hello": {
      "language": "Zulu",
      "text": "Sawubona",
      "pronunciation": "sah-woo-BOH-nah",
      "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
    },
    "currency": {
      "code": "ZAR",
      "name": "South African Rand",
      "sourceUrl": "https://www.geonames.org/countries/ZA/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "zw",
          "name": "Zimbabwe"
        },
        {
          "iso2": "sz",
          "name": "Eswatini"
        },
        {
          "iso2": "mz",
          "name": "Mozambique"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Bobotie",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bobotie"
    },
    "animal": {
      "name": "Springbok",
      "sourceUrl": "https://en.wikipedia.org/wiki/Springbok"
    },
    "landmark": {
      "name": "Table Mountain",
      "sourceUrl": "https://en.wikipedia.org/wiki/Table_Mountain"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ZA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ke": {
    "iso2": "ke",
    "name": "Kenya",
    "capital": {
      "name": "Nairobi",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/KE/"
    },
    "population": {
      "value": 56432944,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ke/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 591969,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ke/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Swahili",
      "English"
    ],
    "hello": {
      "language": "Swahili",
      "text": "Jambo",
      "pronunciation": "JAM-boh",
      "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
    },
    "currency": {
      "code": "KES",
      "name": "Kenyan Shilling",
      "sourceUrl": "https://www.geonames.org/countries/KE/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "et",
          "name": "Ethiopia"
        },
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "ss",
          "name": "South Sudan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ugali",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ugali"
    },
    "animal": {
      "name": "Lion",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lion"
    },
    "landmark": {
      "name": "Mount Kenya",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Kenya"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/KE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ng": {
    "iso2": "ng",
    "name": "Nigeria",
    "capital": {
      "name": "Abuja",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NG/"
    },
    "population": {
      "value": 232679478,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ng/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 923770,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ng/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Hausa",
      "Yoruba",
      "Igbo"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "NGN",
      "name": "Nigerian Naira",
      "sourceUrl": "https://www.geonames.org/countries/NG/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "td",
          "name": "Chad"
        },
        {
          "iso2": "ne",
          "name": "Niger"
        },
        {
          "iso2": "bj",
          "name": "Benin"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Jollof rice",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jollof_rice"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Zuma Rock",
      "sourceUrl": "https://en.wikipedia.org/wiki/Zuma_Rock"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ma": {
    "iso2": "ma",
    "name": "Morocco",
    "capital": {
      "name": "Rabat",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MA/"
    },
    "population": {
      "value": 38081173,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ma/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 446550,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ma/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "Amazigh"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "MAD",
      "name": "Moroccan Dirham",
      "sourceUrl": "https://www.geonames.org/countries/MA/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "dz",
          "name": "Algeria"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Couscous",
      "sourceUrl": "https://en.wikipedia.org/wiki/Couscous"
    },
    "animal": {
      "name": "Barbary macaque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Barbary_macaque"
    },
    "landmark": {
      "name": "Hassan II Mosque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hassan_II_Mosque"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "et": {
    "iso2": "et",
    "name": "Ethiopia",
    "capital": {
      "name": "Addis Ababa",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/ET/"
    },
    "population": {
      "value": 132059767,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/et/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1129818.8,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/et/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Amharic",
      "Oromo",
      "Tigrinya",
      "Somali"
    ],
    "hello": {
      "language": "Amharic",
      "text": "ሰላም",
      "pronunciation": "seh-LAHM",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E1%88%B0%E1%88%8B%E1%88%9D"
    },
    "currency": {
      "code": "ETB",
      "name": "Ethiopian Birr",
      "sourceUrl": "https://www.geonames.org/countries/ET/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "er",
          "name": "Eritrea"
        },
        {
          "iso2": "ke",
          "name": "Kenya"
        },
        {
          "iso2": "sd",
          "name": "Sudan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Injera",
      "sourceUrl": "https://en.wikipedia.org/wiki/Injera"
    },
    "animal": {
      "name": "Gelada",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gelada"
    },
    "landmark": {
      "name": "Rock-Hewn Churches, Lalibela",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rock-Hewn_Churches%2C_Lalibela"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ET/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "gh": {
    "iso2": "gh",
    "name": "Ghana",
    "capital": {
      "name": "Accra",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GH/"
    },
    "population": {
      "value": 34427414,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/gh/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 238539,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/gh/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Akan",
      "Ewe",
      "Ga"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "GHS",
      "name": "Ghanaian Cedi",
      "sourceUrl": "https://www.geonames.org/countries/GH/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ci",
          "name": "Ivory Coast"
        },
        {
          "iso2": "tg",
          "name": "Togo"
        },
        {
          "iso2": "bf",
          "name": "Burkina Faso"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Banku",
      "sourceUrl": "https://en.wikipedia.org/wiki/Banku"
    },
    "animal": {
      "name": "African forest elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_forest_elephant"
    },
    "landmark": {
      "name": "Kakum National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kakum_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GH/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "tz": {
    "iso2": "tz",
    "name": "Tanzania",
    "capital": {
      "name": "Dodoma",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/TZ/"
    },
    "population": {
      "value": 68560157,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/tz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 945500,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/tz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Swahili",
      "English"
    ],
    "hello": {
      "language": "Swahili",
      "text": "Jambo",
      "pronunciation": "JAM-boh",
      "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
    },
    "currency": {
      "code": "TZS",
      "name": "Tanzanian Shilling",
      "sourceUrl": "https://www.geonames.org/countries/TZ/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "mz",
          "name": "Mozambique"
        },
        {
          "iso2": "ke",
          "name": "Kenya"
        },
        {
          "iso2": "cd",
          "name": "Democratic Republic of the Congo"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ugali",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ugali"
    },
    "animal": {
      "name": "Giraffe",
      "sourceUrl": "https://en.wikipedia.org/wiki/Giraffe"
    },
    "landmark": {
      "name": "Mount Kilimanjaro",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Kilimanjaro"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/TZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "dz": {
    "iso2": "dz",
    "name": "Algeria",
    "capital": {
      "name": "Algiers",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/DZ/"
    },
    "population": {
      "value": 46814308,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/dz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2381740,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/dz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "Amazigh"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "DZD",
      "name": "Algerian Dinar",
      "sourceUrl": "https://www.geonames.org/countries/DZ/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ne",
          "name": "Niger"
        },
        {
          "iso2": "ly",
          "name": "Libya"
        },
        {
          "iso2": "mr",
          "name": "Mauritania"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Couscous",
      "sourceUrl": "https://en.wikipedia.org/wiki/Couscous"
    },
    "animal": {
      "name": "Fennec fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fennec_fox"
    },
    "landmark": {
      "name": "Timgad",
      "sourceUrl": "https://en.wikipedia.org/wiki/Timgad"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/DZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mg": {
    "iso2": "mg",
    "name": "Madagascar",
    "capital": {
      "name": "Antananarivo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MG/"
    },
    "population": {
      "value": 31964956,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mg/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 587295,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Malagasy",
      "French"
    ],
    "hello": {
      "language": "Malagasy",
      "text": "Salama",
      "pronunciation": "sah-LAH-mah",
      "sourceUrl": "https://en.wiktionary.org/wiki/salama"
    },
    "currency": {
      "code": "MGA",
      "name": "Malagasy Ariary",
      "sourceUrl": "https://www.geonames.org/countries/MG/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Romazava",
      "sourceUrl": "https://en.wikipedia.org/wiki/Romazava"
    },
    "animal": {
      "name": "Ring-tailed lemur",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ring-tailed_lemur"
    },
    "landmark": {
      "name": "Avenue of the Baobabs",
      "sourceUrl": "https://en.wikipedia.org/wiki/Avenue_of_the_Baobabs"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "tn": {
    "iso2": "tn",
    "name": "Tunisia",
    "capital": {
      "name": "Tunis",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/TN/"
    },
    "population": {
      "value": 12277109,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/tn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 163610,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/tn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "TND",
      "name": "Tunisian Dinar",
      "sourceUrl": "https://www.geonames.org/countries/TN/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "dz",
          "name": "Algeria"
        },
        {
          "iso2": "ly",
          "name": "Libya"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Brik",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brik"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Amphitheatre of El Jem",
      "sourceUrl": "https://en.wikipedia.org/wiki/Amphitheatre_of_El_Jem"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/TN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sn": {
    "iso2": "sn",
    "name": "Senegal",
    "capital": {
      "name": "Dakar",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SN/"
    },
    "population": {
      "value": 18501984,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 196710,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Wolof",
      "French",
      "Pulaar"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/SN/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gn",
          "name": "Guinea"
        },
        {
          "iso2": "mr",
          "name": "Mauritania"
        },
        {
          "iso2": "gw",
          "name": "Guinea-Bissau"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Thieboudienne",
      "sourceUrl": "https://en.wikipedia.org/wiki/Thieboudienne"
    },
    "animal": {
      "name": "African pelican",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_white_pelican"
    },
    "landmark": {
      "name": "Djoudj National Bird Sanctuary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Djoudj_National_Bird_Sanctuary"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cm": {
    "iso2": "cm",
    "name": "Cameroon",
    "capital": {
      "name": "Yaounde",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CM/"
    },
    "population": {
      "value": 29123744,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cm/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 475442,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "French",
      "English",
      "Fulfulde",
      "Ewondo"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/CM/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "td",
          "name": "Chad"
        },
        {
          "iso2": "cf",
          "name": "Central African Republic"
        },
        {
          "iso2": "ga",
          "name": "Gabon"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ndolé",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ndol%C3%A9"
    },
    "animal": {
      "name": "Drill",
      "sourceUrl": "https://en.wikipedia.org/wiki/Drill_(animal)"
    },
    "landmark": {
      "name": "Mount Cameroon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Cameroon"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ug": {
    "iso2": "ug",
    "name": "Uganda",
    "capital": {
      "name": "Kampala",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/UG/"
    },
    "population": {
      "value": 50015092,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ug/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 241551,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ug/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Swahili",
      "Luganda"
    ],
    "hello": {
      "language": "Swahili",
      "text": "Jambo",
      "pronunciation": "JAM-boh",
      "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
    },
    "currency": {
      "code": "UGX",
      "name": "Ugandan Shilling",
      "sourceUrl": "https://www.geonames.org/countries/UG/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "ke",
          "name": "Kenya"
        },
        {
          "iso2": "ss",
          "name": "South Sudan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Matoke",
      "sourceUrl": "https://en.wikipedia.org/wiki/Matoke"
    },
    "animal": {
      "name": "Mountain gorilla",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mountain_gorilla"
    },
    "landmark": {
      "name": "Bwindi Impenetrable National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bwindi_Impenetrable_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/UG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ly": {
    "iso2": "ly",
    "name": "Libya",
    "capital": {
      "name": "Tripoli",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/LY/"
    },
    "population": {
      "value": 7381023,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ly/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1759540,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ly/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "Amazigh"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "LYD",
      "name": "Libyan Dinar",
      "sourceUrl": "https://www.geonames.org/countries/LY/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "td",
          "name": "Chad"
        },
        {
          "iso2": "ne",
          "name": "Niger"
        },
        {
          "iso2": "dz",
          "name": "Algeria"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Bazeen",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bazeen"
    },
    "animal": {
      "name": "Fennec fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fennec_fox"
    },
    "landmark": {
      "name": "Leptis Magna",
      "sourceUrl": "https://en.wikipedia.org/wiki/Leptis_Magna"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "so": {
    "iso2": "so",
    "name": "Somalia",
    "capital": {
      "name": "Mogadishu",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SO/"
    },
    "population": {
      "value": 19009151,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/so/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 637657,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/so/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Somali",
      "Arabic"
    ],
    "hello": {
      "language": "Somali",
      "text": "Salaan",
      "pronunciation": "sah-LAHN",
      "sourceUrl": "https://en.wiktionary.org/wiki/salaan"
    },
    "currency": {
      "code": "SOS",
      "name": "Somali Shilling",
      "sourceUrl": "https://www.geonames.org/countries/SO/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "et",
          "name": "Ethiopia"
        },
        {
          "iso2": "ke",
          "name": "Kenya"
        },
        {
          "iso2": "dj",
          "name": "Djibouti"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Canjeero",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lahoh"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Lido Beach",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lido_Beach%2C_Mogadishu"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sd": {
    "iso2": "sd",
    "name": "Sudan",
    "capital": {
      "name": "Khartoum",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SD/"
    },
    "population": {
      "value": 50448963,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sd/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1878000,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sd/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "English",
      "Nubian languages"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "SDG",
      "name": "Sudanese Pound",
      "sourceUrl": "https://www.geonames.org/countries/SD/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ss",
          "name": "South Sudan"
        },
        {
          "iso2": "td",
          "name": "Chad"
        },
        {
          "iso2": "eg",
          "name": "Egypt"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kisra",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kisra"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Pyramids of Meroe",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mero%C3%AB"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SD/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "td": {
    "iso2": "td",
    "name": "Chad",
    "capital": {
      "name": "N'Djamena",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/TD/"
    },
    "population": {
      "value": 20299123,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/td/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1284000,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/td/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "French",
      "Sara"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/TD/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ne",
          "name": "Niger"
        },
        {
          "iso2": "ly",
          "name": "Libya"
        },
        {
          "iso2": "cf",
          "name": "Central African Republic"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Daraba",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chadian_cuisine"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Lakes of Ounianga",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lakes_of_Ounianga"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/TD/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ml": {
    "iso2": "ml",
    "name": "Mali",
    "capital": {
      "name": "Bamako",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/ML/"
    },
    "population": {
      "value": 24478595,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ml/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1240190,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ml/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Bambara",
      "Fula",
      "Songhay",
      "French"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/ML/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sn",
          "name": "Senegal"
        },
        {
          "iso2": "ne",
          "name": "Niger"
        },
        {
          "iso2": "dz",
          "name": "Algeria"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Maafe",
      "sourceUrl": "https://en.wikipedia.org/wiki/Maafe"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Great Mosque of Djenné",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_Mosque_of_Djenn%C3%A9"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ML/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ne": {
    "iso2": "ne",
    "name": "Niger",
    "capital": {
      "name": "Niamey",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NE/"
    },
    "population": {
      "value": 27032412,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ne/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1267000,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ne/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Hausa",
      "Zarma",
      "French"
    ],
    "hello": {
      "language": "Hausa",
      "text": "Sannu",
      "pronunciation": "SAN-noo",
      "sourceUrl": "https://en.wiktionary.org/wiki/sannu"
    },
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/NE/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "td",
          "name": "Chad"
        },
        {
          "iso2": "bj",
          "name": "Benin"
        },
        {
          "iso2": "dz",
          "name": "Algeria"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Dambou",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dambou"
    },
    "animal": {
      "name": "West African giraffe",
      "sourceUrl": "https://en.wikipedia.org/wiki/West_African_giraffe"
    },
    "landmark": {
      "name": "Air Mountains",
      "sourceUrl": "https://en.wikipedia.org/wiki/A%C3%AFr_Mountains"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ao": {
    "iso2": "ao",
    "name": "Angola",
    "capital": {
      "name": "Luanda",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AO/"
    },
    "population": {
      "value": 37885849,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ao/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1246700,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ao/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Portuguese",
      "Umbundu",
      "Kimbundu",
      "Kikongo"
    ],
    "hello": {
      "language": "Portuguese",
      "text": "Olá",
      "pronunciation": "oh-LAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
    },
    "currency": {
      "code": "AOA",
      "name": "Angolan Kwanza",
      "sourceUrl": "https://www.geonames.org/countries/AO/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cd",
          "name": "Democratic Republic of the Congo"
        },
        {
          "iso2": "na",
          "name": "Namibia"
        },
        {
          "iso2": "zm",
          "name": "Zambia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Muamba de galinha",
      "sourceUrl": "https://en.wikipedia.org/wiki/Moamba_de_galinha"
    },
    "animal": {
      "name": "Giant sable antelope",
      "sourceUrl": "https://en.wikipedia.org/wiki/Giant_sable_antelope"
    },
    "landmark": {
      "name": "Kalandula Falls",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kalandula_Falls"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "zm": {
    "iso2": "zm",
    "name": "Zambia",
    "capital": {
      "name": "Lusaka",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/ZM/"
    },
    "population": {
      "value": 21314956,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/zm/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 752612,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/zm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Bemba",
      "Nyanja",
      "Tonga"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "ZMW",
      "name": "Zambian Kwacha",
      "sourceUrl": "https://www.geonames.org/countries/ZM/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "zw",
          "name": "Zimbabwe"
        },
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "mz",
          "name": "Mozambique"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Nshima",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ugali"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Victoria Falls",
      "sourceUrl": "https://en.wikipedia.org/wiki/Victoria_Falls"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ZM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "zw": {
    "iso2": "zw",
    "name": "Zimbabwe",
    "capital": {
      "name": "Harare",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/ZW/"
    },
    "population": {
      "value": 16634373,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/zw/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 390760,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/zw/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Shona",
      "Ndebele",
      "English"
    ],
    "hello": {
      "language": "Shona",
      "text": "Mhoro",
      "pronunciation": "m-HOH-roh",
      "sourceUrl": "https://vashona.com/en/dictionary/en/hello"
    },
    "currency": {
      "code": "ZWG",
      "name": "Zimbabwe Gold (ZiG)",
      "sourceUrl": "https://www.rbz.co.zw/index.php/publications-notices/notices/press-release/1419-press-statement-introduction-of-zimbabwe-gold-zig-currency-code-zwg"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "za",
          "name": "South Africa"
        },
        {
          "iso2": "mz",
          "name": "Mozambique"
        },
        {
          "iso2": "bw",
          "name": "Botswana"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Sadza",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sadza"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Great Zimbabwe",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_Zimbabwe"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ZW/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mz": {
    "iso2": "mz",
    "name": "Mozambique",
    "capital": {
      "name": "Maputo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MZ/"
    },
    "population": {
      "value": 34631766,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 799380,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Portuguese",
      "Makhuwa",
      "Sena",
      "Tsonga"
    ],
    "hello": {
      "language": "Portuguese",
      "text": "Olá",
      "pronunciation": "oh-LAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
    },
    "currency": {
      "code": "MZN",
      "name": "Mozambican Metical",
      "sourceUrl": "https://www.geonames.org/countries/MZ/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "zw",
          "name": "Zimbabwe"
        },
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "sz",
          "name": "Eswatini"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Matapa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Matapa"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Island of Mozambique",
      "sourceUrl": "https://en.wikipedia.org/wiki/Island_of_Mozambique"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bw": {
    "iso2": "bw",
    "name": "Botswana",
    "capital": {
      "name": "Gaborone",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BW/"
    },
    "population": {
      "value": 2521139,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bw/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 581730,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bw/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Tswana",
      "English"
    ],
    "hello": {
      "language": "Tswana",
      "text": "Dumela",
      "pronunciation": "doo-MEH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/dumela"
    },
    "currency": {
      "code": "BWP",
      "name": "Botswanan Pula",
      "sourceUrl": "https://www.geonames.org/countries/BW/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "zw",
          "name": "Zimbabwe"
        },
        {
          "iso2": "za",
          "name": "South Africa"
        },
        {
          "iso2": "na",
          "name": "Namibia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Seswaa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Seswaa"
    },
    "animal": {
      "name": "African elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_elephant"
    },
    "landmark": {
      "name": "Okavango Delta",
      "sourceUrl": "https://en.wikipedia.org/wiki/Okavango_Delta"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BW/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "na": {
    "iso2": "na",
    "name": "Namibia",
    "capital": {
      "name": "Windhoek",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NA/"
    },
    "population": {
      "value": 3030131,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/na/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 824292,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/na/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Oshiwambo",
      "Afrikaans",
      "English",
      "Khoekhoe"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "NAD",
      "name": "Namibian Dollar",
      "sourceUrl": "https://www.geonames.org/countries/NA/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "za",
          "name": "South Africa"
        },
        {
          "iso2": "bw",
          "name": "Botswana"
        },
        {
          "iso2": "zm",
          "name": "Zambia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kapana",
      "sourceUrl": "https://en.wikipedia.org/wiki/Namibian_cuisine"
    },
    "animal": {
      "name": "Gemsbok",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gemsbok"
    },
    "landmark": {
      "name": "Sossusvlei",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sossusvlei"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "rw": {
    "iso2": "rw",
    "name": "Rwanda",
    "capital": {
      "name": "Kigali",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/RW/"
    },
    "population": {
      "value": 14256567,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/rw/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 26340,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/rw/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Kinyarwanda",
      "English",
      "French",
      "Swahili"
    ],
    "hello": {
      "language": "Kinyarwanda",
      "text": "Muraho",
      "pronunciation": "moo-RAH-hoh",
      "sourceUrl": "https://en.wiktionary.org/wiki/muraho"
    },
    "currency": {
      "code": "RWF",
      "name": "Rwandan Franc",
      "sourceUrl": "https://www.geonames.org/countries/RW/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "cd",
          "name": "Democratic Republic of the Congo"
        },
        {
          "iso2": "bi",
          "name": "Burundi"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Isombe",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rwandan_cuisine"
    },
    "animal": {
      "name": "Mountain gorilla",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mountain_gorilla"
    },
    "landmark": {
      "name": "Volcanoes National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Volcanoes_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/RW/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ci": {
    "iso2": "ci",
    "name": "Ivory Coast",
    "capital": {
      "name": "Yamoussoukro",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CI/"
    },
    "population": {
      "value": 31934230,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ci/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 322460,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ci/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "French",
      "Dioula",
      "Baoulé"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "sourceUrl": "https://www.geonames.org/countries/CI/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "lr",
          "name": "Liberia"
        },
        {
          "iso2": "gh",
          "name": "Ghana"
        },
        {
          "iso2": "gn",
          "name": "Guinea"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Attiéké",
      "sourceUrl": "https://en.wikipedia.org/wiki/Atti%C3%A9k%C3%A9"
    },
    "animal": {
      "name": "African forest elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/African_forest_elephant"
    },
    "landmark": {
      "name": "Taï National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ta%C3%AF_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CI/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cd": {
    "iso2": "cd",
    "name": "DR Congo",
    "capital": {
      "name": "Kinshasa",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CD/"
    },
    "population": {
      "value": 109276265,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cd/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2345410,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cd/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "French",
      "Lingala",
      "Swahili",
      "Kikongo",
      "Tshiluba"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "CDF",
      "name": "Congolese Franc",
      "sourceUrl": "https://www.geonames.org/countries/CD/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tz",
          "name": "Tanzania"
        },
        {
          "iso2": "cf",
          "name": "Central African Republic"
        },
        {
          "iso2": "ss",
          "name": "South Sudan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Moambe chicken",
      "sourceUrl": "https://en.wikipedia.org/wiki/Moambe_chicken"
    },
    "animal": {
      "name": "Bonobo",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bonobo"
    },
    "landmark": {
      "name": "Virunga National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Virunga_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CD/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mr": {
    "iso2": "mr",
    "name": "Mauritania",
    "capital": {
      "name": "Nouakchott",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MR/"
    },
    "population": {
      "value": 5169395,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1030700,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "Pulaar",
      "Soninke",
      "Wolof"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "MRU",
      "name": "Mauritanian Ouguiya",
      "sourceUrl": "https://www.geonames.org/countries/MR/"
    },
    "continent": "Africa",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sn",
          "name": "Senegal"
        },
        {
          "iso2": "dz",
          "name": "Algeria"
        },
        {
          "iso2": "ml",
          "name": "Mali"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Thieboudienne",
      "sourceUrl": "https://en.wikipedia.org/wiki/Thieboudienne"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Banc d'Arguin National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Banc_d'Arguin_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "jp": {
    "iso2": "jp",
    "name": "Japan",
    "capital": {
      "name": "Tokyo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/JP/"
    },
    "population": {
      "value": 123975371,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/jp/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 377969.3,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/jp/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Japanese"
    ],
    "hello": {
      "language": "Japanese",
      "text": "こんにちは",
      "pronunciation": "kon-nee-chee-WAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
    },
    "currency": {
      "code": "JPY",
      "name": "Japanese Yen",
      "sourceUrl": "https://www.geonames.org/countries/JP/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Sushi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sushi"
    },
    "animal": {
      "name": "Japanese macaque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Japanese_macaque"
    },
    "landmark": {
      "name": "Mount Fuji",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mount_Fuji"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/JP/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cn": {
    "iso2": "cn",
    "name": "China",
    "capital": {
      "name": "Beijing",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CN/"
    },
    "population": {
      "value": 1408975000,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 9562910,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Mandarin Chinese",
      "Yue Chinese",
      "Wu Chinese",
      "Min Chinese"
    ],
    "hello": {
      "language": "Mandarin Chinese",
      "text": "你好",
      "pronunciation": "nee how",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
    },
    "currency": {
      "code": "CNY",
      "name": "Chinese Yuan",
      "sourceUrl": "https://www.geonames.org/countries/CN/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "mn",
          "name": "Mongolia"
        },
        {
          "iso2": "kz",
          "name": "Kazakhstan"
        },
        {
          "iso2": "vn",
          "name": "Vietnam"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Jiaozi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jiaozi"
    },
    "animal": {
      "name": "Giant panda",
      "sourceUrl": "https://en.wikipedia.org/wiki/Giant_panda"
    },
    "landmark": {
      "name": "Great Wall of China",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_Wall_of_China"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "in": {
    "iso2": "in",
    "name": "India",
    "capital": {
      "name": "New Delhi",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IN/"
    },
    "population": {
      "value": 1450935791,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/in/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 3287263,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/in/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Hindi",
      "English",
      "Bengali",
      "Tamil",
      "Telugu",
      "Marathi",
      "Urdu",
      "Gujarati",
      "Kannada",
      "Malayalam",
      "Odia",
      "Punjabi"
    ],
    "hello": {
      "language": "Hindi",
      "text": "नमस्ते",
      "pronunciation": "nuh-muh-STAY",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
    },
    "currency": {
      "code": "INR",
      "name": "Indian Rupee",
      "sourceUrl": "https://www.geonames.org/countries/IN/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "np",
          "name": "Nepal"
        },
        {
          "iso2": "bt",
          "name": "Bhutan"
        },
        {
          "iso2": "bd",
          "name": "Bangladesh"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Dosa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dosa"
    },
    "animal": {
      "name": "Bengal tiger",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bengal_tiger"
    },
    "landmark": {
      "name": "Taj Mahal",
      "sourceUrl": "https://en.wikipedia.org/wiki/Taj_Mahal"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "th": {
    "iso2": "th",
    "name": "Thailand",
    "capital": {
      "name": "Bangkok",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/TH/"
    },
    "population": {
      "value": 71668011,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/th/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 513115.021,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/th/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Thai"
    ],
    "hello": {
      "language": "Thai",
      "text": "สวัสดี",
      "pronunciation": "sah-wat-DEE",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
    },
    "currency": {
      "code": "THB",
      "name": "Thai Baht",
      "sourceUrl": "https://www.geonames.org/countries/TH/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "la",
          "name": "Laos"
        },
        {
          "iso2": "mm",
          "name": "Myanmar"
        },
        {
          "iso2": "kh",
          "name": "Cambodia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pad thai",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pad_thai"
    },
    "animal": {
      "name": "Asian elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/Asian_elephant"
    },
    "landmark": {
      "name": "Wat Arun",
      "sourceUrl": "https://en.wikipedia.org/wiki/Wat_Arun"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/TH/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "kr": {
    "iso2": "kr",
    "name": "South Korea",
    "capital": {
      "name": "Seoul",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/KR/"
    },
    "population": {
      "value": 51751065,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/kr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 100450,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/kr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Korean"
    ],
    "hello": {
      "language": "Korean",
      "text": "안녕하세요",
      "pronunciation": "an-nyong-ha-seh-YOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94"
    },
    "currency": {
      "code": "KRW",
      "name": "South Korean Won",
      "sourceUrl": "https://www.geonames.org/countries/KR/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "kp",
          "name": "North Korea"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Bibimbap",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bibimbap"
    },
    "animal": {
      "name": "Korean water deer",
      "sourceUrl": "https://en.wikipedia.org/wiki/Water_deer"
    },
    "landmark": {
      "name": "Gyeongbokgung",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gyeongbokgung"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/KR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "vn": {
    "iso2": "vn",
    "name": "Vietnam",
    "capital": {
      "name": "Hanoi",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/VN/"
    },
    "population": {
      "value": 100987686,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/vn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 331338.31,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/vn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Vietnamese"
    ],
    "hello": {
      "language": "Vietnamese",
      "text": "Xin chào",
      "pronunciation": "sin chow",
      "sourceUrl": "https://en.wiktionary.org/wiki/xin%20ch%C3%A0o"
    },
    "currency": {
      "code": "VND",
      "name": "Vietnamese Dong",
      "sourceUrl": "https://www.geonames.org/countries/VN/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "la",
          "name": "Laos"
        },
        {
          "iso2": "kh",
          "name": "Cambodia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pho",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pho"
    },
    "animal": {
      "name": "Red-shanked douc",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red-shanked_douc"
    },
    "landmark": {
      "name": "Ha Long Bay",
      "sourceUrl": "https://en.wikipedia.org/wiki/H%E1%BA%A1_Long_Bay"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/VN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "id": {
    "iso2": "id",
    "name": "Indonesia",
    "capital": {
      "name": "Jakarta",
      "role": "capital",
      "sourceUrl": "https://en.wikipedia.org/wiki/Capital_of_Indonesia"
    },
    "population": {
      "value": 283487931,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/id/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1916906.8,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/id/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Indonesian",
      "Javanese",
      "Sundanese"
    ],
    "hello": {
      "language": "Indonesian",
      "text": "Halo",
      "pronunciation": "HAHT-loh",
      "sourceUrl": "https://en.wiktionary.org/wiki/halo"
    },
    "currency": {
      "code": "IDR",
      "name": "Indonesian Rupiah",
      "sourceUrl": "https://www.geonames.org/countries/ID/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pg",
          "name": "Papua New Guinea"
        },
        {
          "iso2": "tl",
          "name": "Timor Leste"
        },
        {
          "iso2": "my",
          "name": "Malaysia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Nasi goreng",
      "sourceUrl": "https://en.wikipedia.org/wiki/Nasi_goreng"
    },
    "animal": {
      "name": "Komodo dragon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Komodo_dragon"
    },
    "landmark": {
      "name": "Borobudur",
      "sourceUrl": "https://en.wikipedia.org/wiki/Borobudur"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ID/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ph": {
    "iso2": "ph",
    "name": "Philippines",
    "capital": {
      "name": "Manila",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PH/"
    },
    "population": {
      "value": 115843670,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ph/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 300000,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ph/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Filipino",
      "English",
      "Cebuano",
      "Ilocano"
    ],
    "hello": {
      "language": "Filipino",
      "text": "Kumusta",
      "pronunciation": "koo-moos-TAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/kumusta"
    },
    "currency": {
      "code": "PHP",
      "name": "Philippine Peso",
      "sourceUrl": "https://www.geonames.org/countries/PH/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Adobo",
      "sourceUrl": "https://en.wikipedia.org/wiki/Philippine_adobo"
    },
    "animal": {
      "name": "Philippine eagle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Philippine_eagle"
    },
    "landmark": {
      "name": "Chocolate Hills",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chocolate_Hills"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PH/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "my": {
    "iso2": "my",
    "name": "Malaysia",
    "capital": {
      "name": "Kuala Lumpur",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MY/"
    },
    "population": {
      "value": 35557673,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/my/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 330241,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/my/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Malay",
      "English",
      "Mandarin Chinese",
      "Tamil"
    ],
    "hello": {
      "language": "Malay",
      "text": "Helo",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/helo"
    },
    "currency": {
      "code": "MYR",
      "name": "Malaysian Ringgit",
      "sourceUrl": "https://www.geonames.org/countries/MY/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "bn",
          "name": "Brunei"
        },
        {
          "iso2": "th",
          "name": "Thailand"
        },
        {
          "iso2": "id",
          "name": "Indonesia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Nasi lemak",
      "sourceUrl": "https://en.wikipedia.org/wiki/Nasi_lemak"
    },
    "animal": {
      "name": "Malayan tapir",
      "sourceUrl": "https://en.wikipedia.org/wiki/Malayan_tapir"
    },
    "landmark": {
      "name": "Petronas Towers",
      "sourceUrl": "https://en.wikipedia.org/wiki/Petronas_Towers"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "tr": {
    "iso2": "tr",
    "name": "Turkey",
    "capital": {
      "name": "Ankara",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/TR/"
    },
    "population": {
      "value": 85518661,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/tr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 785350,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/tr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Turkish",
      "Kurdish"
    ],
    "hello": {
      "language": "Turkish",
      "text": "Merhaba",
      "pronunciation": "MEHR-hah-bah",
      "sourceUrl": "https://en.wiktionary.org/wiki/merhaba"
    },
    "currency": {
      "code": "TRY",
      "name": "Turkish Lira",
      "sourceUrl": "https://www.geonames.org/countries/TR/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sy",
          "name": "Syria"
        },
        {
          "iso2": "ge",
          "name": "Georgia"
        },
        {
          "iso2": "iq",
          "name": "Iraq"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Simit",
      "sourceUrl": "https://en.wikipedia.org/wiki/Simit"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Hagia Sophia",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hagia_Sophia"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/TR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sa": {
    "iso2": "sa",
    "name": "Saudi Arabia",
    "capital": {
      "name": "Riyadh",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SA/"
    },
    "population": {
      "value": 35300280,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sa/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2149690,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sa/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "SAR",
      "name": "Saudi Riyal",
      "sourceUrl": "https://www.geonames.org/countries/SA/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "qa",
          "name": "Qatar"
        },
        {
          "iso2": "om",
          "name": "Oman"
        },
        {
          "iso2": "iq",
          "name": "Iraq"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kabsa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kabsa"
    },
    "animal": {
      "name": "Arabian oryx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arabian_oryx"
    },
    "landmark": {
      "name": "Hegra",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hegra_(Mada'in_Salih)"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ae": {
    "iso2": "ae",
    "name": "United Arab Emirates",
    "capital": {
      "name": "Abu Dhabi",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AE/"
    },
    "population": {
      "value": 10986400,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ae/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 98647.9,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ae/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "English",
      "Hindi",
      "Urdu"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "AED",
      "name": "United Arab Emirates Dirham",
      "sourceUrl": "https://www.geonames.org/countries/AE/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        },
        {
          "iso2": "om",
          "name": "Oman"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Harees",
      "sourceUrl": "https://en.wikipedia.org/wiki/Harees"
    },
    "animal": {
      "name": "Arabian oryx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arabian_oryx"
    },
    "landmark": {
      "name": "Burj Khalifa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Burj_Khalifa"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pk": {
    "iso2": "pk",
    "name": "Pakistan",
    "capital": {
      "name": "Islamabad",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PK/"
    },
    "population": {
      "value": 251269164,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pk/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 796100,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Urdu",
      "Punjabi",
      "Pashto",
      "Sindhi",
      "Saraiki",
      "English"
    ],
    "hello": {
      "language": "Urdu",
      "text": "السلام علیکم",
      "pronunciation": "ah-sah-LAH-moo ah-LAY-koom",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%DB%8C%DA%A9%D9%85"
    },
    "currency": {
      "code": "PKR",
      "name": "Pakistani Rupee",
      "sourceUrl": "https://www.geonames.org/countries/PK/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "af",
          "name": "Afghanistan"
        },
        {
          "iso2": "ir",
          "name": "Iran"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Chapli kebab",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chapli_kebab"
    },
    "animal": {
      "name": "Markhor",
      "sourceUrl": "https://en.wikipedia.org/wiki/Markhor"
    },
    "landmark": {
      "name": "Badshahi Mosque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Badshahi_Mosque"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PK/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bd": {
    "iso2": "bd",
    "name": "Bangladesh",
    "capital": {
      "name": "Dhaka",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BD/"
    },
    "population": {
      "value": 173562364,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bd/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 147570,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bd/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Bengali"
    ],
    "hello": {
      "language": "Bengali",
      "text": "নমস্কার",
      "pronunciation": "noh-mosh-KAR",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A6%A8%E0%A6%AE%E0%A6%B8%E0%A7%8D%E0%A6%95%E0%A6%BE%E0%A6%B0"
    },
    "currency": {
      "code": "BDT",
      "name": "Bangladeshi Taka",
      "sourceUrl": "https://www.geonames.org/countries/BD/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "mm",
          "name": "Myanmar"
        },
        {
          "iso2": "in",
          "name": "India"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Panta bhat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Panta_bhat"
    },
    "animal": {
      "name": "Bengal tiger",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bengal_tiger"
    },
    "landmark": {
      "name": "Lalbagh Fort",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lalbagh_Fort"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BD/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "np": {
    "iso2": "np",
    "name": "Nepal",
    "capital": {
      "name": "Kathmandu",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NP/"
    },
    "population": {
      "value": 29651054,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/np/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 147181,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/np/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Nepali",
      "Maithili",
      "Bhojpuri",
      "Tharu"
    ],
    "hello": {
      "language": "Nepali",
      "text": "नमस्ते",
      "pronunciation": "nuh-muh-STAY",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
    },
    "currency": {
      "code": "NPR",
      "name": "Nepalese Rupee",
      "sourceUrl": "https://www.geonames.org/countries/NP/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "in",
          "name": "India"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Dal bhat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dal_bhat"
    },
    "animal": {
      "name": "Red panda",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_panda"
    },
    "landmark": {
      "name": "Boudhanath",
      "sourceUrl": "https://en.wikipedia.org/wiki/Boudhanath"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NP/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "lk": {
    "iso2": "lk",
    "name": "Sri Lanka",
    "capital": {
      "name": "Sri Jayawardenepura Kotte",
      "role": "legislative capital",
      "sourceUrl": "https://www.kotte.mc.gov.lk/index.php?Itemid=175&id=25&lang=en&option=com_content&view=article"
    },
    "population": {
      "value": 21916000,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/lk/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 65610,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/lk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Sinhala",
      "Tamil"
    ],
    "hello": {
      "language": "Sinhala",
      "text": "ආයුබෝවන්",
      "pronunciation": "ah-yoo-BOH-wan",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B6%86%E0%B6%BA%E0%B7%94%E0%B6%B6%E0%B7%9D%E0%B7%80%E0%B6%B1%E0%B7%8A"
    },
    "currency": {
      "code": "LKR",
      "name": "Sri Lankan Rupee",
      "sourceUrl": "https://www.geonames.org/countries/LK/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Hoppers",
      "sourceUrl": "https://en.wikipedia.org/wiki/Appam"
    },
    "animal": {
      "name": "Sri Lankan elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sri_Lankan_elephant"
    },
    "landmark": {
      "name": "Sigiriya",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sigiriya"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LK/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mn": {
    "iso2": "mn",
    "name": "Mongolia",
    "capital": {
      "name": "Ulaanbaatar",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MN/"
    },
    "population": {
      "value": 3524788,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1564115.75,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Mongolian"
    ],
    "hello": {
      "language": "Mongolian",
      "text": "Сайн байна уу",
      "pronunciation": "sain bain OO",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D1%81%D0%B0%D0%B9%D0%BD%20%D0%B1%D0%B0%D0%B9%D0%BD%D0%B0%20%D1%83%D1%83"
    },
    "currency": {
      "code": "MNT",
      "name": "Mongolian Tugrik",
      "sourceUrl": "https://www.geonames.org/countries/MN/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "ru",
          "name": "Russia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Buuz",
      "sourceUrl": "https://en.wikipedia.org/wiki/Buuz"
    },
    "animal": {
      "name": "Przewalski's horse",
      "sourceUrl": "https://en.wikipedia.org/wiki/Przewalski's_horse"
    },
    "landmark": {
      "name": "Gandantegchinlen Monastery",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gandantegchinlen_Monastery"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "kh": {
    "iso2": "kh",
    "name": "Cambodia",
    "capital": {
      "name": "Phnom Penh",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/KH/"
    },
    "population": {
      "value": 17638801,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/kh/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 181035,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/kh/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Khmer"
    ],
    "hello": {
      "language": "Khmer",
      "text": "សួស្តី",
      "pronunciation": "soo-oh-suh-DAY",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E1%9E%9F%E1%9E%BD%E1%9E%9F%E1%9F%92%E1%9E%8F%E1%9E%B8"
    },
    "currency": {
      "code": "KHR",
      "name": "Cambodian Riel",
      "sourceUrl": "https://www.geonames.org/countries/KH/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "la",
          "name": "Laos"
        },
        {
          "iso2": "th",
          "name": "Thailand"
        },
        {
          "iso2": "vn",
          "name": "Vietnam"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Fish amok",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fish_amok"
    },
    "animal": {
      "name": "Pileated gibbon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pileated_gibbon"
    },
    "landmark": {
      "name": "Angkor Wat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Angkor_Wat"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/KH/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "la": {
    "iso2": "la",
    "name": "Laos",
    "capital": {
      "name": "Vientiane",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/LA/"
    },
    "population": {
      "value": 7769819,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/la/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 236800,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/la/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Lao"
    ],
    "hello": {
      "language": "Lao",
      "text": "ສະບາຍດີ",
      "pronunciation": "sah-bai-DEE",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E0%BA%AA%E0%BA%B0%E0%BA%9A%E0%BA%B2%E0%BA%8D%E0%BA%94%E0%BA%B5"
    },
    "currency": {
      "code": "LAK",
      "name": "Laotian Kip",
      "sourceUrl": "https://www.geonames.org/countries/LA/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "mm",
          "name": "Myanmar"
        },
        {
          "iso2": "kh",
          "name": "Cambodia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Laap",
      "sourceUrl": "https://en.wikipedia.org/wiki/Larb"
    },
    "animal": {
      "name": "Asian elephant",
      "sourceUrl": "https://en.wikipedia.org/wiki/Asian_elephant"
    },
    "landmark": {
      "name": "Pha That Luang",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pha_That_Luang"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mm": {
    "iso2": "mm",
    "name": "Myanmar",
    "capital": {
      "name": "Nay Pyi Taw",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MM/"
    },
    "population": {
      "value": 54500091,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mm/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 676577.738,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Burmese",
      "Shan",
      "Karen languages"
    ],
    "hello": {
      "language": "Burmese",
      "text": "မင်္ဂလာပါ",
      "pronunciation": "min-gah-LAH-bah",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E1%80%99%E1%80%84%E1%80%BA%E1%80%B9%E1%80%82%E1%80%9C%E1%80%AC%E1%80%95%E1%80%AB"
    },
    "currency": {
      "code": "MMK",
      "name": "Myanmar Kyat",
      "sourceUrl": "https://www.geonames.org/countries/MM/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "la",
          "name": "Laos"
        },
        {
          "iso2": "th",
          "name": "Thailand"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Mohinga",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mohinga"
    },
    "animal": {
      "name": "Burmese star tortoise",
      "sourceUrl": "https://en.wikipedia.org/wiki/Burmese_star_tortoise"
    },
    "landmark": {
      "name": "Shwedagon Pagoda",
      "sourceUrl": "https://en.wikipedia.org/wiki/Shwedagon_Pagoda"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ir": {
    "iso2": "ir",
    "name": "Iran",
    "capital": {
      "name": "Tehran",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IR/"
    },
    "population": {
      "value": 91567738,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ir/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1745150,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ir/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Persian",
      "Azerbaijani",
      "Kurdish"
    ],
    "hello": {
      "language": "Persian",
      "text": "سلام",
      "pronunciation": "sah-LAHM",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D8%B3%D9%84%D8%A7%D9%85"
    },
    "currency": {
      "code": "IRR",
      "name": "Iranian Rial",
      "sourceUrl": "https://www.geonames.org/countries/IR/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tm",
          "name": "Turkmenistan"
        },
        {
          "iso2": "af",
          "name": "Afghanistan"
        },
        {
          "iso2": "iq",
          "name": "Iraq"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Fesenjan",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fesenj%C4%81n"
    },
    "animal": {
      "name": "Persian leopard",
      "sourceUrl": "https://en.wikipedia.org/wiki/Persian_leopard"
    },
    "landmark": {
      "name": "Persepolis",
      "sourceUrl": "https://en.wikipedia.org/wiki/Persepolis"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "iq": {
    "iso2": "iq",
    "name": "Iraq",
    "capital": {
      "name": "Baghdad",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IQ/"
    },
    "population": {
      "value": 46042015,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/iq/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 435050,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/iq/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "Kurdish"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "IQD",
      "name": "Iraqi Dinar",
      "sourceUrl": "https://www.geonames.org/countries/IQ/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sy",
          "name": "Syria"
        },
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        },
        {
          "iso2": "ir",
          "name": "Iran"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Masgouf",
      "sourceUrl": "https://en.wikipedia.org/wiki/Masgouf"
    },
    "animal": {
      "name": "Eurasian otter",
      "sourceUrl": "https://en.wikipedia.org/wiki/Eurasian_otter"
    },
    "landmark": {
      "name": "Ziggurat of Ur",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ziggurat_of_Ur"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IQ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "il": {
    "iso2": "il",
    "name": "Israel",
    "capital": {
      "name": "Jerusalem",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IL/"
    },
    "population": {
      "value": 10002200,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/il/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 22070,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/il/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Hebrew",
      "Arabic"
    ],
    "hello": {
      "language": "Hebrew",
      "text": "שלום",
      "pronunciation": "shah-LOHM",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D7%A9%D7%9C%D7%95%D7%9D"
    },
    "currency": {
      "code": "ILS",
      "name": "Israeli New Shekel",
      "sourceUrl": "https://www.geonames.org/countries/IL/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "eg",
          "name": "Egypt"
        },
        {
          "iso2": "jo",
          "name": "Jordan"
        },
        {
          "iso2": "lb",
          "name": "Lebanon"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Falafel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Falafel"
    },
    "animal": {
      "name": "Nubian ibex",
      "sourceUrl": "https://en.wikipedia.org/wiki/Nubian_ibex"
    },
    "landmark": {
      "name": "Bahá'í Gardens in Haifa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bah%C3%A1%CA%BC%C3%AD_gardens"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IL/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "jo": {
    "iso2": "jo",
    "name": "Jordan",
    "capital": {
      "name": "Amman",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/JO/"
    },
    "population": {
      "value": 11552876,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/jo/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 89318,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/jo/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "JOD",
      "name": "Jordanian Dinar",
      "sourceUrl": "https://www.geonames.org/countries/JO/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sy",
          "name": "Syria"
        },
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        },
        {
          "iso2": "iq",
          "name": "Iraq"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Mansaf",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mansaf"
    },
    "animal": {
      "name": "Arabian oryx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arabian_oryx"
    },
    "landmark": {
      "name": "Petra",
      "sourceUrl": "https://en.wikipedia.org/wiki/Petra"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/JO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "qa": {
    "iso2": "qa",
    "name": "Qatar",
    "capital": {
      "name": "Doha",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/QA/"
    },
    "population": {
      "value": 2857822,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/qa/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 11490,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/qa/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "English"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "QAR",
      "name": "Qatari Riyal",
      "sourceUrl": "https://www.geonames.org/countries/QA/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Machboos",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kabsa"
    },
    "animal": {
      "name": "Arabian oryx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arabian_oryx"
    },
    "landmark": {
      "name": "Museum of Islamic Art, Doha",
      "sourceUrl": "https://en.wikipedia.org/wiki/Museum_of_Islamic_Art%2C_Doha"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/QA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "kw": {
    "iso2": "kw",
    "name": "Kuwait",
    "capital": {
      "name": "Kuwait City",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/KW/"
    },
    "population": {
      "value": 4897263,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/kw/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 17820,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/kw/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "English"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "KWD",
      "name": "Kuwaiti Dinar",
      "sourceUrl": "https://www.geonames.org/countries/KW/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        },
        {
          "iso2": "iq",
          "name": "Iraq"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Machboos",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kabsa"
    },
    "animal": {
      "name": "Dromedary",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dromedary"
    },
    "landmark": {
      "name": "Kuwait Towers",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kuwait_Towers"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/KW/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "om": {
    "iso2": "om",
    "name": "Oman",
    "capital": {
      "name": "Muscat",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/OM/"
    },
    "population": {
      "value": 5281538,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/om/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 309500,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/om/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "OMR",
      "name": "Omani Rial",
      "sourceUrl": "https://www.geonames.org/countries/OM/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sa",
          "name": "Saudi Arabia"
        },
        {
          "iso2": "ye",
          "name": "Yemen"
        },
        {
          "iso2": "ae",
          "name": "United Arab Emirates"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Shuwa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Omani_cuisine"
    },
    "animal": {
      "name": "Arabian tahr",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arabian_tahr"
    },
    "landmark": {
      "name": "Sultan Qaboos Grand Mosque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sultan_Qaboos_Grand_Mosque"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/OM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "kz": {
    "iso2": "kz",
    "name": "Kazakhstan",
    "capital": {
      "name": "Astana",
      "role": "capital",
      "sourceUrl": "https://www.gov.kz/org/mfa-pretoria/press/news/details/429981"
    },
    "population": {
      "value": 20592571,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/kz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2724902,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/kz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Kazakh",
      "Russian"
    ],
    "hello": {
      "language": "Kazakh",
      "text": "Сәлем",
      "pronunciation": "sah-LEM",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D1%81%D3%99%D0%BB%D0%B5%D0%BC"
    },
    "currency": {
      "code": "KZT",
      "name": "Kazakhstani Tenge",
      "sourceUrl": "https://www.geonames.org/countries/KZ/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tm",
          "name": "Turkmenistan"
        },
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "kg",
          "name": "Kyrgyzstan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Beshbarmak",
      "sourceUrl": "https://en.wikipedia.org/wiki/Beshbarmak"
    },
    "animal": {
      "name": "Saiga antelope",
      "sourceUrl": "https://en.wikipedia.org/wiki/Saiga_antelope"
    },
    "landmark": {
      "name": "Bayterek",
      "sourceUrl": "https://en.wikipedia.org/wiki/Baiterek_(monument)"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/KZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "uz": {
    "iso2": "uz",
    "name": "Uzbekistan",
    "capital": {
      "name": "Tashkent",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/UZ/"
    },
    "population": {
      "value": 36361859,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/uz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 448920,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/uz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Uzbek",
      "Russian",
      "Tajik"
    ],
    "hello": {
      "language": "Uzbek",
      "text": "Salom",
      "pronunciation": "sah-LOM",
      "sourceUrl": "https://en.wiktionary.org/wiki/salom"
    },
    "currency": {
      "code": "UZS",
      "name": "Uzbekistani Som",
      "sourceUrl": "https://www.geonames.org/countries/UZ/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tm",
          "name": "Turkmenistan"
        },
        {
          "iso2": "af",
          "name": "Afghanistan"
        },
        {
          "iso2": "kg",
          "name": "Kyrgyzstan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Palov",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pilaf"
    },
    "animal": {
      "name": "Bactrian camel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bactrian_camel"
    },
    "landmark": {
      "name": "Registan",
      "sourceUrl": "https://en.wikipedia.org/wiki/Registan"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/UZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "af": {
    "iso2": "af",
    "name": "Afghanistan",
    "capital": {
      "name": "Kabul",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AF/"
    },
    "population": {
      "value": 42647492,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/af/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 652870,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/af/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Dari",
      "Pashto",
      "Uzbek"
    ],
    "hello": {
      "language": "Dari",
      "text": "سلام",
      "pronunciation": "sah-LAHM",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D8%B3%D9%84%D8%A7%D9%85"
    },
    "currency": {
      "code": "AFN",
      "name": "Afghan Afghani",
      "sourceUrl": "https://www.geonames.org/countries/AF/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "tm",
          "name": "Turkmenistan"
        },
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "ir",
          "name": "Iran"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kabuli palaw",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kabuli_pulao"
    },
    "animal": {
      "name": "Snow leopard",
      "sourceUrl": "https://en.wikipedia.org/wiki/Snow_leopard"
    },
    "landmark": {
      "name": "Minaret of Jam",
      "sourceUrl": "https://en.wikipedia.org/wiki/Minaret_of_Jam"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AF/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bt": {
    "iso2": "bt",
    "name": "Bhutan",
    "capital": {
      "name": "Thimphu",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BT/"
    },
    "population": {
      "value": 791524,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bt/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 38390,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bt/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Dzongkha",
      "Tshangla",
      "Nepali"
    ],
    "hello": {
      "language": "Dzongkha",
      "text": "སྐུ་གཟུགས་བཟང་པོ།",
      "pronunciation": "koo-zoo-ZANG-poh",
      "sourceUrl": "https://bhutan.travel/visit"
    },
    "currency": {
      "code": "BTN",
      "name": "Bhutanese Ngultrum",
      "sourceUrl": "https://www.geonames.org/countries/BT/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cn",
          "name": "China"
        },
        {
          "iso2": "in",
          "name": "India"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ema datshi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ema_datshi"
    },
    "animal": {
      "name": "Takin",
      "sourceUrl": "https://en.wikipedia.org/wiki/Takin"
    },
    "landmark": {
      "name": "Paro Taktsang",
      "sourceUrl": "https://en.wikipedia.org/wiki/Paro_Taktsang"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bn": {
    "iso2": "bn",
    "name": "Brunei",
    "capital": {
      "name": "Bandar Seri Begawan",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BN/"
    },
    "population": {
      "value": 462721,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 5770,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Malay",
      "English"
    ],
    "hello": {
      "language": "Malay",
      "text": "Helo",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/helo"
    },
    "currency": {
      "code": "BND",
      "name": "Brunei Dollar",
      "sourceUrl": "https://www.geonames.org/countries/BN/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "my",
          "name": "Malaysia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ambuyat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ambuyat"
    },
    "animal": {
      "name": "Proboscis monkey",
      "sourceUrl": "https://en.wikipedia.org/wiki/Proboscis_monkey"
    },
    "landmark": {
      "name": "Omar Ali Saifuddien Mosque",
      "sourceUrl": "https://en.wikipedia.org/wiki/Omar_Ali_Saifuddien_Mosque"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "lb": {
    "iso2": "lb",
    "name": "Lebanon",
    "capital": {
      "name": "Beirut",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/LB/"
    },
    "population": {
      "value": 5805962,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/lb/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 10452,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/lb/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Arabic",
      "French",
      "English"
    ],
    "hello": {
      "language": "Arabic",
      "text": "مرحبا",
      "pronunciation": "MAR-ha-ban",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
    },
    "currency": {
      "code": "LBP",
      "name": "Lebanese Pound",
      "sourceUrl": "https://www.geonames.org/countries/LB/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sy",
          "name": "Syria"
        },
        {
          "iso2": "il",
          "name": "Israel"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Tabbouleh",
      "sourceUrl": "https://en.wikipedia.org/wiki/Tabbouleh"
    },
    "animal": {
      "name": "Striped hyena",
      "sourceUrl": "https://en.wikipedia.org/wiki/Striped_hyena"
    },
    "landmark": {
      "name": "Baalbek",
      "sourceUrl": "https://en.wikipedia.org/wiki/Baalbek"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LB/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ge": {
    "iso2": "ge",
    "name": "Georgia",
    "capital": {
      "name": "Tbilisi",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GE/"
    },
    "population": {
      "value": 3812518,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ge/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 69700,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ge/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Georgian"
    ],
    "hello": {
      "language": "Georgian",
      "text": "გამარჯობა",
      "pronunciation": "gah-mar-JOH-bah",
      "sourceUrl": "https://en.wiktionary.org/wiki/%E1%83%92%E1%83%90%E1%83%9B%E1%83%90%E1%83%A0%E1%83%AF%E1%83%9D%E1%83%91%E1%83%90"
    },
    "currency": {
      "code": "GEL",
      "name": "Georgian Lari",
      "sourceUrl": "https://www.geonames.org/countries/GE/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "am",
          "name": "Armenia"
        },
        {
          "iso2": "az",
          "name": "Azerbaijan"
        },
        {
          "iso2": "tr",
          "name": "Turkey"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Khachapuri",
      "sourceUrl": "https://en.wikipedia.org/wiki/Khachapuri"
    },
    "animal": {
      "name": "Caucasian tur",
      "sourceUrl": "https://en.wikipedia.org/wiki/East_Caucasian_tur"
    },
    "landmark": {
      "name": "Gergeti Trinity Church",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gergeti_Trinity_Church"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "am": {
    "iso2": "am",
    "name": "Armenia",
    "capital": {
      "name": "Yerevan",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AM/"
    },
    "population": {
      "value": 3033500,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/am/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 29740,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/am/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Armenian"
    ],
    "hello": {
      "language": "Armenian",
      "text": "Բարև",
      "pronunciation": "bah-REV",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D5%A2%D5%A1%D6%80%D6%87"
    },
    "currency": {
      "code": "AMD",
      "name": "Armenian Dram",
      "sourceUrl": "https://www.geonames.org/countries/AM/"
    },
    "continent": "Asia",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ge",
          "name": "Georgia"
        },
        {
          "iso2": "ir",
          "name": "Iran"
        },
        {
          "iso2": "az",
          "name": "Azerbaijan"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ghapama",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ghapama"
    },
    "animal": {
      "name": "Bezoar goat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Wild_goat"
    },
    "landmark": {
      "name": "Garni Temple",
      "sourceUrl": "https://en.wikipedia.org/wiki/Temple_of_Garni"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "fr": {
    "iso2": "fr",
    "name": "France",
    "capital": {
      "name": "Paris",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/FR/"
    },
    "population": {
      "value": 68551653,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/fr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 606410,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/fr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "French"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/FR/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "be",
          "name": "Belgium"
        },
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "es",
          "name": "Spain"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Baguette",
      "sourceUrl": "https://en.wikipedia.org/wiki/Baguette"
    },
    "animal": {
      "name": "Red fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_fox"
    },
    "landmark": {
      "name": "Eiffel Tower",
      "sourceUrl": "https://en.wikipedia.org/wiki/Eiffel_Tower"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/FR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "de": {
    "iso2": "de",
    "name": "Germany",
    "capital": {
      "name": "Berlin",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/DE/"
    },
    "population": {
      "value": 83516593,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/de/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 357680,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/de/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "German"
    ],
    "hello": {
      "language": "German",
      "text": "Guten Tag",
      "pronunciation": "GOO-ten tahk",
      "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/DE/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ch",
          "name": "Switzerland"
        },
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "nl",
          "name": "The Netherlands"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pretzel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pretzel"
    },
    "animal": {
      "name": "Red squirrel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_squirrel"
    },
    "landmark": {
      "name": "Brandenburg Gate",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brandenburg_Gate"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/DE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "it": {
    "iso2": "it",
    "name": "Italy",
    "capital": {
      "name": "Rome",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IT/"
    },
    "population": {
      "value": 58952704,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/it/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 302070,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/it/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Italian"
    ],
    "hello": {
      "language": "Italian",
      "text": "Ciao",
      "pronunciation": "chow",
      "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/IT/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ch",
          "name": "Switzerland"
        },
        {
          "iso2": "va",
          "name": "Vatican"
        },
        {
          "iso2": "si",
          "name": "Slovenia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Risotto",
      "sourceUrl": "https://en.wikipedia.org/wiki/Risotto"
    },
    "animal": {
      "name": "Alpine ibex",
      "sourceUrl": "https://en.wikipedia.org/wiki/Alpine_ibex"
    },
    "landmark": {
      "name": "Colosseum",
      "sourceUrl": "https://en.wikipedia.org/wiki/Colosseum"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "es": {
    "iso2": "es",
    "name": "Spain",
    "capital": {
      "name": "Madrid",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/ES/"
    },
    "population": {
      "value": 48848840,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/es/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 505975.98,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/es/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Catalan",
      "Galician",
      "Basque"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/ES/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "fr",
          "name": "France"
        },
        {
          "iso2": "pt",
          "name": "Portugal"
        },
        {
          "iso2": "ad",
          "name": "Andorra"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Paella",
      "sourceUrl": "https://en.wikipedia.org/wiki/Paella"
    },
    "animal": {
      "name": "Iberian lynx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Iberian_lynx"
    },
    "landmark": {
      "name": "Sagrada Família",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sagrada_Fam%C3%ADlia"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/ES/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "gb": {
    "iso2": "gb",
    "name": "United Kingdom",
    "capital": {
      "name": "London",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GB/"
    },
    "population": {
      "value": 69281000,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/gb/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 243610,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/gb/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Welsh",
      "Scottish Gaelic",
      "Scots",
      "Irish"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "GBP",
      "name": "British Pound",
      "sourceUrl": "https://www.geonames.org/countries/GB/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ie",
          "name": "Ireland"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Fish and chips",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fish_and_chips"
    },
    "animal": {
      "name": "Red fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_fox"
    },
    "landmark": {
      "name": "Tower Bridge",
      "sourceUrl": "https://en.wikipedia.org/wiki/Tower_Bridge"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GB/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ru": {
    "iso2": "ru",
    "name": "Russia",
    "capital": {
      "name": "Moscow",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/RU/"
    },
    "population": {
      "value": 143669648,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ru/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 17125190,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ru/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Russian",
      "Tatar",
      "Chechen",
      "Bashkir"
    ],
    "hello": {
      "language": "Russian",
      "text": "Здравствуйте",
      "pronunciation": "ZDRAST-vooy-tyeh",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5"
    },
    "currency": {
      "code": "RUB",
      "name": "Russian Ruble",
      "sourceUrl": "https://www.geonames.org/countries/RU/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "no",
          "name": "Norway"
        },
        {
          "iso2": "fi",
          "name": "Finland"
        },
        {
          "iso2": "mn",
          "name": "Mongolia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pelmeni",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pelmeni"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Saint Basil's Cathedral",
      "sourceUrl": "https://en.wikipedia.org/wiki/Saint_Basil's_Cathedral"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/RU/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "gr": {
    "iso2": "gr",
    "name": "Greece",
    "capital": {
      "name": "Athens",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GR/"
    },
    "population": {
      "value": 10405134,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/gr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 131960,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/gr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Greek"
    ],
    "hello": {
      "language": "Greek",
      "text": "Γεια σου",
      "pronunciation": "yah soo",
      "sourceUrl": "https://en.wiktionary.org/wiki/%CE%B3%CE%B5%CE%B9%CE%B1%20%CF%83%CE%BF%CF%85"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/GR/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "al",
          "name": "Albania"
        },
        {
          "iso2": "mk",
          "name": "North Macedonia"
        },
        {
          "iso2": "tr",
          "name": "Turkey"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Spanakopita",
      "sourceUrl": "https://en.wikipedia.org/wiki/Spanakopita"
    },
    "animal": {
      "name": "Loggerhead sea turtle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Loggerhead_sea_turtle"
    },
    "landmark": {
      "name": "Parthenon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Parthenon"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pt": {
    "iso2": "pt",
    "name": "Portugal",
    "capital": {
      "name": "Lisbon",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PT/"
    },
    "population": {
      "value": 10694681,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pt/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 92230,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pt/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Portuguese"
    ],
    "hello": {
      "language": "Portuguese",
      "text": "Olá",
      "pronunciation": "oh-LAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/PT/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "es",
          "name": "Spain"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pastel de nata",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pastel_de_nata"
    },
    "animal": {
      "name": "Iberian lynx",
      "sourceUrl": "https://en.wikipedia.org/wiki/Iberian_lynx"
    },
    "landmark": {
      "name": "Belém Tower",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bel%C3%A9m_Tower"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "nl": {
    "iso2": "nl",
    "name": "Netherlands",
    "capital": {
      "name": "Amsterdam",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NL/"
    },
    "population": {
      "value": 17993485,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/nl/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 41540,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/nl/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Dutch",
      "West Frisian"
    ],
    "hello": {
      "language": "Dutch",
      "text": "Hallo",
      "pronunciation": "HAHT-loh",
      "sourceUrl": "https://en.wiktionary.org/wiki/hallo"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/NL/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "be",
          "name": "Belgium"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Stroopwafel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Stroopwafel"
    },
    "animal": {
      "name": "Grey heron",
      "sourceUrl": "https://en.wikipedia.org/wiki/Grey_heron"
    },
    "landmark": {
      "name": "Kinderdijk",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kinderdijk"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NL/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ch": {
    "iso2": "ch",
    "name": "Switzerland",
    "capital": {
      "name": "Bern",
      "role": "federal city",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bern"
    },
    "population": {
      "value": 9005582,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ch/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 41290.7,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ch/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "German",
      "Swiss German",
      "French",
      "Italian",
      "Romansh"
    ],
    "hello": {
      "language": "Swiss German",
      "text": "Grüezi",
      "pronunciation": "GROO-et-see",
      "sourceUrl": "https://en.wiktionary.org/wiki/gr%C3%BCezi"
    },
    "currency": {
      "code": "CHF",
      "name": "Swiss Franc",
      "sourceUrl": "https://www.geonames.org/countries/CH/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "it",
          "name": "Italy"
        },
        {
          "iso2": "li",
          "name": "Liechtenstein"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Rösti",
      "sourceUrl": "https://en.wikipedia.org/wiki/R%C3%B6sti"
    },
    "animal": {
      "name": "Alpine ibex",
      "sourceUrl": "https://en.wikipedia.org/wiki/Alpine_ibex"
    },
    "landmark": {
      "name": "Chillon Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chillon_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CH/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "se": {
    "iso2": "se",
    "name": "Sweden",
    "capital": {
      "name": "Stockholm",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SE/"
    },
    "population": {
      "value": 10569709,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/se/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 528660,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/se/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Swedish"
    ],
    "hello": {
      "language": "Swedish",
      "text": "Hej",
      "pronunciation": "hay",
      "sourceUrl": "https://en.wiktionary.org/wiki/hej"
    },
    "currency": {
      "code": "SEK",
      "name": "Swedish Krona",
      "sourceUrl": "https://www.geonames.org/countries/SE/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "no",
          "name": "Norway"
        },
        {
          "iso2": "fi",
          "name": "Finland"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Swedish meatballs",
      "sourceUrl": "https://en.wikipedia.org/wiki/Meatball"
    },
    "animal": {
      "name": "Moose",
      "sourceUrl": "https://en.wikipedia.org/wiki/Moose"
    },
    "landmark": {
      "name": "Drottningholm Palace",
      "sourceUrl": "https://en.wikipedia.org/wiki/Drottningholm_Palace"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "no": {
    "iso2": "no",
    "name": "Norway",
    "capital": {
      "name": "Oslo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NO/"
    },
    "population": {
      "value": 5572279,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/no/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 624500,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/no/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Norwegian",
      "Sámi languages"
    ],
    "hello": {
      "language": "Norwegian",
      "text": "Hei",
      "pronunciation": "hay",
      "sourceUrl": "https://en.wiktionary.org/wiki/hei"
    },
    "currency": {
      "code": "NOK",
      "name": "Norwegian Krone",
      "sourceUrl": "https://www.geonames.org/countries/NO/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "fi",
          "name": "Finland"
        },
        {
          "iso2": "ru",
          "name": "Russia"
        },
        {
          "iso2": "se",
          "name": "Sweden"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Fårikål",
      "sourceUrl": "https://en.wikipedia.org/wiki/F%C3%A5rik%C3%A5l"
    },
    "animal": {
      "name": "Atlantic puffin",
      "sourceUrl": "https://en.wikipedia.org/wiki/Atlantic_puffin"
    },
    "landmark": {
      "name": "Bryggen",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bryggen"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "fi": {
    "iso2": "fi",
    "name": "Finland",
    "capital": {
      "name": "Helsinki",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/FI/"
    },
    "population": {
      "value": 5619911,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/fi/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 338480,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/fi/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Finnish",
      "Swedish"
    ],
    "hello": {
      "language": "Finnish",
      "text": "Hei",
      "pronunciation": "hay",
      "sourceUrl": "https://en.wiktionary.org/wiki/hei"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/FI/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "no",
          "name": "Norway"
        },
        {
          "iso2": "ru",
          "name": "Russia"
        },
        {
          "iso2": "se",
          "name": "Sweden"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Karjalanpiirakka",
      "sourceUrl": "https://en.wikipedia.org/wiki/Karelian_pasty"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Suomenlinna",
      "sourceUrl": "https://en.wikipedia.org/wiki/Suomenlinna"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/FI/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "dk": {
    "iso2": "dk",
    "name": "Denmark",
    "capital": {
      "name": "Copenhagen",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/DK/"
    },
    "population": {
      "value": 5976992,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/dk/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 42920,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/dk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Danish"
    ],
    "hello": {
      "language": "Danish",
      "text": "Hej",
      "pronunciation": "hi",
      "sourceUrl": "https://en.wiktionary.org/wiki/hej"
    },
    "currency": {
      "code": "DKK",
      "name": "Danish Krone",
      "sourceUrl": "https://www.geonames.org/countries/DK/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Smørrebrød",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sm%C3%B8rrebr%C3%B8d"
    },
    "animal": {
      "name": "Red deer",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_deer"
    },
    "landmark": {
      "name": "Rosenborg Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rosenborg_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/DK/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ie": {
    "iso2": "ie",
    "name": "Ireland",
    "capital": {
      "name": "Dublin",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IE/"
    },
    "population": {
      "value": 5395790,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ie/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 70280,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ie/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Irish"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/IE/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gb",
          "name": "United Kingdom"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Colcannon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Colcannon"
    },
    "animal": {
      "name": "Irish hare",
      "sourceUrl": "https://en.wikipedia.org/wiki/Irish_hare"
    },
    "landmark": {
      "name": "Cliffs of Moher",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cliffs_of_Moher"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pl": {
    "iso2": "pl",
    "name": "Poland",
    "capital": {
      "name": "Warsaw",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PL/"
    },
    "population": {
      "value": 36559233,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pl/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 313930,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pl/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Polish"
    ],
    "hello": {
      "language": "Polish",
      "text": "Cześć",
      "pronunciation": "cheshch",
      "sourceUrl": "https://en.wiktionary.org/wiki/cze%C5%9B%C4%87"
    },
    "currency": {
      "code": "PLN",
      "name": "Polish Zloty",
      "sourceUrl": "https://www.geonames.org/countries/PL/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "lt",
          "name": "Lithuania"
        },
        {
          "iso2": "sk",
          "name": "Slovakia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pierogi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pierogi"
    },
    "animal": {
      "name": "European bison",
      "sourceUrl": "https://en.wikipedia.org/wiki/European_bison"
    },
    "landmark": {
      "name": "Wawel Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Wawel_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PL/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "at": {
    "iso2": "at",
    "name": "Austria",
    "capital": {
      "name": "Vienna",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AT/"
    },
    "population": {
      "value": 9177982,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/at/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 83879,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/at/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "German"
    ],
    "hello": {
      "language": "German",
      "text": "Guten Tag",
      "pronunciation": "GOO-ten tahk",
      "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/AT/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ch",
          "name": "Switzerland"
        },
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "hu",
          "name": "Hungary"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Apfelstrudel",
      "sourceUrl": "https://en.wikipedia.org/wiki/Apfelstrudel"
    },
    "animal": {
      "name": "Alpine ibex",
      "sourceUrl": "https://en.wikipedia.org/wiki/Alpine_ibex"
    },
    "landmark": {
      "name": "Schönbrunn Palace",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sch%C3%B6nbrunn_Palace"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "be": {
    "iso2": "be",
    "name": "Belgium",
    "capital": {
      "name": "Brussels",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BE/"
    },
    "population": {
      "value": 11858610,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/be/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 30689,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/be/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Dutch",
      "French",
      "German"
    ],
    "hello": {
      "language": "Dutch",
      "text": "Hallo",
      "pronunciation": "HAHT-loh",
      "sourceUrl": "https://en.wiktionary.org/wiki/hallo"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/BE/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "nl",
          "name": "The Netherlands"
        },
        {
          "iso2": "lu",
          "name": "Luxembourg"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Belgian waffle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Belgian_waffle"
    },
    "animal": {
      "name": "Red fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_fox"
    },
    "landmark": {
      "name": "Atomium",
      "sourceUrl": "https://en.wikipedia.org/wiki/Atomium"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ua": {
    "iso2": "ua",
    "name": "Ukraine",
    "capital": {
      "name": "Kyiv",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/UA/"
    },
    "population": {
      "value": 37860221,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ua/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 603550,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ua/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Ukrainian"
    ],
    "hello": {
      "language": "Ukrainian",
      "text": "Вітаю",
      "pronunciation": "vee-TAH-yoo",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B2%D1%96%D1%82%D0%B0%D1%8E"
    },
    "currency": {
      "code": "UAH",
      "name": "Ukrainian Hryvnia",
      "sourceUrl": "https://www.geonames.org/countries/UA/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "md",
          "name": "Moldova"
        },
        {
          "iso2": "hu",
          "name": "Hungary"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Borscht",
      "sourceUrl": "https://en.wikipedia.org/wiki/Borscht"
    },
    "animal": {
      "name": "White stork",
      "sourceUrl": "https://en.wikipedia.org/wiki/White_stork"
    },
    "landmark": {
      "name": "Saint Sophia Cathedral, Kyiv",
      "sourceUrl": "https://en.wikipedia.org/wiki/Saint_Sophia_Cathedral%2C_Kyiv"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/UA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "is": {
    "iso2": "is",
    "name": "Iceland",
    "capital": {
      "name": "Reykjavik",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/IS/"
    },
    "population": {
      "value": 386506,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/is/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 103000,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/is/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Icelandic"
    ],
    "hello": {
      "language": "Icelandic",
      "text": "Halló",
      "pronunciation": "HAHT-loh",
      "sourceUrl": "https://en.wiktionary.org/wiki/hall%C3%B3"
    },
    "currency": {
      "code": "ISK",
      "name": "Icelandic Króna",
      "sourceUrl": "https://www.geonames.org/countries/IS/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Skyr",
      "sourceUrl": "https://en.wikipedia.org/wiki/Skyr"
    },
    "animal": {
      "name": "Arctic fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arctic_fox"
    },
    "landmark": {
      "name": "Hallgrímskirkja",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hallgr%C3%ADmskirkja"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/IS/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cz": {
    "iso2": "cz",
    "name": "Czechia",
    "capital": {
      "name": "Prague",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CZ/"
    },
    "population": {
      "value": 10905028,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 78871.43,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Czech"
    ],
    "hello": {
      "language": "Czech",
      "text": "Ahoj",
      "pronunciation": "ah-HOY",
      "sourceUrl": "https://en.wiktionary.org/wiki/ahoj"
    },
    "currency": {
      "code": "CZK",
      "name": "Czech Koruna",
      "sourceUrl": "https://www.geonames.org/countries/CZ/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "sk",
          "name": "Slovakia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Svíčková",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sv%C3%AD%C4%8Dkov%C3%A1"
    },
    "animal": {
      "name": "Red deer",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_deer"
    },
    "landmark": {
      "name": "Charles Bridge",
      "sourceUrl": "https://en.wikipedia.org/wiki/Charles_Bridge"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "hu": {
    "iso2": "hu",
    "name": "Hungary",
    "capital": {
      "name": "Budapest",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/HU/"
    },
    "population": {
      "value": 9562065,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/hu/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 93030,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/hu/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Hungarian"
    ],
    "hello": {
      "language": "Hungarian",
      "text": "Szia",
      "pronunciation": "SEE-ah",
      "sourceUrl": "https://en.wiktionary.org/wiki/szia"
    },
    "currency": {
      "code": "HUF",
      "name": "Hungarian Forint",
      "sourceUrl": "https://www.geonames.org/countries/HU/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sk",
          "name": "Slovakia"
        },
        {
          "iso2": "si",
          "name": "Slovenia"
        },
        {
          "iso2": "ro",
          "name": "Romania"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Goulash",
      "sourceUrl": "https://en.wikipedia.org/wiki/Goulash"
    },
    "animal": {
      "name": "White stork",
      "sourceUrl": "https://en.wikipedia.org/wiki/White_stork"
    },
    "landmark": {
      "name": "Hungarian Parliament Building",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hungarian_Parliament_Building"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/HU/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ro": {
    "iso2": "ro",
    "name": "Romania",
    "capital": {
      "name": "Bucharest",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/RO/"
    },
    "population": {
      "value": 19051804,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ro/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 238400,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ro/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Romanian"
    ],
    "hello": {
      "language": "Romanian",
      "text": "Bună",
      "pronunciation": "BOO-nuh",
      "sourceUrl": "https://en.wiktionary.org/wiki/bun%C4%83"
    },
    "currency": {
      "code": "RON",
      "name": "Romanian Leu",
      "sourceUrl": "https://www.geonames.org/countries/RO/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "md",
          "name": "Moldova"
        },
        {
          "iso2": "hu",
          "name": "Hungary"
        },
        {
          "iso2": "ua",
          "name": "Ukraine"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Mămăligă",
      "sourceUrl": "https://en.wikipedia.org/wiki/M%C4%83m%C4%83lig%C4%83"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Bran Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bran_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/RO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bg": {
    "iso2": "bg",
    "name": "Bulgaria",
    "capital": {
      "name": "Sofia",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BG/"
    },
    "population": {
      "value": 6441421,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bg/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 110996.758,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Bulgarian"
    ],
    "hello": {
      "language": "Bulgarian",
      "text": "Здравей",
      "pronunciation": "zdrah-VEY",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D0%B5%D0%B9"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.ecb.europa.eu/euro/changeover/bulgaria/html/index.en.html"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "mk",
          "name": "North Macedonia"
        },
        {
          "iso2": "gr",
          "name": "Greece"
        },
        {
          "iso2": "ro",
          "name": "Romania"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Banitsa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Banitsa"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Rila Monastery",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rila_Monastery"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "hr": {
    "iso2": "hr",
    "name": "Croatia",
    "capital": {
      "name": "Zagreb",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/HR/"
    },
    "population": {
      "value": 3866200,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/hr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 88070,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/hr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Croatian"
    ],
    "hello": {
      "language": "Croatian",
      "text": "Bok",
      "pronunciation": "bok",
      "sourceUrl": "https://en.wiktionary.org/wiki/bok"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/HR/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "hu",
          "name": "Hungary"
        },
        {
          "iso2": "si",
          "name": "Slovenia"
        },
        {
          "iso2": "ba",
          "name": "Bosnia and Herzegovina"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Peka",
      "sourceUrl": "https://en.wikipedia.org/wiki/Peka"
    },
    "animal": {
      "name": "Bottlenose dolphin",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bottlenose_dolphin"
    },
    "landmark": {
      "name": "Diocletian's Palace",
      "sourceUrl": "https://en.wikipedia.org/wiki/Diocletian's_Palace"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/HR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "rs": {
    "iso2": "rs",
    "name": "Serbia",
    "capital": {
      "name": "Belgrade",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/RS/"
    },
    "population": {
      "value": 6586476,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/rs/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 88490,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/rs/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Serbian"
    ],
    "hello": {
      "language": "Serbian",
      "text": "Здраво",
      "pronunciation": "ZDRAH-voh",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D0%BE"
    },
    "currency": {
      "code": "RSD",
      "name": "Serbian Dinar",
      "sourceUrl": "https://www.geonames.org/countries/RS/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "hu",
          "name": "Hungary"
        },
        {
          "iso2": "ro",
          "name": "Romania"
        },
        {
          "iso2": "bg",
          "name": "Bulgaria"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Gibanica",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gibanica"
    },
    "animal": {
      "name": "Griffon vulture",
      "sourceUrl": "https://en.wikipedia.org/wiki/Griffon_vulture"
    },
    "landmark": {
      "name": "Belgrade Fortress",
      "sourceUrl": "https://en.wikipedia.org/wiki/Belgrade_Fortress"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/RS/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sk": {
    "iso2": "sk",
    "name": "Slovakia",
    "capital": {
      "name": "Bratislava",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SK/"
    },
    "population": {
      "value": 5422069,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sk/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 49030,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Slovak"
    ],
    "hello": {
      "language": "Slovak",
      "text": "Ahoj",
      "pronunciation": "ah-HOY",
      "sourceUrl": "https://en.wiktionary.org/wiki/ahoj"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/SK/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "hu",
          "name": "Hungary"
        },
        {
          "iso2": "cz",
          "name": "Czechia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Bryndzové halušky",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bryndzov%C3%A9_halu%C5%A1ky"
    },
    "animal": {
      "name": "Brown bear",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown_bear"
    },
    "landmark": {
      "name": "Spiš Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Spi%C5%A1_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SK/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "si": {
    "iso2": "si",
    "name": "Slovenia",
    "capital": {
      "name": "Ljubljana",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SI/"
    },
    "population": {
      "value": 2127400,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/si/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 20480,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/si/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Slovenian"
    ],
    "hello": {
      "language": "Slovenian",
      "text": "Živjo",
      "pronunciation": "ZHEEV-yoh",
      "sourceUrl": "https://en.wiktionary.org/wiki/%C5%BEivjo"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/SI/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "hu",
          "name": "Hungary"
        },
        {
          "iso2": "it",
          "name": "Italy"
        },
        {
          "iso2": "hr",
          "name": "Croatia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Potica",
      "sourceUrl": "https://en.wikipedia.org/wiki/Slovenian_potica"
    },
    "animal": {
      "name": "Olm",
      "sourceUrl": "https://en.wikipedia.org/wiki/Olm"
    },
    "landmark": {
      "name": "Lake Bled",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lake_Bled"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SI/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "lt": {
    "iso2": "lt",
    "name": "Lithuania",
    "capital": {
      "name": "Vilnius",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/LT/"
    },
    "population": {
      "value": 2888278,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/lt/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 65290,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/lt/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Lithuanian"
    ],
    "hello": {
      "language": "Lithuanian",
      "text": "Labas",
      "pronunciation": "LAH-bahs",
      "sourceUrl": "https://en.wiktionary.org/wiki/labas"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/LT/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "by",
          "name": "Belarus"
        },
        {
          "iso2": "ru",
          "name": "Russia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Cepelinai",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cepelinai"
    },
    "animal": {
      "name": "White stork",
      "sourceUrl": "https://en.wikipedia.org/wiki/White_stork"
    },
    "landmark": {
      "name": "Trakai Island Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Trakai_Island_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "lv": {
    "iso2": "lv",
    "name": "Latvia",
    "capital": {
      "name": "Riga",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/LV/"
    },
    "population": {
      "value": 1866124,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/lv/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 64590,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/lv/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Latvian"
    ],
    "hello": {
      "language": "Latvian",
      "text": "Sveiki",
      "pronunciation": "SVAY-kee",
      "sourceUrl": "https://en.wiktionary.org/wiki/sveiki"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/LV/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "lt",
          "name": "Lithuania"
        },
        {
          "iso2": "ee",
          "name": "Estonia"
        },
        {
          "iso2": "by",
          "name": "Belarus"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Rye bread",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rye_bread"
    },
    "animal": {
      "name": "White wagtail",
      "sourceUrl": "https://en.wikipedia.org/wiki/White_wagtail"
    },
    "landmark": {
      "name": "Rundāle Palace",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rund%C4%81le_Palace"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LV/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ee": {
    "iso2": "ee",
    "name": "Estonia",
    "capital": {
      "name": "Tallinn",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/EE/"
    },
    "population": {
      "value": 1372341,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ee/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 45340,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ee/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Estonian"
    ],
    "hello": {
      "language": "Estonian",
      "text": "Tere",
      "pronunciation": "TEH-reh",
      "sourceUrl": "https://en.wiktionary.org/wiki/tere"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/EE/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ru",
          "name": "Russia"
        },
        {
          "iso2": "lv",
          "name": "Latvia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kama",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kama_(food)"
    },
    "animal": {
      "name": "Barn swallow",
      "sourceUrl": "https://en.wikipedia.org/wiki/Barn_swallow"
    },
    "landmark": {
      "name": "Tallinn Town Hall",
      "sourceUrl": "https://en.wikipedia.org/wiki/Tallinn_Town_Hall"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/EE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "al": {
    "iso2": "al",
    "name": "Albania",
    "capital": {
      "name": "Tirana",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AL/"
    },
    "population": {
      "value": 2377128,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/al/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 28750,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/al/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Albanian"
    ],
    "hello": {
      "language": "Albanian",
      "text": "Përshëndetje",
      "pronunciation": "per-shen-DET-yeh",
      "sourceUrl": "https://en.wiktionary.org/wiki/p%C3%ABrsh%C3%ABndetje"
    },
    "currency": {
      "code": "ALL",
      "name": "Albanian Lek",
      "sourceUrl": "https://www.geonames.org/countries/AL/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gr",
          "name": "Greece"
        },
        {
          "iso2": "me",
          "name": "Montenegro"
        },
        {
          "iso2": "mk",
          "name": "North Macedonia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Tavë kosi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Tav%C3%AB_kosi"
    },
    "animal": {
      "name": "Golden eagle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Golden_eagle"
    },
    "landmark": {
      "name": "Berat Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Berat_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AL/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "by": {
    "iso2": "by",
    "name": "Belarus",
    "capital": {
      "name": "Minsk",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BY/"
    },
    "population": {
      "value": 9132629,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/by/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 207629,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/by/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Belarusian",
      "Russian"
    ],
    "hello": {
      "language": "Belarusian",
      "text": "Прывітанне",
      "pronunciation": "prih-vee-TAHN-nyeh",
      "sourceUrl": "https://en.wiktionary.org/wiki/%D0%BF%D1%80%D1%8B%D0%B2%D1%96%D1%82%D0%B0%D0%BD%D0%BD%D0%B5"
    },
    "currency": {
      "code": "BYN",
      "name": "Belarusian Ruble",
      "sourceUrl": "https://www.geonames.org/countries/BY/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pl",
          "name": "Poland"
        },
        {
          "iso2": "lt",
          "name": "Lithuania"
        },
        {
          "iso2": "ua",
          "name": "Ukraine"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Draniki",
      "sourceUrl": "https://en.wikipedia.org/wiki/Potato_pancake"
    },
    "animal": {
      "name": "European bison",
      "sourceUrl": "https://en.wikipedia.org/wiki/European_bison"
    },
    "landmark": {
      "name": "Mir Castle Complex",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mir_Castle_Complex"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "lu": {
    "iso2": "lu",
    "name": "Luxembourg",
    "capital": {
      "name": "Luxembourg City",
      "role": "capital",
      "sourceUrl": "https://en.wikipedia.org/wiki/Luxembourg_City"
    },
    "population": {
      "value": 677012,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/lu/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2590,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/lu/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Luxembourgish",
      "French",
      "German"
    ],
    "hello": {
      "language": "Luxembourgish",
      "text": "Moien",
      "pronunciation": "MOY-en",
      "sourceUrl": "https://en.wiktionary.org/wiki/moien"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/LU/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "de",
          "name": "Germany"
        },
        {
          "iso2": "be",
          "name": "Belgium"
        },
        {
          "iso2": "fr",
          "name": "France"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Judd mat Gaardebounen",
      "sourceUrl": "https://en.wikipedia.org/wiki/Judd_mat_Gaardebounen"
    },
    "animal": {
      "name": "Red fox",
      "sourceUrl": "https://en.wikipedia.org/wiki/Red_fox"
    },
    "landmark": {
      "name": "Vianden Castle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Vianden_Castle"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/LU/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cy": {
    "iso2": "cy",
    "name": "Cyprus",
    "capital": {
      "name": "Nicosia",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CY/"
    },
    "population": {
      "value": 1358282,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cy/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 9250,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cy/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Greek",
      "Turkish"
    ],
    "hello": {
      "language": "Greek",
      "text": "Γεια σου",
      "pronunciation": "yah soo",
      "sourceUrl": "https://en.wiktionary.org/wiki/%CE%B3%CE%B5%CE%B9%CE%B1%20%CF%83%CE%BF%CF%85"
    },
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "sourceUrl": "https://www.geonames.org/countries/CY/"
    },
    "continent": "Europe",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Halloumi",
      "sourceUrl": "https://en.wikipedia.org/wiki/Halloumi"
    },
    "animal": {
      "name": "Cyprus mouflon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mouflon"
    },
    "landmark": {
      "name": "Kourion",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kourion"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "us": {
    "iso2": "us",
    "name": "United States",
    "capital": {
      "name": "Washington, D.C.",
      "role": "capital",
      "sourceUrl": "https://en.wikipedia.org/wiki/Washington%2C_D.C."
    },
    "population": {
      "value": 340003797,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/us/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 9831510,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/us/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Spanish"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "sourceUrl": "https://www.geonames.org/countries/US/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ca",
          "name": "Canada"
        },
        {
          "iso2": "mx",
          "name": "Mexico"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Cornbread",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cornbread"
    },
    "animal": {
      "name": "American bison",
      "sourceUrl": "https://en.wikipedia.org/wiki/American_bison"
    },
    "landmark": {
      "name": "Statue of Liberty",
      "sourceUrl": "https://en.wikipedia.org/wiki/Statue_of_Liberty"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/US/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ca": {
    "iso2": "ca",
    "name": "Canada",
    "capital": {
      "name": "Ottawa",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CA/"
    },
    "population": {
      "value": 41262329,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ca/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 15634410,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ca/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "French"
    ],
    "hello": {
      "language": "French",
      "text": "Bonjour",
      "pronunciation": "bon-ZHOOR",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
    },
    "currency": {
      "code": "CAD",
      "name": "Canadian Dollar",
      "sourceUrl": "https://www.geonames.org/countries/CA/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "us",
          "name": "United States"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Poutine",
      "sourceUrl": "https://en.wikipedia.org/wiki/Poutine"
    },
    "animal": {
      "name": "North American beaver",
      "sourceUrl": "https://en.wikipedia.org/wiki/North_American_beaver"
    },
    "landmark": {
      "name": "CN Tower",
      "sourceUrl": "https://en.wikipedia.org/wiki/CN_Tower"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "mx": {
    "iso2": "mx",
    "name": "Mexico",
    "capital": {
      "name": "Mexico City",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/MX/"
    },
    "population": {
      "value": 130861007,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/mx/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1957193.9,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/mx/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Nahuatl",
      "Maya languages"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "MXN",
      "name": "Mexican Peso",
      "sourceUrl": "https://www.geonames.org/countries/MX/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gt",
          "name": "Guatemala"
        },
        {
          "iso2": "us",
          "name": "United States"
        },
        {
          "iso2": "bz",
          "name": "Belize"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Taco",
      "sourceUrl": "https://en.wikipedia.org/wiki/Taco"
    },
    "animal": {
      "name": "Axolotl",
      "sourceUrl": "https://en.wikipedia.org/wiki/Axolotl"
    },
    "landmark": {
      "name": "Chichen Itza",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chichen_Itza"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/MX/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cu": {
    "iso2": "cu",
    "name": "Cuba",
    "capital": {
      "name": "Havana",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CU/"
    },
    "population": {
      "value": 10979783,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cu/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 109880,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cu/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "CUP",
      "name": "Cuban Peso",
      "sourceUrl": "https://www.geonames.org/countries/CU/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "us",
          "name": "United States"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Moros y cristianos",
      "sourceUrl": "https://en.wikipedia.org/wiki/Moros_y_Cristianos_(dish)"
    },
    "animal": {
      "name": "Cuban crocodile",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cuban_crocodile"
    },
    "landmark": {
      "name": "Morro Castle, Havana",
      "sourceUrl": "https://en.wikipedia.org/wiki/Castillo_de_los_Tres_Reyes_Del_Morro"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CU/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "jm": {
    "iso2": "jm",
    "name": "Jamaica",
    "capital": {
      "name": "Kingston",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/JM/"
    },
    "population": {
      "value": 2839175,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/jm/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 10991,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/jm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Jamaican Patois"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "JMD",
      "name": "Jamaican Dollar",
      "sourceUrl": "https://www.geonames.org/countries/JM/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ackee and saltfish",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ackee_and_saltfish"
    },
    "animal": {
      "name": "Jamaican tody",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jamaican_tody"
    },
    "landmark": {
      "name": "Dunn's River Falls",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dunn's_River_Falls"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/JM/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cr": {
    "iso2": "cr",
    "name": "Costa Rica",
    "capital": {
      "name": "San Jose",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CR/"
    },
    "population": {
      "value": 5129910,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 51100,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "CRC",
      "name": "Costa Rican Colón",
      "sourceUrl": "https://www.geonames.org/countries/CR/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pa",
          "name": "Panama"
        },
        {
          "iso2": "ni",
          "name": "Nicaragua"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Gallo pinto",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gallo_pinto"
    },
    "animal": {
      "name": "Brown-throated sloth",
      "sourceUrl": "https://en.wikipedia.org/wiki/Brown-throated_sloth"
    },
    "landmark": {
      "name": "Arenal Volcano",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arenal_Volcano"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pa": {
    "iso2": "pa",
    "name": "Panama",
    "capital": {
      "name": "Panama City",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PA/"
    },
    "population": {
      "value": 4515577,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pa/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 75320,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pa/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "PAB",
      "name": "Panamanian Balboa",
      "sourceUrl": "https://www.geonames.org/countries/PA/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cr",
          "name": "Costa Rica"
        },
        {
          "iso2": "co",
          "name": "Colombia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Sancocho",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sancocho"
    },
    "animal": {
      "name": "Harpy eagle",
      "sourceUrl": "https://en.wikipedia.org/wiki/Harpy_eagle"
    },
    "landmark": {
      "name": "Panama Canal",
      "sourceUrl": "https://en.wikipedia.org/wiki/Panama_Canal"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PA/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "gt": {
    "iso2": "gt",
    "name": "Guatemala",
    "capital": {
      "name": "Guatemala City",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GT/"
    },
    "population": {
      "value": 18406359,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/gt/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 108889,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/gt/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Kʼicheʼ",
      "Qʼeqchiʼ",
      "Kaqchikel"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "GTQ",
      "name": "Guatemalan Quetzal",
      "sourceUrl": "https://www.geonames.org/countries/GT/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "mx",
          "name": "Mexico"
        },
        {
          "iso2": "hn",
          "name": "Honduras"
        },
        {
          "iso2": "bz",
          "name": "Belize"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pepián",
      "sourceUrl": "https://en.wikipedia.org/wiki/Guatemalan_cuisine"
    },
    "animal": {
      "name": "Resplendent quetzal",
      "sourceUrl": "https://en.wikipedia.org/wiki/Resplendent_quetzal"
    },
    "landmark": {
      "name": "Tikal",
      "sourceUrl": "https://en.wikipedia.org/wiki/Tikal"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "hn": {
    "iso2": "hn",
    "name": "Honduras",
    "capital": {
      "name": "Tegucigalpa",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/HN/"
    },
    "population": {
      "value": 10825703,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/hn/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 112492,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/hn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Garifuna",
      "Miskito"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "HNL",
      "name": "Honduran Lempira",
      "sourceUrl": "https://www.geonames.org/countries/HN/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gt",
          "name": "Guatemala"
        },
        {
          "iso2": "ni",
          "name": "Nicaragua"
        },
        {
          "iso2": "sv",
          "name": "El Salvador"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Baleada",
      "sourceUrl": "https://en.wikipedia.org/wiki/Baleada"
    },
    "animal": {
      "name": "Scarlet macaw",
      "sourceUrl": "https://en.wikipedia.org/wiki/Scarlet_macaw"
    },
    "landmark": {
      "name": "Copán",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cop%C3%A1n"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/HN/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ni": {
    "iso2": "ni",
    "name": "Nicaragua",
    "capital": {
      "name": "Managua",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NI/"
    },
    "population": {
      "value": 6916140,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ni/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 130370,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ni/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Miskito",
      "English"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "NIO",
      "name": "Nicaraguan Córdoba",
      "sourceUrl": "https://www.geonames.org/countries/NI/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cr",
          "name": "Costa Rica"
        },
        {
          "iso2": "hn",
          "name": "Honduras"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Gallo pinto",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gallo_pinto"
    },
    "animal": {
      "name": "Turquoise-browed motmot",
      "sourceUrl": "https://en.wikipedia.org/wiki/Turquoise-browed_motmot"
    },
    "landmark": {
      "name": "Masaya Volcano",
      "sourceUrl": "https://en.wikipedia.org/wiki/Masaya_Volcano"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NI/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sv": {
    "iso2": "sv",
    "name": "El Salvador",
    "capital": {
      "name": "San Salvador",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SV/"
    },
    "population": {
      "value": 6338193,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sv/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 21040,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sv/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "sourceUrl": "https://www.geonames.org/countries/SV/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gt",
          "name": "Guatemala"
        },
        {
          "iso2": "hn",
          "name": "Honduras"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pupusa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pupusa"
    },
    "animal": {
      "name": "Turquoise-browed motmot",
      "sourceUrl": "https://en.wikipedia.org/wiki/Turquoise-browed_motmot"
    },
    "landmark": {
      "name": "Joya de Cerén",
      "sourceUrl": "https://en.wikipedia.org/wiki/Joya_de_Cer%C3%A9n"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SV/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ht": {
    "iso2": "ht",
    "name": "Haiti",
    "capital": {
      "name": "Port-au-Prince",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/HT/"
    },
    "population": {
      "value": 11772557,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ht/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 27750,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ht/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Haitian Creole",
      "French"
    ],
    "hello": {
      "language": "Haitian Creole",
      "text": "Bonjou",
      "pronunciation": "bon-ZHOO",
      "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
    },
    "currency": {
      "code": "HTG",
      "name": "Haitian Gourde",
      "sourceUrl": "https://www.geonames.org/countries/HT/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "do",
          "name": "Dominican Republic"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Soup joumou",
      "sourceUrl": "https://en.wikipedia.org/wiki/Soup_joumou"
    },
    "animal": {
      "name": "Hispaniolan solenodon",
      "sourceUrl": "https://en.wikipedia.org/wiki/Hispaniolan_solenodon"
    },
    "landmark": {
      "name": "Citadelle Laferrière",
      "sourceUrl": "https://en.wikipedia.org/wiki/Citadelle_Laferri%C3%A8re"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/HT/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "do": {
    "iso2": "do",
    "name": "Dominican Republic",
    "capital": {
      "name": "Santo Domingo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/DO/"
    },
    "population": {
      "value": 11427557,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/do/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 146839.46,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/do/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "DOP",
      "name": "Dominican Peso",
      "sourceUrl": "https://www.geonames.org/countries/DO/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ht",
          "name": "Haiti"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Mangú",
      "sourceUrl": "https://en.wikipedia.org/wiki/Mang%C3%BA"
    },
    "animal": {
      "name": "Palmchat",
      "sourceUrl": "https://en.wikipedia.org/wiki/Palmchat"
    },
    "landmark": {
      "name": "Basilica of Our Lady of Altagracia",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bas%C3%ADlica_Catedral_Nuestra_Se%C3%B1ora_de_la_Altagracia"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/DO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bs": {
    "iso2": "bs",
    "name": "Bahamas",
    "capital": {
      "name": "Nassau",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BS/"
    },
    "population": {
      "value": 401283,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bs/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 13878,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bs/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "BSD",
      "name": "Bahamian Dollar",
      "sourceUrl": "https://www.geonames.org/countries/BS/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Conch fritters",
      "sourceUrl": "https://en.wikipedia.org/wiki/Bahamian_cuisine"
    },
    "animal": {
      "name": "American flamingo",
      "sourceUrl": "https://en.wikipedia.org/wiki/American_flamingo"
    },
    "landmark": {
      "name": "Dean's Blue Hole",
      "sourceUrl": "https://en.wikipedia.org/wiki/Dean's_Blue_Hole"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BS/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bz": {
    "iso2": "bz",
    "name": "Belize",
    "capital": {
      "name": "Belmopan",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BZ/"
    },
    "population": {
      "value": 417072,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 22966,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Spanish",
      "Belizean Creole",
      "Maya languages"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "BZD",
      "name": "Belize Dollar",
      "sourceUrl": "https://www.geonames.org/countries/BZ/"
    },
    "continent": "North America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gt",
          "name": "Guatemala"
        },
        {
          "iso2": "mx",
          "name": "Mexico"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Rice and beans",
      "sourceUrl": "https://en.wikipedia.org/wiki/Rice_and_beans"
    },
    "animal": {
      "name": "Baird's tapir",
      "sourceUrl": "https://en.wikipedia.org/wiki/Baird's_tapir"
    },
    "landmark": {
      "name": "Great Blue Hole",
      "sourceUrl": "https://en.wikipedia.org/wiki/Great_Blue_Hole"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "br": {
    "iso2": "br",
    "name": "Brazil",
    "capital": {
      "name": "Brasilia",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/BR/"
    },
    "population": {
      "value": 211998573,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/br/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 8510420,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/br/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Portuguese"
    ],
    "hello": {
      "language": "Portuguese",
      "text": "Olá",
      "pronunciation": "oh-LAH",
      "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
    },
    "currency": {
      "code": "BRL",
      "name": "Brazilian Real",
      "sourceUrl": "https://www.geonames.org/countries/BR/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sr",
          "name": "Suriname"
        },
        {
          "iso2": "pe",
          "name": "Peru"
        },
        {
          "iso2": "bo",
          "name": "Bolivia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pão de queijo",
      "sourceUrl": "https://en.wikipedia.org/wiki/P%C3%A3o_de_queijo"
    },
    "animal": {
      "name": "Capybara",
      "sourceUrl": "https://en.wikipedia.org/wiki/Capybara"
    },
    "landmark": {
      "name": "Christ the Redeemer (statue)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ar": {
    "iso2": "ar",
    "name": "Argentina",
    "capital": {
      "name": "Buenos Aires",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AR/"
    },
    "population": {
      "value": 45696159,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ar/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 2780400,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ar/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "ARS",
      "name": "Argentine Peso",
      "sourceUrl": "https://www.geonames.org/countries/AR/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "cl",
          "name": "Chile"
        },
        {
          "iso2": "bo",
          "name": "Bolivia"
        },
        {
          "iso2": "uy",
          "name": "Uruguay"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Empanada",
      "sourceUrl": "https://en.wikipedia.org/wiki/Empanada"
    },
    "animal": {
      "name": "Guanaco",
      "sourceUrl": "https://en.wikipedia.org/wiki/Guanaco"
    },
    "landmark": {
      "name": "Perito Moreno Glacier",
      "sourceUrl": "https://en.wikipedia.org/wiki/Perito_Moreno_Glacier"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "cl": {
    "iso2": "cl",
    "name": "Chile",
    "capital": {
      "name": "Santiago",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CL/"
    },
    "population": {
      "value": 19764771,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/cl/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 757244.88,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/cl/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Mapudungun",
      "Aymara"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "CLP",
      "name": "Chilean Peso",
      "sourceUrl": "https://www.geonames.org/countries/CL/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pe",
          "name": "Peru"
        },
        {
          "iso2": "bo",
          "name": "Bolivia"
        },
        {
          "iso2": "ar",
          "name": "Argentina"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pastel de choclo",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pastel_de_choclo"
    },
    "animal": {
      "name": "Andean condor",
      "sourceUrl": "https://en.wikipedia.org/wiki/Andean_condor"
    },
    "landmark": {
      "name": "Torres del Paine National Park",
      "sourceUrl": "https://en.wikipedia.org/wiki/Torres_del_Paine_National_Park"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CL/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pe": {
    "iso2": "pe",
    "name": "Peru",
    "capital": {
      "name": "Lima",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PE/"
    },
    "population": {
      "value": 34217848,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pe/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1285215.6,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pe/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Quechua",
      "Aymara"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "PEN",
      "name": "Peruvian Sol",
      "sourceUrl": "https://www.geonames.org/countries/PE/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ec",
          "name": "Ecuador"
        },
        {
          "iso2": "cl",
          "name": "Chile"
        },
        {
          "iso2": "bo",
          "name": "Bolivia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Ceviche",
      "sourceUrl": "https://en.wikipedia.org/wiki/Ceviche"
    },
    "animal": {
      "name": "Vicuña",
      "sourceUrl": "https://en.wikipedia.org/wiki/Vicu%C3%B1a"
    },
    "landmark": {
      "name": "Machu Picchu",
      "sourceUrl": "https://en.wikipedia.org/wiki/Machu_Picchu"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "co": {
    "iso2": "co",
    "name": "Colombia",
    "capital": {
      "name": "Bogota",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/CO/"
    },
    "population": {
      "value": 52886363,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/co/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1140619.1,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/co/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "COP",
      "name": "Colombian Peso",
      "sourceUrl": "https://www.geonames.org/countries/CO/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "ec",
          "name": "Ecuador"
        },
        {
          "iso2": "pe",
          "name": "Peru"
        },
        {
          "iso2": "pa",
          "name": "Panama"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Arepa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arepa"
    },
    "animal": {
      "name": "Cotton-top tamarin",
      "sourceUrl": "https://en.wikipedia.org/wiki/Cotton-top_tamarin"
    },
    "landmark": {
      "name": "Salt Cathedral of Zipaquirá",
      "sourceUrl": "https://en.wikipedia.org/wiki/Salt_Cathedral_of_Zipaquir%C3%A1"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/CO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ve": {
    "iso2": "ve",
    "name": "Venezuela",
    "capital": {
      "name": "Caracas",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/VE/"
    },
    "population": {
      "value": 28405543,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ve/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 912050,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ve/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "VES",
      "name": "Venezuelan Bolívar",
      "sourceUrl": "https://www.geonames.org/countries/VE/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gy",
          "name": "Guyana"
        },
        {
          "iso2": "br",
          "name": "Brazil"
        },
        {
          "iso2": "co",
          "name": "Colombia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Arepa",
      "sourceUrl": "https://en.wikipedia.org/wiki/Arepa"
    },
    "animal": {
      "name": "Venezuelan troupial",
      "sourceUrl": "https://en.wikipedia.org/wiki/Venezuelan_troupial"
    },
    "landmark": {
      "name": "Angel Falls",
      "sourceUrl": "https://en.wikipedia.org/wiki/Angel_Falls"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/VE/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "ec": {
    "iso2": "ec",
    "name": "Ecuador",
    "capital": {
      "name": "Quito",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/EC/"
    },
    "population": {
      "value": 18135478,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/ec/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 256370,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/ec/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Kichwa",
      "Shuar"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "sourceUrl": "https://www.geonames.org/countries/EC/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pe",
          "name": "Peru"
        },
        {
          "iso2": "co",
          "name": "Colombia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Llapingacho",
      "sourceUrl": "https://en.wikipedia.org/wiki/Llapingacho"
    },
    "animal": {
      "name": "Galápagos giant tortoise",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gal%C3%A1pagos_giant_tortoise"
    },
    "landmark": {
      "name": "Galápagos Islands",
      "sourceUrl": "https://en.wikipedia.org/wiki/Gal%C3%A1pagos_Islands"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/EC/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "bo": {
    "iso2": "bo",
    "name": "Bolivia",
    "capital": {
      "name": "Sucre",
      "role": "constitutional capital",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sucre"
    },
    "population": {
      "value": 12413315,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/bo/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 1098580,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/bo/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Quechua",
      "Aymara",
      "Guaraní"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "BOB",
      "name": "Bolivian Boliviano",
      "sourceUrl": "https://www.geonames.org/countries/BO/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "pe",
          "name": "Peru"
        },
        {
          "iso2": "cl",
          "name": "Chile"
        },
        {
          "iso2": "py",
          "name": "Paraguay"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Salteña",
      "sourceUrl": "https://en.wikipedia.org/wiki/Salte%C3%B1a"
    },
    "animal": {
      "name": "Llama",
      "sourceUrl": "https://en.wikipedia.org/wiki/Llama"
    },
    "landmark": {
      "name": "Salar de Uyuni",
      "sourceUrl": "https://en.wikipedia.org/wiki/Salar_de_Uyuni"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/BO/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "uy": {
    "iso2": "uy",
    "name": "Uruguay",
    "capital": {
      "name": "Montevideo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/UY/"
    },
    "population": {
      "value": 3386588,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/uy/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 176220,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/uy/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "UYU",
      "name": "Uruguayan Peso",
      "sourceUrl": "https://www.geonames.org/countries/UY/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "br",
          "name": "Brazil"
        },
        {
          "iso2": "ar",
          "name": "Argentina"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Chivito (sandwich)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Chivito_(sandwich)"
    },
    "animal": {
      "name": "Capybara",
      "sourceUrl": "https://en.wikipedia.org/wiki/Capybara"
    },
    "landmark": {
      "name": "Palacio Salvo",
      "sourceUrl": "https://en.wikipedia.org/wiki/Palacio_Salvo"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/UY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "py": {
    "iso2": "py",
    "name": "Paraguay",
    "capital": {
      "name": "Asuncion",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PY/"
    },
    "population": {
      "value": 6929153,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/py/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 406752,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/py/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Spanish",
      "Guaraní"
    ],
    "hello": {
      "language": "Spanish",
      "text": "Hola",
      "pronunciation": "OH-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/hola"
    },
    "currency": {
      "code": "PYG",
      "name": "Paraguayan Guarani",
      "sourceUrl": "https://www.geonames.org/countries/PY/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "bo",
          "name": "Bolivia"
        },
        {
          "iso2": "br",
          "name": "Brazil"
        },
        {
          "iso2": "ar",
          "name": "Argentina"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Sopa paraguaya",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sopa_paraguaya"
    },
    "animal": {
      "name": "Jaguar",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jaguar"
    },
    "landmark": {
      "name": "Jesuit Missions of La Santísima Trinidad de Paraná and Jesús de Tavarangue",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jesuit_Missions_of_La_Sant%C3%ADsima_Trinidad_de_Paran%C3%A1_and_Jes%C3%BAs_de_Tavarangue"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "gy": {
    "iso2": "gy",
    "name": "Guyana",
    "capital": {
      "name": "Georgetown",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/GY/"
    },
    "population": {
      "value": 831087,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/gy/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 214970,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/gy/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Guyanese Creole"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "GYD",
      "name": "Guyanaese Dollar",
      "sourceUrl": "https://www.geonames.org/countries/GY/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "sr",
          "name": "Suriname"
        },
        {
          "iso2": "br",
          "name": "Brazil"
        },
        {
          "iso2": "ve",
          "name": "Venezuela"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Guyanese pepperpot",
      "sourceUrl": "https://en.wikipedia.org/wiki/Guyanese_pepperpot"
    },
    "animal": {
      "name": "Giant otter",
      "sourceUrl": "https://en.wikipedia.org/wiki/Giant_otter"
    },
    "landmark": {
      "name": "Kaieteur Falls",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kaieteur_Falls"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/GY/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "sr": {
    "iso2": "sr",
    "name": "Suriname",
    "capital": {
      "name": "Paramaribo",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/SR/"
    },
    "population": {
      "value": 634431,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/sr/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 163820,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/sr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Dutch",
      "Sranan Tongo",
      "Sarnami Hindustani"
    ],
    "hello": {
      "language": "Dutch",
      "text": "Goedendag",
      "pronunciation": "KHOO-den-dakh",
      "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
    },
    "currency": {
      "code": "SRD",
      "name": "Surinamese Dollar",
      "sourceUrl": "https://www.geonames.org/countries/SR/"
    },
    "continent": "South America",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "gy",
          "name": "Guyana"
        },
        {
          "iso2": "br",
          "name": "Brazil"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pom (dish)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pom_(dish)"
    },
    "animal": {
      "name": "Jaguar",
      "sourceUrl": "https://en.wikipedia.org/wiki/Jaguar"
    },
    "landmark": {
      "name": "Saint Peter and Paul Cathedral, Paramaribo",
      "sourceUrl": "https://en.wikipedia.org/wiki/Saint_Peter_and_Paul_Cathedral%2C_Paramaribo"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/SR/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "au": {
    "iso2": "au",
    "name": "Australia",
    "capital": {
      "name": "Canberra",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/AU/"
    },
    "population": {
      "value": 27194286,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/au/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 7741220,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/au/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English"
    ],
    "hello": {
      "language": "English",
      "text": "Hello",
      "pronunciation": "heh-LOH",
      "sourceUrl": "https://en.wiktionary.org/wiki/hello"
    },
    "currency": {
      "code": "AUD",
      "name": "Australian Dollar",
      "sourceUrl": "https://www.geonames.org/countries/AU/"
    },
    "continent": "Oceania",
    "neighbours": {
      "kind": "none",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Lamington",
      "sourceUrl": "https://en.wikipedia.org/wiki/Lamington"
    },
    "animal": {
      "name": "Koala",
      "sourceUrl": "https://en.wikipedia.org/wiki/Koala"
    },
    "landmark": {
      "name": "Sydney Opera House",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sydney_Opera_House"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/AU/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "nz": {
    "iso2": "nz",
    "name": "New Zealand",
    "capital": {
      "name": "Wellington",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/NZ/"
    },
    "population": {
      "value": 5290000,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/nz/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 267710,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/nz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "English",
      "Māori",
      "New Zealand Sign Language"
    ],
    "hello": {
      "language": "Māori",
      "text": "Kia ora",
      "pronunciation": "kee-ah OH-rah",
      "sourceUrl": "https://en.wiktionary.org/wiki/kia%20ora"
    },
    "currency": {
      "code": "NZD",
      "name": "New Zealand Dollar",
      "sourceUrl": "https://www.geonames.org/countries/NZ/"
    },
    "continent": "Oceania",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Pavlova (dessert)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Pavlova_(dessert)"
    },
    "animal": {
      "name": "Kiwi (bird)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kiwi_(bird)"
    },
    "landmark": {
      "name": "Sky Tower (Auckland)",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sky_Tower_(Auckland)"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/NZ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "pg": {
    "iso2": "pg",
    "name": "Papua New Guinea",
    "capital": {
      "name": "Port Moresby",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/PG/"
    },
    "population": {
      "value": 10576502,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/pg/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 462840,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/pg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Tok Pisin",
      "English",
      "Hiri Motu"
    ],
    "hello": {
      "language": "Tok Pisin",
      "text": "Gude",
      "pronunciation": "goo-DEH",
      "sourceUrl": "https://en.wiktionary.org/wiki/gude"
    },
    "currency": {
      "code": "PGK",
      "name": "Papua New Guinean Kina",
      "sourceUrl": "https://www.geonames.org/countries/PG/"
    },
    "continent": "Oceania",
    "neighbours": {
      "kind": "land",
      "countries": [
        {
          "iso2": "id",
          "name": "Indonesia"
        }
      ],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Mumu",
      "sourceUrl": "https://en.wikipedia.org/wiki/Papua_New_Guinean_cuisine"
    },
    "animal": {
      "name": "Raggiana bird-of-paradise",
      "sourceUrl": "https://en.wikipedia.org/wiki/Raggiana_bird-of-paradise"
    },
    "landmark": {
      "name": "Kokoda Track",
      "sourceUrl": "https://en.wikipedia.org/wiki/Kokoda_Track"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/PG/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  },
  "fj": {
    "iso2": "fj",
    "name": "Fiji",
    "capital": {
      "name": "Suva",
      "role": "capital",
      "sourceUrl": "https://www.geonames.org/countries/FJ/"
    },
    "population": {
      "value": 928784,
      "year": 2024,
      "unit": "people",
      "basis": "World Bank WDI population estimate",
      "sourceUrl": "https://api.worldbank.org/v2/country/fj/indicator/SP.POP.TOTL?date=2024&format=json"
    },
    "areaKm2": {
      "value": 18270,
      "year": 2023,
      "unit": "km2",
      "basis": "World Bank WDI surface area; includes inland water",
      "sourceUrl": "https://api.worldbank.org/v2/country/fj/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
    },
    "languages": [
      "Fijian",
      "English",
      "Fiji Hindi"
    ],
    "hello": {
      "language": "Fijian",
      "text": "Bula",
      "pronunciation": "MBOO-lah",
      "sourceUrl": "https://en.wiktionary.org/wiki/bula"
    },
    "currency": {
      "code": "FJD",
      "name": "Fijian Dollar",
      "sourceUrl": "https://www.geonames.org/countries/FJ/"
    },
    "continent": "Oceania",
    "neighbours": {
      "kind": "island",
      "countries": [],
      "sourceUrl": "https://download.geonames.org/export/dump/countryInfo.txt"
    },
    "food": {
      "name": "Kokoda",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fijian_cuisine"
    },
    "animal": {
      "name": "Fiji crested iguana",
      "sourceUrl": "https://en.wikipedia.org/wiki/Fiji_crested_iguana"
    },
    "landmark": {
      "name": "Sri Siva Subramaniya temple",
      "sourceUrl": "https://en.wikipedia.org/wiki/Sri_Siva_Subramaniya_temple"
    },
    "sources": {
      "languages": "https://www.geonames.org/countries/FJ/",
      "continent": "src/lib/world-quiz/countries.ts"
    },
    "reviewedOn": "2026-10-21"
  }
};
