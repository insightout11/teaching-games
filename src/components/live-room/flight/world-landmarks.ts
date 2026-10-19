/**
 * Landmarks standing in the passing scenery (Oct 2026): drawn into the same world as the ground and the mountains, at a
 * real place ahead, approaching and passing with the flight, in the same light (light from the left, as the mountains),
 * in the same haze, by day, dusk or night. Not a picture in a box.
 *
 * Each kind knows its size in the world (exaggerated a little so it reads from cruise height) and how to draw itself
 * from the cockpit's projection.
 */

type RGB = [number, number, number];

export type WorldLandmarkKind = 'fuji' | 'pyramids';

/** A landmark on the ground: how far ahead and to the side when it comes into range (km), as for the distant cities. */
export interface WorldLandmark { id: string; kind: WorldLandmarkKind; ahead: number; lateral: number }

/** Size in world units (the cockpit's): height and the radius kept clear of ordinary mountains. */
export const LANDMARK_SIZE: Record<WorldLandmarkKind, { h: number; w: number; clear: number }> = {
  fuji: { h: 2900, w: 2900 * 5.4, clear: 11000 }, // a lone, broad volcano: nothing else that tall near it
  pyramids: { h: 1500, w: 2400, clear: 12000 },   // the three on the desert edge (about ten times life size, to read from cruise height)
};

/** The cockpit's projection for this frame: world point (sideways x, depth ahead z, height y) to the screen. */
export interface Projector { (x: number, z: number, y?: number): [number, number] }

export interface LandmarkLook { night: boolean; snow: RGB; leaf: RGB; rock: RGB }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

// ── Mount Fuji ───────────────────────────────────────────────────────────────────────────────────────────────────────
// The famous profile: a wide, gently concave cone with a flat top (the crater), snow reaching down the gullies in
// long fingers, dark forest round the foot. One picture per light and haze colour, made once, drawn scaled.

const FW = 360, FH = 120;
const fujiCache = new Map<string, HTMLCanvasElement>();

