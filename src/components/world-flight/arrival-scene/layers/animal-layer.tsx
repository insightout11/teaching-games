import { BLEED_X, LAYOUT, type ScenePalette } from '../types';
import type { DestinationScene } from '@/lib/world-flight/types';

// A local animal in the near grass, bottom left (Oct 2026, gallery first). With the framing branch top right it
// frames the landing on the diagonal. It steps up into view after touchdown and stays, alive: it blinks, flicks an
// ear, swishes its tail. Real animals of the place only, drawn in the scene's own light.

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

/** Fur colours per animal: main, shade, light (chest, belly, inner ear), dark (legs, mask, nose). */
const FUR: Record<AnimalKind, [string, string, string, string]> = {
  tanuki: ['#8a7660', '#5f5040', '#d9c9ad', '#2e2620'],
  'red-fox': ['#d4743a', '#a5512a', '#f3e6d4', '#3a2a22'],
  kangaroo: ['#a98c6e', '#7d654f', '#e3d3bc', '#3d3128'],
  fennec: ['#e2c79a', '#bf9f70', '#f7eedc', '#4a3a2c'],
};

export function AnimalLayer({ kind, palette, idPrefix, ambient }: {
  kind: AnimalKind;
  palette: ScenePalette;
  idPrefix: string;
  ambient: boolean;
}) {
  const night = palette.light === 'moon';
  // Lit by the scene: at night mostly a moonlit silhouette, by day a touch of the sun's colour
  const tone = (c: string) => (night ? mix(c, palette.skyTop, 0.55) : mix(c, palette.lightColor, 0.08));
  const [main, shade, light, dark] = FUR[kind].map(tone);
  const eye = night ? '#f6e7b0' : '#1d1712';
  const id = `${idPrefix}-animal`;
  // Bottom left of the 16:9 view, sitting in the near grass and facing into the scene
  const x = BLEED_X + 120, y = LAYOUT.foregroundY + 70;

  const body = (() => {
    switch (kind) {
      case 'tanuki':
        return (
          <>
            <path className="lc-an-tail" d="M -40 -20 q -46 4 -44 -30 q 18 4 30 14 q 14 6 14 16 Z" fill={main} />
            <path d="M -76 -44 q 10 6 22 8" stroke={dark} strokeWidth={6} fill="none" strokeLinecap="round" />
            <ellipse cx={0} cy={-40} rx={46} ry={42} fill={main} />
            <ellipse cx={8} cy={-30} rx={26} ry={28} fill={light} opacity={0.8} />
            <rect x={-30} y={-12} width={14} height={14} rx={6} fill={dark} />
            <rect x={14} y={-12} width={14} height={14} rx={6} fill={dark} />
            <g className="lc-an-head">
              <path className="lc-an-ear" d="M 2 -112 l 10 -22 l 12 22 Z" fill={dark} />
              <path d="M 30 -110 l 12 -20 l 8 22 Z" fill={dark} />
              <ellipse cx={26} cy={-94} rx={34} ry={28} fill={main} />
              {/* the dark mask across the eyes, the tanuki's mark */}
              <path d="M -2 -98 q 14 -14 30 -2 q 14 -12 30 2 q -8 18 -30 10 q -22 8 -30 -10 Z" fill={dark} />
              <ellipse cx={44} cy={-80} rx={16} ry={11} fill={light} />
              <circle cx={58} cy={-82} r={4} fill={dark} />
              <g className="lc-an-blink"><circle cx={16} cy={-96} r={3.4} fill={eye} /><circle cx={38} cy={-96} r={3.4} fill={eye} /></g>
            </g>
          </>
        );
      case 'red-fox':
        return (
          <>
            <path className="lc-an-tail" d="M -30 -6 q -70 6 -66 -46 q 4 -22 22 -26 q -4 30 26 44 q 24 10 18 28 Z" fill={main} />
            <path d="M -96 -52 q 0 -22 16 -28 q -8 14 -2 26 Z" fill={light} />
            <path d="M -36 -10 q -6 -70 26 -88 q 34 -10 44 30 q 6 30 -4 68 Z" fill={main} />
            <path d="M 10 -84 q 22 4 22 34 q 0 26 -10 42 q -16 -30 -12 -76 Z" fill={light} />
            <rect x={-24} y={-16} width={10} height={18} rx={4} fill={dark} />
            <rect x={14} y={-16} width={10} height={18} rx={4} fill={dark} />
            <g className="lc-an-head">
              <path className="lc-an-ear" d="M 0 -118 l 6 -34 l 18 26 Z" fill={main} />
              <path d="M 4 -124 l 3 -18 l 9 14 Z" fill={dark} />
              <path d="M 26 -122 l 14 -30 l 10 32 Z" fill={main} />
              <path d="M -4 -104 q 6 -26 36 -24 q 22 2 46 22 q -18 12 -46 10 q -26 4 -36 -8 Z" fill={main} />
              <path d="M 30 -94 q 22 6 48 -4 q -14 16 -40 14 Z" fill={light} />
              <circle cx={78} cy={-100} r={4} fill={dark} />
              <g className="lc-an-blink"><ellipse cx={30} cy={-108} rx={3.2} ry={3.6} fill={eye} /></g>
            </g>
          </>
        );
      case 'kangaroo':
        return (
          <>
            <path className="lc-an-tail" d="M -20 -10 q -60 6 -90 -2 q 40 -8 70 -24 Z" fill={shade} />
            <path d="M -30 -8 q -18 -60 0 -110 q 20 -40 44 -24 q 12 20 6 60 q -2 40 8 74 Z" fill={main} />
            <path d="M 6 -120 q 16 16 14 56 q -2 30 6 56 q -14 -2 -20 -40 q -6 -40 0 -72 Z" fill={light} />
            <path d="M 14 -98 q 12 10 24 2" stroke={shade} strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d="M -40 2 q 30 -6 72 0 q -36 8 -72 0 Z" fill={dark} />
            <g className="lc-an-head">
              <path className="lc-an-ear" d="M 2 -168 q -6 -34 6 -40 q 10 18 4 40 Z" fill={main} />
              <path d="M 18 -166 q 4 -32 16 -36 q 4 20 -6 38 Z" fill={main} />
              <path d="M 0 -150 q 10 -22 34 -18 q 22 6 30 22 q -10 10 -30 8 q -24 2 -34 -12 Z" fill={main} />
              <circle cx={62} cy={-146} r={3.6} fill={dark} />
              <g className="lc-an-blink"><ellipse cx={24} cy={-154} rx={3} ry={3.4} fill={eye} /></g>
            </g>
          </>
        );
      case 'fennec':
        return (
          <>
            <path className="lc-an-tail" d="M -26 -6 q -52 4 -52 -30 q 16 -2 24 10 q 14 8 28 20 Z" fill={main} />
            <circle cx={-76} cy={-36} r={6} fill={dark} />
            <path d="M -30 -8 q -6 -54 20 -66 q 30 -6 36 26 q 4 22 -4 40 Z" fill={main} />
            <path d="M 8 -70 q 18 6 16 30 q -2 20 -10 32 q -12 -26 -6 -62 Z" fill={light} />
            <rect x={-20} y={-14} width={9} height={16} rx={4} fill={shade} />
            <rect x={12} y={-14} width={9} height={16} rx={4} fill={shade} />
            <g className="lc-an-head">
              {/* the huge ears that let a fennec lose heat in the desert */}
              <path className="lc-an-ear" d="M -6 -96 q -22 -50 -6 -70 q 22 30 24 64 Z" fill={main} />
              <path d="M -4 -100 q -12 -36 -2 -52 q 12 22 14 48 Z" fill={light} />
              <path d="M 22 -98 q 12 -54 36 -62 q 4 40 -18 66 Z" fill={main} />
              <path d="M 26 -100 q 8 -36 24 -46 q 0 28 -14 48 Z" fill={light} />
              <path d="M -6 -84 q 8 -20 32 -18 q 20 4 34 18 q -16 10 -34 8 q -22 2 -32 -8 Z" fill={main} />
              <circle cx={60} cy={-84} r={3.4} fill={dark} />
              <g className="lc-an-blink"><ellipse cx={22} cy={-90} rx={3.4} ry={3.8} fill={eye} /></g>
            </g>
          </>
        );
    }
  })();

  return (
    <g aria-hidden transform={`translate(${x} ${y}) scale(1.15)`}>
      {ambient && (
        <style>{`
          @keyframes lc-an-in{0%{transform:translateY(150px)}100%{transform:translateY(0)}}
          @keyframes lc-an-blink{0%,93%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
          @keyframes lc-an-ear{0%,80%,100%{transform:rotate(0)}84%{transform:rotate(-9deg)}88%{transform:rotate(3deg)}}
          @keyframes lc-an-tail{0%,100%{transform:rotate(0)}50%{transform:rotate(7deg)}}
          @keyframes lc-an-look{0%,60%,100%{transform:rotate(0)}68%,88%{transform:rotate(-6deg)}}
          .${id} .lc-an-rise{animation:lc-an-in 1.6s cubic-bezier(.2,.8,.3,1) both}
          .${id} .lc-an-blink{transform-box:fill-box;transform-origin:center;animation:lc-an-blink 5.2s infinite}
          .${id} .lc-an-ear{transform-box:fill-box;transform-origin:50% 100%;animation:lc-an-ear 7s infinite 1.5s}
          .${id} .lc-an-tail{transform-box:fill-box;transform-origin:100% 100%;animation:lc-an-tail 3.8s ease-in-out infinite}
          .${id} .lc-an-head{transform-box:fill-box;transform-origin:30% 90%;animation:lc-an-look 11s ease-in-out infinite 3s}
        `}</style>
      )}
      <g className={id}>
        <g className="lc-an-rise">
          {/* a soft shadow on the grass */}
          <ellipse cx={0} cy={2} rx={62} ry={8} fill="#000" opacity={night ? 0.25 : 0.18} />
          {body}
        </g>
      </g>
      {/* grass blades in front of its feet, so it sits IN the grass */}
      {Array.from({ length: 14 }, (_, i) => {
        const gx = -90 + i * 13;
        const h = 18 + ((i * 7) % 11);
        return <path key={i} d={`M ${gx} 12 q 3 ${-h * 0.6} ${(i % 2 ? 6 : -4)} ${-h}`} stroke={night ? mix(palette.foliage, palette.skyTop, 0.5) : mix(palette.foliage, '#000000', 0.15)} strokeWidth={3} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
}
