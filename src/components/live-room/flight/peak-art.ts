import { mixRgb } from '@/components/live-room/flight/cockpit-sky';

type RGB = [number, number, number];

export type PeakKind = 'snow' | 'forest' | 'bare';

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
