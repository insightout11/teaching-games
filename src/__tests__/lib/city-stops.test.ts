import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import packs from '@/data/world-flight/city-packs.json';
import data from '@/data/world-flight/city-stops.json';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { WORLD_FLIGHT_RANGE_TIERS } from '@/lib/world-flight/progression';
import { routeLengthKm } from '@/lib/live-room/coast-strip';
import { cityStopsData as cityStops } from '@/lib/world-flight/city-stops';

const accessories = new Set(['sun-hat', 'scarf', 'sunglasses', 'bag', 'bracelet', 'cap', 'badge', 'umbrella']);
const sourceItems = Object.values(packs).flatMap(p => p.souvenirs);
const icons = new Set(sourceItems.map(i => i.icon));

describe('city stop content', () => {
  it('covers exactly all 50 existing city packs', () => {
    expect(Object.keys(data).sort()).toEqual(Object.keys(packs).sort());
    expect(Object.keys(data)).toHaveLength(50);
  });

  it('covers every Dubai-reachable city using the actual longest plane range', () => {
    const dubai = WORLD_DESTINATIONS.find(d => d.id === 'dubai')!;
    const longest = Math.max(...WORLD_FLIGHT_RANGE_TIERS.map(t => t.rangeKm));
    const reachable = WORLD_DESTINATIONS.filter(d => routeLengthKm(dubai, d) <= longest);
    expect(reachable).toHaveLength(40); // Includes the departure city itself.
    for (const d of reachable) expect(cityStops(d.id), d.id).not.toBeNull();
    for (const id of Object.keys(data)) expect(Object.prototype.hasOwnProperty.call(packs, id), id).toBe(true);
  });

  it('has four named stops, one short scene and three distinct rewards at each stop', () => {
    for (const id of Object.keys(data)) {
      const stops = cityStops(id)!;
      expect(Object.keys(stops).sort()).toEqual(['market', 'restaurant', 'sights', 'station']);
      for (const kind of ['restaurant', 'market', 'station', 'sights'] as const) {
        const stop = stops[kind];
        expect(stop.place.trim().length).toBeGreaterThan(5);
        expect(stop.place).not.toMatch(/CHECK|TODO|TBD|\?/);
        expect(stop.scene.trim().split(/\s+/).length).toBeLessThanOrEqual(30);
        expect(stop.scene.match(/[.!?]/g)).toHaveLength(1);
        expect(stop.scene.endsWith('.')).toBe(true);
        expect(stop.items).toHaveLength(3);
        expect(new Set(stop.items.map(i => i.name)).size).toBe(3);
      }
    }
  });

  it('uses three allowed accessory types and two valid colours per city', () => {
    for (const id of Object.keys(data)) {
      const items = cityStops(id)!.market.items;
      expect(new Set(items.map(i => i.type)).size).toBe(3);
      for (const item of items) {
        expect(accessories.has(item.type)).toBe(true);
        expect(item.colors).toHaveLength(2);
        for (const color of item.colors) expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(item.colors[0]).not.toBe(item.colors[1]);
        expect(item.motif.length).toBeGreaterThan(3);
        expect(item.description.endsWith('.')).toBe(true);
        expect(item.name).not.toMatch(/costume|national dress|headdress/i);
      }
    }
  });

  it('keeps reward ids globally unique, source links local to their city and art metadata valid', () => {
    const ids: string[] = [];
    for (const id of Object.keys(data)) {
      const stops = cityStops(id)!;
      const localSources = new Set(packs[id as keyof typeof packs].souvenirs.map(i => i.id));
      const reused: string[] = [];
      for (const kind of ['restaurant', 'market', 'station', 'sights'] as const) for (const item of stops[kind].items) {
        ids.push(item.id);
        expect(item.id.startsWith(id + '-stop-')).toBe(true);
      }
      for (const kind of ['restaurant', 'station', 'sights'] as const) for (const item of stops[kind].items) {
        expect(item.description.trim().length).toBeGreaterThan(10);
        expect(item.description).not.toMatch(/\uFFFD|\bCHECK\b|\bTODO\b/);
        expect(item.description.endsWith('.')).toBe(true);
        expect(item.icon === null || icons.has(item.icon)).toBe(true);
        if (item.sticker !== null) expect(existsSync(join(process.cwd(), 'public/stickers', item.sticker + '.webp'))).toBe(true);
        expect(item.artPrompt.startsWith('sticker-style ')).toBe(true);
        expect(item.artPrompt).toContain('no text');
        expect(item.artPrompt).toContain("no people's faces");
        if (item.fromCityPacks !== null) {
          expect(localSources.has(item.fromCityPacks), item.fromCityPacks).toBe(true);
          reused.push(item.fromCityPacks);
        }
      }
      expect(new Set(reused).size).toBe(reused.length);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(Object.keys(data).length * 12);
  });

  it('returns null for unknown and inherited object keys', () => {
    expect(cityStops('not-a-city')).toBeNull();
    expect(cityStops('__proto__')).toBeNull();
    expect(cityStops('constructor')).toBeNull();
    expect(cityStops('')).toBeNull();
    expect(cityStops('dubai')?.market.items).toHaveLength(3);
  });
});
