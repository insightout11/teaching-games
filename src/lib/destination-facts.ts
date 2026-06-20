export interface DestinationFactSource {
  name: string;
  url: string;
}

export interface DestinationPopulationFact extends DestinationFactSource {
  label: 'City population' | 'Metro population' | 'City-state population';
  value: string;
  year: string;
}

export interface DestinationFactSheet {
  population?: DestinationPopulationFact;
  language?: string;
  currency?: string;
  timeZone?: string;
  foodCulture?: string[];
  knownFor?: string[];
  prompt?: string;
  sources?: DestinationFactSource[];
}

export const COUNTRY_LANGUAGE_HINTS: Record<string, string> = {
  Argentina: 'Spanish',
  Australia: 'English',
  Brazil: 'Portuguese',
  Canada: 'English and French',
  Chile: 'Spanish',
  China: 'Mandarin Chinese, Cantonese, and regional languages',
  Colombia: 'Spanish',
  Egypt: 'Arabic',
  Ethiopia: 'Amharic, Oromo, Tigrinya, English, and other languages',
  Fiji: 'English, Fijian, and Fiji Hindi',
  France: 'French',
  Germany: 'German',
  Iceland: 'Icelandic',
  India: 'Hindi, English, and many regional languages',
  Indonesia: 'Indonesian',
  Ireland: 'English and Irish',
  Italy: 'Italian',
  Japan: 'Japanese',
  Kazakhstan: 'Kazakh and Russian',
  Kenya: 'Swahili and English',
  Mexico: 'Spanish',
  Mongolia: 'Mongolian',
  Netherlands: 'Dutch',
  'New Zealand': 'English and Maori',
  Nigeria: 'English, Yoruba, Igbo, Hausa, and other languages',
  Panama: 'Spanish',
  Peru: 'Spanish, Quechua, Aymara, and other languages',
  Philippines: 'Filipino, English, and regional languages',
  Portugal: 'Portuguese',
  Russia: 'Russian',
  Senegal: 'French, Wolof, and other languages',
  Singapore: 'English, Malay, Mandarin, and Tamil',
  'South Africa': 'English, Afrikaans, Zulu, Xhosa, and other languages',
  'South Korea': 'Korean',
  Spain: 'Spanish',
  Thailand: 'Thai',
  Turkey: 'Turkish',
  'United Arab Emirates': 'Arabic, English, and many community languages',
  'United Kingdom': 'English',
  'United States': 'English, Spanish, and many community languages',
  Vietnam: 'Vietnamese',
};

