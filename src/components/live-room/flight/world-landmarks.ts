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
  fuji: { h: 2200, w: 2200 * 2.6, clear: 11000 }, // a lone volcano, steeper than life so it reads from above; stays below the plane
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
// A real cone in the world (as the pyramids), so it turns as the plane passes: rings of faces up a gently concave
// profile to a flat crater rim, each face lit by how squarely it meets the light. Dark forest round the foot, bare rock,
// then snow, which runs further down in fingers along the gullies.

const SEGS = 56;                                               // faces round the cone
const RINGS = [0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.64, 0.74, 0.83, 0.91, 0.97, 1];   // heights of the rings (0 foot, 1 rim)
const RIM = 0.075;                                             // the crater's radius, as a share of the base radius
const fujiRadius = (hf: number) => RIM + (1 - RIM) * (1 - Math.pow(hf, 1 / 1.4));  // concave slopes

function drawFuji(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, airFog: number, haze: RGB, alpha: number) {
  const { h, w } = LANDMARK_SIZE.fuji;
  const R0 = w / 2;
  const fog = airFog * 0.75;
  const rock: RGB = look.night ? [58, 64, 92] : [118, 104, 106];
  const rockLit: RGB = look.night ? [104, 116, 156] : [188, 168, 160];
  const rockShade: RGB = look.night ? [16, 20, 36] : [54, 52, 72];
  const snowLit: RGB = look.night ? [196, 208, 240] : look.snow;
  const snowShade: RGB = look.night ? [92, 106, 148] : mix(look.snow, [136, 158, 206], 0.55);
  const forest: RGB = look.night ? [10, 18, 22] : mix(look.leaf, [22, 50, 34], 0.55);
  // each face: its corners, how deep it lies (to paint far ones first) and its colour
  const faces: Array<{ pts: Array<[number, number]>; depth: number; col: RGB; a: number }> = [];
  for (let i = 0; i < SEGS; i++) {
    const a0 = (i / SEGS) * Math.PI * 2, a1 = ((i + 1) / SEGS) * Math.PI * 2, am = (a0 + a1) / 2;
    // snow line for this gully: lower in the gullies, a little uneven
    const finger = Math.pow(0.5 + 0.5 * Math.sin(am * 9 + Math.sin(am * 4) * 1.3), 3);
    const snowAt = 0.55 - finger * 0.2 + (hash(i * 3.7) - 0.5) * 0.05;
    for (let r = 0; r < RINGS.length - 1; r++) {
      const h0 = RINGS[r], h1 = RINGS[r + 1];
      const r0 = fujiRadius(h0) * R0, r1 = fujiRadius(h1) * R0;
      const c = (a: number, rad: number, hf: number): [number, number, number] => [X + Math.cos(a) * rad, Z + Math.sin(a) * rad, hf * h];
      const p00 = c(a0, r0, h0), p10 = c(a1, r0, h0), p11 = c(a1, r1, h1), p01 = c(a0, r1, h1);
      // outward, upward normal of this face (from the slope of the profile)
      const rise = (h1 - h0) * h, run = r0 - r1;
      const len = Math.hypot(rise, run) || 1;
      const n = { x: Math.cos(am) * (rise / len), y: run / len, z: Math.sin(am) * (rise / len) };
      const lam = clamp01((n.x * LIGHT.x + n.y * LIGHT.y + n.z * LIGHT.z) / LN);
      const hm = (h0 + h1) / 2;
      let col: RGB = mix(rockShade, rockLit, Math.pow(lam, 1.2));
      col = mix(col, rock, 0.2);
      if (hm < 0.25) col = mix(col, mix(forest, col, 0.25 + lam * 0.4), clamp01((0.25 - hm) / 0.15) * 0.8);
      const sT = clamp01((hm - snowAt) / 0.08 + 0.5);
      if (sT > 0) col = mix(col, mix(snowShade, snowLit, Math.pow(lam, 0.9)), sT * sT * (3 - 2 * sT));
      col = mix(col, haze, fog);
      const pts = [p00, p10, p11, p01].map((q) => proj(q[0], q[1], q[2]));
      faces.push({ pts, depth: Z + Math.sin(am) * (r0 + r1) / 2, col, a: clamp01(0.25 + hm * 7) }); // the foot melts into the ground
    }
  }
  faces.sort((a, b) => b.depth - a.depth);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  for (const f of faces) {
    const css1 = css(f.col);
    ctx.globalAlpha = alpha * f.a;
    ctx.fillStyle = css1;
    ctx.strokeStyle = css1;          // a hairline of the same colour hides the seams between faces
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let k = 1; k < f.pts.length; k++) ctx.lineTo(f.pts[k][0], f.pts[k][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = alpha;
  // the crater: a snowy rim with a shadowed hollow
  const rimPts: Array<[number, number]> = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; rimPts.push(proj(X + Math.cos(a) * RIM * R0, Z + Math.sin(a) * RIM * R0, h)); }
  ctx.fillStyle = css(mix(mix(snowShade, rockShade, 0.35), haze, fog));
  ctx.beginPath(); rimPts.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
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
  if (kind === 'fuji') drawFuji(ctx, look, at.x, at.z, proj, fog, haze, alpha);
  else drawPyramids(ctx, look, at.x, at.z, proj, fog, haze, alpha);
}
