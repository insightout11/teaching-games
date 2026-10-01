/**
 * Course lessons (and other plans) that are about a place: find the city the lesson is "set in"
 * from its own words (topic, source title, course theme), so the room can suggest flying there.
 * A city name wins over a country name; a country picks its first listed city.
 */
export interface PlanCityCandidate { id: string; city: string; country?: string }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findPlanCity<T extends PlanCityCandidate>(text: string, cities: T[]): T | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;
  const has = (name?: string) => !!name && new RegExp(`(^|[^a-z])${escape(name.toLowerCase())}([^a-z]|$)`).test(t);
  return cities.find((c) => has(c.city)) ?? cities.find((c) => has(c.country)) ?? null;
}
