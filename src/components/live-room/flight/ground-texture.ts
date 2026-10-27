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
  if (r.startsWith('city:') || r.startsWith('town:')) return 'city';
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

export function farmTexture(region: string | null | undefined, palette: ScenePalette, night: boolean, waterFeatures = true): HTMLCanvasElement {
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
  if (style === 'city') return cityTexture((region ?? '').slice(5), palette, night, (region ?? '').startsWith('town:'), waterFeatures);
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
    if (style === 'paddies' && R() < 0.3 && waterFeatures) {
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
  if (waterFeatures) g.stroke();

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

type CityPlan = 'grid' | 'organic' | 'dense';

/** Street plan by where in the world the city is, not which city: American and Australian grids, tight Asian and African blocks, organic European and other layouts. */
function cityPlanFor(continent: string): CityPlan {
  if (/North America|South America|Australia|Oceania/.test(continent)) return 'grid';
  if (/Asia|Africa/.test(continent)) return 'dense';
  return 'organic';
}

/**
 * A city from above: a dense core of tall, grey, shadow-casting blocks thinning through ordinary blocks and
 * garden suburbs into fields, laid out in districts that each have their own street grid (one grid for American
 * cities, twisting grids for European ones, tight small blocks for Asian ones), with a ring road, two highways and
 * a river. Lit from the upper left; at night the streets and windows glow. Tiles seamlessly.
 */
function cityTexture(place: string, palette: ScenePalette, night: boolean, town = false, waterFeatures = true): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  // `place` is "Name|Continent": the name only seeds this city's own layout; the continent picks the street plan.
  const [name, continent = ''] = place.split('|');
  const plan = cityPlanFor(continent);
  const R = rng(hash(`city|${name}`));
  const size = town ? 0.28 + R() * 0.1 : 0.8 + R() * 0.4;          // some cities sprawl further across the tile than others
  const land = hexToRgb(palette.terrainTop);
  const leaf = hexToRgb(palette.foliage);
  const dim = (c: RGB): RGB => (night ? mixRgb(c, [6, 10, 22], 0.75) : c);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hsh = (a: number, b: number, c: number) => {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // Districts: each owns a street grid with its own angle and block size. Nearest centre wins, wrapping at the edges.
  const P = plan === 'grid' ? { bw: [10, 15], bh: [14, 22], sw: 1.5, turn: 0.04 } : plan === 'dense' ? { bw: [5, 8], bh: [6, 10], sw: 1.0, turn: 0.3 } : { bw: [7, 12], bh: [8, 15], sw: 1.2, turn: 1.4 };
  const baseAngle = R() * Math.PI;
  const districts = Array.from({ length: plan === 'grid' ? 10 : 18 }, () => {
    const angle = baseAngle + (R() - 0.5) * P.turn * Math.PI;
    return { x: R() * N, y: R() * N, cos: Math.cos(angle), sin: Math.sin(angle), bw: P.bw[0] + R() * (P.bw[1] - P.bw[0]), bh: P.bh[0] + R() * (P.bh[1] - P.bh[0]) };
  });
  // City centre and a smaller second centre; density falls away from them, broken up by noise.
  const cu = 0.3 + R() * 0.4, cv = 0.3 + R() * 0.4, c2u = (cu + 0.5) % 1, c2v = (cv + 0.35) % 1;
  const n3 = tileNoise(3, 311), n7 = tileNoise(7, 313), park = tileNoise(6, 317), field = tileNoise(5, 331), grain = tileNoise(96, 337);
  const wrapD = (a: number, b: number) => { const d = Math.abs(a - b); return Math.min(d, 1 - d); };
  const urbanAt = (u: number, v: number) => {
    const d1 = Math.hypot(wrapD(u, cu), wrapD(v, cv)), d2 = Math.hypot(wrapD(u, c2u), wrapD(v, c2v));
    return Math.max(0, Math.min(town ? 0.8 : 1.2, Math.max(1.45 - d1 / (0.42 * size), 1.1 - d2 / (0.26 * size)) + (n3(u, v) - 0.5) * 0.55 + (n7(u, v) - 0.5) * 0.25));
  };

  const asphalt: RGB = dim([88, 90, 96]);
  const garden = dim(mixRgb(leaf, [112, 142, 84], 0.7));
  const green = dim(mixRgb(leaf, [70, 118, 66], 0.7));
  const coreRoof: RGB[] = [[150, 154, 162], [176, 180, 190], [128, 134, 146], [200, 202, 210]];
  const midRoof: RGB[] = [[158, 112, 98], [150, 150, 154], [196, 186, 172], [124, 116, 112], [176, 150, 120]];
  const homeRoof: RGB[] = [[156, 104, 88], [142, 142, 148], [198, 192, 184], [120, 100, 90]];
  const crops: RGB[] = [mixRgb(land, [190, 170, 110], 0.7), mixRgb(land, [128, 156, 90], 0.7), mixRgb(land, [160, 138, 96], 0.7), mixRgb(land, [104, 140, 76], 0.7)];

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    // Nearest district (wrapped), and this pixel in that district's tilted grid.
    let best = 0, bd = 1e9, bdx = 0, bdy = 0;
    for (let i = 0; i < districts.length; i++) {
      let dx = x - districts[i].x, dy = y - districts[i].y;
      dx -= Math.round(dx / N) * N; dy -= Math.round(dy / N) * N;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; bdx = dx; bdy = dy; }
    }
    const D = districts[best];
    const rx = (bdx * D.cos + bdy * D.sin) / D.bw, ry = (-bdx * D.sin + bdy * D.cos) / D.bh;
    const bi = Math.floor(rx), bj = Math.floor(ry), fx = rx - bi, fy = ry - bj;
    const h = hsh(best, bi, bj);
    const urban = urbanAt(u, v);
    const road = fx < P.sw / D.bw || fy < P.sw / D.bh;
    const sp = (grain(u, v) - 0.5) * 0.1;
    const parkBlock = h < 0.06 + step(0.55, 0.8, park(u, v)) * 0.25;
    const hx = hsh(x, y, 7);
    let c: RGB;
    if (urban < 0.22 + h * 0.08) {
      // Outskirts: fields and the odd lane.
      c = dim(crops[Math.floor(h * 4) % 4]);
      if (road && h < 0.25) c = asphalt;
      c = mixRgb(c, dim(leaf), step(0.55, 0.8, field(u, v)) * 0.3);
    } else if (road) {
      c = asphalt;
      if (night) c = mixRgb(c, [255, 196, 120], Math.min(1, urban * 1.3 * (0.7 + hsh(bi, bj, 3))));
    } else if (parkBlock) {
      c = hx < 0.12 ? dim([46, 88, 46]) : green;
    } else if (urban > 0.85) {
      // Core: tall pale blocks; the taller, the longer the shadow on the lower right.
      const tall = 0.4 + h * 0.6;
      c = dim(coreRoof[Math.floor(h * 977) % coreRoof.length]);
      const edge = Math.max(fx, fy);
      if (edge > 1 - tall * 0.4) c = mixRgb(c, [20, 22, 34], 0.55);
      else if (fx < 0.18 || fy < 0.18) c = mixRgb(c, [255, 250, 240], 0.2);
      if (night && hx < 0.3) c = [255, 222, 150];
    } else if (urban > 0.5) {
      c = dim(midRoof[Math.floor(h * 977) % midRoof.length]);
      const edge = Math.max(fx, fy);
      if (edge > 0.78) c = mixRgb(c, [20, 22, 34], 0.4);
      else if (fx < 0.2 || fy < 0.2) c = mixRgb(c, [255, 246, 230], 0.14);
      if (night && hx < 0.2) c = [255, 214, 140];
    } else {
      // Suburb: gardens with a house in each small lot.
      const lx = (fx * 3) % 1, ly = (fy * 2) % 1;
      c = garden;
      if (lx > 0.2 && lx < 0.75 && ly > 0.25 && ly < 0.7) c = dim(homeRoof[Math.floor(hsh(bi, bj, Math.floor(fx * 3) + Math.floor(fy * 2) * 3) * 977) % homeRoof.length]);
      if (night && hx < 0.1) c = [255, 206, 130];
    }
    const l = 1 + sp;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, c[0] * l); img.data[p + 1] = Math.min(255, c[1] * l); img.data[p + 2] = Math.min(255, c[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);

  // A river with pale banks, two highways out of the centre and a ring road, all wrapped across the tile edge.
  const copies = (draw: (ox: number, oy: number) => void) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) draw(ox, oy); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  const water = dim(mixRgb(hexToRgb(palette.waterTop), [48, 104, 140], 0.6));
  const riverY = S * (0.1 + R() * 0.8), phase = R() * Math.PI * 2, amp = 60 + R() * 60;
  const riverPts: Array<[number, number]> = [];
  for (let x = -16; x <= S + 16; x += 16) riverPts.push([x, riverY + Math.sin((x / S) * Math.PI * 2 + phase) * amp + Math.sin((x / S) * Math.PI * 6 + phase * 2) * 14]);
  const strokeLine = (pts: Array<[number, number]>, color: string, width: number) => {
    g.strokeStyle = color; g.lineWidth = width;
    copies((ox, oy) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy))); g.stroke(); });
  };
  if (waterFeatures) {
    strokeLine(riverPts, css(dim([200, 196, 176])), 34);
    strokeLine(riverPts, css(water), 24);
  }
  const highway = (angle: number) => {
    const pts: Array<[number, number]> = [[cu * S, cv * S]];
    let px = cu * S, py = cv * S, a = angle;
    for (let k = 0; k < 40; k++) { a += (R() - 0.5) * 0.18; px += Math.cos(a) * 26; py += Math.sin(a) * 26; pts.push([px, py]); }
    strokeLine(pts, night ? 'rgba(255,214,140,0.85)' : css(dim([214, 208, 192])), 6);
  };
  if (town) return canvas;
  highway(R() * Math.PI * 2);
  highway(R() * Math.PI * 2);
  const ring: Array<[number, number]> = [];
  for (let k = 0; k <= 48; k++) { const t = (k / 48) * Math.PI * 2; ring.push([cu * S + Math.cos(t) * 190 * (1 + 0.08 * Math.sin(t * 3 + phase)), cv * S + Math.sin(t) * 150 * (1 + 0.1 * Math.cos(t * 2 + phase))]); }
  strokeLine(ring, night ? 'rgba(255,214,140,0.8)' : css(dim([206, 200, 186])), 5);
  return canvas;
}

