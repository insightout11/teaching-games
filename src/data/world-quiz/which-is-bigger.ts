/** Static teaching data; source URLs are provenance, never runtime downloads. */
export const WHICH_IS_BIGGER = [
  {
    "id": "bigger-dz-fr",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "dz",
      "name": "Algeria",
      "number": {
        "value": 2381740,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/dz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "fr",
      "name": "France",
      "number": {
        "value": 606410,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/fr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "dz",
    "difficulty": "easy",
    "whySurprising": "Algeria spans a large part of the Sahara, beyond its Mediterranean coast."
  },
  {
    "id": "bigger-kz-sa",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "kz",
      "name": "Kazakhstan",
      "number": {
        "value": 2724902,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/kz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "sa",
      "name": "Saudi Arabia",
      "number": {
        "value": 2149690,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/sa/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "kz",
    "difficulty": "surprising",
    "whySurprising": "Kazakhstan's broad steppe can be easy to underestimate beside the Arabian Peninsula."
  },
  {
    "id": "bigger-cd-mx",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "cd",
      "name": "DR Congo",
      "number": {
        "value": 2345410,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/cd/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "mx",
      "name": "Mexico",
      "number": {
        "value": 1957193.9,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/mx/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "cd",
    "difficulty": "surprising",
    "whySurprising": "DR Congo stretches across a vast part of central Africa."
  },
  {
    "id": "bigger-ir-mn",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ir",
      "name": "Iran",
      "number": {
        "value": 1745150,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ir/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "mn",
      "name": "Mongolia",
      "number": {
        "value": 1564115.75,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/mn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ir",
    "difficulty": "surprising",
    "whySurprising": "Iran and Mongolia have closer surface areas than their different shapes suggest."
  },
  {
    "id": "bigger-pe-za",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "pe",
      "name": "Peru",
      "number": {
        "value": 1285215.6,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/pe/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "za",
      "name": "South Africa",
      "number": {
        "value": 1219090,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/za/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "pe",
    "difficulty": "surprising",
    "whySurprising": "Peru combines Pacific coast, Andes and Amazon land in one long country."
  },
  {
    "id": "bigger-co-td",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "td",
      "name": "Chad",
      "number": {
        "value": 1284000,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/td/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "co",
      "name": "Colombia",
      "number": {
        "value": 1140619.1,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/co/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "td",
    "difficulty": "surprising",
    "whySurprising": "Chad reaches far into the Sahara, despite having no coast."
  },
  {
    "id": "bigger-ao-eg",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ao",
      "name": "Angola",
      "number": {
        "value": 1246700,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ao/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "eg",
      "name": "Egypt",
      "number": {
        "value": 1001450,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/eg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ao",
    "difficulty": "surprising",
    "whySurprising": "Angola's wide inland territory can be overlooked beside Egypt's familiar outline."
  },
  {
    "id": "bigger-ml-ve",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ml",
      "name": "Mali",
      "number": {
        "value": 1240190,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ml/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ve",
      "name": "Venezuela",
      "number": {
        "value": 912050,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ve/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ml",
    "difficulty": "surprising",
    "whySurprising": "Mali extends from the Sahel far into the Sahara."
  },
  {
    "id": "bigger-ne-pk",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ne",
      "name": "Niger",
      "number": {
        "value": 1267000,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ne/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "pk",
      "name": "Pakistan",
      "number": {
        "value": 796100,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/pk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ne",
    "difficulty": "surprising",
    "whySurprising": "Niger's large desert north takes up much of its surface area."
  },
  {
    "id": "bigger-na-tr",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "na",
      "name": "Namibia",
      "number": {
        "value": 824292,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/na/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "tr",
      "name": "Turkey",
      "number": {
        "value": 785350,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/tr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "na",
    "difficulty": "surprising",
    "whySurprising": "Namibia's long Atlantic coast belongs to a broad inland country."
  },
  {
    "id": "bigger-jp-mz",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "mz",
      "name": "Mozambique",
      "number": {
        "value": 799380,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/mz/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "jp",
      "name": "Japan",
      "number": {
        "value": 377969.3,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/jp/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "mz",
    "difficulty": "easy",
    "whySurprising": "A long coastline can hide how much land Mozambique covers."
  },
  {
    "id": "bigger-th-zm",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "zm",
      "name": "Zambia",
      "number": {
        "value": 752612,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/zm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "th",
      "name": "Thailand",
      "number": {
        "value": 513115.021,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/th/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "zm",
    "difficulty": "surprising",
    "whySurprising": "Landlocked Zambia covers more space than a narrow map shape might suggest."
  },
  {
    "id": "bigger-mm-ua",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "mm",
      "name": "Myanmar",
      "number": {
        "value": 676577.738,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/mm/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ua",
      "name": "Ukraine",
      "number": {
        "value": 603550,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ua/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "mm",
    "difficulty": "surprising",
    "whySurprising": "Myanmar's long north-south shape encloses a large surface area."
  },
  {
    "id": "bigger-es-mg",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "mg",
      "name": "Madagascar",
      "number": {
        "value": 587295,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/mg/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "es",
      "name": "Spain",
      "number": {
        "value": 505975.98,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/es/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "mg",
    "difficulty": "surprising",
    "whySurprising": "Madagascar is a single island with a surprisingly large surface area."
  },
  {
    "id": "bigger-de-ke",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ke",
      "name": "Kenya",
      "number": {
        "value": 591969,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ke/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "de",
      "name": "Germany",
      "number": {
        "value": 357680,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/de/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ke",
    "difficulty": "surprising",
    "whySurprising": "Germany's large population does not tell us which country covers more space."
  },
  {
    "id": "bigger-bw-vn",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "bw",
      "name": "Botswana",
      "number": {
        "value": 581730,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/bw/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "vn",
      "name": "Vietnam",
      "number": {
        "value": 331338.31,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/vn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "bw",
    "difficulty": "surprising",
    "whySurprising": "Botswana's broad shape contrasts with Vietnam's long, narrow outline."
  },
  {
    "id": "bigger-gb-ug",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "gb",
      "name": "United Kingdom",
      "number": {
        "value": 243610,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/gb/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ug",
      "name": "Uganda",
      "number": {
        "value": 241551,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ug/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "gb",
    "difficulty": "surprising",
    "whySurprising": "The two countries have unusually close reported surface areas."
  },
  {
    "id": "bigger-la-ro",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ro",
      "name": "Romania",
      "number": {
        "value": 238400,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ro/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "la",
      "name": "Laos",
      "number": {
        "value": 236800,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/la/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ro",
    "difficulty": "surprising",
    "whySurprising": "Romania and Laos are far apart but close in reported surface area."
  },
  {
    "id": "bigger-gh-sn",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "gh",
      "name": "Ghana",
      "number": {
        "value": 238539,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/gh/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "sn",
      "name": "Senegal",
      "number": {
        "value": 196710,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/sn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "gh",
    "difficulty": "surprising",
    "whySurprising": "Two familiar West African countries can differ greatly in the space they cover."
  },
  {
    "id": "bigger-kh-uy",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "kh",
      "name": "Cambodia",
      "number": {
        "value": 181035,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/kh/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "uy",
      "name": "Uruguay",
      "number": {
        "value": 176220,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/uy/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "kh",
    "difficulty": "surprising",
    "whySurprising": "Cambodia and Uruguay have similar surface areas on different continents."
  },
  {
    "id": "bigger-sr-tn",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "sr",
      "name": "Suriname",
      "number": {
        "value": 163820,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/sr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "tn",
      "name": "Tunisia",
      "number": {
        "value": 163610,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/tn/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "sr",
    "difficulty": "surprising",
    "whySurprising": "Suriname and Tunisia have almost the same reported surface area."
  },
  {
    "id": "bigger-gr-np",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "np",
      "name": "Nepal",
      "number": {
        "value": 147181,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/np/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "gr",
      "name": "Greece",
      "number": {
        "value": 131960,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/gr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "np",
    "difficulty": "surprising",
    "whySurprising": "Mountainous Nepal's surface area is not obvious from its narrow outline."
  },
  {
    "id": "bigger-bd-pt",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "bd",
      "name": "Bangladesh",
      "number": {
        "value": 147570,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/bd/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "pt",
      "name": "Portugal",
      "number": {
        "value": 92230,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/pt/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "bd",
    "difficulty": "surprising",
    "whySurprising": "Bangladesh's dense population does not make it a tiny country in area."
  },
  {
    "id": "bigger-cu-kr",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "cu",
      "name": "Cuba",
      "number": {
        "value": 109880,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/cu/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "kr",
      "name": "South Korea",
      "number": {
        "value": 100450,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/kr/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "cu",
    "difficulty": "surprising",
    "whySurprising": "Cuba's long island outline covers a surface area comparable to South Korea."
  },
  {
    "id": "bigger-ae-at",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "at",
      "name": "Austria",
      "number": {
        "value": 83879,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/at/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ae",
      "name": "United Arab Emirates",
      "number": {
        "value": 98647.9,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ae/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ae",
    "difficulty": "surprising",
    "whySurprising": "Austria's mountains and the Emirates' desert make a useful close-area comparison."
  },
  {
    "id": "bigger-ie-lk",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "lk",
      "name": "Sri Lanka",
      "number": {
        "value": 65610,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/lk/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ie",
      "name": "Ireland",
      "number": {
        "value": 70280,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ie/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ie",
    "difficulty": "surprising",
    "whySurprising": "These two islands have comparable areas despite lying far apart."
  },
  {
    "id": "bigger-ch-nl",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "nl",
      "name": "Netherlands",
      "number": {
        "value": 41540,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/nl/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ch",
      "name": "Switzerland",
      "number": {
        "value": 41290.7,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ch/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "nl",
    "difficulty": "surprising",
    "whySurprising": "Flat Netherlands and mountainous Switzerland have very similar surface areas."
  },
  {
    "id": "bigger-am-be",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "be",
      "name": "Belgium",
      "number": {
        "value": 30689,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/be/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "am",
      "name": "Armenia",
      "number": {
        "value": 29740,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/am/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "be",
    "difficulty": "surprising",
    "whySurprising": "Belgium and Armenia have close areas, despite very different landscapes."
  },
  {
    "id": "bigger-ca-us",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "ca",
      "name": "Canada",
      "number": {
        "value": 15634410,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ca/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "us",
      "name": "United States",
      "number": {
        "value": 9831510,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/us/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "ca",
    "difficulty": "easy",
    "whySurprising": "Including inland water matters when comparing these two vast neighbours."
  },
  {
    "id": "bigger-ar-br",
    "metric": "areaKm2",
    "prompt": "Which country has the larger surface area?",
    "left": {
      "iso2": "br",
      "name": "Brazil",
      "number": {
        "value": 8510420,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/br/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "right": {
      "iso2": "ar",
      "name": "Argentina",
      "number": {
        "value": 2780400,
        "year": 2023,
        "unit": "km2",
        "basis": "World Bank WDI surface area; includes inland water",
        "sourceUrl": "https://api.worldbank.org/v2/country/ar/indicator/AG.SRF.TOTL.K2?date=2023&format=json"
      }
    },
    "correctIso2": "br",
    "difficulty": "easy",
    "whySurprising": "Brazil and Argentina are both large, but South America's largest country stands out."
  },
  {
    "id": "bigger-cn-in",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "in",
      "name": "India",
      "number": {
        "value": 1450935791,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/in/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "cn",
      "name": "China",
      "number": {
        "value": 1408975000,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/cn/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "in",
    "difficulty": "easy",
    "whySurprising": "These two very large populations can be compared using the same reference year."
  },
  {
    "id": "bigger-ng-ru",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ng",
      "name": "Nigeria",
      "number": {
        "value": 232679478,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ng/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ru",
      "name": "Russia",
      "number": {
        "value": 143669648,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ru/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ng",
    "difficulty": "surprising",
    "whySurprising": "Russia's huge land area does not mean it has the larger population."
  },
  {
    "id": "bigger-bd-ru",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "bd",
      "name": "Bangladesh",
      "number": {
        "value": 173562364,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/bd/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ru",
      "name": "Russia",
      "number": {
        "value": 143669648,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ru/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "bd",
    "difficulty": "surprising",
    "whySurprising": "Bangladesh fits many people into far less land than Russia."
  },
  {
    "id": "bigger-br-pk",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "pk",
      "name": "Pakistan",
      "number": {
        "value": 251269164,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/pk/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "br",
      "name": "Brazil",
      "number": {
        "value": 211998573,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/br/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "pk",
    "difficulty": "surprising",
    "whySurprising": "Brazil's very large map outline does not determine the population winner."
  },
  {
    "id": "bigger-et-jp",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "et",
      "name": "Ethiopia",
      "number": {
        "value": 132059767,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/et/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "jp",
      "name": "Japan",
      "number": {
        "value": 123975371,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/jp/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "et",
    "difficulty": "surprising",
    "whySurprising": "Ethiopia and Japan show why population facts need a year."
  },
  {
    "id": "bigger-de-ph",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ph",
      "name": "Philippines",
      "number": {
        "value": 115843670,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ph/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "de",
      "name": "Germany",
      "number": {
        "value": 83516593,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/de/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ph",
    "difficulty": "surprising",
    "whySurprising": "The Philippines' many islands together hold a very large population."
  },
  {
    "id": "bigger-tr-vn",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "vn",
      "name": "Vietnam",
      "number": {
        "value": 100987686,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/vn/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "tr",
      "name": "Turkey",
      "number": {
        "value": 85518661,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/tr/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "vn",
    "difficulty": "surprising",
    "whySurprising": "Vietnam's narrow outline does not make its population small."
  },
  {
    "id": "bigger-cd-fr",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "cd",
      "name": "DR Congo",
      "number": {
        "value": 109276265,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/cd/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "fr",
      "name": "France",
      "number": {
        "value": 68551653,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/fr/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "cd",
    "difficulty": "surprising",
    "whySurprising": "A country's media visibility is not a measure of its population."
  },
  {
    "id": "bigger-it-tz",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "tz",
      "name": "Tanzania",
      "number": {
        "value": 68560157,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/tz/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "it",
      "name": "Italy",
      "number": {
        "value": 58952704,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/it/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "tz",
    "difficulty": "surprising",
    "whySurprising": "Tanzania and Italy make a close comparison across two continents."
  },
  {
    "id": "bigger-es-ke",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ke",
      "name": "Kenya",
      "number": {
        "value": 56432944,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ke/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "es",
      "name": "Spain",
      "number": {
        "value": 48848840,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/es/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ke",
    "difficulty": "surprising",
    "whySurprising": "Kenya's population can surprise someone who knows Spain's cities better."
  },
  {
    "id": "bigger-ca-ug",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ug",
      "name": "Uganda",
      "number": {
        "value": 50015092,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ug/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ca",
      "name": "Canada",
      "number": {
        "value": 41262329,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ca/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ug",
    "difficulty": "surprising",
    "whySurprising": "Canada covers vastly more land, but that does not decide this population comparison."
  },
  {
    "id": "bigger-au-sd",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "sd",
      "name": "Sudan",
      "number": {
        "value": 50448963,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/sd/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "au",
      "name": "Australia",
      "number": {
        "value": 27194286,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/au/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "sd",
    "difficulty": "surprising",
    "whySurprising": "Australia's continent-sized outline does not predict this population result."
  },
  {
    "id": "bigger-gh-nl",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "gh",
      "name": "Ghana",
      "number": {
        "value": 34427414,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/gh/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "nl",
      "name": "Netherlands",
      "number": {
        "value": 17993485,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/nl/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "gh",
    "difficulty": "surprising",
    "whySurprising": "A familiar European city skyline is not a clue to a country's total population."
  },
  {
    "id": "bigger-au-np",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "np",
      "name": "Nepal",
      "number": {
        "value": 29651054,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/np/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "au",
      "name": "Australia",
      "number": {
        "value": 27194286,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/au/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "np",
    "difficulty": "surprising",
    "whySurprising": "Mountainous Nepal and much larger Australia have comparable population totals."
  },
  {
    "id": "bigger-my-pl",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "my",
      "name": "Malaysia",
      "number": {
        "value": 35557673,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/my/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "pl",
      "name": "Poland",
      "number": {
        "value": 36559233,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/pl/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "pl",
    "difficulty": "surprising",
    "whySurprising": "Malaysia and Poland have close populations despite very different locations."
  },
  {
    "id": "bigger-lk-ro",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "lk",
      "name": "Sri Lanka",
      "number": {
        "value": 21916000,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/lk/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ro",
      "name": "Romania",
      "number": {
        "value": 19051804,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ro/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "lk",
    "difficulty": "surprising",
    "whySurprising": "An island in South Asia and a European country have comparable population totals."
  },
  {
    "id": "bigger-be-rw",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "rw",
      "name": "Rwanda",
      "number": {
        "value": 14256567,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/rw/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "be",
      "name": "Belgium",
      "number": {
        "value": 11858610,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/be/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "rw",
    "difficulty": "surprising",
    "whySurprising": "Two relatively small countries can still hold many millions of people."
  },
  {
    "id": "bigger-gr-ne",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ne",
      "name": "Niger",
      "number": {
        "value": 27032412,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ne/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "gr",
      "name": "Greece",
      "number": {
        "value": 10405134,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/gr/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ne",
    "difficulty": "surprising",
    "whySurprising": "A large desert region does not mean a country has few people overall."
  },
  {
    "id": "bigger-gr-zm",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "zm",
      "name": "Zambia",
      "number": {
        "value": 21314956,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/zm/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "gr",
      "name": "Greece",
      "number": {
        "value": 10405134,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/gr/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "zm",
    "difficulty": "surprising",
    "whySurprising": "Zambia and Greece show how a famous travel destination can mislead a population guess."
  },
  {
    "id": "bigger-kh-nl",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "kh",
      "name": "Cambodia",
      "number": {
        "value": 17638801,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/kh/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "nl",
      "name": "Netherlands",
      "number": {
        "value": 17993485,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/nl/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "nl",
    "difficulty": "surprising",
    "whySurprising": "The two population estimates are close even though their landscapes differ."
  },
  {
    "id": "bigger-se-sn",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "sn",
      "name": "Senegal",
      "number": {
        "value": 18501984,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/sn/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "se",
      "name": "Sweden",
      "number": {
        "value": 10569709,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/se/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "sn",
    "difficulty": "surprising",
    "whySurprising": "A country's place far north on a map is not a population clue."
  },
  {
    "id": "bigger-ie-so",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "so",
      "name": "Somalia",
      "number": {
        "value": 19009151,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/so/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ie",
      "name": "Ireland",
      "number": {
        "value": 5395790,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ie/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "so",
    "difficulty": "surprising",
    "whySurprising": "Ireland's familiar place in English lessons does not make it more populous."
  },
  {
    "id": "bigger-ml-pt",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ml",
      "name": "Mali",
      "number": {
        "value": 24478595,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ml/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "pt",
      "name": "Portugal",
      "number": {
        "value": 10694681,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/pt/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ml",
    "difficulty": "surprising",
    "whySurprising": "The Sahel and Atlantic Europe make a population comparison that can challenge a guess."
  },
  {
    "id": "bigger-fi-td",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "td",
      "name": "Chad",
      "number": {
        "value": 20299123,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/td/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "fi",
      "name": "Finland",
      "number": {
        "value": 5619911,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/fi/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "td",
    "difficulty": "surprising",
    "whySurprising": "A cold climate and a hot climate tell us little about the total number of people."
  },
  {
    "id": "bigger-ao-ca",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "ao",
      "name": "Angola",
      "number": {
        "value": 37885849,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ao/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ca",
      "name": "Canada",
      "number": {
        "value": 41262329,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ca/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ca",
    "difficulty": "surprising",
    "whySurprising": "These populations are closer than their very different land areas suggest."
  },
  {
    "id": "bigger-mz-sa",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "mz",
      "name": "Mozambique",
      "number": {
        "value": 34631766,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/mz/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "sa",
      "name": "Saudi Arabia",
      "number": {
        "value": 35300280,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/sa/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "sa",
    "difficulty": "surprising",
    "whySurprising": "Two long coastlines belong to countries with fairly close population estimates."
  },
  {
    "id": "bigger-af-ar",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "af",
      "name": "Afghanistan",
      "number": {
        "value": 42647492,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/af/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ar",
      "name": "Argentina",
      "number": {
        "value": 45696159,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ar/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ar",
    "difficulty": "surprising",
    "whySurprising": "These two population estimates are close despite their distant locations."
  },
  {
    "id": "bigger-es-iq",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "iq",
      "name": "Iraq",
      "number": {
        "value": 46042015,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/iq/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "es",
      "name": "Spain",
      "number": {
        "value": 48848840,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/es/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "es",
    "difficulty": "surprising",
    "whySurprising": "Iraq and Spain have comparable population totals in this dated snapshot."
  },
  {
    "id": "bigger-ma-uz",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "uz",
      "name": "Uzbekistan",
      "number": {
        "value": 36361859,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/uz/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "ma",
      "name": "Morocco",
      "number": {
        "value": 38081173,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/ma/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "ma",
    "difficulty": "surprising",
    "whySurprising": "Central Asia and North Africa include countries with similar population totals."
  },
  {
    "id": "bigger-nz-pg",
    "metric": "population",
    "prompt": "Which country had more people in 2024?",
    "left": {
      "iso2": "pg",
      "name": "Papua New Guinea",
      "number": {
        "value": 10576502,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/pg/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "right": {
      "iso2": "nz",
      "name": "New Zealand",
      "number": {
        "value": 5290000,
        "year": 2024,
        "unit": "people",
        "basis": "World Bank WDI population estimate",
        "sourceUrl": "https://api.worldbank.org/v2/country/nz/indicator/SP.POP.TOTL?date=2024&format=json"
      }
    },
    "correctIso2": "pg",
    "difficulty": "surprising",
    "whySurprising": "New Zealand's familiar travel images can distract from Papua New Guinea's larger population."
  }
] as const;
