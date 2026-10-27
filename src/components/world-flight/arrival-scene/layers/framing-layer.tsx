import { normalizeVegetation } from '../scene-registry';
import { randRange } from '../seed';
import { BLEED_X, CONTENT_W, type ScenePalette } from '../types';
import type { DestinationScene } from '@/lib/world-flight/types';

// Foreground framing (Oct 2026, gallery first): a soft, slightly out-of-focus branch reaching in from the top right
// corner, chosen from the city's real plants and the real season: cherry blossom in Tokyo in spring, red maple in
// autumn, palm fronds in Dubai and Rio. It gives the scene a near layer and a sense of place. Top right, because the
// plane comes in from the upper left.

export type FramingKind = 'blossom' | 'maple' | 'autumn' | 'green' | 'bare' | 'palm' | 'pine';

/** The branch for this place and month. `southern` flips the seasons. Null when the scene has no trees to frame with. */
export function framingKind(scene: DestinationScene, month: number, southern = false): FramingKind | null {
  const veg = normalizeVegetation(scene.vegetation);
  const m = southern ? ((month + 5) % 12) + 1 : month; // the same season in the other hemisphere
  const tropical = scene.palette === 'tropical';
  if (veg === 'palms') return 'palm';
  if (veg === 'pines') return 'pine';
  if (veg === 'sakura') {
    if (m === 3 || m === 4) return 'blossom';
    if (m === 10 || m === 11) return 'maple';
    if (m === 12 || m <= 2) return 'bare';
    return 'green';
  }
  if (veg === 'broadleaf') {
    if (tropical) return 'green';
    if (m === 10 || m === 11) return 'autumn';
    if (m === 12 || m <= 2) return 'bare';
    return 'green';
  }
  return null;
}

