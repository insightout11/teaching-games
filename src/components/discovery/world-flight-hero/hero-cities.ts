// The curated destinations that headline the World Flight home hero. Scene art +
// coordinates are pulled LIVE from the canonical destination data so the hero can
// never drift from what World Flight actually renders; only the short teaser
// `focus` line is authored here. Order = the rotation order in the hero.

import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationScene } from '@/lib/world-flight/types';

export interface HeroCity {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  scene: DestinationScene;
  /** Short teaser of what a lesson here leans into. */
  focus: string;
  /** A distinct aircraft per stop, so the rotation shows off the fleet. */
  plane: string;
}

const ORDER: { id: string; focus: string; plane: string }[] = [
  { id: 'tokyo', focus: 'Speaking · City life', plane: 'comet-jet' },
  { id: 'rio-de-janeiro', focus: 'Culture · Conversation', plane: 'sky-racer' },
  { id: 'cairo', focus: 'History · Reading', plane: 'trailblazer-biplane' },
  { id: 'vancouver', focus: 'Nature · Discussion', plane: 'twin-prop-scout' },
  { id: 'paris', focus: 'Art · Speaking', plane: 'starliner-mini' },
  { id: 'new-york', focus: 'Debate · City life', plane: 'future-flyer' },
  { id: 'sydney', focus: 'Travel · Speaking', plane: 'solar-flyer' },
  { id: 'cape-town', focus: 'Story · Nature', plane: 'aurora-glider' },
];

export const HERO_CITIES: HeroCity[] = ORDER.flatMap(({ id, focus, plane }) => {
  const d = WORLD_DESTINATIONS.find((x) => x.id === id);
  if (!d) {
    // A curated id no longer exists in the destination data — skip rather than crash.
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[world-flight-hero] curated city not found in destinations: ${id}`);
    }
    return [];
  }
  return [{ id: d.id, city: d.city, country: d.country, lat: d.lat, lng: d.lng, scene: d.scene, focus, plane }];
});
