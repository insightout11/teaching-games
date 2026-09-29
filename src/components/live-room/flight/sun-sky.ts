import type { ScenePalette, TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { SunPosition } from '@/lib/live-room/sun';

/**
 * The cockpit sky from the real sun: palettes blend smoothly by the sun's
 * height (night → twilight → golden hour → day), and the sun sits where it
 * really is relative to the plane's heading.
 */
type PaletteScene = Parameters<typeof composeTimedPalette>[1];

function parseColor(c: string): [number, number, number, number] | null {
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}

function mix(a: string, b: string, t: number): string {
  const x = parseColor(a), y = parseColor(b);
  if (!x || !y) return t < 0.5 ? a : b;
  const v = x.map((n, i) => n + (y[i] - n) * t);
  if (a.startsWith('#') && b.startsWith('#')) {
    return `#${v.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${Math.round(v[0])},${Math.round(v[1])},${Math.round(v[2])},${v[3].toFixed(2)})`;
}

function blend(a: ScenePalette, b: ScenePalette, t: number): ScenePalette {
  const out = { ...a } as Record<string, unknown>;
  for (const k of Object.keys(a) as Array<keyof ScenePalette>) {
    const va = a[k], vb = b[k];
    out[k] = typeof va === 'string' && typeof vb === 'string' ? mix(va, vb, t) : t < 0.5 ? va : vb;
  }
  out.light = t < 0.5 ? a.light : b.light;
  return out as unknown as ScenePalette;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface SunSky {
  palette: ScenePalette;
  /** Nearest named time, for things that need a bucket (cloud tint, night lights, cinematics). */
  timeOfDay: TimeOfDay;
}

export function skyForSun(sun: SunPosition, scene: PaletteScene): SunSky {
  const e = sun.elevation;
  // Morning if the sun is in the eastern half of the sky.
  const twilight: TimeOfDay = sun.azimuth < 180 ? 'dawn' : 'dusk';
  const night = composeTimedPalette('night', scene);
  const low = composeTimedPalette(twilight, scene);
  const day = composeTimedPalette('day', scene);
  let palette: ScenePalette;
  if (e < -2) palette = blend(night, low, smooth(-12, -2, e));
  else palette = blend(low, day, smooth(4, 16, e));
  const timeOfDay: TimeOfDay = e < -6 ? 'night' : e < 8 ? twilight : 'day';
  return { palette, timeOfDay };
}

export interface LightSpot {
  x: string;
  y: string;
  size: number;
  visible: boolean;
}

/** Where to draw the sun (or the moon, roughly opposite it) on the windscreen. */
export function lightSpot(sun: SunPosition, headingDeg: number, isMoon: boolean): LightSpot {
  const az = isMoon ? (sun.azimuth + 180) % 360 : sun.azimuth;
  const el = isMoon ? Math.max(12, -sun.elevation * 0.8) : sun.elevation;
  const rel = ((az - headingDeg + 540) % 360) - 180; // −180…180, 0 = dead ahead
  const x = 50 + (rel / 70) * 50;
  const y = Math.max(5, 58 - el * 1.4);
  const size = isMoon ? 56 : Math.round(66 + Math.max(0, 14 - el) * 3);
  return { x: `${x}%`, y: `${y}%`, size, visible: Math.abs(rel) < 78 && (isMoon || el > -3) };
}
