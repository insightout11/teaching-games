import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_RANGE_TIERS } from '@/lib/world-flight/progression';
import { distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import { greatCirclePoint } from '@/lib/live-room/route-terrain';
import { countryAt, toShapes } from '@/lib/live-room/places-below';
import { COUNTRY_ITEMS } from '@/data/world-flight/country-items';
import raw from '@/data/world/countries-110m.json';

// Non-sovereign, disputed or uninhabited map entries documented in the review.
const EXCLUDED = new Set(['Antarctica', 'Greenland', 'Kosovo', 'N. Cyprus', 'New Caledonia', 'Palestine', 'Puerto Rico', 'Somaliland', 'Taiwan', 'W. Sahara']);

describe('country items for real flight routes', () => {
 it('covers every sampled country in each eligible directed route', () => {
  const shapes = toShapes(raw as Parameters<typeof toShapes>[0]);
  const limit = Math.max(...WORLD_FLIGHT_RANGE_TIERS.map(t => t.rangeKm));
  const visited = new Set<string>();
  for (const from of WORLD_DESTINATIONS) for (const to of WORLD_DESTINATIONS) {
   if (from.id === to.id) continue;
   const km = distanceBetweenCoordsKm(from, to);
   if (km > limit) continue;
   const segments = Math.ceil(km / 25);
   for (let i = 0; i <= segments; i++) {
    const country = countryAt(shapes, greatCirclePoint(from, to, i / segments));
    if (country) visited.add(country);
   }
  }
  const countries = new Set(COUNTRY_ITEMS.map(item => item.country));
  expect(Array.from(visited).filter(country => !EXCLUDED.has(country) && !countries.has(country)).sort()).toEqual([]);
 }, 60_000);
 it('uses unique country names, real stickers and one-sentence facts', () => {
  expect(new Set(COUNTRY_ITEMS.map(item => item.country)).size).toBe(COUNTRY_ITEMS.length);
  for (const item of COUNTRY_ITEMS) {
   if (item.sticker === null) {
    expect(item.artPrompt, item.country).toMatch(/^sticker-style .+, no text, no people's faces$/);
   } else {
    expect(existsSync(join(process.cwd(), 'public', 'stickers', `${item.sticker}.webp`)), item.country).toBe(true);
   }
   expect(item.fact.trim(), item.country).toMatch(/^[^.!?]+[.!?]$/);
  }
 });
});
