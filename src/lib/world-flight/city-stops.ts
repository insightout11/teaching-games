/**
 * City stops (Oct 2026, decided by Matt): after landing the class votes for one of four stops; the winning stop's
 * role-play scene (Scene Igniter) earns its souvenir. Restaurant, station and sights souvenirs go on the class shelf;
 * the market offers accessories each student picks for their own avatar.
 *
 * Data: src/data/world-flight/city-stops.json (written by Codex, docs/city-stops-brief.md). Until a city has data, a
 * fallback builds its stops from the city's existing souvenirs, so every destination works.
 */
import data from '@/data/world-flight/city-stops.json';
import { citySouvenirs } from '@/lib/world-flight/souvenirs';
import { getDestinationById } from '@/data/world-flight/destinations';
import { parseAccessory, type Accessory } from '@/lib/accessories';

export const STOP_KINDS = ['restaurant', 'market', 'station', 'sights'] as const;
export type StopKind = (typeof STOP_KINDS)[number];

export const STOP_LABEL: Record<StopKind, string> = { restaurant: 'Restaurant', market: 'Market', station: 'Station', sights: 'Sights' };
export const STOP_SKILL: Record<StopKind, string> = {
  restaurant: 'ordering food and asking about dishes',
  market: 'haggling and asking about sizes and colours',
  station: 'buying tickets and asking directions',
  sights: 'describing a place and asking questions about it',
};

export interface StopItem { id: string; name: string; description: string; icon: string | null; sticker: string | null }
export interface CityStop { kind: StopKind; place: string; scene: string; items: StopItem[]; accessories: Accessory[] }

type RawStop = { place?: unknown; scene?: unknown; items?: unknown[] };

const FOOD = /utensils|croissant|coffee|cookie|cooking-pot|fish|cup-soda|sandwich|cake|apple/;
const MOVE = /car|ship|train|sailboat|cable-car|bus|bike|tram-front/;

const PALETTE: Array<[string, string]> = [['#c2410c', '#fde68a'], ['#0f766e', '#f9a8d4'], ['#1e3a8a', '#d4a017'], ['#7c2d12', '#93c5fd'], ['#166534', '#fcd34d']];

function fallback(cityId: string, kind: StopKind): CityStop | null {
  const city = getDestinationById(cityId);
  if (!city) return null;
  const all = citySouvenirs(cityId);
  const pick = (re: RegExp | null) => all.filter((s) => (re ? re.test(s.icon ?? '') : !FOOD.test(s.icon ?? '') && !MOVE.test(s.icon ?? '')));
  const toItem = (s: { id: string; name: string; description: string; icon?: string | null }): StopItem => ({ id: s.id, name: s.name, description: s.description, icon: s.icon ?? null, sticker: null });
  const n = city.city;
  if (kind === 'market') {
    let h = 0;
    for (const ch of cityId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const colors = PALETTE[h % PALETTE.length];
    const acc = (type: Accessory['type'], name: string): Accessory => ({ id: `${cityId}-${type}`, name: `${n} ${name}`, type, colors, cityId });
    return { kind, place: `a busy market in ${n}`, scene: `Choose something to wear from ${n} and agree on a fair price.`, items: [], accessories: [acc('scarf', 'market scarf'), acc('sun-hat', 'sun hat'), acc('bag', 'market bag')] };
  }
  const items = (kind === 'restaurant' ? pick(FOOD) : kind === 'station' ? pick(MOVE) : pick(null)).map(toItem);
  const place = kind === 'restaurant' ? `a popular local restaurant in ${n}` : kind === 'station' ? `a busy station in ${n}` : `a famous sight in ${n}`;
  const scene = kind === 'restaurant' ? `Order a meal for the group and ask what is in the dishes.` : kind === 'station' ? `Buy tickets and ask how to get across ${n}.` : `Describe what you can see and ask the guide two questions.`;
  return { kind, place, scene, items, accessories: [] };
}

/** The four stops for a city (real data where Codex has written it, else the fallback). */
export function cityStops(cityId: string): CityStop[] {
  const raw = (data as Record<string, Partial<Record<StopKind, RawStop>>>)[cityId];
  return STOP_KINDS.flatMap((kind) => {
    const r = raw?.[kind];
    if (r && typeof r.place === 'string' && typeof r.scene === 'string' && Array.isArray(r.items)) {
      const accessories = kind === 'market' ? r.items.map((x) => parseAccessory({ ...(x as object), cityId })).filter((a): a is Accessory => !!a) : [];
      const items = kind === 'market' ? [] : r.items.flatMap((x) => {
        const v = x as Partial<StopItem>;
        return typeof v.id === 'string' && typeof v.name === 'string' ? [{ id: v.id, name: v.name, description: typeof v.description === 'string' ? v.description : '', icon: typeof v.icon === 'string' ? v.icon : null, sticker: typeof v.sticker === 'string' ? v.sticker : null }] : [];
      });
      return [{ kind, place: r.place, scene: r.scene, items, accessories }];
    }
    const f = fallback(cityId, kind);
    return f ? [f] : [];
  });
}

/** The Scene Igniter topic for a stop: the place, the situation and the everyday English it practises. */
export function stopSceneTopic(cityName: string, stop: CityStop): string {
  return `${stop.place} (${cityName}): ${stop.scene} Practise ${STOP_SKILL[stop.kind]}.`.slice(0, 240);
}
