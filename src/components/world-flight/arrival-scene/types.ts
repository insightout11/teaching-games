import type { ComponentType } from 'react';
import type { DestinationScene } from '@/lib/world-flight/types';

// ─────────────────────────────────────────────────────────────────────────────
// Public contract for the composable arrival-scene library.
//
// Camera is a SIDE-PROFILE cinematic view (all plane upgrade art is side-view):
// the runway is a horizontal foreground band, the plane approaches diagonally
// from the upper-left, and the city/terrain/landmark sit BEHIND the runway.
//
// The scene owns NO arrival timeline. `phase` + `progress` define the EXACT
// rendered frame; `motion` only gates ambient effects (lights, drift, bob).
// ─────────────────────────────────────────────────────────────────────────────

export type ArrivalPhase = 'approach' | 'touchdown' | 'taxi' | 'landed';

export type ArrivalMotion = 'animated' | 'static';

/** Arrival (plane lands into the city) vs departure (plane takes off from it). */
export type ArrivalMode = 'arrival' | 'departure';

/** Flight-clock time of day; overrides the destination's baked palette when set. */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface DestinationArrivalSceneProps {
  destinationId: string;
  scene: DestinationScene;
  phase: ArrivalPhase;
  /** Normalized 0–1 progress within the phase. Clamped to [0,1] by the composer. */
  progress?: number;
  planeKey?: string | null;
  /** 'animated' (default) enables ambient effects only; 'static' renders a still frame. */
  motion?: ArrivalMotion;
  /** Landing (default) or taking off — controls the plane's flight path. */
  mode?: ArrivalMode;
  /**
   * Skip the built-in sky (gradient + sun/moon + stars + clouds) so a shared
   * full-bleed sky (e.g. SkyBackground) can render behind it. The ground, city,
   * landmark, runway and plane still draw. Used by the live flight transition so
   * the city fly-in shares the same animated clouds/altitude as the other legs.
   */
  transparentSky?: boolean;
  /** How the 16:9 scene fits its box: 'meet' (letterbox, default) or 'slice' (fill). */
  fit?: 'meet' | 'slice';
  /**
   * Flight-clock time of day. When provided, the scene composes a time-of-day
   * palette + the destination's climate tint (used by the live flight). When
   * omitted, the destination's baked `scene.palette` is used (gallery / default).
   */
  timeOfDay?: TimeOfDay;
  className?: string;
}

export type LandmarkDepth = 'background' | 'midground' | 'foreground';

/**
 * Props every layer receives. Landmark components additionally get their
 * placement applied by the composer (see LandmarkRegistryEntry), so they only
 * need to draw around a consistent base-center local origin.
 */
export interface SceneLayerProps {
  scene: DestinationScene;
  palette: ScenePalette;
  /** Deterministic RNG seeded from destinationId — same city always looks identical. */
  rand: () => number;
  /** Collision-safe prefix for all <defs> ids in this scene instance. */
  idPrefix: string;
  phase: ArrivalPhase;
  /** Already clamped to [0,1]. */
  progress: number;
  /** False when motion === 'static' OR prefers-reduced-motion. */
  ambient: boolean;
  /** Landing vs takeoff — only the plane layer reads this. */
  mode: ArrivalMode;
}

/**
 * Landmark layer local-origin convention: draw around (x=0 horizontal center,
 * y=0 base line), building UPWARD with negative y. The composer wraps each
 * landmark in `translate(anchorX*1600, baseY) scale(scale)` so all positioning
 * lives in the registry, not hidden inside the component.
 */
export type LandmarkLayerProps = Pick<SceneLayerProps, 'palette' | 'rand' | 'idPrefix' | 'ambient'>;

export interface LandmarkRegistryEntry {
  component: ComponentType<LandmarkLayerProps>;
  depth: LandmarkDepth;
  /** 0–1 horizontal anchor across the 1600-wide frame. */
  anchorX: number;
  /** Vertical placement of the landmark's base-center origin, in SVG units (0–900). */
  baseY: number;
  /** Relative size multiplier applied at the anchor. */
  scale: number;
  /** Optional atmospheric fade (default 1). */
  opacity?: number;
}

// ── Palette ──────────────────────────────────────────────────────────────────

export type PaletteKey = DestinationScene['palette']; // 'dawn' | 'night' | 'golden' | 'tropical' | 'winter'

export interface ScenePalette {
  /** Sky gradient, top → bottom. */
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  /** Soft glow at the horizon. */
  horizonGlow: string;
  /** 'sun' draws a warm disk, 'moon' a cool disk + stars. */
  light: 'sun' | 'moon';
  lightColor: string;
  /** Land / terrain base tint (gradient top → bottom). */
  terrainTop: string;
  terrainBottom: string;
  /** Water tint for coastal/island terrain. */
  waterTop: string;
  waterBottom: string;
  /** Building silhouette fill. */
  buildingSilhouette: string;
  /** Lit window colors. */
  windowWarm: string;
  windowCool: string;
  /** Vegetation foliage + trunk. */
  foliage: string;
  trunk: string;
  /** Landmark silhouette fill + a subtle accent edge. */
  landmarkFill: string;
  landmarkAccent: string;
}

// ── Shared coordinate system (single viewBox 0 0 1600 900) ──────────────────

export const VIEWBOX = { w: 1600, h: 900 } as const;

/**
 * Vertical anchors for the side-profile composition. Everything keys off these
 * so terrain, skyline, landmarks, vegetation, runway and plane stay locked
 * together and scale as a single unit.
 */
export const LAYOUT = {
  /** Sky meets land here; distant skyline/landmarks sit on this line. */
  horizonY: 590,
  /** Top of the grassy airfield apron (in front of the city). */
  apronY: 640,
  /** The horizontal runway surface line the plane rolls/parks on. */
  runwayY: 742,
  /** Foreground grass strip in front of the runway. */
  foregroundY: 808,
} as const;