/** Smooth noise that repeats exactly every `cells` lattice cells, so textures built from it tile. */
function tileNoise(cells: number, seed: number) {
  const R = rng(seed);
  const lattice = Array.from({ length: cells * cells }, () => R());
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const fx = u * cells, fy = v * cells;
    const i = Math.floor(fx), j = Math.floor(fy), tx = smooth(fx - i), ty = smooth(fy - j);
    const i0 = ((i % cells) + cells) % cells, j0 = ((j % cells) + cells) % cells;
    const i1 = (i0 + 1) % cells, j1 = (j0 + 1) % cells;
    const a = lattice[j0 * cells + i0], b = lattice[j0 * cells + i1], c = lattice[j1 * cells + i0], d = lattice[j1 * cells + i1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

/**
 * Desert from the air: seas of dunes (long gentle windward slopes, short dark slip faces, crests that wander and
 * merge) broken by flat gravel plains, dark rock outcrops and pale dry riverbeds. Lit from one side so the dunes
 * read as shapes rather than lines. Tiles seamlessly.
 */
export function desertTexture(palette: ScenePalette, night: boolean): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  const land = hexToRgb(palette.terrainTop);
  const sand: RGB = mixRgb(land, [222, 178, 116], 0.78);
  const lit: RGB = mixRgb(sand, [255, 234, 190], 0.4);
  const slip: RGB = mixRgb(sand, [122, 78, 48], 0.6);
  const gravel: RGB = mixRgb(sand, [150, 132, 112], 0.55);
  const rock: RGB = mixRgb(sand, [84, 62, 52], 0.75);
  const warpA = tileNoise(4, 11), warpB = tileNoise(9, 23), region = tileNoise(3, 37), blotch = tileNoise(12, 53), grain = tileNoise(96, 71);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // +1 on a sunlit crest, falling to −1 on the short shadowed slip face behind it.
  const face = (t: number) => (t < 0.74 ? 0.5 + 0.5 * (t / 0.74) : -1 + ((t - 0.74) / 0.26) * 0.9);

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const warp = (warpA(u, v) - 0.5) * 2.6 + (warpB(u, v) - 0.5) * 0.9;
    // Dune crests: whole numbers of waves across the tile, bent by the warp.
    const f = (((v * 6 + u * 2 + warp) % 1) + 1) % 1;
    const f2 = (((v * 17 + u * 4 + warp * 2.3 + 0.37) % 1) + 1) % 1;
    const relief = face(f) * 0.8 + face(f2) * 0.25;
    const dunes = step(0.36, 0.56, region(u, v) + (blotch(u, v) - 0.5) * 0.2);
    const speck = grain(u, v) - 0.5;
    const dune: RGB = relief >= 0 ? mixRgb(sand, lit, Math.min(1, relief)) : mixRgb(sand, slip, Math.min(1, -relief));
    // Gravel plains between the dune seas, with dark rock where the plain is barest.
    const plain = mixRgb(mixRgb(gravel, rock, step(0.58, 0.8, blotch(u + 0.31, v + 0.17)) * 0.85), sand, 0.25 + speck * 0.5);
    const c = mixRgb(plain, dune, dunes);
    const l = 1 + speck * 0.07;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, c[0] * l); img.data[p + 1] = Math.min(255, c[1] * l); img.data[p + 2] = Math.min(255, c[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);

  // Dry riverbeds: pale braided lines that fork, drawn with wrap-around copies so they cross the tile edge cleanly.
  const R = rng(4721);
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(244,226,190,0.34)';
  const wadi = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    let px = x, py = y, a = angle;
    for (let k = 0; k < length; k++) {
      a += (R() - 0.5) * 0.7;
      const nx = px + Math.cos(a) * 26, ny = py + Math.sin(a) * 26;
      g.lineWidth = width;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        g.beginPath(); g.moveTo(px + ox, py + oy); g.lineTo(nx + ox, ny + oy); g.stroke();
      }
      px = nx; py = ny;
      if (depth < 2 && R() < 0.12) wadi(px, py, a + (R() < 0.5 ? 0.8 : -0.8), Math.floor(length * 0.4), width * 0.6, depth + 1);
    }
  };
  for (let i = 0; i < 3; i++) wadi(R() * S, R() * S, R() * Math.PI * 2, 34, 5 + R() * 3, 0);
  if (night) {
    g.fillStyle = 'rgba(8,12,26,0.6)';
    g.fillRect(0, 0, S, S);
  }
  return canvas;
}

