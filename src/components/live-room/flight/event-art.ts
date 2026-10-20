/**
 * Real natural events in the scenery (Oct 2026), from NASA's live list (EONET): a wildfire's smoke, a volcano's ash and
 * steam, a storm's tall cloud. Calm and factual (these are real places where people are affected): soft shapes drifting
 * slowly, a faint glow at night, the occasional soft flicker inside a storm cloud. Nothing dramatic, no flames.
 */

type RGB = [number, number, number];

export type EventKind = 'fire' | 'volcano' | 'storm';
/** An event on the ground: how far ahead and to the side when it comes into range (km), as for the cities. */
export interface SceneEvent { id: string; kind: EventKind; ahead: number; lateral: number }

/** Events in the scenery (the gallery turns them on; the room keeps them off until the owner approves). */
let REAL_EVENTS = false;
export function setRealEvents(on: boolean) { REAL_EVENTS = on; }
export const realEvents = () => REAL_EVENTS;

/** EONET's category → what the scenery shows (sea and lake ice has no scenery). */
export function eventKind(category: string): EventKind | null {
  if (/wildfire/i.test(category)) return 'fire';
  if (/volcano/i.test(category)) return 'volcano';
  if (/storm/i.test(category)) return 'storm';
  return null;
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

/** One soft puff (a radial fade), made once per colour and drawn scaled. */
const puffs = new Map<string, HTMLCanvasElement>();
function puff(col: RGB): HTMLCanvasElement {
  const key = col.map((v) => Math.round(v / 8)).join(',');
  const hit = puffs.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(28, 26, 2, 32, 32, 32);
    r.addColorStop(0, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0.9)`);
    r.addColorStop(0.6, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0.55)`);
    r.addColorStop(1, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0)`);
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  puffs.set(key, c);
  if (puffs.size > 40) { const k = puffs.keys().next().value; if (k) puffs.delete(k); }
  return c;
}

/**
 * Draw one event at its place. `proj` turns a world point (sideways x, depth z, height y) into the screen; `t` is the
 * time in seconds (for the slow drift and the flicker).
 */
export function drawSceneEvent(
  ctx: CanvasRenderingContext2D, kind: EventKind, seed: number, x: number, z: number,
  proj: (x: number, z: number, y?: number) => [number, number], scale: (z: number) => number,
  t: number, night: boolean, haze: RGB, fog: number, alpha: number,
) {
  ctx.save();
  if (kind === 'storm') {
    // a tall storm cloud: a column of billows rising from the cloud deck, spreading into a flat anvil at the top
    const lit: RGB = night ? [70, 78, 104] : [236, 238, 244], shade: RGB = night ? [30, 34, 52] : [132, 140, 162];
    const n = 16;
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1);
      const y = 2400 + f * 7600;                           // from the cloud tops up into the anvil
      const spread = f > 0.78 ? 1 + (f - 0.78) * 9 : 1;    // the anvil spreads at the top
      const along = (hash(seed + k) - 0.5) * 2600 * spread + (f > 0.78 ? (f - 0.78) * 18000 : 0);
      const r = (2800 + hash(seed * 3 + k) * 1800) * (f > 0.78 ? 1.3 : 1);
      const [sx, sy] = proj(x + along, z, y);
      const sr = r * scale(z);
      const col = mix(mix(shade, lit, 0.35 + f * 0.65), haze, fog * 0.7);
      ctx.globalAlpha = alpha * (1 - fog * 0.4);
      ctx.drawImage(puff(col), sx - sr, sy - sr * 0.8, sr * 2, sr * 1.6);
    }
    // now and then a soft flicker of lightning inside (never a bolt across the sky)
    const flick = Math.sin(t * 0.9 + seed) > 0.985 || Math.sin(t * 2.3 + seed * 2) > 0.995;
    if (flick) {
      const [sx, sy] = proj(x, z, 5600);
      const sr = 5200 * scale(z);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.55 * (1 - fog * 0.5);
      ctx.drawImage(puff([200, 210, 255]), sx - sr, sy - sr, sr * 2, sr * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    return;
  }
  // fire smoke or volcanic ash and steam: a column of puffs rising and leaning downwind, slowly drifting
  const volcano = kind === 'volcano';
  const base: RGB = volcano ? (night ? [52, 50, 56] : [118, 114, 118]) : (night ? [60, 58, 62] : [168, 150, 128]);
  const top: RGB = volcano ? (night ? [90, 92, 106] : [214, 214, 220]) : (night ? [76, 76, 86] : [206, 198, 186]);
  const n = volcano ? 14 : 11;
  const height = volcano ? 9000 : 6000;
  for (let k = 0; k < n; k++) {
    const f = k / (n - 1);
    const drift = Math.sin(t * 0.08 + seed + k * 0.6) * 220;
    const along = f * f * (volcano ? 11000 : 14000) + drift * 2;     // leaning away downwind as it rises
    const y = 120 + f * height;
    const r = (volcano ? 1200 : 1000) + f * (volcano ? 3600 : 4000);
    const [sx, sy] = proj(x + along, z + f * 900, y);
    const sr = r * scale(z);
    ctx.globalAlpha = alpha * (0.95 - f * 0.45) * (1 - fog * 0.3);
    ctx.drawImage(puff(mix(mix(base, top, f), haze, fog * 0.7)), sx - sr, sy - sr * 0.8, sr * 2, sr * 1.6);
  }
  // at night: a faint glow at the foot (orange for a fire, dull red for a volcano), never flames
  if (night) {
    const [sx, sy] = proj(x, z, 0);
    const sr = (volcano ? 2000 : 2800) * scale(z);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.5 * (1 - fog * 0.5) * (0.85 + 0.15 * Math.sin(t * 1.3 + seed));
    ctx.drawImage(puff(volcano ? [190, 60, 40] : [230, 120, 50]), sx - sr, sy - sr * 0.5, sr * 2, sr);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}
