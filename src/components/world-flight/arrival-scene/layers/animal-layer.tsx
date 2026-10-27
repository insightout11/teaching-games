import { BLEED_X, VIEWBOX, type ScenePalette } from '../types';
import type { DestinationScene } from '@/lib/world-flight/types';

// A local animal close to the camera, bottom left (Oct 2026, gallery first). With the framing branch top right it
// frames the landing on the diagonal. It pops up into view watching the plane, notices the camera after ~2 s (eyes snap to you,
// go wide, ears perk with a little hop), then pulls a cheeky face: a big grin, one eyebrow up, rosy cheeks. Then it
// stays, alive: blinks, flicks an ear, glances back at the plane now and then. Real animals of the place only, drawn
// head and shoulders, cut off by the bottom of the picture, in the scene's own light.

export type AnimalKind = 'tanuki' | 'red-fox' | 'kangaroo' | 'fennec';

const BY_CITY: Record<string, AnimalKind> = {
  tokyo: 'tanuki',
  paris: 'red-fox',
  sydney: 'kangaroo',
  dubai: 'fennec',
};

export const ANIMAL_NAME: Record<AnimalKind, string> = {
  tanuki: 'Tanuki (raccoon dog)',
  'red-fox': 'Red fox',
  kangaroo: 'Eastern grey kangaroo',
  fennec: 'Fennec fox',
};

export function animalFor(scene: DestinationScene): AnimalKind | null {
  return (scene.skylineVariant && BY_CITY[scene.skylineVariant]) || null;
}