/**
 * Open ocean from the air: broad deep and shallow bands, two crossing swells that bend and fade in and out, short
 * wind chop and whitecaps that gather in patches, soft cloud shadows, one small ship with a wake. Lit from the
 * upper left so each swell has a bright face and a dark one. Tiles seamlessly.
 */
export function oceanTexture(palette: ScenePalette, night: boolean): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  // Deep sea is a saturated navy, mid water a rich blue, shallows a turquoise. The palette only tints them a touch: the
  // warm haze at sunset is the engine's job, and must not turn the sea itself beige.
  const tint = hexToRgb(palette.waterTop);
  const deep: RGB = mixRgb([3, 36, 86], tint, 0.06);
  const mid: RGB = mixRgb([6, 80, 132], tint, 0.08);
  const shallow: RGB = mixRgb([22, 126, 152], tint, 0.1);
  const crestC: RGB = [118, 186, 218];
  const troughC: RGB = [2, 22, 60];
  const bands = tileNoise(3, 101), bandsFine = tileNoise(7, 103), warpA = tileNoise(4, 107), warpB = tileNoise(10, 109);
  const windy = tileNoise(4, 131), patch = tileNoise(3, 113), cloud = tileNoise(2, 137), streak = tileNoise(8, 139);
  const grain = tileNoise(128, 149), fleck = tileNoise(64, 151);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const warp = (warpA(u, v) - 0.5) * 0.7 + (warpB(u, v) - 0.5) * 0.22;
    // Depth: slow wide bands from deep navy through blue to turquoise.
    const depth = bands(u, v) * 0.7 + bandsFine(u, v) * 0.3;
    const base = depth < 0.5 ? mixRgb(deep, mid, step(0.15, 0.5, depth)) : mixRgb(mid, shallow, step(0.5, 0.88, depth) * 0.8);
    // One main swell with long, gently bending crests, and a smaller one running a little across it. Near-parallel, so
    // they read as swell lines, not as the cells two crossing sets make.
    const am = 0.55 + 0.45 * step(0.25, 0.7, patch(u, v));
    const fa = v * 6 + u + warp, fb = v * 9 + u * 3 + warp * 1.2 + 0.3;
    const ha = Math.sin(fa * TAU) + 0.3 * Math.sin(fa * TAU * 2 + 1);
    const slope = Math.cos(fa * TAU) * am + Math.cos(fb * TAU) * 0.5;
    // Short wind chop, and long streaks lying along the wind.
    const windiness = step(0.35, 0.7, windy(u + 0.2, v + 0.4));
    const fc = v * 27 + u * 9 + warp * 2.4;
    const chop = Math.cos(fc * TAU) * 0.12 * (0.3 + windiness);
    const lane = (streak(u, v * 5) - 0.5) * 0.25;
    const light = Math.max(-1, Math.min(1, slope + chop + lane));
    let c: RGB = light >= 0 ? mixRgb(base, crestC, light * 0.42) : mixRgb(base, troughC, -light * 0.5);
    // Whitecaps: sparse, short, on the highest crests in the windy patches.
    const crest = ha * am;
    if (crest > 0.9 && windiness > 0.1) {
      const foam = step(0.9, 1.25, crest) * step(0.45, 0.72, fleck(u, v) * 0.6 + grain(u, v) * 0.5) * (0.3 + windiness * 0.7);
      if (foam > 0) c = mixRgb(c, [232, 244, 250], Math.min(0.8, foam));
    }
    // A couple of big soft cloud shadows.
    const cb = cloud(u, v);
    if (cb > 0.5) c = mixRgb(c, mixRgb(c, troughC, 0.7), step(0.62, 0.82, cb + (warpA(u + 0.5, v + 0.5) - 0.5) * 0.3) * 0.35);
    const p = (y * N + x) * 4;
    img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);

  // One small ship with a pale wake, drawn at wrapped positions so it can sit on the tile edge.
  const R = rng(9103);
  const sx = 180 + R() * 660, sy = 180 + R() * 660, heading = 0.5 + R() * 0.8;
  const eachCopy = (draw: () => void) => {
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const x = sx + ox, y = sy + oy;
      if (x < -90 || x > S + 90 || y < -90 || y > S + 90) continue;
      g.save(); g.translate(x, y); g.rotate(heading); draw(); g.restore();
    }
  };
  eachCopy(() => {
    const wake = g.createLinearGradient(0, 0, -70, 0);
    wake.addColorStop(0, 'rgba(232,244,250,0.55)');
    wake.addColorStop(1, 'rgba(232,244,250,0)');
    g.fillStyle = wake;
    g.beginPath(); g.moveTo(-3, 0); g.lineTo(-70, -7); g.lineTo(-70, 7); g.closePath(); g.fill();
    g.fillStyle = 'rgba(8,16,28,0.45)';
    g.fillRect(-7, -2, 15, 5.5);
    g.fillStyle = 'rgb(232,234,238)';
    g.beginPath(); g.moveTo(8, 0); g.lineTo(5, -3); g.lineTo(-8, -3); g.lineTo(-8, 3); g.lineTo(5, 3); g.closePath(); g.fill();
    g.fillStyle = 'rgb(196,70,60)';
    g.fillRect(-6, -2, 5, 4);
  });
  if (night) {
    g.fillStyle = 'rgba(6,10,24,0.58)';
    g.fillRect(0, 0, S, S);
    // The ship keeps its lights on.
    eachCopy(() => {
      g.fillStyle = 'rgba(255,214,140,0.25)'; g.fillRect(-5, -5, 11, 11);
      g.fillStyle = 'rgba(255,214,140,0.95)'; g.fillRect(-1, -1, 3, 3);
    });
  }
  return canvas;
}

