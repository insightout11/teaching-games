/**
 * Landmarks standing in the passing scenery (Oct 2026): drawn into the same world as the ground and the mountains, at a
 * real place ahead, approaching and passing with the flight, in the same light (light from the left, as the mountains),
 * in the same haze, by day, dusk or night. Not a picture in a box.
 *
 * Each kind knows its size in the world (exaggerated a little so it reads from cruise height) and how to draw itself
 * from the cockpit's projection.
 */

type RGB = [number, number, number];

export type WorldLandmarkKind = 'fuji' | 'pyramids' | 'everest' | 'matterhorn' | 'kilimanjaro' | 'volcano' | 'niagara';

/** A landmark on the ground: how far ahead and to the side when it comes into range (km), as for the distant cities. */
export interface WorldLandmark { id: string; kind: WorldLandmarkKind; ahead: number; lateral: number }

/** Size in world units (the cockpit's): height and the radius kept clear of ordinary mountains. */
export const LANDMARK_SIZE: Record<WorldLandmarkKind, { h: number; w: number; clear: number }> = {
  fuji: { h: 2200, w: 2200 * 2.6, clear: 11000 }, // a lone volcano, steeper than life so it reads from above; stays below the plane
  pyramids: { h: 1500, w: 2400, clear: 12000 },   // the three on the desert edge (about ten times life size, to read from cruise height)
  // Landmarks stay below the plane (cruise 3200): the tallest are about 2200.
  everest: { h: 2200, w: 2200 * 1.7, clear: 5000 },     // with Lhotse and Nuptse; the rest of the Himalaya around it
  matterhorn: { h: 2100, w: 2100 * 1.7, clear: 4500 }, // the steep four-sided horn, among the Alps
  kilimanjaro: { h: 2000, w: 2000 * 3.4, clear: 12000 }, // broad and flat-topped, alone on the savanna
  volcano: { h: 1700, w: 1700 * 2.8, clear: 9000 },     // the shared volcano (Etna, Vesuvius, Teide...)
  niagara: { h: 0, w: 5200, clear: 14000 },             // a river, the falls and their mist (ten times life size)
};

/** The cockpit's projection for this frame: world point (sideways x, depth ahead z, height y) to the screen. */
export interface Projector { (x: number, z: number, y?: number): [number, number] }

export interface LandmarkLook { night: boolean; snow: RGB; leaf: RGB; rock: RGB }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

// ── Mountains as real shapes in the world ───────────────────────────────────────────────────────────────────────────
// A mountain is rings of faces from the foot to the top, each face lit by how squarely it meets the light, so it turns
// as the plane passes (a flat picture looks one-dimensional going by). The shape (how wide it is at each height and in
// each direction) and the colour of each face come from the landmark.

interface MeshMountain {
  h: number; R: number;
  /** Width at height hf (0 foot, 1 top) towards angle a, as a share of the base radius. */
  radius: (hf: number, a: number) => number;
  /** Sideways lean of the shape at height hf (world units): the Matterhorn's hook. */
  lean?: (hf: number) => [number, number];
  /** Colour of a face: its height, direction, how much light it gets (0 to 1) and how steep it is (0 flat, 1 sheer). */
  color: (hf: number, a: number, lam: number, steep: number, seg: number) => RGB;
  segs?: number;
  rings?: number[];
  /** How jagged the faces are: each corner pushed in or out by up to this share (0 smooth, 0.25 craggy). */
  jag?: number;
  /** A number that makes this mountain's crags its own. */
  seed?: number;
  /** Snow streaming down the ridges from the top (angles of the ridges), to a line, in the snow colours. */
  ridgeSnow?: { ridges: number[]; line: number; width: number; lit: RGB; shade: RGB };
}

const RINGS = [0, 0.06, 0.14, 0.24, 0.35, 0.46, 0.56, 0.65, 0.73, 0.8, 0.86, 0.91, 0.95, 0.98, 1];

