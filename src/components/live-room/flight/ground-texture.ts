import type { ScenePalette } from '@/components/world-flight/arrival-scene/types';
import { hexToRgb, mixRgb } from '@/components/live-room/flight/cockpit-sky';

/**
 * Procedural ground for the cockpit view. The farmland is a large, seamlessly
 * tiling patchwork (fields of many sizes and crops, hedgerows, woods, villages,
 * a road and a river) whose character follows the region below: small mixed
 * fields in Europe, big squares and irrigation circles in the Americas and
 * Australia, bright rice paddies in Asia, dry plots and scattered trees in
 * Africa. A separate large-scale light/dark texture, drawn at an unrelated
 * scale, breaks up any repetition on every terrain.
 */

type RGB = [number, number, number];
type FarmStyle = 'patchwork' | 'grid' | 'paddies' | 'savanna' | 'city';

export const FARM_TEXTURE_SIZE = 1024;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function farmStyleFor(region: string | null | undefined): FarmStyle {
  const r = region ?? '';
  if (r.startsWith('city:')) return 'city';
  if (/Asia|Japan|Taiwan|Hainan|Philippines|Borneo|Sumatra|Java|Sulawesi|Sri Lanka/.test(r)) return 'paddies';
  if (/North America|South America|Australia/.test(r)) return 'grid';
  if (/Africa|Madagascar/.test(r)) return 'savanna';
  return 'patchwork';
}

const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

const CROPS: Record<FarmStyle, RGB[]> = {
  patchwork: [[108, 148, 72], [84, 124, 58], [196, 174, 96], [222, 206, 110], [140, 108, 74], [128, 142, 80], [160, 176, 96]],
  grid: [[206, 180, 106], [178, 150, 92], [120, 150, 76], [96, 132, 66], [150, 120, 84], [190, 196, 120]],
  paddies: [[96, 170, 84], [120, 186, 90], [72, 148, 78], [104, 160, 120], [150, 190, 100], [86, 140, 110]],
  savanna: [[176, 150, 96], [150, 132, 84], [128, 122, 72], [190, 164, 110], [112, 118, 70]],
  city: [[150, 148, 144], [176, 170, 160], [128, 126, 124], [196, 188, 176], [160, 118, 96], [210, 206, 198]],
};
const FIELD_SIZE: Record<FarmStyle, [number, number]> = {
  patchwork: [28, 150],
  grid: [110, 280],
  paddies: [18, 80],
  savanna: [60, 220],
  city: [20, 60],
};

/** Fill the square with irregular fields by recursive splitting. */
function fields(R: () => number, style: FarmStyle): Array<[number, number, number, number]> {
  const [min, max] = FIELD_SIZE[style];
  const out: Array<[number, number, number, number]> = [];
  const split = (x: number, y: number, w: number, h: number) => {
    const big = Math.max(w, h);
    if (big <= max && (big < min * 2 || R() < 0.35)) { out.push([x, y, w, h]); return; }
    const vertical = w > h ? R() < 0.8 : R() < 0.2;
    const k = 0.3 + R() * 0.4;
    if (vertical) { const a = Math.round(w * k); split(x, y, a, h); split(x + a, y, w - a, h); }
    else { const a = Math.round(h * k); split(x, y, w, a); split(x, y + a, w, h - a); }
  };
  split(0, 0, FARM_TEXTURE_SIZE, FARM_TEXTURE_SIZE);
  return out;
}

/** Draw a shape at its position and wrapped copies, so features cross the tile edge seamlessly. */
function wrapped(S: number, x: number, y: number, r: number, draw: (x: number, y: number) => void) {
  for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
    const px = x + ox, py = y + oy;
    if (px + r >= 0 && px - r <= S && py + r >= 0 && py - r <= S) draw(px, py);
  }
}