/**
 * Forest from the air: a lumpy canopy in dark conifer, mid broadleaf and pale new growth, with hills implied by light
 * and shade (lit from the upper left), darker damp valleys, clearings with fields, a few lakes and a winding river
 * with pale banks. Tiles seamlessly.
 */
export function forestTexture(palette: ScenePalette, night: boolean, waterFeatures = true): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  const leaf = hexToRgb(palette.foliage);
  const deepC: RGB = mixRgb(leaf, [22, 52, 34], 0.82);
  const midC: RGB = mixRgb(leaf, [50, 96, 46], 0.78);
  const lightC: RGB = mixRgb(leaf, [112, 148, 66], 0.7);
  const fieldA: RGB = mixRgb(hexToRgb(palette.terrainTop), [168, 176, 92], 0.8);
  const fieldB: RGB = mixRgb(hexToRgb(palette.terrainTop), [196, 176, 104], 0.8);
  const lake: RGB = mixRgb(hexToRgb(palette.waterTop), [40, 92, 116], 0.7);
  const n3 = tileNoise(3, 411), n6 = tileNoise(6, 413), species = tileNoise(5, 417), warp = tileNoise(4, 419);
  const clear = tileNoise(7, 421), lakes = tileNoise(4, 431), crown = tileNoise(48, 433), grain = tileNoise(128, 439), sheet = tileNoise(3, 443);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ridge = (n: number) => { const r = 1 - Math.abs(2 * n - 1); return r * r; };

  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const wu = u + (warp(u, v) - 0.5) * 0.1, wv = v + (warp(u + 0.5, v + 0.3) - 0.5) * 0.1;
    H[y * N + x] = ridge(n3(wu, wv)) * 0.6 + ridge(n6(wu, wv)) * 0.3 + sheet(u, v) * 0.1;
  }
  const at = (x: number, y: number) => H[(((y % N) + N) % N) * N + (((x % N) + N) % N)];

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const h = H[y * N + x];
    const lit = (at(x + 2, y + 2) - at(x - 2, y - 2)) * 6;
    // Species patches: conifer in the high, cold ground and valleys, broadleaf and new growth between.
    const sp = species(u, v) * 0.7 + h * 0.3;
    let c = mixRgb(mixRgb(midC, deepC, step(0.5, 0.7, sp)), lightC, step(0.45, 0.28, sp) * 0.9);
    // Damp valleys are darker.
    c = mixRgb(c, deepC, step(0.35, 0.1, h) * 0.5);
    // Crowns: lumpy light and dark at the scale of a few trees, plus fine speckle.
    const lump = crown(u, v) - 0.5, fine = grain(u, v) - 0.5;
    // Clearings: pale fields in patches, two kinds, edges soft.
    const cl = step(0.74, 0.8, clear(u, v));
    if (cl > 0) c = mixRgb(c, (fine > 0 ? fieldA : fieldB), cl * 0.85);
    // Lakes with a lighter shallow rim.
    const lk = waterFeatures ? lakes(u + 0.2, v + 0.6) : 0;
    if (lk > 0.84) c = mixRgb(c, mixRgb(lake, [110, 160, 170], step(0.84, 0.86, 1 - lk + 0.84) * 0.6), step(0.84, 0.86, lk));
    const l = 1 + Math.max(-0.45, Math.min(0.45, lit)) * 0.75 + lump * 0.42 * (1 - cl) + fine * 0.2;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, c[0] * l); img.data[p + 1] = Math.min(255, c[1] * l); img.data[p + 2] = Math.min(255, c[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);

  // A winding river with pale banks, wrapped across the tile edge.
  const R = rng(4409);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const pts: Array<[number, number]> = [];
  let px = R() * S, py = R() * S, a = R() * Math.PI * 2;
  for (let k = 0; k < 64; k++) { a += (R() - 0.5) * 0.9; px += Math.cos(a) * 26; py += Math.sin(a) * 26; pts.push([px, py]); }
  const draw = (color: string, width: number) => {
    g.strokeStyle = color; g.lineWidth = width;
    for (const ox of [-S * 2, -S, 0, S, S * 2]) for (const oy of [-S * 2, -S, 0, S, S * 2]) {
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy))); g.stroke();
    }
  };
  if (waterFeatures) {
    draw('rgba(196,204,170,0.7)', 16);
    draw(`rgb(${Math.round(lake[0])},${Math.round(lake[1])},${Math.round(lake[2])})`, 9);
  }
  if (night) {
    g.fillStyle = 'rgba(8,12,26,0.6)';
    g.fillRect(0, 0, S, S);
  }
  return canvas;
}

