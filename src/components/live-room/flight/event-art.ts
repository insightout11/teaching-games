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

/** A soft teardrop flame (orange to yellow core), made once. */
let flameImg: HTMLCanvasElement | null = null;
function flame(): HTMLCanvasElement {
  if (flameImg) return flameImg;
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(16, 50, 1, 16, 44, 30);
    r.addColorStop(0, 'rgba(255,240,170,1)');
    r.addColorStop(0.3, 'rgba(255,170,60,0.95)');
    r.addColorStop(0.7, 'rgba(230,80,20,0.6)');
    r.addColorStop(1, 'rgba(200,40,10,0)');
    g.fillStyle = r;
    g.beginPath();
    g.moveTo(16, 0);
    g.bezierCurveTo(26, 22, 32, 40, 28, 54);
    g.quadraticCurveTo(16, 66, 4, 54);
    g.bezierCurveTo(0, 40, 6, 22, 16, 0);
    g.fill();
  }
  flameImg = c;
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
  /** A volcano's summit height (world units): the plume rises from there. */ ventTop = 1700,
) {
  ctx.save();
  const sc = scale(z);
  const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  if (kind === 'storm') {
    // a towering storm cell: dark base, rain falling below it, billows climbing high and a wide flat anvil on top
    const lit: RGB = night ? [80, 86, 112] : [244, 246, 250], shade: RGB = night ? [18, 20, 32] : [58, 64, 82];
    const baseY = 2600, topY = 11500;
    // rain shafts: soft grey streaks from the dark base to the ground
    for (let k = 0; k < 7; k++) {
      const off = (hash(seed + 40 + k) - 0.5) * 9000;
      const [ax, ay] = proj(x + off, z, baseY);
      const [bx, by] = proj(x + off - 1400, z, 0);
      const wpx = (1600 + hash(seed + 60 + k) * 1400) * sc;
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      const rc = mix(night ? [30, 34, 48] : [100, 108, 126], haze, fog * 0.6);
      g.addColorStop(0, rgba(rc, 0.55 * alpha)); g.addColorStop(1, rgba(rc, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ax - wpx / 2, ay); ctx.lineTo(ax + wpx / 2, ay); ctx.lineTo(bx + wpx / 2, by); ctx.lineTo(bx - wpx / 2, by);
      ctx.fill();
    }
    const n = 44;
    for (let k = 0; k < n; k++) {
      const f = k / (n - 1);
      const anvil = f > 0.8;
      const y = baseY + f * (topY - baseY);
      const spread = anvil ? 1 + (f - 0.8) * 22 : 1 + f * 0.6;
      const along = (hash(seed + k) - 0.5) * 8000 * spread + (anvil ? (f - 0.8) * 30000 : 0);
      const r = (2600 + hash(seed * 3 + k) * 2000) * (anvil ? 1.2 : 1);
      const [sx, sy] = proj(x + along, z, y);
      const sr = r * sc;
      const col = mix(mix(shade, lit, Math.min(1, f * f * 1.1)), haze, fog * 0.3);
      ctx.globalAlpha = alpha * (1 - fog * 0.3);
      ctx.drawImage(puff(col), sx - sr, sy - sr * (anvil ? 0.45 : 0.8), sr * 2, sr * (anvil ? 0.9 : 1.6));
    }
    // a soft flicker of lightning inside every few seconds
    const flick = Math.sin(t * 1.1 + seed) > 0.97 || Math.sin(t * 2.7 + seed * 2) > 0.99;
    if (flick) {
      const [sx, sy] = proj(x + (hash(Math.floor(t)) - 0.5) * 5000, z, 5000 + hash(Math.floor(t) + 1) * 4000);
      const sr = 7000 * sc;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.7 * (1 - fog * 0.4);
      ctx.drawImage(puff([200, 210, 255]), sx - sr, sy - sr, sr * 2, sr * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    return;
  }
  const volcano = kind === 'volcano';
  let ventY = 0;
  const ventX = x;
  if (volcano) {
    // the mountain is the shared volcano landmark, drawn just before this; here only the crater's glow
    const sr = 700 * sc;
    const [cx, cy] = proj(x, z, ventTop);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (night ? 0.8 : 0.35) * (1 - fog * 0.5) * (0.85 + 0.15 * Math.sin(t * 1.3 + seed));
    ctx.drawImage(puff([230, 80, 30]), cx - sr, cy - sr * 0.5, sr * 2, sr);
    ctx.globalCompositeOperation = 'source-over';
    ventY = ventTop;
  } else {
    // the burnt ground and the fire front: a line of flickering flames along the edge of the burn
    const [bx, by] = proj(x, z + 1500, 0);
    const bw = 7000 * sc;
    ctx.globalAlpha = alpha * 0.6 * (1 - fog * 0.5);
    ctx.drawImage(puff(night ? [10, 8, 8] : [52, 44, 36]), bx - bw, by - bw * 0.18, bw * 2, bw * 0.36);
    ctx.globalCompositeOperation = 'lighter';
    const nf = 40;
    for (let k = 0; k < nf; k++) {
      const u = k / (nf - 1) - 0.5;
      const fx = x + u * 12000, fz = z - Math.cos(u * 3) * 600 + (hash(seed + k) - 0.5) * 700;
      const [sx, sy] = proj(fx, fz, 0);
      const h = Math.max(2, (170 + 90 * Math.sin(t * (3 + hash(k) * 3) + k * 1.7)) * sc);
      ctx.globalAlpha = alpha * (night ? 1 : 0.85) * (1 - fog * 0.5);
      ctx.drawImage(flame(), sx - h * 0.3, sy - h, h * 0.6, h * 1.05);
    }
    // the glow over the front
    const [gx, gy] = proj(x, z, 300);
    const gr = 3000 * sc;
    ctx.globalAlpha = alpha * (night ? 0.6 : 0.25) * (1 - fog * 0.5);
    ctx.drawImage(puff([240, 120, 40]), gx - gr, gy - gr * 0.3, gr * 2, gr * 0.6);
    ctx.globalCompositeOperation = 'source-over';
  }
  // smoke (fire) or ash and steam (volcano): a column of puffs rising from the vent or the front and leaning downwind
  const base: RGB = volcano ? (night ? [44, 42, 48] : [96, 92, 96]) : (night ? [56, 50, 50] : [120, 104, 90]);
  const top: RGB = volcano ? (night ? [90, 92, 106] : [214, 214, 220]) : (night ? [76, 76, 86] : [200, 192, 180]);
  const n = volcano ? 16 : 14;
  const height = volcano ? 5000 : 6000;
  for (let k = 0; k < n; k++) {
    const f = k / (n - 1);
    const drift = Math.sin(t * 0.08 + seed + k * 0.6) * 440;
    const along = f * f * (volcano ? 6000 : 14000) + drift;
    const y = ventY + 120 + f * height;
    const r = (volcano ? 450 : 1400) + f * (volcano ? 2000 : 4000);
    const [sx, sy] = proj(ventX + along + (volcano ? 0 : (hash(seed + k * 7) - 0.5) * 6000 * (1 - f)), z + f * 900, y);
    const sr = r * sc;
    ctx.globalAlpha = alpha * (0.95 - f * 0.45) * (1 - fog * 0.3);
    ctx.drawImage(puff(mix(mix(base, top, f), haze, fog * 0.7)), sx - sr, sy - sr * 0.8, sr * 2, sr * 1.6);
  }
  ctx.restore();
}
