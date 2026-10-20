/** Reproduce the tappable-place inventory, using the app's actual route lookups.
 * Run: pnpm exec tsx --tsconfig tsconfig.json scripts/dev/route-places.ts
 * Unordered destination pairs count once; moments are planned in BOTH directions.
 * Sample every 0.5% including endpoints. Counts are route incidence, not tap forecasts.
 */
import { writeFileSync } from 'node:fs';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { greatCirclePoint, overflightAt, withArticle } from '@/lib/live-room/route-terrain';
import { loadCountries, countryAt, featureNear, citiesAround } from '@/lib/live-room/places-below';
import { bearingDeg } from '@/lib/live-room/sun';
import { namedRegionAt } from '@/lib/live-room/land-cover';
import { planMoments } from '@/lib/live-room/moments';
import { routePreview } from '@/lib/live-room/route-preview';

export const routePlaceKey = (name: string) => name.trim().replace(/\s+/g, ' ').replace(/^the /i, '').toLowerCase().replace(/^bogota$/, 'bogotá');
interface Place { title: string; aliases: string[]; kinds: string[]; routes: number; examples: string[] }

export async function auditRoutePlaces() {
  const countries = await loadCountries();
  const cities = WORLD_DESTINATIONS.map(d => ({ city: d.city, lat: d.lat, lng: d.lng }));
  const places = new Map<string, Place>();
  let pairs = 0;
  for (let a = 0; a < cities.length; a++) for (let b = a + 1; b < cities.length; b++) {
    const origin = cities[a], destination = cities[b], seen = new Set<string>();
    const example = `${origin.city} – ${destination.city}`;
    const add = (title: string, kind: string) => {
      const key = routePlaceKey(title);
      let place = places.get(key);
      if (!place) { place = { title: title.replace(/^the /i, ''), aliases: [], kinds: [], routes: 0, examples: [] }; places.set(key, place); }
      if (!place.aliases.includes(title)) place.aliases.push(title);
      if (!place.kinds.includes(kind)) place.kinds.push(kind);
      if (!seen.has(key)) { seen.add(key); place.routes++; if (place.examples.length < 3) place.examples.push(example); }
    };
    add(origin.city, 'destination city'); add(destination.city, 'destination city');
    for (let i = 0; i <= 200; i++) {
      const p = greatCirclePoint(origin, destination, i / 200);
      const country = countryAt(countries, p); if (country) add(country, 'country');
      const feature = featureNear(p); if (feature) add(feature.name, feature.kind);
      const region = namedRegionAt(p); if (region) add(withArticle(region.name, region.kind), region.kind);
      const below = overflightAt(origin, destination, i / 200);
      const visibleRegion = !feature && below.terrain !== 'farmland' && below.terrain !== 'ocean' ? below.name : null;
      if (visibleRegion) add(visibleRegion, 'below region');
      const forward = bearingDeg(p, greatCirclePoint(origin, destination, Math.min(1, (i + 1) / 200)));
      const backward = bearingDeg(p, greatCirclePoint(origin, destination, Math.max(0, (i - 1) / 200)));
      for (const heading of [forward, backward]) {
        const city = citiesAround(p, heading, 150)[0];
        if (city) add(city.name, 'nearby city');
        if (!country && !feature && !visibleRegion && !city && below.name) add(below.name, 'below fallback');
      }
    }
    for (const [from, to] of [[origin, destination], [destination, origin]]) {
      const minutes = 45;
      const stops = routePreview(from, to, countries, minutes);
      for (const moment of planMoments({ origin: from, destination: to, flightMinutes: minutes, stops, events: [] })) {
        if (moment.kind !== 'event') add(moment.title, moment.kind === 'country' ? 'country' : moment.kind === 'landmark' ? 'landmark' : 'moment place');
      }
    }
    pairs++;
    if (pairs % 250 === 0) console.log(`Audited ${pairs} destination pairs; ${places.size} places`);
  }
  const ranked = Array.from(places.values()).sort((a, b) => b.routes - a.routes || a.title.localeCompare(b.title, 'en'));
  const mandatory = ranked.filter(p => p.kinds.includes('country') || p.kinds.includes('destination city'));
  const mandatoryKeys = new Set(mandatory.map(p => routePlaceKey(p.title)));
  // These unqualified labels refer to different source polygons in different countries.
  // A title-only lookup cannot choose one truthfully; retain live context lookup instead.
  const ambiguous = ['Cordillera Oriental', 'Cordillera Occidental'];
  const extra = ranked.filter(p => p.routes >= 3 && !mandatoryKeys.has(routePlaceKey(p.title)) && !ambiguous.includes(p.title)).slice(0, Math.max(0, 300 - mandatory.length));
  const selectedKeys = new Set([...mandatory, ...extra].map(p => routePlaceKey(p.title)));
  const selected = ranked.filter(p => selectedKeys.has(routePlaceKey(p.title)));
  const cutoff = extra[extra.length - 1];
  const metadata = { destinations: cities.length, pairs, samplesPerPair: 201, momentFlightMinutes: 45, selected: selected.length, mandatory: mandatory.length, ambiguousExcluded: ambiguous, cutoff: cutoff ? { title: cutoff.title, rank: ranked.indexOf(cutoff) + 1, routes: cutoff.routes } : null };
  writeFileSync('docs/route-places.json', JSON.stringify({ metadata, places: ranked.map((p, i) => ({ rank: i + 1, ...p, selected: selectedKeys.has(routePlaceKey(p.title)) })) }, null, 2) + '\n');
  const md = `# Places on real routes\n\nGenerated by \`scripts/dev/route-places.ts\`: ${cities.length} WORLD_DESTINATIONS, ${pairs} unordered pairs. Both directions' non-event moments are counted together. Each place counts at most once per pair. Countries, named features, named regions and nearby cities are sampled at 201 points including endpoints. The Below us terrain fallback and citiesAround within 150 km (both headings) are included because those names are tappable too. Bogota and Bogotá are counted together with both spellings retained. Moments use the existing 45-minute lesson-flight planner with no events; its timing/three-moment cap can change which moments are offered. These are geometric route-incidence counts, not estimates of actual classroom taps.\n\nSelection: all ${mandatory.length} crossed countries/destination cities, then remaining places on at least three routes in rank order, up to 300 entries. Selected: ${selected.length}. The unqualified Cordillera Oriental and Cordillera Occidental labels are excluded because each names multiple ranges in the source polygons; their contextual live lookup is retained. Last non-mandatory selection: ${cutoff?.title ?? 'none'}, rank ${metadata.cutoff?.rank ?? 'n/a'}, ${cutoff?.routes ?? 0} routes. Mandatory places below that rank are still selected.\n\n| Rank | Place | Kind | Routes | Cards selected | Example routes |\n| ---: | --- | --- | ---: | --- | --- |\n${ranked.map((p, i) => `| ${i + 1} | ${p.title} | ${p.kinds.join(', ')} | ${p.routes} | ${selectedKeys.has(routePlaceKey(p.title)) ? 'yes' : ''} | ${p.examples.join('; ')} |`).join('\n')}\n`;
  writeFileSync('docs/route-places.md', md);
  console.log(JSON.stringify(metadata));
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/route-places.ts')) void auditRoutePlaces();