/**
 * Pack ice from the air: pale blue-white floes of every size split by dark, forking leads of open water, grey-blue
 * pressure ridges along the floe edges, snow-drift streaks all running one way, a few turquoise melt pools, and
 * stretches of unbroken sheet between. Lit from the upper left. Tiles seamlessly.
 */
export function iceTexture(palette: ScenePalette, night: boolean): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE, G = 9;
  const tintC = hexToRgb(palette.terrainTop);
  const white: RGB = mixRgb([238, 244, 250], tintC, 0.06);
  const blue: RGB = mixRgb([188, 214, 238], tintC, 0.06);
  const water: RGB = mixRgb([14, 44, 78], hexToRgb(palette.waterBottom), 0.15);
  const fringe: RGB = mixRgb([70, 112, 142], hexToRgb(palette.waterTop), 0.12);
  const pool: RGB = [96, 188, 206];
  const R = rng(5501);
  const cells = Array.from({ length: G * G }, () => [R(), R()] as [number, number]);
  const warp = tileNoise(8, 503), warp2 = tileNoise(16, 507), leady = tileNoise(3, 511), ridgeN = tileNoise(7, 513), streak = tileNoise(8, 517);
  const poolN = tileNoise(10, 521), blotch = tileNoise(5, 523), grain = tileNoise(128, 527);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hsh = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    // Ragged floe edges: bend the lookup before finding the nearest floe centre.
    const wu = u + (warp(u, v) - 0.5) * 0.045 + (warp2(u, v) - 0.5) * 0.012, wv = v + (warp(u + 0.5, v + 0.5) - 0.5) * 0.045 + (warp2(v, u) - 0.5) * 0.012;
    const gx0 = Math.floor(wu * G), gy0 = Math.floor(wv * G);
    let d1 = 9, d2 = 9, id = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = gx0 + dx, cy = gy0 + dy;
      const cell = cells[(((cy % G) + G) % G) * G + (((cx % G) + G) % G)];
      const ex = (cx + cell[0]) / G - wu, ey = (cy + cell[1]) / G - wv;
      const d = Math.sqrt(ex * ex + ey * ey);
      if (d < d1) { d2 = d1; d1 = d; id = (((cy % G) + G) % G) * G + (((cx % G) + G) % G); } else if (d < d2) d2 = d;
    }
    const edge = d2 - d1;
    // Where the sea is breaking up, leads are wide; elsewhere the sheet is whole and only hairline cracks show.
    const breaking = step(0.38, 0.7, leady(u, v));
    const leadW = 0.0015 + 0.015 * breaking;
    const hf = hsh(id);
    const fine = grain(u, v) - 0.5;
    let c: RGB;
    if (edge < leadW) {
      c = edge < leadW * 0.45 ? water : mixRgb(water, fringe, 0.6);
    } else {
      // Floe surface: white to pale blue per floe, snow-drift streaks all one way, pressure ridges near the edges.
      c = mixRgb(white, blue, hf * 0.7 + (blotch(u, v) - 0.5) * 0.35);
      const drift = streak(u, v * 6) - 0.5;
      const edgeZone = 1 - step(leadW, leadW + 0.03, edge);
      const rdg = 1 - Math.abs(2 * ridgeN(u, v) - 1);
      const rh = rdg * rdg * (0.35 + edgeZone * 0.9);
      // Lit on the upper-left side of each ridge, shadowed on the lower right.
      if (rh > 0.08) {
        const lit = (ridgeN(u - 0.004, v - 0.004) - ridgeN(u + 0.004, v + 0.004)) * 18;
        c = mixRgb(c, mixRgb([120, 146, 172], [250, 252, 255], Math.max(0, lit) * 0.9), Math.min(1, rh * 0.55) * (lit > 0 ? 0.8 : 0.2));
        if (lit < 0) c = mixRgb(c, [64, 92, 128], Math.min(0.5, -lit * rh * 0.5));
      }
      c = mixRgb(c, [250, 252, 255], Math.max(0, drift) * 0.45);
      c = mixRgb(c, [150, 178, 208], Math.max(0, -drift) * 0.35);
      // Melt pools: turquoise with a darker rim, on the open floes only.
      const pl = poolN(u + 0.3, v + 0.1);
      if (pl > 0.7 && edgeZone < 0.5) c = mixRgb(c, mixRgb(pool, [30, 110, 140], step(0.7, 0.74, 1 - pl + 0.7) * 0.5), step(0.7, 0.735, pl) * 0.85);
    }
    const l = 1 + fine * 0.05;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, c[0] * l); img.data[p + 1] = Math.min(255, c[1] * l); img.data[p + 2] = Math.min(255, c[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);
  if (night) {
    g.fillStyle = 'rgba(6,10,24,0.5)';
    g.fillRect(0, 0, S, S);
  }
  return canvas;
}