function drawMesh(ctx: CanvasRenderingContext2D, m: MeshMountain, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const segs = m.segs ?? 56, rings = m.rings ?? RINGS;
  const jag = m.jag ?? 0, seed = m.seed ?? 0;
  const pos = (i: number, r: number): [number, number, number] => {
    const a = ((i % segs) / segs) * Math.PI * 2, hf = rings[r];
    // crags: corners pushed in or out and up or down; none at the very top or the foot
    const k = (i % segs) * 131 + r * 17 + seed * 7919;
    const j = jag * Math.sin(Math.PI * Math.min(1, hf * 1.15));
    const rr = m.radius(hf, a) * m.R * (1 + j * (hash(k) * 2 - 1));
    const yy = hf * m.h + (hf > 0 && hf < 1 ? j * m.h * 0.35 * (hash(k + 3) - 0.5) : 0);
    const [lx, lz] = m.lean ? m.lean(hf) : [0, 0];
    return [X + lx + Math.cos(a) * rr, Z + lz + Math.sin(a) * rr, yy];
  };
  const faces: Array<{ pts: Array<[number, number]>; depth: number; col: RGB; a: number }> = [];
  for (let i = 0; i < segs; i++) {
    const am = ((i + 0.5) / segs) * Math.PI * 2;
    for (let r = 0; r < rings.length - 1; r++) {
      const h0 = rings[r], h1 = rings[r + 1];
      const p00 = pos(i, r), p10 = pos(i + 1, r), p11 = pos(i + 1, r + 1), p01 = pos(i, r + 1);
      // the face's normal from its corners (pointing outwards and up)
      const ux = p10[0] - p00[0], uy = p10[2] - p00[2], uz = p10[1] - p00[1];
      const vx = p01[0] - p00[0], vy = p01[2] - p00[2], vz = p01[1] - p00[1];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      const lam = clamp01((nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z) / LN);
      const col = mix(m.color((h0 + h1) / 2, am, lam, 1 - ny, i), haze, fog);
      const pts = [p00, p10, p11, p01].map((q) => proj(q[0], q[1], q[2]));
      faces.push({ pts, depth: (p00[1] + p10[1] + p11[1] + p01[1]) / 4, col, a: clamp01(0.25 + ((h0 + h1) / 2) * 7) });
    }
  }
  faces.sort((a, b) => b.depth - a.depth);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.8;
  for (const f of faces) {
    const c = css(f.col);
    ctx.globalAlpha = alpha * f.a;   // the foot melts into the ground
    ctx.fillStyle = c;
    ctx.strokeStyle = c;            // a hairline of the same colour hides the seams between faces
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let k = 1; k < f.pts.length; k++) ctx.lineTo(f.pts[k][0], f.pts[k][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Snow down the ridges: a streak along each ridge that faces the plane, wide at the top and tapering, wavering.
  const rs = m.ridgeSnow;
  if (rs) {
    const at = (a: number, hf: number, out = 1.02): [number, number] => {
      const r = m.radius(hf, a) * m.R * out, [lx, lz] = m.lean ? m.lean(hf) : [0, 0];
      return proj(X + lx + Math.cos(a) * r, Z + lz + Math.sin(a) * r, hf * m.h);
    };
    rs.ridges.forEach((ra, k) => {
      if (Math.sin(ra) > 0.35) return;                               // a ridge on the far side: hidden by the mountain
      const steps = 12;
      const left: Array<[number, number]> = [], right: Array<[number, number]> = [];
      for (let q = 0; q <= steps; q++) {
        const hf = 1 - (q / steps) * (1 - rs.line - hash(k * 9.1) * 0.1);
        const wob = (hash(k * 31 + q * 7) - 0.5) * rs.width * 0.8;
        const wid = rs.width * (0.35 + (1 - hf) * 1.2) * (q === steps ? 0.2 : 1);
        left.push(at(ra - wid + wob, hf)); right.push(at(ra + wid * 0.7 + wob, hf));
      }
      // the side of the ridge towards the light is bright, the other in shade
      const litSide = Math.cos(ra) < 0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = css(mix(litSide ? rs.lit : rs.shade, haze, fog));
      ctx.beginPath();
      [...left, ...right.reverse()].forEach((pt, n) => (n ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
      ctx.closePath();
      ctx.fill();
    });
  }
  ctx.restore();
}

/** The colours every mountain shares: rock lit and in shade, snow lit and in shade, forest. */
function palette(look: LandmarkLook, warm = false) {
  return {
    rockLit: (look.night ? [96, 112, 158] : warm ? [200, 150, 112] : [120, 146, 186]) as RGB,
    rockShade: (look.night ? [12, 16, 32] : warm ? [70, 44, 40] : [26, 38, 68]) as RGB,
    snowLit: (look.night ? [196, 208, 240] : look.snow) as RGB,
    snowShade: (look.night ? [92, 106, 148] : mix(look.snow, [136, 158, 206], 0.55)) as RGB,
    forest: (look.night ? [10, 18, 22] : mix(look.leaf, [22, 50, 34], 0.55)) as RGB,
  };
}
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Snow over a colour: soft-edged above a line. */
const withSnow = (col: RGB, hf: number, line: number, lam: number, P: ReturnType<typeof palette>) => {
  const t = clamp01((hf - line) / 0.07 + 0.5);
  return t > 0 ? mix(col, mix(P.snowShade, P.snowLit, Math.pow(lam, 0.9)), smooth(t)) : col;
};
/** Forest round the foot, thinning upwards. */
const withForest = (col: RGB, hf: number, top: number, lam: number, P: ReturnType<typeof palette>) =>
  hf < top ? mix(col, mix(P.forest, col, 0.25 + lam * 0.4), clamp01((top - hf) / (top * 0.6)) * 0.8) : col;

// ── Mount Fuji: the wide concave cone, the flat crater top, snow in fingers down the gullies ─────────────────────────

const RIM = 0.075;
function drawFuji(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const P = palette(look);
  const { h, w } = LANDMARK_SIZE.fuji;
  drawMesh(ctx, {
    h, R: w / 2,
    radius: (hf) => RIM + (1 - RIM) * (1 - Math.pow(hf, 1 / 1.4)),
    color: (hf, a, lam, _st, seg) => {
      const finger = Math.pow(0.5 + 0.5 * Math.sin(a * 9 + Math.sin(a * 4) * 1.3), 3);
      const col = withForest(mix(P.rockShade, P.rockLit, Math.pow(lam, 1.2)), hf, 0.25, lam, P);
      return withSnow(col, hf, 0.55 - finger * 0.2 + (hash(seg * 3.7) - 0.5) * 0.05, lam, P);
    },
  }, X, Z, proj, fog * 0.75, haze, alpha);
  crater(ctx, X, Z, h, RIM * (w / 2), proj, mix(mix(P.snowShade, P.rockShade, 0.35), haze, fog * 0.75), alpha);
}

function crater(ctx: CanvasRenderingContext2D, X: number, Z: number, h: number, r: number, proj: Projector, col: RGB, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = css(col);
  ctx.beginPath();
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, q = proj(X + Math.cos(a) * r, Z + Math.sin(a) * r, h); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Mount Everest: a dark, three-sided pyramid with Lhotse and Nuptse, the plume of snow blowing off the summit ─────

/** A cross-section with n flat faces and sharp ridges between them (a regular polygon), 1 at the ridges. */
const faceted = (a: number, n: number, turn = 0) => {
  const seg = (Math.PI * 2) / n;
  const t = ((((a + turn) % seg) + seg) % seg) - seg / 2;
  return Math.cos(seg / 2) / Math.cos(t);
};

function drawEverest(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const P = palette(look);
  const { h, w } = LANDMARK_SIZE.everest;
  const himal = (hgt: number, R: number, turn: number, line: number) => ({
    h: hgt, R,
    segs: 24, jag: 0.12, seed: Math.round(turn * 10),
    rings: [0, 0.1, 0.22, 0.34, 0.46, 0.57, 0.67, 0.76, 0.84, 0.91, 0.96, 1],
    radius: (hf: number, a: number) => (1 - Math.pow(hf, 0.85)) * faceted(a, 3, turn),
    color: (hf: number, _a: number, lam: number) => {
      // dark rock with strong light and shade; a snow cap at the very top (the ridges carry the rest)
      const rock = mix(P.rockShade, P.rockLit, Math.pow(lam, 1.1));
      return hf > 0.9 ? mix(P.snowShade, P.snowLit, Math.pow(lam, 0.7)) : rock;
    },
    ridgeSnow: { ridges: [0, 1, 2].map((k) => (k * Math.PI * 2) / 3 - turn), line, width: 0.16, lit: P.snowLit, shade: P.snowShade },
  });
  // far ones first: Nuptse in front-left, Lhotse behind-right, Everest behind
  drawMesh(ctx, himal(h * 0.86, w * 0.42, 0.9, 0.3), X + w * 0.5, Z + w * 0.35, proj, fog * 0.8, haze, alpha); // Lhotse
  drawMesh(ctx, himal(h, w * 0.5, 0.3, 0.32), X, Z + w * 0.15, proj, fog * 0.8, haze, alpha);                 // Everest
  drawMesh(ctx, himal(h * 0.72, w * 0.46, 2.1, 0.25), X - w * 0.45, Z - w * 0.3, proj, fog * 0.8, haze, alpha); // Nuptse
  // the plume: snow torn off the summit by the jet stream, streaming away downwind
  const top = proj(X, Z + w * 0.15, h);
  const tail = proj(X + w * 0.9, Z + w * 0.15, h * 0.97);
  const len = Math.hypot(tail[0] - top[0], tail[1] - top[1]);
  if (len > 6) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - fog * 0.6);
    const g = ctx.createLinearGradient(top[0], top[1], tail[0], tail[1]);
    const white = look.night ? [190, 200, 230] as RGB : [250, 250, 252] as RGB;
    g.addColorStop(0, css(white, 0.85)); g.addColorStop(0.5, css(white, 0.35)); g.addColorStop(1, css(white, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(top[0], top[1] - len * 0.02);
    ctx.quadraticCurveTo(top[0] + len * 0.5, top[1] - len * 0.09, tail[0], tail[1] - len * 0.05);
    ctx.quadraticCurveTo(top[0] + len * 0.55, top[1] + len * 0.05, top[0], top[1] + len * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ── The Matterhorn: four steep faces between sharp ridges, the summit hooked to one side, patchy snow ─────────────────

function drawMatterhorn(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const P = palette(look);
  const { h, w } = LANDMARK_SIZE.matterhorn;
  drawMesh(ctx, {
    h, R: w / 2, segs: 24, jag: 0.07, seed: 4,
    ridgeSnow: { ridges: [0, 1, 2, 3].map((k) => (k * Math.PI) / 2 - Math.PI / 4), line: 0.3, width: 0.1, lit: P.snowLit, shade: P.snowShade },
    rings: [0, 0.1, 0.2, 0.31, 0.42, 0.53, 0.63, 0.72, 0.8, 0.87, 0.93, 0.97, 1],
    radius: (hf, a) => (1 - Math.pow(hf, 0.75)) * faceted(a, 4, Math.PI / 4),
    lean: (hf) => [Math.pow(hf, 3) * w * 0.12, Math.pow(hf, 3) * w * 0.05],   // the hook: the top leans east
    color: (hf, _a, lam) => {
      // the sunlit face is nearly all snow, bright; the shaded face deep blue rock with snow on its ledges
      const rock = withForest(mix(P.rockShade, P.rockLit, Math.pow(lam, 1.05)), hf, 0.1, lam, P);
      if (hf > 0.15 && lam > 0.5) return mix(P.snowShade, P.snowLit, Math.min(1, 0.4 + lam));
      return rock;
    },
  }, X, Z, proj, fog * 0.8, haze, alpha);
}

// ── Kilimanjaro: broad gentle slopes from the savanna, a wide flat top, the last glaciers in white patches ────────────

function drawKilimanjaro(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const P = palette(look, true);
  const { h, w } = LANDMARK_SIZE.kilimanjaro;
  const top = 0.2;
  drawMesh(ctx, {
    h, R: w / 2, segs: 30, jag: 0.08, seed: 9,
    radius: (hf, a) => (top + (1 - top) * (1 - Math.pow(hf, 0.75))) * (1 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 11)),
    color: (hf, _a, lam, _st, seg) => {
      // forest belt low down, heath and bare brown rock above, white glacier patches only right at the top
      let col = mix(P.rockShade, P.rockLit, Math.pow(lam, 1.1));
      col = withForest(col, hf, 0.35, lam, P);
      if (hf > 0.86 && hash(seg * 4.7 + hf * 3) > 0.45) col = mix(col, mix(P.snowShade, P.snowLit, lam), 0.9);
      return col;
    },
  }, X, Z, proj, fog * 0.75, haze, alpha);
  crater(ctx, X, Z, h, top * 0.7 * (w / 2), proj, mix(mix(P.rockShade, P.snowShade, 0.4), haze, fog * 0.75), alpha);
}

// ── The shared volcano: a cone with a crater and (for the active ones) a wisp of steam ───────────────────────────────

function drawVolcano(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const P = palette(look, true);
  const { h, w } = LANDMARK_SIZE.volcano;
  const rim = 0.1;
  drawMesh(ctx, {
    h, R: w / 2, segs: 30, jag: 0.1, seed: 13,
    radius: (hf, a) => (rim + (1 - rim) * (1 - Math.pow(hf, 1 / 1.25))) * (1 + 0.07 * Math.sin(a * 5 + hf * 3)),
    color: (hf, a, lam, _st, seg) => {
      // dark lava rock, old flows as darker streaks, green lower slopes, a little snow on top
      let col = mix(P.rockShade, P.rockLit, Math.pow(lam, 1.2));
      if (Math.sin(a * 6 + 0.7) > 0.7) col = mix(col, P.rockShade, 0.35);
      col = withForest(col, hf, 0.3, lam, P);
      return withSnow(col, hf, 0.8 + (hash(seg * 2.9) - 0.5) * 0.08, lam, P);
    },
  }, X, Z, proj, fog * 0.8, haze, alpha);
  crater(ctx, X, Z, h, rim * (w / 2), proj, mix(P.rockShade, haze, fog * 0.8), alpha);
  // steam drifting downwind from the crater
  const t0 = proj(X, Z, h), t1 = proj(X + w * 0.5, Z + w * 0.2, h * 1.18);
  const len = Math.hypot(t1[0] - t0[0], t1[1] - t0[1]);
  if (len > 6) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - fog * 0.6) * 0.75;
    const g = ctx.createLinearGradient(t0[0], t0[1], t1[0], t1[1]);
    const steam = look.night ? [150, 156, 180] as RGB : [236, 236, 236] as RGB;
    g.addColorStop(0, css(steam, 0.8)); g.addColorStop(1, css(steam, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse((t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2, len * 0.55, len * 0.14, Math.atan2(t1[1] - t0[1], t1[0] - t0[0]), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Niagara Falls: the river, Goat Island, the curved Horseshoe Falls, the straight American Falls, and the mist ──────

function drawNiagara(ctx: CanvasRenderingContext2D, look: LandmarkLook, X: number, Z: number, proj: Projector, fog: number, haze: RGB, alpha: number) {
  const { w } = LANDMARK_SIZE.niagara;
  const water: RGB = mix(look.night ? [18, 30, 52] : [52, 104, 128], haze, fog * 0.7);
  const rapids: RGB = mix(look.night ? [120, 136, 170] : [214, 232, 236], haze, fog * 0.7);
  const island: RGB = mix(look.night ? [12, 22, 22] : mix(look.leaf, [40, 80, 46], 0.4), haze, fog * 0.7);
  const drop = w * 0.05;                       // the height of the falls (exaggerated, so the drop shows from above)
  const poly = (pts: Array<[number, number, number?]>, col: RGB, a = 1) => {
    ctx.fillStyle = css(col, a);
    ctx.beginPath();
    pts.forEach(([x, z, y], k) => { const q = proj(x, z, y ?? 0); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    ctx.fill();
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  const half = w * 0.16;                       // half the river's width
  // the upper river winds away towards the horizon (to Lake Erie), raised by the drop; banks a darker green
  const bank: RGB = mix(look.night ? [8, 14, 14] : mix(look.leaf, [30, 56, 34], 0.6), haze, fog * 0.7);
  const river = (z0: number, z1: number, y: number, wid: number, col: RGB, curl: number) => {
    const N = 14;
    const left: Array<[number, number, number]> = [], right: Array<[number, number, number]> = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N, z = z0 + (z1 - z0) * t, cx = X + Math.sin(t * 2.4) * curl * Math.abs(z1 - z0) * 0.12, ww = wid * (1 + t * 0.35);
      left.push([cx - ww, z, y]); right.push([cx + ww, z, y]);
    }
    poly([...left, ...right.reverse()].map(([x, z, yy]) => [x, z, yy] as [number, number, number]), col);
  };
  river(Z, Z + w * 7, drop, half * 1.45, bank, 1);
  river(Z, Z + w * 7, drop, half * 1.15, water, 1);
  // below the falls: a deep, narrow gorge with dark cliffs, running back towards the plane
  river(Z, Z - w * 4, 0, half * 0.95, mix(bank, [20, 24, 26], 0.45), -0.6);
  river(Z, Z - w * 4, 0, half * 0.55, mix(water, [12, 24, 34], 0.3), -0.6);
  // rapids above the falls: pale streaks
  for (let k = 0; k < 9; k++) {
    const x = X - half + (k + 0.5) * (half * 2 / 9), z0 = Z + w * 0.05, z1 = Z + w * (0.15 + hash(k) * 0.25);
    poly([[x - half * 0.03, z1, drop], [x + half * 0.03, z1, drop], [x + half * 0.03, z0, drop], [x - half * 0.03, z0, drop]], rapids, 0.6);
  }
  // Goat Island splits the river: the Horseshoe Falls (curved) on the right, the American Falls (straight) on the left
  poly([[X - half * 0.45, Z + w * 0.4, drop], [X - half * 0.2, Z + w * 0.4, drop], [X - half * 0.15, Z + w * 0.02, drop], [X - half * 0.5, Z + w * 0.02, drop]], island);
  const curve: Array<[number, number]> = [];
  for (let k = 0; k <= 16; k++) { const t = k / 16, a = Math.PI * (1 - t); curve.push([X + half * 0.35 + Math.cos(a) * half * 0.65, Z + Math.sin(a) * w * 0.12]); }
  // the falling water: a white curtain from the lip down to the gorge
  for (let k = 0; k < curve.length - 1; k++) {
    const [x0, z0] = curve[k], [x1, z1] = curve[k + 1];
    poly([[x0, z0, drop], [x1, z1, drop], [x1, z1 - w * 0.01, 0], [x0, z0 - w * 0.01, 0]], mix(rapids, [255, 255, 255], 0.3), 0.95);
  }
  poly([[X - half * 1.0, Z + w * 0.02, drop], [X - half * 0.5, Z + w * 0.02, drop], [X - half * 0.5, Z, 0], [X - half * 1.0, Z, 0]], mix(rapids, [255, 255, 255], 0.3), 0.95);
  // the mist rising out of the horseshoe
  const m0 = proj(X + half * 0.35, Z + w * 0.03, drop * 0.5), m1 = proj(X + half * 0.35, Z + w * 0.03, drop * 9);
  const rad = Math.max(4, Math.abs(m1[1] - m0[1]));
  const g = ctx.createRadialGradient(m0[0], m1[1] + rad * 0.4, 0, m0[0], m1[1] + rad * 0.4, rad);
  const mist = look.night ? [150, 160, 190] as RGB : [250, 252, 255] as RGB;
  g.addColorStop(0, css(mist, 0.75 * (1 - fog * 0.6))); g.addColorStop(1, css(mist, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(m0[0], m1[1] + rad * 0.4, rad * 1.1, rad * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
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
  const draw = { fuji: drawFuji, pyramids: drawPyramids, everest: drawEverest, matterhorn: drawMatterhorn, kilimanjaro: drawKilimanjaro, volcano: drawVolcano, niagara: drawNiagara }[kind];
  draw(ctx, look, at.x, at.z, proj, fog, haze, alpha);
}