function fujiPicture(look: LandmarkLook, haze: RGB): HTMLCanvasElement {
  const q = (c: RGB) => c.map((v) => Math.round(v / 24) * 24) as RGB;
  const hz = q(haze);
  const key = `${look.night ? 1 : 0}|${q(look.snow).join(',')}|${q(look.leaf).join(',')}|${hz.join(',')}`;
  const hit = fujiCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  if (!g) return c;
  const img = g.createImageData(FW, FH);
  // profile: concave slopes (power > 1), a flat crater rim, the left shoulder a touch fuller
  const prof = (u: number) => {
    const d = Math.abs(u - 0.5) * 2;
    const top = 0.075;                                    // half-width of the flat top
    if (d < top) return 1 - (top - d) * 0.15;             // a shallow dip: the crater
    const t = clamp01((d - top) / (1 - top));
    return Math.pow(1 - t, 1.75 + (u < 0.5 ? -0.08 : 0.06));
  };
  const H = new Float32Array(FW + 2);
  for (let x = -1; x <= FW; x++) H[x + 1] = prof((x + 0.5) / FW);
  const rock: RGB = look.night ? [44, 50, 74] : [104, 92, 96];
  const lit: RGB = look.night ? [92, 104, 142] : [176, 156, 150];
  const shade: RGB = look.night ? [16, 20, 36] : [52, 50, 70];
  const snowLit: RGB = look.night ? [190, 204, 236] : look.snow;
  const snowShade: RGB = look.night ? [96, 110, 150] : mix(look.snow, [140, 162, 208], 0.5);
  const forest: RGB = look.night ? [10, 18, 22] : mix(look.leaf, [20, 48, 32], 0.55);
  for (let x = 0; x < FW; x++) {
    const h = H[x + 1];
    const top = (1 - h) * FH;
    const u = x / FW;
    for (let y = Math.max(0, Math.floor(top)); y < FH; y++) {
      const ph = 1 - y / FH;                              // height (0 foot, 1 summit)
      const depth = (y - top) / Math.max(1, FH - top);
      // gullies run straight down from the summit: a pattern in the angle from the top centre
      const ang = (u - 0.5) / (0.06 + (1 - ph) * 0.9);
      const gully = 0.5 + 0.5 * Math.sin(ang * 21 + Math.sin(ang * 7) * 1.4);
      // shaded as a round cone: where this point sits across the cone's width at its height (left lit, right in shade)
      const halfW = 0.075 + (1 - Math.pow(clamp01(ph), 1 / 1.75)) * 0.925;
      const across = Math.max(-1, Math.min(1, ((u - 0.5) * 2) / Math.max(0.05, halfW)));
      const light = clamp01(0.52 - across * 0.42 + (gully - 0.5) * 0.2 - depth * 0.12);
      let col = mix(shade, lit, light);
      // snow: down to about 60 % of the height, much further down the gully floors in fingers
      const line = 0.58 + (1 - gully) * 0.16 - Math.pow(gully, 3) * 0.08 + (hash(Math.floor(u * 90)) - 0.5) * 0.03;
      const sT = clamp01((ph - line) / 0.04 + 0.5);
      const snow = mix(snowShade, snowLit, clamp01(light * 1.2));
      if (ph < 0.2) col = mix(col, forest, clamp01((0.2 - ph) / 0.12) * (0.55 + 0.35 * hash(x * 3.1 + y * 7.7)));
      else col = mix(col, rock, 0.15);
      col = mix(col, snow, sT * sT * (3 - 2 * sT));
      col = mix(col, hz, depth * 0.25);
      const edge = (y === Math.floor(top) ? 1 - (top - Math.floor(top)) : 1) * clamp01((1 - depth) / 0.3) * clamp01(Math.min(u, 1 - u) / 0.06);
      const i = (y * FW + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = Math.round(255 * edge);
    }
  }
  g.putImageData(img, 0, 0);
  fujiCache.set(key, c);
  if (fujiCache.size > 24) { const k = fujiCache.keys().next().value; if (k) fujiCache.delete(k); }
  return c;
}

/** The haze-coloured silhouette laid over a picture at the haze strength (smooth with distance). */
const veils = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function veilOf(pic: HTMLCanvasElement, haze: RGB) {
  let v = veils.get(pic);
  if (!v) {
    v = document.createElement('canvas');
    v.width = pic.width; v.height = pic.height;
    const g = v.getContext('2d');
    if (g) { g.drawImage(pic, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = css(haze); g.fillRect(0, 0, v.width, v.height); }
    veils.set(pic, v);
  }
  return v;
}

function drawFuji(ctx: CanvasRenderingContext2D, look: LandmarkLook, cx: number, baseY: number, s: number, fog: number, haze: RGB, alpha: number) {
  const { h, w } = LANDMARK_SIZE.fuji;
  const pw = w * s, ph = h * s;
  const pic = fujiPicture(look, haze);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.globalAlpha = alpha;
  ctx.drawImage(pic, cx - pw / 2, baseY - ph, pw, ph);
  if (fog > 0.03) { ctx.globalAlpha = alpha * fog; ctx.drawImage(veilOf(pic, haze), cx - pw / 2, baseY - ph, pw, ph); }
  ctx.restore();
}

// ── The Pyramids of Giza ────────────────────────────────────────────────────────────────────────────────────────────
// Three real pyramids in the world (square bases on the desert, faces lit or in shade by the light from the left),
// each casting its shadow on the sand. Drawn as shapes from the cockpit's projection, so they turn as the plane passes.

const PYRAMIDS = [
  { dx: 0, dz: 0, k: 1 },          // Khufu, the Great Pyramid
  { dx: 1.25, dz: 1.1, k: 0.95 },  // Khafre, just behind and to the side
  { dx: 2.3, dz: 2.15, k: 0.48 },  // Menkaure, the small one
];
const LIGHT = { x: -0.62, y: 0.7, z: 0.36 };                      // towards the light: from the left, high, a little behind
const LN = Math.hypot(LIGHT.x, LIGHT.y, LIGHT.z);

function drawPyramids(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, airFog: number, haze: RGB, alpha: number) {
  const { h, w } = LANDMARK_SIZE.pyramids;
  const fog = airFog * 0.6; // big, pale stone: it shows through more of the haze than the ground does
  const sandLit: RGB = look.night ? [112, 120, 156] : [234, 202, 150];
  const sandShade: RGB = look.night ? [30, 34, 56] : [128, 94, 70];
  ctx.save();
  ctx.globalAlpha = alpha;
  // far ones first
  const order = PYRAMIDS.map((p) => ({ ...p, x: X + p.dx * w, z: Z + p.dz * w })).sort((a, b) => b.z - a.z);
  for (const p of order) {
    const b = (w * p.k) / 2, hh = h * p.k;
    const corners: Array<[number, number]> = [[p.x - b, p.z - b], [p.x + b, p.z - b], [p.x + b, p.z + b], [p.x - b, p.z + b]];
    // shadow on the sand: the apex thrown away from the light
    const sx = p.x - (LIGHT.x / LIGHT.y) * hh, sz = p.z - (LIGHT.z / LIGHT.y) * hh;
    const apexShadow = proj(sx, sz);
    ctx.fillStyle = css(mix(look.night ? [8, 10, 20] : [70, 48, 34], haze, fog * 0.8), 0.6 * (1 - fog * 0.7));
    for (let i = 0; i < 4; i++) {
      const a = proj(corners[i][0], corners[i][1]), c = proj(corners[(i + 1) % 4][0], corners[(i + 1) % 4][1]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(apexShadow[0], apexShadow[1]); ctx.closePath(); ctx.fill();
    }
    // faces, far first, each shaded by how squarely it faces the light
    const apex = proj(p.x, p.z, hh);
    const faces = [0, 1, 2, 3].map((i) => {
      const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
      const mx = (ax + bx) / 2 - p.x, mz = (az + bz) / 2 - p.z;      // outward direction of the face
      const ml = Math.hypot(mx, mz) || 1;
      const n = { x: (mx / ml) * Math.sin(0.9), y: Math.cos(0.9), z: (mz / ml) * Math.sin(0.9) }; // faces lean back ~52°
      const lam = clamp01((n.x * LIGHT.x + n.y * LIGHT.y + n.z * LIGHT.z) / LN);
      return { i, depth: (az + bz) / 2, lam };
    }).sort((a, b) => b.depth - a.depth);
    for (const f of faces) {
      const a = proj(corners[f.i][0], corners[f.i][1]), c = proj(corners[(f.i + 1) % 4][0], corners[(f.i + 1) % 4][1]);
      const col = mix(mix(sandShade, sandLit, Math.pow(f.lam, 1.4)), haze, fog);
      ctx.fillStyle = css(col);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(apex[0], apex[1]); ctx.closePath(); ctx.fill();
      // the stone courses: faint lines parallel to the base, closer together towards the top
      const span = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (span > 30) {
        ctx.strokeStyle = css(mix(col, [40, 28, 20], 0.35), 0.35);
        ctx.lineWidth = 1;
        const n = Math.min(14, Math.floor(span / 9));
        ctx.beginPath();
        for (let k = 1; k < n; k++) {
          const t = k / n;
          ctx.moveTo(a[0] + (apex[0] - a[0]) * t, a[1] + (apex[1] - a[1]) * t);
          ctx.lineTo(c[0] + (apex[0] - c[0]) * t, c[1] + (apex[1] - c[1]) * t);
        }
        ctx.stroke();
      }
    }
    // Khafre still has a little of its smooth casing at the top: a paler cap
    if (p.k === 0.95) {
      const capT = 0.82;
      const cap = (i: number) => { const q = proj(corners[i][0] + (p.x - corners[i][0]) * capT, corners[i][1] + (p.z - corners[i][1]) * capT, hh * capT); return q; };
      ctx.fillStyle = css(mix(look.night ? [140, 148, 180] : [246, 230, 196], haze, fog), 0.55);
      ctx.beginPath(); const q0 = cap(0), q1 = cap(1); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(apex[0], apex[1]); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

/** Draw one landmark at its place in the world. */
export function drawWorldLandmark(
  ctx: CanvasRenderingContext2D, kind: WorldLandmarkKind, look: LandmarkLook,
  at: { x: number; z: number; cx: number; baseY: number; s: number }, proj: Projector, fog: number, haze: RGB, alpha: number,
) {
  if (kind === 'fuji') drawFuji(ctx, look, at.cx, at.baseY, at.s, fog, haze, alpha);
  else drawPyramids(ctx, look, at.x, at.z, proj, fog, haze, alpha);
}
