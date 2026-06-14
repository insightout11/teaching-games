import type { DestinationScene } from '@/lib/world-flight/types';
import type { WeatherCondition } from './types';
import { seededRand } from './seed';

export type { WeatherCondition };

// ─────────────────────────────────────────────────────────────────────────────
// Per-flight weather: a deterministic, climate-weighted roll. Same seed always
// produces the same condition (so a flight leg is stable across re-renders), but
// different flights vary, and the odds match the destination's climate.
// ─────────────────────────────────────────────────────────────────────────────

/** All conditions, in UI order. */
export const WEATHER_CONDITIONS: WeatherCondition[] = ['clear', 'overcast', 'rain', 'storm', 'snow', 'aurora'];

export type Climate = 'tropical' | 'desert' | 'polar' | 'temperate';

/** Bucket a destination into a broad climate from its baked scene metadata. */
export function destinationClimate(scene: DestinationScene): Climate {
  if (scene.palette === 'winter') return 'polar';
  if (scene.terrain === 'desert') return 'desert';
  if (scene.palette === 'tropical' || scene.vegetation === 'palms') return 'tropical';
  return 'temperate';
}

/** How each condition paints — consumed by the atmosphere + weather layers. */
export interface WeatherProfile {
  /** Grey-blue darkening wash over the scene, 0 (none) → 1 (darkest). */
  dim: number;
  /** Extra low cloud-deck coverage, 0 → 1. */
  cloudCover: number;
  /** Rain intensity, 0 → 1. */
  rain: number;
  /** Snow intensity, 0 → 1. */
  snow: number;
  /** Periodic lightning flashes. */
  lightning: boolean;
  /** Aurora ribbons (night skies). */
  aurora: boolean;
}

export const WEATHER_PROFILE: Record<WeatherCondition, WeatherProfile> = {
  clear: { dim: 0, cloudCover: 0, rain: 0, snow: 0, lightning: false, aurora: false },
  overcast: { dim: 0.34, cloudCover: 0.9, rain: 0, snow: 0, lightning: false, aurora: false },
  rain: { dim: 0.42, cloudCover: 0.96, rain: 0.7, snow: 0, lightning: false, aurora: false },
  storm: { dim: 0.54, cloudCover: 1, rain: 0.92, snow: 0, lightning: true, aurora: false },
  snow: { dim: 0.2, cloudCover: 0.78, rain: 0, snow: 0.8, lightning: false, aurora: false },
  aurora: { dim: 0.12, cloudCover: 0.12, rain: 0, snow: 0, lightning: false, aurora: true },
};

// Climate → relative weights. Aurora only enters the table when it's night (it's
// folded back into 'clear' by day). Snow only for cold places.
const WEIGHTS: Record<Climate, Partial<Record<WeatherCondition, number>>> = {
  tropical: { clear: 44, overcast: 20, rain: 26, storm: 10 },
  desert: { clear: 82, overcast: 13, storm: 5 },
  polar: { clear: 30, overcast: 24, snow: 34, aurora: 12 },
  temperate: { clear: 50, overcast: 26, rain: 17, storm: 5, snow: 2 },
};

/**
 * Roll a weather condition for a flight leg. `seed` should be stable per flight
 * (e.g. `${legId}:${destinationId}`) so the leg's weather doesn't flicker. Aurora
 * is only eligible at night; by day its weight folds into clear.
 */
export function rollWeather(seed: string, scene: DestinationScene, isNight = false): WeatherCondition {
  const climate = destinationClimate(scene);
  const weights: Partial<Record<WeatherCondition, number>> = { ...WEIGHTS[climate] };
  if (!isNight && weights.aurora) {
    weights.clear = (weights.clear ?? 0) + weights.aurora;
    delete weights.aurora;
  }
  const entries = Object.entries(weights) as [WeatherCondition, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return 'clear';
  const pick = seededRand(`${seed}:weather`)() * total;
  let acc = 0;
  for (const [condition, w] of entries) {
    acc += w;
    if (pick < acc) return condition;
  }
  return 'clear';
}