export const DESTINATION_FACTS: Record<string, DestinationFactSheet> = {
  'rio-de-janeiro': {
    population: {
      label: 'City population',
      value: '6.77M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/brazil/rio-de-janeiro',
    },
    language: 'Portuguese',
    currency: 'Brazilian real (BRL)',
    timeZone: 'Brasilia Time (UTC-3)',
    foodCulture: ['Feijoada', 'Churrasco', 'Acai bowls', 'Beach snacks', 'Samba'],
    knownFor: ['Mountains meeting the ocean', 'Samba and Carnival', 'Tijuca Forest', 'Beach public life'],
    prompt: 'What parts of Rio feel natural, and what parts feel built by people?',
  },
  'panama-city': {
    population: {
      label: 'Metro population',
      value: '2.09M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/22063/panama-city/population',
    },
    language: 'Spanish',
    currency: 'Panamanian balboa (PAB) and U.S. dollar (USD)',
    timeZone: 'Eastern Standard Time (UTC-5)',
    foodCulture: ['Sancocho', 'Seafood', 'Plantains', 'Canal history', 'Afro-Panamanian culture'],
    knownFor: ['Panama Canal', 'Casco Viejo', 'Trade routes', 'Afro-Panamanian culture'],
    prompt: 'How can one city connect local neighborhoods with global movement?',
  },
  bangkok: {
    population: {
      label: 'City population',
      value: '5.19M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/thailand/bangkok',
    },
    language: 'Thai',
    currency: 'Thai baht (THB)',
    timeZone: 'Indochina Time (UTC+7)',
    foodCulture: ['Street food', 'Noodle dishes', 'River markets', 'Buddhist temples', 'Night markets'],
    knownFor: ['Street food', 'Chao Phraya River', 'Temples', 'Dense urban movement'],
    prompt: 'How does Bangkok mix daily routines, religion, food, and transport in one city?',
  },
  tokyo: {
    population: {
      label: 'City population',
      value: '10.32M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/japan/tokyo',
    },
    language: 'Japanese',
    currency: 'Japanese yen (JPY)',
    timeZone: 'Japan Standard Time (UTC+9)',
    foodCulture: ['Ramen', 'Sushi', 'Convenience stores', 'Public baths', 'Railway stations'],
    knownFor: ['Dense transit', 'Neighborhood routines', 'Public baths', 'Old and new streets'],
    prompt: 'What daily systems help a very large city feel organized?',
  },
  london: {
    population: {
      label: 'City population',
      value: '9.19M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/united-kingdom/london',
    },
    language: 'English',
    currency: 'Pound sterling (GBP)',
    timeZone: 'GMT / British Summer Time',
    foodCulture: ['Fish and chips', 'South Asian food', 'Markets', 'Museums', 'River history'],
    knownFor: ['River Thames', 'Global finance', 'Museums', 'Multicultural neighborhoods'],
    prompt: 'What makes London feel both historic and global?',
  },
  paris: {
    population: {
      label: 'City population',
      value: '2.06M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/france/paris',
    },
    language: 'French',
    currency: 'Euro (EUR)',
    timeZone: 'Central European Time / Summer Time',
    foodCulture: ['Bakeries', 'Cafes', 'Cheese', 'Fashion', 'Museums'],
    knownFor: ['Seine River', 'Art museums', 'Fashion', 'Historic public spaces'],
    prompt: 'How does Paris use food, design, and public space to shape its identity?',
  },
  delhi: {
    population: {
      label: 'City population',
      value: '23.39M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/india/delhi',
    },
    language: 'Hindi, English, and many regional languages',
    currency: 'Indian rupee (INR)',
    timeZone: 'India Standard Time (UTC+5:30)',
    foodCulture: ['Street food', 'Chaat', 'Markets', 'Historic layers', 'Multilingual public life'],
    knownFor: ['Markets', 'Food variety', 'Multilingual public life', 'Historic layers'],
    prompt: 'What clues show that Delhi is shaped by many regions and languages?',
  },
  'new-york': {
    population: {
      label: 'City population',
      value: '8.55M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/us-cities/new-york/new-york',
    },
    language: 'English, Spanish, and many community languages',
    currency: 'U.S. dollar (USD)',
    timeZone: 'Eastern Time',
    foodCulture: ['Pizza', 'Bagels', 'Food carts', 'Broadway', 'Immigrant neighborhoods'],
    knownFor: ['Skyscrapers', 'Subway life', 'Immigration history', 'Media and finance'],
    prompt: 'How do many communities make one city feel like several cities at once?',
  },
  cairo: {
    population: {
      label: 'Metro population',
      value: '23.54M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/22812/cairo/population',
    },
    language: 'Arabic',
    currency: 'Egyptian pound (EGP)',
    timeZone: 'Eastern European Time (UTC+2; UTC+3 during DST)',
    foodCulture: ['Koshari', 'Ful medames', 'Nile life', 'Markets', 'Ancient monuments'],
    knownFor: ['Nile River', 'Ancient monuments', 'Desert edge', 'Historic capital life'],
    prompt: 'How does the past stay visible inside a modern city?',
  },
  singapore: {
    population: {
      label: 'City-state population',
      value: '6.11M',
      year: 'June 2025',
      name: 'Singapore National Population and Talent Division',
      url: 'https://www.population.gov.sg/our-population/population-trends/overall-population/',
    },
    language: 'English, Malay, Mandarin, and Tamil',
    currency: 'Singapore dollar (SGD)',
    timeZone: 'Singapore Time (UTC+8)',
    foodCulture: ['Hawker centres', 'Chicken rice', 'Laksa', 'Multilingual classrooms', 'Port trade'],
    knownFor: ['Hawker food', 'Multilingual classrooms', 'Port trade', 'Garden city design'],
    prompt: 'How can a small city-state feel connected to many cultures at once?',
  },
  amsterdam: {
    population: {
      label: 'Metro population',
      value: '1.20M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/21930/amsterdam/population',
    },
    language: 'Dutch',
    currency: 'Euro (EUR)',
    timeZone: 'Central European Time / Summer Time',
    foodCulture: ['Cheese', 'Stroopwafels', 'Canal cafes', 'Cycling culture'],
    knownFor: ['Canals', 'Water management', 'Cycling culture', 'Historic streets'],
    prompt: 'When is water beautiful, and when is it infrastructure?',
  },
  nairobi: {
    population: {
      label: 'Metro population',
      value: '6.00M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/21711/nairobi/population',
    },
    language: 'Swahili and English',
    currency: 'Kenyan shilling (KES)',
    timeZone: 'East Africa Time (UTC+3)',
    foodCulture: ['Nyama choma', 'Tea', 'Matatu art', 'Market food'],
    knownFor: ['Matatu culture', 'Urban wildlife edge', 'Regional business', 'Visual transport language'],
    prompt: 'How can transport become part of a city culture?',
  },
  dakar: {
    population: {
      label: 'Metro population',
      value: '3.78M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/22439/dakar/population',
    },
    language: 'French, Wolof, and other languages',
    currency: 'West African CFA franc (XOF)',
    timeZone: 'Greenwich Mean Time (UTC+0)',
    foodCulture: ['Thieboudienne', 'Music', 'Markets', 'Coastal food'],
    knownFor: ['Wolof language', 'Coastal location', 'Music and media', 'West African crossroads'],
    prompt: 'How does multilingual life shape what people hear and see in a city?',
  },
  'addis-ababa': {
    population: {
      label: 'City population',
      value: '4.23M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/ethiopia/addis-ababa',
    },
    language: 'Amharic, Oromo, Tigrinya, English, and other languages',
    currency: 'Ethiopian birr (ETB)',
    timeZone: 'East Africa Time (UTC+3)',
    foodCulture: ['Injera', 'Coffee ceremony', 'Scripts and languages', 'Diplomacy'],
    knownFor: ['African Union diplomacy', 'Scripts and languages', 'Highland capital', 'Coffee culture'],
    prompt: 'How can one capital represent many languages and identities?',
  },
  miami: {
    population: {
      label: 'Metro population',
      value: '6.43M',
      year: '2026 estimate',
      name: 'Macrotrends',
      url: 'https://www.macrotrends.net/global-metrics/cities/23064/miami/population',
    },
    language: 'English, Spanish, Haitian Creole, and many community languages',
    currency: 'U.S. dollar (USD)',
    timeZone: 'Eastern Time',
    foodCulture: ['Cuban food', 'Caribbean music', 'Bilingual media', 'Coastal life'],
    knownFor: ['Caribbean and Latin American migration', 'Bilingual life', 'Coastal risk', 'Music and media'],
    prompt: 'How does migration change the sound and feel of a city?',
  },
  istanbul: {
    population: {
      label: 'City population',
      value: '15.79M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/cities/turkey/istanbul',
    },
    language: 'Turkish',
    currency: 'Turkish lira (TRY)',
    timeZone: 'Turkey Time (UTC+3)',
    foodCulture: ['Tea', 'Street simit', 'Markets', 'Historic food routes'],
    knownFor: ['Europe-Asia crossing', 'Historic peninsula', 'Earthquake readiness', 'Layered architecture'],
    prompt: 'What changes when a city is both a bridge and a risk zone?',
  },
  ulaanbaatar: {
    population: {
      label: 'Metro population',
      value: '1.68M',
      year: '2026 estimate',
      name: 'World Population Review',
      url: 'https://worldpopulationreview.com/countries/mongolia',
    },
    language: 'Mongolian',
    currency: 'Mongolian togrog (MNT)',
    timeZone: 'Ulaanbaatar Time (UTC+8)',
    foodCulture: ['Dairy foods', 'Meat dishes', 'Ger districts', 'Winter routines'],
    knownFor: ['Extreme winter systems', 'Ger districts', 'Mountain valley setting', 'Mongolian capital life'],
    prompt: 'What does a city need to keep working through a very cold winter?',
  },
};

export function getDestinationFacts(destinationId: string) {
  return DESTINATION_FACTS[destinationId] ?? null;
}

export function getLanguageHintForCountry(country: string) {
  return COUNTRY_LANGUAGE_HINTS[country] ?? 'Local and regional languages vary by community';
}
