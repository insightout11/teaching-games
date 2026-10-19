import { mixRgb } from '@/components/live-room/flight/cockpit-sky';

type RGB = [number, number, number];

export type PeakKind = 'snow' | 'forest' | 'bare';

/** Which peak drawing to use (the dev gallery compares the old and new). */
let PEAK_STYLE: 'old' | 'new' = 'old'; // the room keeps the old peaks until the owner approves the new ones
export function setPeakStyle(s: 'old' | 'new') { PEAK_STYLE = s; }
export const peakStyle = () => PEAK_STYLE;

export interface PeakStyle {
  /** Bare rock colour for this part of the world (grey in the north, red-brown in the desert belt). */
  rock: RGB;
  leaf: RGB;
  snow: RGB;
  warm: boolean;
  night: boolean;
}

const css = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
/** A repeatable pseudo-random number in [0,1) from the peak's own roll, so a peak keeps its shape for life. */
const pr = (roll: number, i: number) => { const s = Math.sin(roll * 12.9898 * (i + 1) + i * 78.233) * 43758.5453; return s - Math.floor(s); };

/**
 * One mountain: a faceted, off-centre peak with a lit left face and a shaded right face split along a wandering
 * ridge, rock strata or forest or snow depending on its kind, and a base that melts into the haze.
 * (cx, baseY) is the foot, topY the summit, half the half-width, all in screen pixels.
 */