const hex = (c: string) => {
  const m = c.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function mix(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  if (!x || !y) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Fur colours per animal: main, shade, light (cheeks, muzzle, inner ear), dark (mask, nose, ear backs). */
const FUR: Record<AnimalKind, [string, string, string, string]> = {
  tanuki: ['#8a7660', '#62523f', '#e2d4b8', '#2e2620'],
  'red-fox': ['#d4743a', '#a5512a', '#f6ece0', '#3a2a22'],
  kangaroo: ['#ad9174', '#806850', '#eadcc6', '#3d3128'],
  fennec: ['#e5cb9e', '#c2a072', '#faf2e2', '#4a3a2c'],
};

/** Face layout per animal (all drawn facing the camera, head centre at 0,0, body below). */
interface Face {
  head: string; // head outline path
  ears: [string, string]; // left, right outer ear
  inner: [string, string]; // inner ears
  muzzle: string;
  eyeY: number;
  eyeDX: number;
  eyeR: number;
  noseY: number;
  mask?: string; // tanuki's dark eye mask
  shoulders: string;
}

const FACES: Record<AnimalKind, Face> = {
  tanuki: {
    head: 'M -78 -6 C -84 -60 -46 -96 0 -96 C 46 -96 84 -60 78 -6 C 72 40 34 58 0 58 C -34 58 -72 40 -78 -6 Z',
    ears: ['M -66 -62 C -76 -96 -52 -112 -34 -92 Z', 'M 66 -62 C 76 -96 52 -112 34 -92 Z'],
    inner: ['M -60 -70 C -64 -90 -52 -98 -42 -88 Z', 'M 60 -70 C 64 -90 52 -98 42 -88 Z'],
    muzzle: 'M -34 18 C -36 -6 36 -6 34 18 C 30 46 -30 46 -34 18 Z',
    eyeY: -20, eyeDX: 32, eyeR: 9, noseY: 6,
    mask: 'M -70 -18 C -66 -46 -30 -46 -12 -16 C -6 -2 -24 14 -44 10 C -60 6 -72 -2 -70 -18 Z M 70 -18 C 66 -46 30 -46 12 -16 C 6 -2 24 14 44 10 C 60 6 72 -2 70 -18 Z',
    shoulders: 'M -120 200 C -120 90 -80 40 0 40 C 80 40 120 90 120 200 Z',
  },
  'red-fox': {
    head: 'M -82 -30 C -72 -70 -36 -90 0 -90 C 36 -90 72 -70 82 -30 C 70 6 30 54 0 70 C -30 54 -70 6 -82 -30 Z',
    ears: ['M -70 -56 L -60 -150 L -18 -84 Z', 'M 70 -56 L 60 -150 L 18 -84 Z'],
    inner: ['M -60 -66 L -55 -126 L -30 -86 Z', 'M 60 -66 L 55 -126 L 30 -86 Z'],
    muzzle: 'M -82 -28 C -50 -16 -26 4 0 4 C 26 4 50 -16 82 -28 C 70 8 30 56 0 72 C -30 56 -70 8 -82 -28 Z',
    eyeY: -36, eyeDX: 30, eyeR: 8, noseY: 36,
    shoulders: 'M -112 200 C -112 100 -70 52 0 52 C 70 52 112 100 112 200 Z',
  },
  kangaroo: {
    head: 'M -56 -40 C -56 -86 -28 -104 0 -104 C 28 -104 56 -86 56 -40 C 56 6 34 60 0 72 C -34 60 -56 6 -56 -40 Z',
    ears: ['M -44 -80 C -66 -150 -44 -186 -24 -170 C -20 -130 -22 -104 -26 -92 Z', 'M 44 -80 C 66 -150 44 -186 24 -170 C 20 -130 22 -104 26 -92 Z'],
    inner: ['M -40 -96 C -54 -140 -42 -166 -32 -158 C -30 -128 -30 -110 -32 -100 Z', 'M 40 -96 C 54 -140 42 -166 32 -158 C 30 -128 30 -110 32 -100 Z'],
    muzzle: 'M -30 20 C -32 -4 32 -4 30 20 C 28 56 -28 56 -30 20 Z',
    eyeY: -40, eyeDX: 26, eyeR: 8.5, noseY: 36,
    shoulders: 'M -96 200 C -100 110 -60 56 0 56 C 60 56 100 110 96 200 Z',
  },
  fennec: {
    head: 'M -58 -20 C -58 -62 -30 -78 0 -78 C 30 -78 58 -62 58 -20 C 52 18 26 50 0 58 C -26 50 -52 18 -58 -20 Z',
    // the huge ears that let a fennec lose heat in the desert
    ears: ['M -46 -48 C -112 -110 -110 -196 -82 -204 C -50 -160 -26 -100 -20 -70 Z', 'M 46 -48 C 112 -110 110 -196 82 -204 C 50 -160 26 -100 20 -70 Z'],
    inner: ['M -44 -62 C -92 -112 -94 -170 -80 -180 C -58 -146 -40 -102 -32 -76 Z', 'M 44 -62 C 92 -112 94 -170 80 -180 C 58 -146 40 -102 32 -76 Z'],
    muzzle: 'M -26 14 C -28 -8 28 -8 26 14 C 24 42 -24 42 -26 14 Z',
    eyeY: -22, eyeDX: 24, eyeR: 9.5, noseY: 26,
    shoulders: 'M -92 200 C -92 104 -56 46 0 46 C 56 46 92 104 92 200 Z',
  },
};

export function AnimalLayer({ kind, palette, idPrefix, ambient }: {
  kind: AnimalKind;
  palette: ScenePalette;
  idPrefix: string;
  ambient: boolean;
}) {
  const night = palette.light === 'moon';
  // Lit by the scene: at night mostly moonlit, by day a touch of the sun's colour
  const tone = (c: string) => (night ? mix(c, palette.skyTop, 0.45) : mix(c, palette.lightColor, 0.08));
  const [main, shade, light, dark] = FUR[kind].map(tone);
  const f = FACES[kind];
  const id = `${idPrefix}-animal`;
  const ink = night ? '#14101a' : '#1d1712';
  // Close to the camera, bottom left of the 16:9 view; the picture's bottom edge cuts off the body
  const x = BLEED_X + 200, y = VIEWBOX.h - 185;
  const L = -f.eyeDX, R = f.eyeDX;

  // The eyes: white, a pupil that first watches the plane (to the right), then snaps to the camera
  const eye = (cx: number, side: 'l' | 'r') => (
    <g className="lc-an-blink" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }}>
      <ellipse className="lc-an-wide" cx={cx} cy={f.eyeY} rx={f.eyeR * 1.15} ry={f.eyeR * 1.25} fill="#fbf6ea" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }} />
      <g className={ambient ? 'lc-an-pupil' : undefined}>
        <circle cx={cx} cy={f.eyeY + 1} r={f.eyeR * 0.72} fill={ink} />
        <circle cx={cx + f.eyeR * 0.28} cy={f.eyeY - f.eyeR * 0.3} r={f.eyeR * 0.26} fill="#ffffff" />
      </g>
      {/* eyebrow: the left one shoots up in the cheeky face */}
      <path className={side === 'l' && ambient ? 'lc-an-brow' : undefined} transform={side === 'l' && !ambient ? 'translate(0 -7) rotate(-10)' : undefined} d={`M ${cx - f.eyeR * 1.2} ${f.eyeY - f.eyeR * 1.8} q ${f.eyeR * 1.2} ${-f.eyeR * 0.7} ${f.eyeR * 2.4} 0`}
        stroke={dark} strokeWidth={4} strokeLinecap="round" fill="none" style={{ transformOrigin: `${cx}px ${f.eyeY}px` }} />
    </g>
  );

  const mouthY = f.noseY + 16;
  return (
    <g aria-hidden transform={`translate(${x} ${y}) scale(1.25)`}>
      {ambient && (
        <style>{`
          @keyframes lc-an-in{0%{transform:translateY(260px)}60%{transform:translateY(-6px)}100%{transform:translateY(0)}}
          @keyframes lc-an-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}70%{transform:translateY(2px)}}
          @keyframes lc-an-pupil{0%,12%{transform:translate(5px,-2px)}15%,82%{transform:translate(0,0)}86%,93%{transform:translate(6px,-2px)}96%,100%{transform:translate(0,0)}}
          @keyframes lc-an-wide{0%,12%{transform:scale(1)}16%{transform:scale(1.4)}22%,74%{transform:scale(1.08)}80%,100%{transform:scale(1)}}
          @keyframes lc-an-blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(0.1)}}
          @keyframes lc-an-grin{0%,19%{opacity:0}22%,72%{opacity:1}76%,100%{opacity:0}}
          @keyframes lc-an-flat{0%,19%{opacity:1}22%,72%{opacity:0}76%,100%{opacity:1}}
          @keyframes lc-an-brow{0%,19%{transform:translateY(0) rotate(0)}24%,70%{transform:translateY(-7px) rotate(-10deg)}76%,100%{transform:translateY(0) rotate(0)}}
          @keyframes lc-an-ear{0%,12%{transform:rotate(0)}15%{transform:rotate(-8deg) scale(1.08)}20%,86%{transform:rotate(0)}90%{transform:rotate(-7deg)}94%,100%{transform:rotate(0)}}
          @keyframes lc-an-tilt{0%,20%{transform:rotate(0)}26%,70%{transform:rotate(-5deg)}78%,100%{transform:rotate(0)}}
          .${id} .lc-an-rise{animation:lc-an-in 1.5s cubic-bezier(.2,.8,.3,1) both}
          .${id} .lc-an-hopper{animation:lc-an-hop .55s ease-out 2.2s both}
          .${id} .lc-an-pupil{animation:lc-an-pupil 14s ease-in-out .4s infinite}
          .${id} .lc-an-wide{animation:lc-an-wide 14s ease-out .4s infinite}
          .${id} .lc-an-blink{animation:lc-an-blink 5.4s 6s infinite}
          .${id} .lc-an-grin{animation:lc-an-grin 14s .4s infinite}
          .${id} .lc-an-flat{animation:lc-an-flat 14s .4s infinite}
          .${id} .lc-an-brow{animation:lc-an-brow 14s .4s infinite}
          .${id} .lc-an-ear{transform-box:fill-box;transform-origin:50% 100%;animation:lc-an-ear 14s .4s infinite}
          .${id} .lc-an-head{transform-box:fill-box;transform-origin:50% 90%;animation:lc-an-tilt 14s ease-in-out .4s infinite}
        `}</style>
      )}
      <g className={id}>
        <g className="lc-an-rise">
          <g className="lc-an-hopper">
            <path d={f.shoulders} fill={main} />
            <path d={`M -40 200 C -40 120 -24 70 0 64 C 24 70 40 120 40 200 Z`} fill={light} opacity={0.85} />
            <g className="lc-an-head">
              <path className="lc-an-ear" d={f.ears[0]} fill={kind === 'red-fox' ? dark : main} />
              <path className="lc-an-ear" d={f.ears[1]} fill={kind === 'red-fox' ? dark : main} />
              <path d={f.inner[0]} fill={kind === 'tanuki' ? dark : light} opacity={0.9} />
              <path d={f.inner[1]} fill={kind === 'tanuki' ? dark : light} opacity={0.9} />
              <path d={f.head} fill={main} />
              {/* a soft shade under the chin side away from the light */}
              <path d={f.head} fill={shade} opacity={0.35} transform="translate(10 8) scale(0.94)" />
              <path d={f.head} fill={main} transform="translate(-4 -4) scale(0.92)" />
              {f.mask && <path d={f.mask} fill={dark} />}
              <path d={f.muzzle} fill={light} />
              {/* rosy cheeks in the cheeky face */}
              <g className={ambient ? 'lc-an-grin' : undefined}>
                <ellipse cx={L - f.eyeR * 1.4} cy={f.noseY + 4} rx={f.eyeR * 1.2} ry={f.eyeR * 0.7} fill="#f08a8a" opacity={0.45} />
                <ellipse cx={R + f.eyeR * 1.4} cy={f.noseY + 4} rx={f.eyeR * 1.2} ry={f.eyeR * 0.7} fill="#f08a8a" opacity={0.45} />
              </g>
              {eye(L, 'l')}
              {eye(R, 'r')}
              <ellipse cx={0} cy={f.noseY} rx={f.eyeR * 1.1} ry={f.eyeR * 0.75} fill={dark} />
              <ellipse cx={-2} cy={f.noseY - 2} rx={f.eyeR * 0.35} ry={f.eyeR * 0.2} fill="#ffffff" opacity={0.5} />
              {/* the mouth: a small calm line first, then a big cheeky grin */}
              <path className={ambient ? 'lc-an-flat' : undefined} d={`M -10 ${mouthY} q 10 6 20 0`} stroke={dark} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={ambient ? 1 : 0} />
              <g className={ambient ? 'lc-an-grin' : undefined}>
                <path d={`M -26 ${mouthY - 6} q 26 34 52 0 q -26 10 -52 0 Z`} fill="#5a2630" stroke={dark} strokeWidth={3} strokeLinejoin="round" />
                <path d={`M -11 ${mouthY + 10} q 11 10 22 0 q -11 -5 -22 0 Z`} fill="#e07b84" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}
