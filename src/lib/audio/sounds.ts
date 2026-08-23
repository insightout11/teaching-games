/**
 * Sound registry and the timing constants that place each cue.
 *
 * Components call semantic keys (`play('takeoff', engineClass)`) and never touch
 * file paths, so re-cutting an asset never ripples into component code.
 *
 * Assets are currently WAV. They are small (~2 MB for the whole set) and this
 * avoids adding an encoder dependency; swap to mp3 here when one is available —
 * nothing else needs to change. See docs/sound-design.md §5.
 */
import type { EngineClass } from '@/lib/plane-progression';

export const SOUNDS = {
  brandResolve: '/sounds/brand-resolve.wav',
  touchdown: '/sounds/touchdown.wav',
  arrivalResolve: '/sounds/arrival-resolve.wav',
} as const;

export type SoundKey = keyof typeof SOUNDS;

export const TAKEOFF_SOUNDS: Record<EngineClass, string> = {
  piston: '/sounds/takeoff-piston.wav',
  'twin-prop': '/sounds/takeoff-twin-prop.wav',
  electric: '/sounds/takeoff-electric.wav',
  jet: '/sounds/takeoff-jet.wav',
};

export const ALL_SOUND_URLS: string[] = [
  ...Object.values(SOUNDS),
  ...Object.values(TAKEOFF_SOUNDS),
];

/**
 * Where the chime's attack sits inside brand-resolve.wav, measured after trimming.
 * The clip opens with a riser, so playback has to START this far before the moment
 * the chime should land.
 */
export const BRAND_CHIME_OFFSET_MS = 830;

/**
 * When the BrandSting spark bursts — the visual climax the chime lands on.
 *
 * Derived, do not re-guess (docs/sound-design.md §6.3):
 *   TakeoffSpark mounts at MARK_DELAY (brand-sting.tsx)
 *   + spark delay 0.65s + times[1] 0.45 x duration 0.65s = +942.5ms (takeoff-spark.tsx)
 *
 * full:  1700 + 942.5 = 2642.5   short: 850 + 942.5 = 1792.5
 */
export const BRAND_SPARK_PEAK_MS: Record<'full' | 'short', number> = {
  full: 2643,
  short: 1793,
};

/** How long after the sting mounts to start brand-resolve, so the chime hits the spark. */
export function brandResolveDelayMs(variant: 'full' | 'short'): number {
  return Math.max(0, BRAND_SPARK_PEAK_MS[variant] - BRAND_CHIME_OFFSET_MS);
}

/**
 * Touchdown lands on the descent bounce keyframe: times [0, 0.52, 0.60, 1.0] over
 * TRAVEL_DURATION (3200ms) in flight-transition-overlay.tsx, so 0.60 x 3200.
 *
 * NOTE: the overlay's own `travelMs` is 5200 on arrival legs while the plane
 * variants stay pinned to TRAVEL_DURATION. The keyframe follows the variant, hence
 * 3200 here — revisit if those two are ever reconciled.
 */
export const TOUCHDOWN_DELAY_MS = 1920;
