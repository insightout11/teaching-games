import { greatCirclePoint, overflightAt, type LatLng } from '@/lib/live-room/route-terrain';
import { bearingDeg } from '@/lib/live-room/sun';
import { citiesAround, countryAt, featureNear, featureText, type CountryShape } from '@/lib/live-room/places-below';

/**
 * "Today's route": what the class will pass on the way, worked out with the same lookups as the "Below us" line,
 * so the preview only names what the windscreen will really show. Each stop has the minute it comes up.
 */
export interface RouteStop {
  /** Minutes after take-off. */
  at: number;
  text: string;
  /** A border crossing: always kept when the list is trimmed. */
  crossing?: boolean;
}

const SAMPLES = 48;
const MAX_STOPS = 6;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function routePreview(
  origin: LatLng & { city: string },
  destination: LatLng & { city: string },
  countries: CountryShape[] | null,
  flightMinutes: number,
): RouteStop[] {
  const stops: RouteStop[] = [];
  const seen = new Set<string>([`city:${origin.city}`, `city:${destination.city}`]);
  const add = (key: string, t: number, text: string, crossing = false) => {
    if (seen.has(key)) return;
    seen.add(key);
    stops.push({ at: Math.max(1, Math.round(t * flightMinutes)), text, ...(crossing ? { crossing } : {}) });
  };
  // Big cities a little further off, used only when a route has little else to name (short flights over farmland).
  const near: Array<{ t: number; name: string }> = [];
  let lastCountry = countries ? countryAt(countries, origin) : null;
  // Skip the first and last few samples: the take-off and the landing are their own moments.
  for (let i = 2; i < SAMPLES - 2; i++) {
    const t = i / SAMPLES;
    const p = greatCirclePoint(origin, destination, t);
    const below = overflightAt(origin, destination, t);
    const country = countries ? countryAt(countries, p) : null;
    if (country && lastCountry && country !== lastCountry) add(`country:${country}`, t, `Cross into ${country}`, true);
    if (country) lastCountry = country; // null over the sea, so reaching a coast later is not "crossing" anything
    const feature = featureNear(p);
    if (feature) { add(`feature:${feature.name}`, t, cap(featureText(feature))); continue; }
    const heading = bearingDeg(p, greatCirclePoint(origin, destination, Math.min(1, t + 0.01)));
    const city = citiesAround(p, heading, 80)[0];
    if (city && city.km < 25) { add(`city:${city.name}`, t, `Over ${city.name}`); continue; }
    if (city && !near.some((n) => n.name === city.name)) near.push({ t, name: city.name });
    if (below.name && below.terrain !== 'farmland') add(`area:${below.name}`, t, `Over ${below.name}`);
  }
  if (stops.length < 3) {
    for (const n of near) add(`city:${n.name}`, n.t, `Pass near ${n.name}`);
    stops.sort((a, b) => a.at - b.at);
  }
  // Keep every border crossing, then fill with the rest, spread along the route.
  let kept = stops;
  if (stops.length > MAX_STOPS) {
    const crossings = stops.filter((s) => s.crossing).slice(0, MAX_STOPS);
    const others = stops.filter((s) => !s.crossing);
    const room = MAX_STOPS - crossings.length;
    const picked = room > 0 ? Array.from({ length: room }, (_, k) => others[Math.floor((k * others.length) / room)]) : [];
    kept = [...crossings, ...picked].sort((a, b) => a.at - b.at);
  }
  return [...kept, { at: Math.round(flightMinutes), text: `Land in ${destination.city}` }];
}
