import type { DestinationScene } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// LC International — the LessonCaptain home base.
//
// The universal departure + arrival point for every flight launched OUTSIDE of
// World Flight. World Flight flies OUT to real cities (Tokyo, Paris, …) and back;
// every other lesson takes off from and lands at home base. It is NOT a real
// DestinationPack (no readings / coordinates / focus options) — the arrival-scene
// engine only needs an id (for deterministic seeding) and a DestinationScene, so
// home base is just that pair, composed through the exact same engine as the
// real cities: a coastal airfield with a futuristic LC skyline across the bay, a
// snow-capped mountain range behind it, and the LC control tower as the hero.
// ─────────────────────────────────────────────────────────────────────────────

/** Stable seed id for the home-base scene (drives the deterministic RNG). */
export const HOME_BASE_ID = 'lc-international';

/** Display name shown on the transition label + (future) boarding pass / logbook. */
export const HOME_BASE_NAME = 'LC International';

/**
 * The home-base scene. Coastal terrain gives the bay + beach; the bespoke
 * `homebase` skyline variant draws the snow-capped mountains + the sleek iconic
 * LC towers; the `lc-control-tower` landmark is the grounded brand hero. `palette`
 * is only the fallback when no flight-clock timeOfDay is supplied — the live
 * surfaces always pass a time of day so the base feels alive dawn → night.
 */
export const HOME_BASE_SCENE: DestinationScene = {
  terrain: 'coastal',
  vegetation: 'palms',
  skyline: 'highrise',
  skylineVariant: 'homebase',
  landmarkSilhouette: 'lc-control-tower',
  palette: 'dawn',
};