export function farmTexture(region: string | null | undefined, palette: ScenePalette, night: boolean): HTMLCanvasElement {
  const S = FARM_TEXTURE_SIZE;
  const style = farmStyleFor(region);
  const R = rng(hash(`${region ?? ''}|${style}`));
  const land = hexToRgb(palette.terrainTop);
  const water = hexToRgb(palette.waterTop);
  const dim = (c: RGB): RGB => (night ? mixRgb(c, [8, 12, 26], 0.55) : c);
  const tint = (c: RGB): RGB => dim(mixRgb(c, land, 0.22));

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  if (style === 'city') return cityTexture(g, R, dim, water);
  g.fillStyle = css(tint(CROPS[style][0]));
  g.fillRect(0, 0, S, S);

  const crops = CROPS[style];
  for (const [x, y, w, h] of fields(R, style)) {
    const crop = crops[Math.floor(R() * crops.length)];
    const shade = 0.85 + R() * 0.3;
    const c = tint([crop[0] * shade, crop[1] * shade, crop[2] * shade]);
    g.fillStyle = css(c);
    g.fillRect(x, y, w, h);
    // furrows / crop rows
    if (style !== 'savanna' && R() < 0.6) {
      g.strokeStyle = css(mixRgb(c, [30, 30, 20], 0.18), 0.55);
      g.lineWidth = 1;
      const across = R() < 0.5;
      const gap = style === 'paddies' ? 4 : 5 + Math.floor(R() * 4);
      g.beginPath();
      if (across) for (let yy = y + gap; yy < y + h; yy += gap) { g.moveTo(x + 1, yy); g.lineTo(x + w - 1, yy); }
      else for (let xx = x + gap; xx < x + w; xx += gap) { g.moveTo(xx, y + 1); g.lineTo(xx, y + h - 1); }
      g.stroke();
    }
    // paddies catch the sky
    if (style === 'paddies' && R() < 0.3) {
      g.fillStyle = css(dim(mixRgb(water, c, 0.45)), 0.75);
      g.fillRect(x + 2, y + 2, w - 4, h - 4);
    }
    // centre-pivot irrigation circles
    if (style === 'grid' && R() < 0.35 && w > 90 && h > 90) {
      const r = Math.min(w, h) / 2 - 4;
      g.fillStyle = css(tint(R() < 0.5 ? [96, 140, 64] : [150, 170, 86]));
      g.beginPath(); g.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2); g.fill();
    }
    // hedgerows / bunds (internal edges only, so the tile edge stays invisible)
    g.strokeStyle = css(dim(style === 'paddies' ? [70, 110, 60] : style === 'savanna' ? [120, 104, 70] : [58, 82, 44]), style === 'grid' ? 0.35 : 0.8);
    g.lineWidth = style === 'patchwork' ? 2 : 1;
    g.beginPath();
    if (x > 0) { g.moveTo(x, y); g.lineTo(x, y + h); }
    if (y > 0) { g.moveTo(x, y); g.lineTo(x + w, y); }
    g.stroke();
  }

  // Farm lanes along the tile edges, so where the texture wraps reads as a
  // straight country lane, not a seam.
  g.fillStyle = css(dim(style === 'paddies' ? [150, 150, 120] : [178, 164, 128]));
  g.fillRect(0, 0, 2, S); g.fillRect(S - 2, 0, 2, S);
  g.fillRect(0, 0, S, 2); g.fillRect(0, S - 2, S, 2);

  // River: meanders across, periodic so it joins itself at the tile edge.
  const riverY = S * (0.2 + R() * 0.6);
  const amp = 30 + R() * 60, phase = R() * Math.PI * 2, k = (2 * Math.PI * (1 + Math.floor(R() * 2))) / S;
  g.strokeStyle = css(dim(mixRgb(water, [40, 70, 90], 0.25)));
  g.lineWidth = style === 'grid' ? 5 : 7;
  g.lineCap = 'round';
  g.beginPath();
  for (let x = -8; x <= S + 8; x += 8) {
    const y = riverY + Math.sin(x * k + phase) * amp + Math.sin(x * k * 3 + phase * 2) * amp * 0.25;
    if (x < 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();

  // Road: straighter, crossing the other way.
  const roadX = S * (0.15 + R() * 0.7);
  g.strokeStyle = css(dim([196, 188, 170]), 0.9);
  g.lineWidth = 3;
  g.beginPath();
  for (let y = -8; y <= S + 8; y += 16) {
    const x = roadX + Math.sin((y / S) * Math.PI * 2 + phase) * 24;
    if (y < 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();

  // Woods and scattered trees.
  const clumps = style === 'grid' ? 10 : style === 'savanna' ? 4 : 26;
  for (let i = 0; i < clumps; i++) {
    const cx = R() * S, cy = R() * S, n = 6 + Math.floor(R() * 26), spread = 10 + R() * 34;
    for (let j = 0; j < n; j++) {
      const tx = cx + (R() - 0.5) * spread * 2, ty = cy + (R() - 0.5) * spread * 2, r = 3 + R() * 5;
      wrapped(S, tx, ty, r, (px, py) => {
        g.fillStyle = css(dim(mixRgb([44, 78, 40], [70, 100, 50], R())));
        g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
      });
    }
  }
  if (style === 'savanna') {
    for (let i = 0; i < 220; i++) {
      const r = 2 + R() * 3;
      wrapped(S, R() * S, R() * S, r, (px, py) => {
        g.fillStyle = css(dim([78, 96, 52]));
        g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
      });
    }
  }

  // Villages along the road.
  for (let i = 0; i < 4; i++) {
    const vy = R() * S, vx = roadX + Math.sin((vy / S) * Math.PI * 2 + phase) * 24;
    for (let j = 0; j < 18; j++) {
      const hx = vx + (R() - 0.5) * 60, hy = vy + (R() - 0.5) * 60;
      wrapped(S, hx, hy, 6, (px, py) => {
        g.fillStyle = css(dim(R() < 0.5 ? [176, 96, 76] : [214, 206, 192]));
        g.fillRect(px - 2.5, py - 2, 5, 4);
      });
    }
  }
  return canvas;
}

/** A city seen from above: street grid, blocks of rooftops, parks, a highway and a river. */
function cityTexture(g: CanvasRenderingContext2D, R: () => number, dim: (c: RGB) => RGB, water: RGB): HTMLCanvasElement {
  const S = FARM_TEXTURE_SIZE;
  const street = dim([92, 94, 100]);
  g.fillStyle = css(street);
  g.fillRect(0, 0, S, S);
  // Irregular street grid: lines at 0 and S so the tile edge is just another street.
  const cuts = (n: number) => {
    const out = [0];
    while (out[out.length - 1] < S - 40) out.push(Math.min(S, out[out.length - 1] + 28 + Math.floor(R() * 44)));
    out[out.length - 1] = S;
    return out.slice(0, n);
  };
  const xs = cuts(99), ys = cuts(99);
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x = xs[i] + 3, y = ys[j] + 3, w = xs[i + 1] - xs[i] - 6, h = ys[j + 1] - ys[j] - 6;
    if (w <= 0 || h <= 0) continue;
    if (R() < 0.07) {
      g.fillStyle = css(dim([84, 132, 70]));               // park
      g.fillRect(x, y, w, h);
      for (let k = 0; k < 6; k++) { g.fillStyle = css(dim([56, 96, 50])); g.beginPath(); g.arc(x + R() * w, y + R() * h, 2 + R() * 3, 0, Math.PI * 2); g.fill(); }
      continue;
    }
    // A block of buildings: rooftops of different sizes, each with a small shadow.
    g.fillStyle = css(dim([120, 118, 116]));
    g.fillRect(x, y, w, h);
    const n = 2 + Math.floor(R() * 6);
    for (let k = 0; k < n; k++) {
      const bw = 6 + R() * Math.min(28, w), bh = 6 + R() * Math.min(28, h);
      const bx = x + R() * Math.max(1, w - bw), by = y + R() * Math.max(1, h - bh);
      const roof = CROPS.city[Math.floor(R() * CROPS.city.length)];
      g.fillStyle = 'rgba(20,22,28,0.35)';
      g.fillRect(bx + 2, by + 2, bw, bh);
      g.fillStyle = css(dim(roof));
      g.fillRect(bx, by, bw, bh);
    }
  }
  // River and a highway across town.
  const riverY = S * (0.25 + R() * 0.5), phase = R() * Math.PI * 2;
  g.strokeStyle = css(dim(water));
  g.lineWidth = 16;
  g.beginPath();
  for (let x = -8; x <= S + 8; x += 8) { const y = riverY + Math.sin((x / S) * Math.PI * 2 + phase) * 50; if (x < 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke();
  g.strokeStyle = css(dim([210, 204, 190]));
  g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, S * 0.1); g.lineTo(S, S * 0.1); g.stroke();
  return g.canvas;
}

/** Large, soft light/dark blotches (tileable value noise) drawn at a scale unrelated to the ground's. */
let macroCache: HTMLCanvasElement | null = null;
export function macroTexture(): HTMLCanvasElement {
  if (macroCache) return macroCache;
  const N = 16, S = 256;
  const R = rng(7919);
  const lattice = Array.from({ length: N * N }, () => R());
  const at = (i: number, j: number) => lattice[((j % N) + N) % N * N + (((i % N) + N) % N)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v = 0, amp = 0.6, freq = 1;
    for (let o = 0; o < 3; o++) {
      const fx = (x / S) * N * freq, fy = (y / S) * N * freq;
      const i = Math.floor(fx), j = Math.floor(fy), tx = smooth(fx - i), ty = smooth(fy - j);
      const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
      v += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      amp *= 0.5; freq *= 2;
    }
    const l = Math.max(0, Math.min(255, v * 255 / 1.05));
    const p = (y * S + x) * 4;
    img.data[p] = l; img.data[p + 1] = l; img.data[p + 2] = l; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  macroCache = canvas;
  return canvas;
}