/** What kind of mountains a region has: how the valley floor looks and what share of peaks wear snow or forest. */
export interface RangeMix {
  floor: 'alpine' | 'arid' | 'green';
  /** Share of peaks that are snow-capped; the next `green` share are forested; the rest are bare rock. */
  snow: number;
  green: number;
}

export function rangeFor(region: string | null | undefined): RangeMix {
  const r = region ?? '';
  if (/Africa|Madagascar/.test(r)) return { floor: 'arid', snow: 0, green: 0.05 };
  if (/Australia/.test(r)) return { floor: 'arid', snow: 0.02, green: 0.12 };
  // in the tropics only the very highest peaks hold snow (Indonesia, the Andes near the equator, New Guinea)
  if (/tropics/.test(r)) return { floor: 'green', snow: 0, green: 0.8 }; // no snow in tropical ranges (the snowy giants are landmarks)
  if (/Oceania|Pacific|New Zealand|Fiji/.test(r)) return { floor: 'green', snow: 0.2, green: 0.55 };
  if (/Japan|Taiwan|Hainan|Philippines|Borneo|Sumatra|Java|Sulawesi|Sri Lanka/.test(r)) return { floor: 'green', snow: 0.05, green: 0.75 };
  if (/Asia/.test(r)) return { floor: 'green', snow: 0.35, green: 0.35 };
  if (/South America/.test(r)) return { floor: 'alpine', snow: 0.45, green: 0.3 };
  if (/North America/.test(r)) return { floor: 'alpine', snow: 0.6, green: 0.25 };
  if (/Europe/.test(r)) return { floor: 'alpine', snow: 0.7, green: 0.1 };
  return { floor: 'alpine', snow: 0.5, green: 0.2 };
}

/**
 * The ground between the peaks, seen from high up: a ridged height field lit from one side (so slopes read as slopes),
 * coloured by height. Alpine: dull green valleys, grey rock, scree, snow on shaded high ground, dark conifer patches
 * and a pale braided river. Arid: banded red and tan rock with a dry riverbed. Green: forested ridges and valleys.
 * Tiles seamlessly.
 */