export function drawPeak(
  ctx: CanvasRenderingContext2D, kind: PeakKind, roll: number, tone: number, style: PeakStyle,
  cx: number, baseY: number, topY: number, half: number, fog: number, haze: RGB, alpha: number,
) {
  // the new mountains; until their picture is ready (made a few per second, never holding up the flight), the old one
  if (PEAK_STYLE === 'new' && drawPeakV2(ctx, kind, roll, tone, style, cx, baseY, topY, half, fog, haze, alpha)) return;
  const H = baseY - topY;
  const X = (nx: number) => cx + nx * half;
  const Y = (ny: number) => baseY - ny * H;
  const apex = (pr(roll, 1) - 0.5) * 0.4;
  const foot = apex + (pr(roll, 2) - 0.5) * 0.35;
  const j = (i: number, amt = 0.2) => (pr(roll, i) - 0.5) * amt;
  const bump = pr(roll, 7) > 0.5 ? 0.14 : 0;

  // Silhouette: left slope, summit, right slope (with a shoulder on some), and the wandering ridge down the middle.
  const left: Array<[number, number]> = [[-1, 0], [-0.68 + j(3), 0.3], [-0.4 + j(4), 0.62 + j(5, 0.1)], [apex - 0.1, 0.9]];
  const right: Array<[number, number]> = [[apex + 0.12, 0.84], [0.34 + j(6), 0.6], [0.64 + j(8), 0.3 + bump], [1, 0]];
  const ridge: Array<[number, number]> = [[apex, 1], [apex + 0.04 + j(9, 0.1), 0.58], [foot, 0]];

  const litPath = new Path2D();
  const lp = (pts: Array<[number, number]>, path: Path2D) => pts.forEach(([nx, ny], i) => (i ? path.lineTo(X(nx), Y(ny)) : path.moveTo(X(nx), Y(ny))));
  lp([...left, ridge[0], ridge[1], ridge[2]], litPath);
  litPath.closePath();
  const shadePath = new Path2D();
  lp([ridge[0], ...right, ridge[2], ridge[1]], shadePath);
  shadePath.closePath();
  const whole = new Path2D();
  lp([...left, ridge[0], ...right], whole);
  whole.closePath();

  const rock = kind === 'forest' ? mixRgb(style.rock, style.leaf, 0.75) : style.rock;
  const base = kind === 'forest'
    ? mixRgb(style.leaf, [40, 88, 46], 0.82)
    : mixRgb(rock, style.warm ? [150, 96, 70] : [128, 124, 116], tone * 0.3);
  const litC = mixRgb(mixRgb(base, kind === 'forest' ? [150, 190, 100] : [240, 226, 204], kind === 'forest' ? 0.2 : 0.32), haze, kind === 'forest' ? fog * 0.8 : fog);
  const shadeC = mixRgb(mixRgb(base, [16, 20, 34], kind === 'forest' ? 0.5 : 0.45), haze, (kind === 'forest' ? 0.75 : 0.9) * fog);
  const snowLit = mixRgb(style.snow, haze, fog * 0.8);
  const snowShade = mixRgb(mixRgb(style.snow, [150, 170, 206], 0.45), haze, fog * 0.8);
  const detail = fog < 0.78;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.clip(whole);
  ctx.fillStyle = css(litC);
  ctx.fill(litPath);
  ctx.fillStyle = css(shadeC);
  ctx.fill(shadePath);

  if (detail) {
    // A gully down the lit face, and a second on the shaded one, so the faces are not flat.
    ctx.fillStyle = `rgba(14,18,30,${0.16 * (1 - fog)})`;
    ctx.beginPath();
    ctx.moveTo(X(apex - 0.06), Y(0.8)); ctx.lineTo(X(apex - 0.3 + j(10)), Y(0.1)); ctx.lineTo(X(apex - 0.16 + j(11)), Y(0));
    ctx.lineTo(X(apex - 0.02), Y(0.45)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,236,214,${0.1 * (1 - fog)})`;
    ctx.beginPath();
    ctx.moveTo(X(apex + 0.08), Y(0.8)); ctx.lineTo(X(apex + 0.34 + j(12)), Y(0.12)); ctx.lineTo(X(apex + 0.2), Y(0));
    ctx.lineTo(X(apex + 0.1), Y(0.5)); ctx.closePath(); ctx.fill();
    if (style.warm && kind === 'bare') {
      // Rock strata: pale and dark bands that run across the faces, a little tilted.
      for (let b = 0; b < 4; b++) {
        const y = 0.16 + b * 0.19 + j(13 + b, 0.06);
        ctx.fillStyle = b % 2 ? `rgba(240,170,110,${0.26 * (1 - fog)})` : `rgba(80,30,24,${0.24 * (1 - fog)})`;
        ctx.beginPath();
        ctx.moveTo(X(-1.1), Y(y + 0.04)); ctx.lineTo(X(1.1), Y(y - 0.02)); ctx.lineTo(X(1.1), Y(y - 0.09)); ctx.lineTo(X(-1.1), Y(y - 0.03));
        ctx.closePath(); ctx.fill();
      }
    }
    if (kind === 'forest') {
      // Tree line: a darker, speckled lower slope and a bare rocky tip.
      ctx.fillStyle = `rgba(20,52,34,${0.32 * (1 - fog)})`;
      ctx.fillRect(X(-1.1), Y(0.34), half * 2.2, H * 0.34);
      ctx.fillStyle = css(mixRgb(mixRgb(style.rock, [150, 146, 138], 0.3), haze, fog));
      ctx.beginPath(); ctx.moveTo(X(apex - 0.2), Y(0.76)); ctx.lineTo(X(apex), Y(1)); ctx.lineTo(X(apex + 0.2), Y(0.76)); ctx.closePath(); ctx.fill();
    }
  }

  if (kind === 'snow') {
    // Snow lies on the high ground down to a ragged line, whiter on the lit face and bluer in shadow.
    const k = 0.36 + pr(roll, 20) * 0.22;
    const line = (nx: number) => k + 0.07 * Math.sin(nx * 9 + roll * 20) + 0.04 * Math.sin(nx * 23 + roll * 7);
    const cap = new Path2D();
    cap.moveTo(X(-1.2), Y(1.2));
    cap.lineTo(X(1.2), Y(1.2));
    for (let s = 12; s >= 0; s--) { const nx = -1.2 + (s / 12) * 2.4; cap.lineTo(X(nx), Y(line(nx))); }
    cap.closePath();
    ctx.save(); ctx.clip(litPath); ctx.fillStyle = css(snowLit); ctx.fill(cap); ctx.restore();
    ctx.save(); ctx.clip(shadePath); ctx.fillStyle = css(snowShade); ctx.fill(cap); ctx.restore();
  }

  // Foot of the mountain melts into the haze and the valley floor.
  const skirt = ctx.createLinearGradient(0, baseY - H * 0.28, 0, baseY);
  skirt.addColorStop(0, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
  skirt.addColorStop(1, `rgba(${haze[0]},${haze[1]},${haze[2]},${0.25 + fog * 0.4})`);
  ctx.fillStyle = skirt;
  ctx.fillRect(X(-1.1), baseY - H * 0.28, half * 2.2, H * 0.28 + 1);
  ctx.restore();
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ── Mountains with depth (Oct 2026) ───────────────────────────────────────────────────────────────────────────────
// Each mountain is a small picture made once and reused (drawn scaled), shaded pixel by pixel like a relief map:
// a broad, irregular massif with shoulders; slopes facing the light are bright and the others in shadow; vertical
// spurs and gullies; darker and hazier towards the foot; snow above an uneven line that runs further down the ridges;
// forest speckle low down; banded rock in dry ranges. Night uses the same shapes in moonlight.

const TW = 288, TH = 144;          // template size (pixels); drawn scaled to each peak
const TEMPLATES = 24;              // different mountain shapes per kind (and each can be mirrored)
const templateCache = new Map<string, HTMLCanvasElement>();
/** The same silhouette filled with the haze colour: drawn over the mountain at the haze strength (smooth with distance). */
const hazeCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const pending = new Map<string, () => void>();
let buildScheduled = false;
/** Builds waiting pictures while the browser is idle (a few milliseconds each), so the flight never stutters. */
function scheduleBuilds() {
  if (buildScheduled) return;
  buildScheduled = true;
  const idle = (cb: (d: { timeRemaining: () => number }) => void) =>
    (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 120 }) : setTimeout(() => cb({ timeRemaining: () => 8 }), 30));
  const run = (d: { timeRemaining: () => number }) => {
    const start = performance.now();
    do {
      const next = pending.entries().next().value;
      if (!next) break;
      pending.delete(next[0]);
      next[1]();
    } while (d.timeRemaining() > 6 || performance.now() - start < 6); // a busy page still gets a few every call
    if (pending.size) idle(run); else buildScheduled = false;
  };
  idle(run);
}

/** 1-D smooth noise from a seed (sum of a few sines with seeded phases: cheap and repeatable). */
function noise1(seed: number) {
  const ph = [0, 1, 2, 3, 4, 5].map((i) => pr(seed, i) * Math.PI * 2);
  return (x: number, f = 1) => (
    Math.sin(x * 2.1 * f + ph[0]) * 0.5 + Math.sin(x * 4.7 * f + ph[1]) * 0.25 + Math.sin(x * 9.3 * f + ph[2]) * 0.14
    + Math.sin(x * 19.1 * f + ph[3]) * 0.07 + Math.sin(x * 37.7 * f + ph[4]) * 0.04
  ) * 0.5 + 0.5;
}

function makeTemplate(kind: PeakKind, seed: number, style: PeakStyle, fog: number, haze: RGB): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TW; c.height = TH;
  const g = c.getContext('2d');
  if (!g) return c;
  const img = g.createImageData(TW, TH);
  const n1 = noise1(seed * 1.7 + 1), n2 = noise1(seed * 3.1 + 7), n3 = noise1(seed * 5.3 + 13);
  // the skyline: a summit off-centre, one or two shoulders, noise that is stronger mid-slope
  const apex = 0.36 + pr(seed, 40) * 0.28;
  const bumps = [0, 1, 2].map((k) => ({ x: apex + (pr(seed, 41 + k) < 0.5 ? -1 : 1) * (0.14 + pr(seed, 43 + k) * 0.3), h: 0.35 + pr(seed, 45 + k) * 0.4, w: 0.06 + pr(seed, 47 + k) * 0.1 }));
  const sharp = 0.75 + pr(seed, 49) * 0.45;
  // not every mountain is a spike: about half have rounded or broad, uneven tops
  const cap = pr(seed, 51) < 0.5 ? 0.62 + pr(seed, 52) * 0.25 : 2;
  const hAt = (u: number) => {
    const d = u < apex ? (apex - u) / apex : (u - apex) / (1 - apex);
    let h = Math.pow(clamp01(1 - d), sharp);
    for (const b of bumps) h = Math.max(h, b.h * Math.exp(-((u - b.x) ** 2) / (2 * b.w * b.w)) * (1 - d * 0.4));
    if (h > cap) h = cap + (h - cap) * 0.22;
    h *= 0.74 + 0.26 * n1(u * 4);
    h += (n2(u * 9) - 0.5) * 0.07 * Math.sin(Math.PI * clamp01(1 - d));
    return clamp01(h * Math.pow(Math.sin(Math.PI * clamp01(u)), 0.45)); // slopes always reach the ground before the sides
  };
  const H = new Float32Array(TW + 2);
  for (let x = -1; x <= TW; x++) H[x + 1] = hAt((x + 0.5) / TW);
  const peakH = Math.max(...Array.from(H));
  for (let x = 0; x < H.length; x++) H[x] /= peakH || 1; // the summit touches the top

  const rock = kind === 'forest' ? mixRgb(style.rock, style.leaf, 0.55) : mixRgb(style.rock, style.warm ? [150, 96, 70] : [128, 124, 116], 0.25);
  const lit: RGB = style.night ? mixRgb(rock, [76, 90, 128], 0.6) : mixRgb(rock, style.warm ? [246, 200, 156] : [238, 228, 212], 0.42);
  const shade: RGB = style.night ? mixRgb(rock, [8, 12, 24], 0.78) : mixRgb(rock, [26, 30, 48], 0.55);
  const snowLit: RGB = style.night ? [178, 192, 224] : style.snow;
  const snowShade: RGB = style.night ? [88, 102, 140] : mixRgb(style.snow, [138, 160, 204], 0.45);
  const tree: RGB = style.night ? [10, 20, 20] : mixRgb(style.leaf, [18, 46, 28], 0.6);
  const snowLine = kind === 'snow' ? 0.4 + pr(seed, 50) * 0.22 : kind === 'forest' ? 0.86 : 2;

  for (let x = 0; x < TW; x++) {
    const h = H[x + 1];
    if (h <= 0.002) continue;
    const top = (1 - h) * TH;
    const slope = (H[x + 2] - H[x]) * TW * 0.08;   // + rising to the right: a face turned to the light (from the left)
    const u = x / TW;
    for (let y = Math.max(0, Math.floor(top)); y < TH; y++) {
      const ph = 1 - y / TH;                          // height of this point (0 foot, 1 summit)
      const depth = (y - top) / Math.max(1, TH - top); // 0 at the skyline, 1 at the foot
      // ridges and gullies fan out from the summit: a pattern in the angle from the summit
      const spread = 0.12 + (1 - ph) * 1.3;
      const a0 = (u - apex) / spread, a1 = (u + 1 / TW - apex) / spread;
      const rf = (a: number) => 0.6 * n3(a * 3) + 0.4 * n2(a * 6.3 + 2.1);
      const ridge = rf(a0), across = (rf(a1) - ridge) * TW * 0.35; // + the light side of a ridge
      const spur = Math.abs(ridge - 0.5) * 2;           // 0 on a crest, 1 in a gully
      const patch = n2(u * 5 + ph * 6) - 0.5;           // broad patchy variation
      let light = clamp01(0.5 + slope * 1.5 * (1 - depth * 0.5) + across * (kind === 'bare' ? 0.4 : 0.6) + patch * 0.3);
      light = clamp01(light - depth * 0.22);
      let col = mixRgb(shade, lit, light);
      // snow: above an uneven line, further down along the crests, thinner in the gullies
      const line = snowLine + (n1(u * 23 + ph * 3) - 0.5) * 0.12 + (spur - 0.5) * 0.14;
      if (ph > line) col = mixRgb(snowShade, snowLit, clamp01(light * 1.15));
      else if (kind === 'forest' && ph < 0.55) {
        // trees: random dots, clumped by a broad noise, thinning towards the tree line
        const hash = Math.sin(x * 12.9898 + y * 78.233 + seed * 3.7) * 43758.5453;
        const dot = hash - Math.floor(hash);
        if (dot < (0.55 - ph) * 1.4 * (0.4 + n2(u * 4 + ph * 3))) col = mixRgb(col, tree, 0.75);
      } else if (kind === 'bare' && style.warm) {
        // rock layers: soft horizontal bands, gently warped
        const band = Math.sin((ph + (n1(u * 2) - 0.5) * 0.06) * 30);
        col = mixRgb(col, band > 0.5 ? [228, 160, 108] : band < -0.6 ? [96, 46, 34] : col, 0.12);
      }
      col = mixRgb(col, haze, clamp01(fog + depth * 0.22 * (1 - fog)));
      // soft skyline, and the foot fades into the valley haze
      const edge = (y === Math.floor(top) ? 1 - (top - Math.floor(top)) : 1) * clamp01((1 - depth) / 0.28) * clamp01(Math.min(u, 1 - u) / 0.1); // no hard sides
      const i = (y * TW + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = Math.round(255 * edge);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function drawPeakV2(
  ctx: CanvasRenderingContext2D, kind: PeakKind, roll: number, _tone: number, style: PeakStyle,
  cx: number, baseY: number, topY: number, half: number, fog: number, haze: RGB, alpha: number,
): boolean {
  const h = baseY - topY;
  if (h < 1 || half < 1) return true;
  const t = Math.floor(roll * TEMPLATES) % TEMPLATES;
  // Colours rounded, so colours that drift slightly (ranges blending as the plane flies) reuse the same pictures.
  const q = (c: RGB) => c.map((v) => Math.round(v / 24) * 24) as RGB;
  const hz = q(haze);
  const look: PeakStyle = { ...style, rock: q(style.rock), snow: q(style.snow), leaf: q(style.leaf) };
  const base = `${kind}|${look.night ? 1 : 0}|${look.warm ? 1 : 0}|${look.rock.join(',')}|${look.snow.join(',')}|${look.leaf.join(',')}|${hz.join(',')}`;
  const key = `${base}|${t}`;
  let tpl = templateCache.get(key);
  if (!tpl) {
    // Made in the browser's idle moments, never inside a frame; until it exists, borrow one already made (or the old peak).
    if (!pending.has(key)) {
      pending.set(key, () => { templateCache.set(key, makeTemplate(kind, t + 1, look, 0, hz)); if (templateCache.size > 400) { const k = templateCache.keys().next().value; if (k) templateCache.delete(k); } });
      scheduleBuilds();
    }
    for (let k = 1; k < TEMPLATES && !tpl; k++) tpl = templateCache.get(`${base}|${(t + k) % TEMPLATES}`);
    // nothing of this look yet: make this one now (once per look), so the new mountains show from the first frame
    if (!tpl) { pending.delete(key); tpl = makeTemplate(kind, t + 1, look, 0, hz); templateCache.set(key, tpl); }
  }
  let veil = hazeCache.get(tpl);
  if (!veil) {
    veil = document.createElement('canvas');
    veil.width = TW; veil.height = TH;
    const vg = veil.getContext('2d');
    if (vg) { vg.drawImage(tpl, 0, 0); vg.globalCompositeOperation = 'source-in'; vg.fillStyle = `rgb(${hz[0]},${hz[1]},${hz[2]})`; vg.fillRect(0, 0, TW, TH); }
    hazeCache.set(tpl, veil);
  }
  const haze01 = clamp01(fog);
  // broad massifs: a mountain is about three times as wide as it is tall
  const w = half * 2.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  const x0 = pr(roll, 99) > 0.5 ? (ctx.translate(cx, 0), ctx.scale(-1, 1), -w / 2) : cx - w / 2;
  ctx.drawImage(tpl, x0, topY, w, h);
  if (haze01 > 0.03) { ctx.globalAlpha = alpha * haze01; ctx.drawImage(veil, x0, topY, w, h); }
  ctx.restore();
  return true;
}
