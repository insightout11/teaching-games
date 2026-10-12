import type { MoonPosition, SunPosition } from '@/lib/live-room/sun';
import { BLEED_X, CONTENT_W, LAYOUT } from './types';

/**
 * The real sun and moon over the ground the plane is above, and the way the plane is heading. The scene looks along
 * the heading, the same as the cockpit windscreen does, so a sun off to the left in the cockpit is off to the left
 * here, and a sun behind the plane is out of shot in both.
 */
export interface SkyLight {
  sun: SunPosition;
  moon: MoonPosition;
  /** Compass degrees the plane is heading. */
  heading: number;
}

export interface LightDisc {
  x: number;
  y: number;
  visible: boolean;
}

export interface SkyDiscs {
  sun: LightDisc;
  moon: LightDisc & { illumination: number; litOnRight: boolean };
  /** 0 at night to 1 in full day: how bright the sky is, so the moon can fade out in daylight. */
  daylight: number;
}

const HALF_VIEW_DEG = 70; // the cockpit shows 70° either side of straight ahead
const PIXELS_PER_DEGREE = 8.8; // height: 60° up reaches the top of the sky

function discAt(azimuth: number, elevation: number, heading: number, minElevation: number): LightDisc {
  const rel = ((azimuth - heading + 540) % 360) - 180; // −180…180, 0 = dead ahead
  return {
    x: BLEED_X + CONTENT_W * (0.5 + rel / (HALF_VIEW_DEG * 2)),
    y: Math.max(40, LAYOUT.horizonY - elevation * PIXELS_PER_DEGREE),
    visible: Math.abs(rel) < 78 && elevation > minElevation,
  };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Which way the scene looks. Takeoff and landing are side views, so the direction is free: turn the camera toward the
 * sun while it is up, or the moon once it has set, so there is a light in shot whenever there is one in the sky. `offset`
 * (degrees, per city) keeps the light from always sitting dead centre. With neither up, the plane's own heading.
 */
export function sceneHeading(light: SkyLight, offset = 0): number {
  const norm = (d: number) => ((d % 360) + 360) % 360;
  if (light.sun.elevation > -3) return norm(light.sun.azimuth - offset);
  if (light.moon.elevation > 1) return norm(light.moon.azimuth - offset);
  return light.heading;
}

/** Where the sun and moon sit on the scene's canvas, and whether each is in shot and above the horizon. */
export function skyDiscs(light: SkyLight, offset = 0): SkyDiscs {
  const heading = sceneHeading(light, offset);
  return {
    sun: discAt(light.sun.azimuth, light.sun.elevation, heading, -3),
    moon: { ...discAt(light.moon.azimuth, light.moon.elevation, heading, 1), illumination: light.moon.illumination, litOnRight: light.moon.litOnRight },
    daylight: smooth(-6, 8, light.sun.elevation),
  };
}

/** The light the scene is lit from: the sun while it is up, the moon at night. Nothing when it is out of shot. */
export function primaryLight(discs: SkyDiscs): { x: number; y: number } | undefined {
  if (discs.daylight > 0.05 && discs.sun.visible) return { x: discs.sun.x, y: discs.sun.y };
  if (discs.daylight < 0.5 && discs.moon.visible) return { x: discs.moon.x, y: discs.moon.y };
  return undefined;
}
