/** Offline comparison only. Run: npx tsx scripts/compare-terrain.ts */
import { WORLD_DESTINATIONS } from '../src/data/world-flight/destinations';
import { greatCirclePoint, terrainAt } from '../src/lib/live-room/route-terrain';
import { landCoverAt, namedRegionAt } from '../src/lib/live-room/land-cover';

/** Fixed, reproducible selection spanning biomes, continents and the date line. */
export const COMPARISON_ROUTES: [string, string][] = [
  ['london', 'tokyo'], ['seoul', 'bangkok'], ['bangkok', 'ho-chi-minh-city'],
  ['paris', 'rome'], ['cairo', 'lagos'], ['dakar', 'cairo'],
  ['nairobi', 'cape-town'], ['addis-ababa', 'lagos'],
  ['rio-de-janeiro', 'bogota'], ['lima', 'buenos-aires'], ['santiago', 'lima'],
  ['new-york', 'los-angeles'], ['vancouver', 'toronto'], ['london', 'reykjavik'],
  ['lisbon', 'rio-de-janeiro'], ['beijing', 'ulaanbaatar'], ['delhi', 'almaty'],
  ['perth', 'sydney'], ['jakarta', 'singapore'], ['auckland', 'honolulu'],
];

export function compareTerrain(): string {
  const lines = [
    'Static terrain comparison: 20 routes x 10 great-circle points (including endpoints).',
    'Coordinates come from WORLD_DESTINATIONS. t = sample / 9; coordinates shown rounded only.',
    'Old: terrainAt terrain + label. New: landCoverAt + namedRegionAt. Not wired into the live room.',
  ];
  for (const [fromId, toId] of COMPARISON_ROUTES) {
    const from = WORLD_DESTINATIONS.find(city => city.id === fromId);
    const to = WORLD_DESTINATIONS.find(city => city.id === toId);
    if (!from || !to) throw new Error('Unknown World Flight city: ' + fromId + ' / ' + toId);
    lines.push('', `${from.city} -> ${to.city}`, 'n | lat,lng | old terrain / label | new cover / region (kind)');
    for (let sample = 0; sample < 10; sample++) {
      const p = greatCirclePoint(from, to, sample / 9);
      const old = terrainAt(p), cover = landCoverAt(p), region = namedRegionAt(p);
      lines.push(`${sample + 1} | ${p.lat.toFixed(3)},${p.lng.toFixed(3)} | ${old.terrain} / ${old.name || '-'} | ${cover} / ${region ? `${region.name} (${region.kind})` : '-'}`);
    }
  }
  return lines.join('\n') + '\n';
}

if (require.main === module) process.stdout.write(compareTerrain());