const hex = (c: string) => {
  const m = c.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Mix two colours; falls back to the first when either isn't a plain hex. */
function mix(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  if (!x || !y) return a;
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const LEAF: Record<FramingKind, { lit: string; shade: string } | null> = {
  blossom: { lit: '#f7d3de', shade: '#d99ab3' },
  maple: { lit: '#e0663f', shade: '#9e3934' },
  autumn: { lit: '#e2b04d', shade: '#b0702f' },
  green: null, // from the scene's own foliage colour
  bare: null,
  palm: { lit: '#6f9a55', shade: '#3a6145' },
  pine: { lit: '#5d8566', shade: '#2f4d40' },
};

export function FramingLayer({ palette, rand, idPrefix, ambient, kind }: {
  palette: ScenePalette;
  rand: () => number;
  idPrefix: string;
  ambient: boolean;
  kind: FramingKind;
}) {
  const night = palette.light === 'moon';
  // Foreground things are close and against the light: a touch darker, and at night mostly silhouette.
  const tone = (c: string) => (night ? mix(c, palette.skyTop, 0.42) : mix(c, palette.buildingSilhouette, 0.15));
  const own = LEAF[kind];
  const leafLit = tone(own?.lit ?? mix(palette.foliage, palette.lightColor, 0.25));
  const leafShade = tone(own?.shade ?? mix(palette.foliage, palette.buildingSilhouette, 0.35));
  const bark = tone(mix(palette.trunk, palette.buildingSilhouette, 0.3));
  // Moonlight or sunlight catching the top edge of the wood, so the bough reads even at night
  const rim = night ? mix(palette.lightColor, palette.skyTop, 0.35) : mix(palette.lightColor, '#ffffff', 0.3);
  const id = `${idPrefix}-frame`;

  // The right edge of the 16:9 view; the branch reaches about a fifth of the way across from there.
  const edge = BLEED_X + CONTENT_W;
  const reach = CONTENT_W * 0.27;
  // The landing camera's slight zoom crops the very top, so the branch hangs a little lower than the frame edge.
  const top = 40;

  const parts: React.ReactNode[] = [];
  if (kind === 'palm') {
    // Fronds hanging down from a crown just above the top right corner: each a filled, drooping leaf cut into fingers
    const cx = edge - reach * 0.12, cy = top - 120;
    for (let f = 0; f < 8; f += 1) {
      const ang = Math.PI * (0.5 + f * 0.085) + randRange(rand, -0.04, 0.04); // fanning down and to the left
      const len = randRange(rand, reach * 1.0, reach * 1.4);
      const ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len * 0.6 + len * 0.42;
      const qx = cx + Math.cos(ang) * len * 0.55, qy = cy + Math.sin(ang) * len * 0.15;
      const at = (t: number) => [
        (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * qx + t * t * ex,
        (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * qy + t * t * ey,
      ];
      const fill = f % 2 ? leafShade : leafLit;
      for (let i = 1; i < 22; i += 1) {
        const t = i / 22;
        const [px, py] = at(t);
        const [nx, ny] = at(Math.min(1, t + 0.06));
        const dir = Math.atan2(ny - py, nx - px);
        const l = (1 - t * 0.6) * 74;
        for (const s of [-1, 1]) {
          // each finger points down and outward from the rib, as a slim filled leaf
          const a = dir + s * 0.95 + 0.25;
          const tx = px + Math.cos(a) * l, ty = py + Math.sin(a) * l + 10;
          const w = 11 - t * 6;
          parts.push(
            <path key={`l${f}-${i}-${s}`} d={`M ${px} ${py} Q ${(px + tx) / 2 + Math.cos(a + Math.PI / 2) * w} ${(py + ty) / 2 + Math.sin(a + Math.PI / 2) * w} ${tx} ${ty} Q ${(px + tx) / 2 - Math.cos(a + Math.PI / 2) * w} ${(py + ty) / 2 - Math.sin(a + Math.PI / 2) * w} ${px} ${py} Z`}
              fill={s > 0 ? fill : leafShade} />,
          );
        }
      }
      parts.push(<path key={`r${f}`} d={`M ${cx} ${cy} Q ${qx} ${qy} ${ex} ${ey}`} stroke={bark} strokeWidth={4} fill="none" strokeLinecap="round" />);
    }
  } else {
    // A bough coming in from beyond the right edge, with twigs, and leaf or blossom clusters on them
    const x0 = edge + 80, y0 = top - 90, x1 = edge - reach, y1 = top + 80;
    const qx = edge - reach * 0.3, qy = top - 20;
    parts.push(<path key="bough" d={`M ${x0} ${y0} Q ${qx} ${qy} ${x1} ${y1}`} stroke={bark} strokeWidth={17} fill="none" strokeLinecap="round" />);
    const twigs: Array<[number, number]> = [];
    for (let i = 0; i < 9; i += 1) {
      const t = 0.12 + i * 0.1;
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1;
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1;
      const tx = px + randRange(rand, -70, 20), ty = py + randRange(rand, 40, 110);
      parts.push(<path key={`t${i}`} d={`M ${px} ${py} Q ${px - 10} ${(py + ty) / 2} ${tx} ${ty}`} stroke={bark} strokeWidth={Math.max(2, 7 - i * 0.6)} fill="none" strokeLinecap="round" />);
      twigs.push([tx, ty], [(px + tx) / 2, (py + ty) / 2]);
    }
    twigs.push([x1, y1]);
    if (kind !== 'bare') {
      twigs.forEach(([tx, ty], i) => {
        const n = kind === 'pine' ? 10 : kind === 'blossom' ? 20 : 12;
        for (let j = 0; j < n; j += 1) {
          const dx = randRange(rand, -44, 44), dy = randRange(rand, -30, 28);
          const r = kind === 'blossom' ? randRange(rand, 6, 11) : randRange(rand, 10, 18);
          const lit = dy < 0;
          if (kind === 'pine') {
            const a = randRange(rand, 0, Math.PI * 2);
            parts.push(<path key={`n${i}-${j}`} d={`M ${tx} ${ty} l ${Math.cos(a) * r * 2.2} ${Math.sin(a) * r * 2.2}`} stroke={lit ? leafLit : leafShade} strokeWidth={2.4} strokeLinecap="round" />);
          } else {
            parts.push(<ellipse key={`f${i}-${j}`} cx={tx + dx} cy={ty + dy} rx={r * 1.2} ry={r} transform={`rotate(${randRange(rand, -40, 40)} ${tx + dx} ${ty + dy})`} fill={lit ? leafLit : leafShade} />);
          }
        }
      });
    }
  }

  // A few blossom petals or leaves drifting down in front of the scene
  const fallers = ambient && (kind === 'blossom' || kind === 'maple' || kind === 'autumn')
    ? Array.from({ length: 7 }, (_, i) => ({ x: edge - randRange(rand, 40, reach * 2.4), d: randRange(rand, 9, 15), delay: -randRange(rand, 0, 14), i }))
    : [];

  return (
    <g aria-hidden>
      <defs>
        {/* Close to the camera, so slightly out of focus */}
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <g filter={`url(#${id}-soft)`}>
        {parts}
        {kind !== 'palm' && (
          <path d={`M ${edge + 80} ${top - 90} Q ${edge - reach * 0.3} ${top - 20} ${edge - reach} ${top + 80}`} stroke={rim} strokeWidth={3} opacity={night ? 0.55 : 0.45} fill="none" transform="translate(0 -6)" />
        )}
      </g>
      {fallers.length > 0 && (
        <>
          <style>{'@keyframes lc-fall{0%{transform:translate(0,-30px) rotate(0deg);opacity:0}10%{opacity:.9}90%{opacity:.9}100%{transform:translate(-160px,620px) rotate(320deg);opacity:0}}.lc-fall{animation:lc-fall linear infinite}'}</style>
          {fallers.map((p) => (
            <g key={p.i} transform={`translate(${p.x} ${top + 40})`}>
              <ellipse className="lc-fall" style={{ animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, transformBox: 'fill-box' } as React.CSSProperties}
                cx={0} cy={0} rx={6} ry={3.6} fill={leafLit} />
            </g>
          ))}
        </>
      )}
    </g>
  );
}