export function mountainTexture(palette: ScenePalette, night: boolean, floor: RangeMix['floor'] = 'alpine'): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  const land = hexToRgb(palette.terrainTop);
  const leaf = hexToRgb(palette.foliage);
  const valley: RGB = floor === 'arid' ? mixRgb(land, [196, 150, 108], 0.8) : floor === 'green' ? mixRgb(leaf, [58, 104, 56], 0.7) : mixRgb(land, [96, 114, 82], 0.75);
  const slopeC: RGB = floor === 'arid' ? mixRgb(land, [170, 108, 76], 0.8) : floor === 'green' ? mixRgb(leaf, [44, 86, 52], 0.7) : mixRgb(land, [122, 120, 114], 0.8);
  const highC: RGB = floor === 'arid' ? mixRgb(land, [116, 80, 66], 0.8) : floor === 'green' ? mixRgb(leaf, [96, 118, 80], 0.6) : mixRgb(land, [170, 168, 164], 0.8);
  const n3 = tileNoise(3, 211), n6 = tileNoise(6, 223), n13 = tileNoise(13, 227), warp = tileNoise(4, 229);
  const patch = tileNoise(9, 233), conif = tileNoise(24, 239), grain = tileNoise(96, 241), band = tileNoise(5, 251);
  const step = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ridge = (n: number) => { const r = 1 - Math.abs(2 * n - 1); return r * r; };

  // Height field first, so each pixel can compare itself with its neighbours.
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const wu = u + (warp(u, v) - 0.5) * 0.12, wv = v + (warp(u + 0.5, v + 0.25) - 0.5) * 0.12;
    H[y * N + x] = ridge(n3(wu, wv)) * 0.62 + ridge(n6(wu, wv)) * 0.28 + n13(u, v) * 0.1;
  }
  const at = (x: number, y: number) => H[(((y % N) + N) % N) * N + (((x % N) + N) % N)];

  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const h = H[y * N + x];
    // Light from the upper left: slopes rising away from it are lit.
    const lit = (at(x + 2, y + 2) - at(x - 2, y - 2)) * 7;
    const steep = Math.abs(at(x + 2, y) - at(x - 2, y)) + Math.abs(at(x, y + 2) - at(x, y - 2));
    const sp = grain(u, v) - 0.5;
    let c: RGB;
    if (floor === 'arid') {
      // Banded rock: bands follow the height, so they bend around the hills like strata.
      const strata = Math.sin((h * 5.2 + band(u, v) * 1.6) * Math.PI * 2) * 0.5 + 0.5;
      c = mixRgb(mixRgb(valley, slopeC, step(0.18, 0.5, h)), highC, step(0.5, 0.9, h));
      c = mixRgb(c, mixRgb(c, [236, 196, 150], 0.5), strata * 0.35);
    } else {
      c = mixRgb(mixRgb(valley, slopeC, step(0.2, 0.52, h)), highC, step(0.52, 0.88, h));
      // Dark conifer patches on the low ground (alpine); the green floor is forest everywhere.
      const wood = floor === 'green' ? 0.7 : step(0.44, 0.62, conif(u, v) * 0.55 + patch(u, v) * 0.5) * step(0.5, 0.2, h);
      c = mixRgb(c, mixRgb(leaf, [20, 56, 34], 0.7), Math.min(0.85, wood * (floor === 'green' ? 0.55 + sp * 0.4 : 0.9)));
      // Scree fans: pale and speckled where the ground is steep and not high.
      c = mixRgb(c, [176, 172, 164], step(0.1, 0.22, steep) * step(0.7, 0.35, h) * (0.3 + sp) * 0.5);
      // Snow on high ground, heaviest on the faces turned away from the light (alpine only).
      if (floor === 'alpine') c = mixRgb(c, [238, 244, 250], step(0.66, 0.84, h - lit * 0.18 + sp * 0.1) * 0.9);
    }
    const l = 1 + Math.max(-0.5, Math.min(0.5, lit)) * 0.55 + sp * 0.05;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, c[0] * l); img.data[p + 1] = Math.min(255, c[1] * l); img.data[p + 2] = Math.min(255, c[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);

  // A braided river (pale glacial water; a dry riverbed in the arid ranges), wrapped across the tile edge.
  const R = rng(5233);
  g.lineCap = 'round';
  g.strokeStyle = floor === 'arid' ? 'rgba(238,214,176,0.45)' : floor === 'green' ? 'rgba(168,196,190,0.5)' : 'rgba(196,222,226,0.55)';
  const river = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    let px = x, py = y, a = angle;
    for (let k = 0; k < length; k++) {
      a += (R() - 0.5) * 0.55;
      const nx = px + Math.cos(a) * 24, ny = py + Math.sin(a) * 24;
      g.lineWidth = width;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        g.beginPath(); g.moveTo(px + ox, py + oy); g.lineTo(nx + ox, ny + oy); g.stroke();
      }
      px = nx; py = ny;
      if (depth < 2 && R() < 0.14) river(px, py, a + (R() < 0.5 ? 0.6 : -0.6), Math.floor(length * 0.35), width * 0.6, depth + 1);
    }
  };
  for (let i = 0; i < 2; i++) river(R() * S, R() * S, R() * Math.PI * 2, 42, 6 + R() * 3, 0);
  if (night) {
    g.fillStyle = 'rgba(8,12,26,0.6)';
    g.fillRect(0, 0, S, S);
  }
  return canvas;
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



export type NaturalGround = 'grassland' | 'tundra' | 'wetlands' | 'salt-flats';

/**
 * Open natural ground from the air (real land cover, NASA MODIS): steppe grass with wind streaks, tundra with lichen
 * and small ponds, wetlands threaded with channels, salt flats with pale polygon cracks. Tiles seamlessly.
 */
export function naturalTexture(kind: NaturalGround, palette: ScenePalette, night: boolean, waterFeatures = true): HTMLCanvasElement {
  const N = 512, S = FARM_TEXTURE_SIZE;
  const land = hexToRgb(palette.terrainTop);
  const water = mixRgb(hexToRgb(palette.waterTop), [40, 92, 116], 0.6);
  const look: Record<NaturalGround, { a: RGB; b: RGB; c: RGB; pond: number }> = {
    grassland: { a: mixRgb(land, [150, 160, 88], 0.8), b: mixRgb(land, [190, 176, 104], 0.8), c: mixRgb(land, [118, 132, 74], 0.8), pond: 0 },
    tundra: { a: mixRgb(land, [128, 128, 92], 0.8), b: mixRgb(land, [160, 146, 110], 0.8), c: mixRgb(land, [96, 104, 80], 0.8), pond: 0.16 },
    wetlands: { a: mixRgb(land, [92, 132, 82], 0.82), b: mixRgb(land, [128, 150, 96], 0.82), c: mixRgb(land, [70, 108, 78], 0.82), pond: 0.34 },
    'salt-flats': { a: [238, 236, 228], b: [224, 220, 210], c: [206, 200, 190], pond: 0 },
  };
  const { a, b, c, pond } = look[kind];
  const n3 = tileNoise(3, 701), n8 = tileNoise(8, 707), n24 = tileNoise(24, 709), grain = tileNoise(128, 719), ponds = tileNoise(10, 727), warp = tileNoise(4, 733);
  const small = document.createElement('canvas');
  small.width = N; small.height = N;
  const sg = small.getContext('2d')!;
  const img = sg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const w = (warp(u, v) - 0.5) * 0.6;
    let col = mixRgb(a, b, n3(u + w, v));
    col = mixRgb(col, c, Math.max(0, n8(u, v + w) - 0.45) * 1.4);
    if (kind === 'grassland') col = mixRgb(col, b, Math.max(0, Math.sin((u * 3 + v * 9 + w * 4) * Math.PI * 2)) * 0.18);
    if (kind === 'tundra') col = mixRgb(col, [200, 196, 170], Math.max(0, n24(u, v) - 0.62) * 1.6);
    if (waterFeatures && pond > 0 && ponds(u + w * 0.5, v) > 1 - pond) col = mixRgb(col, water, 0.85);
    const l = 1 + (grain(u, v) - 0.5) * 0.08;
    const p = (y * N + x) * 4;
    img.data[p] = Math.min(255, col[0] * l); img.data[p + 1] = Math.min(255, col[1] * l); img.data[p + 2] = Math.min(255, col[2] * l); img.data[p + 3] = 255;
  }
  sg.putImageData(img, 0, 0);
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, S, S);
  const R = rng(kind.length * 131);
  if (kind === 'wetlands') {
    // Winding channels, wrapped so they cross the tile edge cleanly.
    g.strokeStyle = css(water, 0.7); g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      let px = R() * S, py = R() * S, ang = R() * Math.PI * 2;
      g.lineWidth = 3 + R() * 4;
      for (let k = 0; k < 40; k++) {
        ang += (R() - 0.5) * 0.9;
        const nx = px + Math.cos(ang) * 22, ny = py + Math.sin(ang) * 22;
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.moveTo(px + ox, py + oy); g.lineTo(nx + ox, ny + oy); g.stroke(); }
        px = nx; py = ny;
      }
    }
  }
  if (kind === 'salt-flats') {
    // Polygon cracks in the salt crust.
    g.strokeStyle = 'rgba(150,140,128,0.35)'; g.lineWidth = 1.5;
    const cells = 14, step = S / cells;
    for (let i = 0; i <= cells; i++) for (let j = 0; j <= cells; j++) {
      const x0 = i * step + (R() - 0.5) * step * 0.5, y0 = j * step + (R() - 0.5) * step * 0.5;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + step * (0.7 + R() * 0.4), y0 + (R() - 0.5) * step * 0.4);
      g.moveTo(x0, y0); g.lineTo(x0 + (R() - 0.5) * step * 0.4, y0 + step * (0.7 + R() * 0.4)); g.stroke();
    }
  }
  if (night) { g.fillStyle = 'rgba(8,12,26,0.6)'; g.fillRect(0, 0, S, S); }
  return canvas;
}

