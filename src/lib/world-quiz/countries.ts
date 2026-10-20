/**
 * World Quiz countries (Oct 2026): the well-known countries, with their ISO code (for the flag), their continent (so
 * the wrong choices come from nearby) and how well known they are (1: most classes know it, 3: harder). Disputed areas
 * and territories are left out on purpose: a kids' class is not the place for border politics.
 * `map` is the name in src/data/world/countries-110m.json when it differs.
 */

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';
export interface QuizCountry { name: string; iso2: string; continent: Continent; level: 1 | 2 | 3; map?: string }

const C = (name: string, iso2: string, continent: Continent, level: 1 | 2 | 3, map?: string): QuizCountry => ({ name, iso2, continent, level, ...(map ? { map } : {}) });

export const QUIZ_COUNTRIES: QuizCountry[] = [
  // Africa
  C('Egypt', 'eg', 'Africa', 1), C('South Africa', 'za', 'Africa', 1), C('Kenya', 'ke', 'Africa', 1), C('Nigeria', 'ng', 'Africa', 1), C('Morocco', 'ma', 'Africa', 1),
  C('Ethiopia', 'et', 'Africa', 2), C('Ghana', 'gh', 'Africa', 2), C('Tanzania', 'tz', 'Africa', 2), C('Algeria', 'dz', 'Africa', 2), C('Madagascar', 'mg', 'Africa', 2),
  C('Tunisia', 'tn', 'Africa', 2), C('Senegal', 'sn', 'Africa', 2), C('Cameroon', 'cm', 'Africa', 2), C('Uganda', 'ug', 'Africa', 2), C('Libya', 'ly', 'Africa', 2),
  C('Somalia', 'so', 'Africa', 3), C('Sudan', 'sd', 'Africa', 3), C('Chad', 'td', 'Africa', 3), C('Mali', 'ml', 'Africa', 3), C('Niger', 'ne', 'Africa', 3),
  C('Angola', 'ao', 'Africa', 3), C('Zambia', 'zm', 'Africa', 3), C('Zimbabwe', 'zw', 'Africa', 3), C('Mozambique', 'mz', 'Africa', 3), C('Botswana', 'bw', 'Africa', 3),
  C('Namibia', 'na', 'Africa', 3), C('Rwanda', 'rw', 'Africa', 3), C('Ivory Coast', 'ci', 'Africa', 3, "Côte d'Ivoire"), C('DR Congo', 'cd', 'Africa', 3, 'Dem. Rep. Congo'), C('Mauritania', 'mr', 'Africa', 3),
  // Asia
  C('Japan', 'jp', 'Asia', 1), C('China', 'cn', 'Asia', 1), C('India', 'in', 'Asia', 1), C('Thailand', 'th', 'Asia', 1), C('South Korea', 'kr', 'Asia', 1),
  C('Vietnam', 'vn', 'Asia', 1), C('Indonesia', 'id', 'Asia', 1), C('Philippines', 'ph', 'Asia', 1), C('Malaysia', 'my', 'Asia', 1), C('Turkey', 'tr', 'Asia', 1),
  C('Saudi Arabia', 'sa', 'Asia', 2), C('United Arab Emirates', 'ae', 'Asia', 2), C('Pakistan', 'pk', 'Asia', 2), C('Bangladesh', 'bd', 'Asia', 2), C('Nepal', 'np', 'Asia', 2),
  C('Sri Lanka', 'lk', 'Asia', 2), C('Mongolia', 'mn', 'Asia', 2), C('Cambodia', 'kh', 'Asia', 2), C('Laos', 'la', 'Asia', 2), C('Myanmar', 'mm', 'Asia', 2),
  C('Iran', 'ir', 'Asia', 2), C('Iraq', 'iq', 'Asia', 3), C('Israel', 'il', 'Asia', 3), C('Jordan', 'jo', 'Asia', 3), C('Qatar', 'qa', 'Asia', 3),
  C('Kuwait', 'kw', 'Asia', 3), C('Oman', 'om', 'Asia', 3), C('Kazakhstan', 'kz', 'Asia', 2), C('Uzbekistan', 'uz', 'Asia', 3), C('Afghanistan', 'af', 'Asia', 3),
  C('Bhutan', 'bt', 'Asia', 3), C('Brunei', 'bn', 'Asia', 3), C('Lebanon', 'lb', 'Asia', 3), C('Georgia', 'ge', 'Asia', 3), C('Armenia', 'am', 'Asia', 3),
  // Europe
  C('France', 'fr', 'Europe', 1), C('Germany', 'de', 'Europe', 1), C('Italy', 'it', 'Europe', 1), C('Spain', 'es', 'Europe', 1), C('United Kingdom', 'gb', 'Europe', 1),
  C('Russia', 'ru', 'Europe', 1), C('Greece', 'gr', 'Europe', 1), C('Portugal', 'pt', 'Europe', 1), C('Netherlands', 'nl', 'Europe', 1), C('Switzerland', 'ch', 'Europe', 1),
  C('Sweden', 'se', 'Europe', 2), C('Norway', 'no', 'Europe', 2), C('Finland', 'fi', 'Europe', 2), C('Denmark', 'dk', 'Europe', 2), C('Ireland', 'ie', 'Europe', 2),
  C('Poland', 'pl', 'Europe', 2), C('Austria', 'at', 'Europe', 2), C('Belgium', 'be', 'Europe', 2), C('Ukraine', 'ua', 'Europe', 2), C('Iceland', 'is', 'Europe', 2),
  C('Czechia', 'cz', 'Europe', 2), C('Hungary', 'hu', 'Europe', 3), C('Romania', 'ro', 'Europe', 3), C('Bulgaria', 'bg', 'Europe', 3), C('Croatia', 'hr', 'Europe', 2),
  C('Serbia', 'rs', 'Europe', 3), C('Slovakia', 'sk', 'Europe', 3), C('Slovenia', 'si', 'Europe', 3), C('Lithuania', 'lt', 'Europe', 3), C('Latvia', 'lv', 'Europe', 3),
  C('Estonia', 'ee', 'Europe', 3), C('Albania', 'al', 'Europe', 3), C('Belarus', 'by', 'Europe', 3), C('Luxembourg', 'lu', 'Europe', 3), C('Cyprus', 'cy', 'Europe', 3),
  // North America
  C('United States', 'us', 'North America', 1, 'United States of America'), C('Canada', 'ca', 'North America', 1), C('Mexico', 'mx', 'North America', 1),
  C('Cuba', 'cu', 'North America', 2), C('Jamaica', 'jm', 'North America', 2), C('Costa Rica', 'cr', 'North America', 2), C('Panama', 'pa', 'North America', 2),
  C('Guatemala', 'gt', 'North America', 3), C('Honduras', 'hn', 'North America', 3), C('Nicaragua', 'ni', 'North America', 3), C('El Salvador', 'sv', 'North America', 3),
  C('Haiti', 'ht', 'North America', 3), C('Dominican Republic', 'do', 'North America', 3, 'Dominican Rep.'), C('Bahamas', 'bs', 'North America', 3), C('Belize', 'bz', 'North America', 3),
  // South America
  C('Brazil', 'br', 'South America', 1), C('Argentina', 'ar', 'South America', 1), C('Chile', 'cl', 'South America', 2), C('Peru', 'pe', 'South America', 2),
  C('Colombia', 'co', 'South America', 2), C('Venezuela', 've', 'South America', 2), C('Ecuador', 'ec', 'South America', 3), C('Bolivia', 'bo', 'South America', 3),
  C('Uruguay', 'uy', 'South America', 3), C('Paraguay', 'py', 'South America', 3), C('Guyana', 'gy', 'South America', 3), C('Suriname', 'sr', 'South America', 3),
  // Oceania
  C('Australia', 'au', 'Oceania', 1), C('New Zealand', 'nz', 'Oceania', 1), C('Papua New Guinea', 'pg', 'Oceania', 3), C('Fiji', 'fj', 'Oceania', 3),
];

/** A free public-domain flag picture (flagcdn: national flags are public domain). */
export const flagUrl = (c: QuizCountry, width = 640) => `https://flagcdn.com/w${width}/${c.iso2}.png`;

/** Countries for a quiz at this level: easier classes get the well-known ones. */
export function countriesFor(level: 1 | 2 | 3): QuizCountry[] {
  return QUIZ_COUNTRIES.filter((c) => c.level <= level);
}
