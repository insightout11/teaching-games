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
  cruise: '/sounds/cruise.wav',
  /** Cruise micro-events. There is deliberately no `instrument` cue: a beep on an
   *  accuracy check is a hair from the per-question ding §2 calls a hard no, so
   *  that stage falls through to the plain cruise swell instead of getting one. */
  turbulence: '/sounds/turbulence.wav',
  radar: '/sounds/radar.wav',
} as const;

export type SoundKey = keyof typeof SOUNDS;

export const TAKEOFF_SOUNDS: Record<EngineClass, string> = {
  piston: '/sounds/takeoff-piston.wav',
  'twin-prop': '/sounds/takeoff-twin-prop.wav',
  electric: '/sounds/takeoff-electric.wav',
  jet: '/sounds/takeoff-jet.wav',
};

/**
 * Approach beds, keyed by the SAME propulsion family as takeoff — a piston
 * aircraft must not land sounding like a jet. Each is derived from that class's
 * own takeoff source, heard from further away.
 */
export const DESCENT_SOUNDS: Record<EngineClass, string> = {
  piston: '/sounds/descent-piston.wav',
  'twin-prop': '/sounds/descent-twin-prop.wav',
  electric: '/sounds/descent-electric.wav',
  jet: '/sounds/descent-jet.wav',
};

/**
 * Lobby bed. Lives outside SOUNDS because it is a music channel, not a one-shot:
 * different lifecycle, different preference, different level trim.
 */
export const LOBBY_BED = '/sounds/lobby-bed.wav';

export const ALL_SOUND_URLS: string[] = [
  ...Object.values(SOUNDS),
  ...Object.values(TAKEOFF_SOUNDS),
  ...Object.values(DESCENT_SOUNDS),
];

/**
 * Where the chime's attack sits inside brand-resolve.wav.
 *
 * The clip is a composite: a synthesised cloud rush scores the opening and the
 * generated chime is layered on at 2.643s (see scripts/process-sound-assets.mjs).
 * That is deliberately equal to the 'full' spark peak, so the clip plays from mount
 * with NO offset and the whole reveal is scored — the earlier cut had only 0.83s of
 * run-up, which left the entire cloud rush in silence.
 */
export const BRAND_CHIME_OFFSET_MS = 2643;

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

/**
 * How long after the sting mounts to start brand-resolve, so the chime hits the spark.
 *
 * The clip is cut for 'full', where this is 0. 'short' is dev-only and its spark
 * comes 850ms earlier than the clip can deliver, so it clamps to 0 and the chime
 * lands late there — acceptable, since no shipping call site uses 'short'.
 */
export function brandResolveDelayMs(variant: 'full' | 'short'): number {
  return Math.max(0, BRAND_SPARK_PEAK_MS[variant] - BRAND_CHIME_OFFSET_MS);
}

/**
 * Bounce keyframe for a BARE RUNWAY descent — times [0, 0.52, 0.60, 1.0] on the
 * plane variant, which is pinned to TRAVEL_DURATION.
 *
 * This is only half the story, and assuming it covered both descents is what made
 * the landing chirp drift. A CITY arrival — the path real sessions always take,
 * because session-view falls back to the home-base scene — runs `arrivalTimeline`
 * over `travelMs` (5200ms) instead, where contact is at `A_APPROACH_END` (0.52),
 * i.e. ~2704ms rather than 1920ms. The overlay picks per leg.
 */
export const RUNWAY_TOUCHDOWN_KEYFRAME = 0.6;
