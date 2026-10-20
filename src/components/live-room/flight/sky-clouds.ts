/**
 * The sea of clouds (Oct 2026): fair-weather cloud tops floating between the ground and the plane, seen from above,
 * receding to the horizon in perspective, with gaps where the land shows and their shadows on the ground. How many
 * follows the real cloud cover. Lit like everything else: white by day, warm at dusk (the sky's horizon colour on the
 * tops), dim and blue by moonlight. Each cloud is a small picture made once per light and drawn scaled.
 */

type RGB = [number, number, number];

/** The sea of clouds (approved by the owner 20 Oct 2026). */
let SKY_CLOUDS = true;
export function setSkyClouds(on: boolean) { SKY_CLOUDS = on; }
export const skyClouds = () => SKY_CLOUDS;

export interface SkyCloud { x: number; z: number; y: number; size: number; seed: number }

/** Height of the cloud tops (world units; the plane cruises at 3200, the ground is 0). */
export const CLOUD_Y_MIN = 1300, CLOUD_Y_MAX = 2000;

const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const PIC_W = 220, PIC_H = 110, KINDS = 8;
const pics = new Map<string, HTMLCanvasElement>();

/** One cloud seen from above and a little to the side: overlapping puffs, sunlit tops, a shaded lower edge. */
function cloudPicture(kind: number, lit: RGB, shade: RGB): HTMLCanvasElement {
  const key = `${kind}|${lit.map((v) => Math.round(v / 8)).join(',')}|${shade.map((v) => Math.round(v / 8)).join(',')}`;
  const hit = pics.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = PIC_W; c.height = PIC_H;
  const g = c.getContext('2d');
  if (!g) return c;
  const puffs = 7 + Math.floor(hash(kind * 3.1) * 6);
  const css = (col: RGB, a: number) => `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
  const blobs = Array.from({ length: puffs }, (_, i) => {
    const t = (i + 0.5) / puffs;
    return {
      x: PIC_W * (0.14 + t * 0.72 + (hash(kind * 7 + i) - 0.5) * 0.12),
      y: PIC_H * (0.55 + (hash(kind * 11 + i) - 0.5) * 0.3 - Math.sin(t * Math.PI) * 0.12),
      r: PIC_H * (0.18 + Math.sin(t * Math.PI) * 0.16 + hash(kind * 13 + i) * 0.08),
    };
  });
  // shadowed underside first (offset down), then the lit tops over it
  for (const b of blobs) {
    const gr = g.createRadialGradient(b.x, b.y + b.r * 0.35, 0, b.x, b.y + b.r * 0.35, b.r * 1.05);
    gr.addColorStop(0, css(shade, 0.95)); gr.addColorStop(0.75, css(shade, 0.85)); gr.addColorStop(1, css(shade, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y + b.r * 0.35, b.r * 1.05, 0, Math.PI * 2); g.fill();
  }
  for (const b of blobs) {
    const gr = g.createRadialGradient(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
    gr.addColorStop(0, css(mix(lit, [255, 255, 255], 0.25), 1)); gr.addColorStop(0.7, css(lit, 0.95)); gr.addColorStop(1, css(lit, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
  }
  pics.set(key, c);
  if (pics.size > 64) { const k = pics.keys().next().value; if (k) pics.delete(k); }
  return c;
}

/** The cloud colours for this light: `glow` is the sky's colour at the horizon (warm at dusk). */
export function cloudLight(night: boolean, glow: RGB, haze: RGB): { lit: RGB; shade: RGB } {
  if (night) return { lit: [128, 140, 176], shade: [44, 52, 78] };
  const warm = Math.max(0, glow[0] - glow[2]) / 255;          // dusk: the horizon is much redder than blue
  const lit = mix([250, 250, 252], mix(glow, [255, 214, 180], 0.4), Math.min(0.75, warm * 1.6));
  const shade = mix(mix([150, 164, 190], haze, 0.3), [120, 100, 120], Math.min(0.5, warm));
  return { lit, shade };
}

const shadows = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** The cloud's silhouette, dark and soft: its shadow on the ground. */
function shadowOf(pic: HTMLCanvasElement): HTMLCanvasElement {
  const hit = shadows.get(pic);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = pic.width; c.height = pic.height;
  const g = c.getContext('2d');
  if (g) { g.filter = 'blur(4px)'; g.drawImage(pic, 0, 0); g.filter = 'none'; g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(16,24,36)'; g.fillRect(0, 0, c.width, c.height); }
  shadows.set(pic, c);
  return c;
}
const veils = new WeakMap<HTMLCanvasElement, { key: string; c: HTMLCanvasElement }>();
/** The cloud's shape filled with the haze colour (cached per picture). */
function hazeVeil(pic: HTMLCanvasElement, haze: RGB): HTMLCanvasElement {
  const key = haze.map((v) => Math.round(v / 16)).join(',');
  const hit = veils.get(pic);
  if (hit && hit.key === key) return hit.c;
  const c = document.createElement('canvas');
  c.width = pic.width; c.height = pic.height;
  const g = c.getContext('2d');
  if (g) { g.drawImage(pic, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = `rgb(${haze[0] | 0},${haze[1] | 0},${haze[2] | 0})`; g.fillRect(0, 0, c.width, c.height); }
  veils.set(pic, { key, c });
  return c;
}

/** Draw one cloud (and its shadow on the ground) at its place in the world. */
export function drawSkyCloud(
  ctx: CanvasRenderingContext2D, c: SkyCloud, proj: (x: number, z: number, y?: number) => [number, number], camZ: number,
  F: number, light: { lit: RGB; shade: RGB }, haze: RGB, fog: number, alpha: number, night: boolean,
) {
  const rz = c.z - camZ;
  if (rz <= 400) return;
  const s = F / rz;
  const w = c.size * s, h = w * 0.5;
  const [cx, cy] = proj(c.x, c.z, c.y);
  // its shadow on the ground, soft, offset away from the light (from the left)
  ctx.save();
  // its shadow on the ground, in the cloud's own shape laid flat (near clouds only: far away it cannot be seen)
  const pic = cloudPicture(c.seed % KINDS, light.lit, light.shade);
  if (rz < 30000) {
    const [gx, gy] = proj(c.x + c.size * 0.35, c.z, 0);
    const flat = Math.max(0.16, Math.min(0.5, (3200 * s) / (F * 0.5)));
    ctx.globalAlpha = alpha * (night ? 0.16 : 0.3) * (1 - fog);
    ctx.drawImage(shadowOf(pic), gx - w * 0.5, gy - h * flat * 0.5, w, h * flat);
  }
  // the cloud (one picture per shape and light, reused), then the haze laid over it with distance: remaking the
  // picture for every distance was what made the sky slow
  ctx.globalAlpha = alpha * (1 - fog * 0.35);
  ctx.drawImage(pic, cx - w / 2, cy - h * 0.6, w, h);
  if (fog > 0.05) {
    ctx.globalAlpha = alpha * (1 - fog * 0.35) * fog * 0.75;
    ctx.drawImage(hazeVeil(pic, haze), cx - w / 2, cy - h * 0.6, w, h);
  }
  ctx.restore();
}