/** Whether the ground gets relief shading (the room keeps it off until the owner approves; the gallery turns it on). */
let GROUND_RELIEF = true; // approved by the owner 19 Oct 2026

/** Softer changes between land types (patches over a wider band). */
let SOFT_EDGES = true; // approved by the owner 20 Oct 2026
export function setSoftEdges(on: boolean) { SOFT_EDGES = on; }
export const softEdges = () => SOFT_EDGES;

/**
 * Made-up night lights across the land (random towns and roads). Off since 28 Oct 2026 (owner): they aren't real places.
 * Real night lights (NASA Black Marble) are coming with the GPU terrain. `?lights=on` in the mountain gallery still shows them.
 */
let NIGHT_LIGHTS = false;
export function setNightLights(on: boolean) { NIGHT_LIGHTS = on; }
export const nightLights = () => NIGHT_LIGHTS;

/** Real rivers and lakes on the ground (approved by the owner 20 Oct 2026). */
let REAL_WATERS = true;
export function setRealWaters(on: boolean) { REAL_WATERS = on; }
export const realWaters = () => REAL_WATERS;

/** Real coastlines (land and sea from closed land outlines; back on in the room, owner OK 20 Oct 2026). */
// On 22 Oct 2026 (owner approved on /dev/coast-strip): smooth coast outlines from the whole-route strip, real land
// colours, about 60 fps after the texture read-back fix.
let REAL_COAST = true;
export function setRealCoast(on: boolean) { REAL_COAST = on; }
export const realCoast = () => REAL_COAST;

/** Mountains and hills placed from real elevation (approved 20 Oct 2026). */
let REAL_RELIEF = true;
export function setRealRelief(on: boolean) { REAL_RELIEF = on; }
export const realRelief = () => REAL_RELIEF;
/** Continuous real elevation surface, enabled by default in live flights. */
let REAL_TERRAIN = true;
export function setRealTerrain(on: boolean) { REAL_TERRAIN = on; }
export function realTerrain() { return REAL_TERRAIN; }
export function setGroundRelief(on: boolean) { GROUND_RELIEF = on; }
export const groundRelief = () => GROUND_RELIEF;

let reliefCache: HTMLCanvasElement | null = null;
/**
 * Relief for every kind of land: a seamless field of hills and valleys (ridged noise), lit from the sun's side so
 * slopes facing it are lighter and the far slopes darker; mid-grey on the flat, so it lays light and shadow over the
 * ground texture without changing its colours.
 */
export function reliefTexture(): HTMLCanvasElement {
  if (reliefCache) return reliefCache;
  const S = 512;
  const n4 = tileNoise(4, 901), n8 = tileNoise(8, 907), n16 = tileNoise(16, 911), n32 = tileNoise(32, 919);
  const height = (u: number, v: number) => {
    const ridge = (n: number) => { const r = 1 - Math.abs(2 * n - 1); return r * r; };
    return n4(u, v) * 0.45 + ridge(n8(u, v)) * 0.3 + ridge(n16(u, v)) * 0.17 + n32(u, v) * 0.08;
  };
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d')!;
  const img = g.createImageData(S, S);
  const e = 1 / S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    const dx = height(u + e, v) - height(u - e, v);
    const dy = height(u, v + e) - height(u, v - e);
    // light from the left and a little from the far side
    const shade = 128 + (-dx * 0.85 - dy * 0.35) * S * 3.2;
    const l = Math.max(30, Math.min(226, shade));
    const p = (y * S + x) * 4;
    img.data[p] = l; img.data[p + 1] = l; img.data[p + 2] = l; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  reliefCache = canvas;
  return canvas;
}
