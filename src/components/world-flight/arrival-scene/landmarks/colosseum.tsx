import type { LandmarkLayerProps } from '../types';

// Colosseum (Rome) — foreground slot. A clean oval amphitheatre: three tiers of
// arched arcades under a solid windowed attic. Base-center origin, built upward.
export function ColosseumLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const open = palette.light === 'moon' ? 'rgba(255,212,130,0.34)' : 'rgba(0,0,0,0.36)';

  // A row of arches: n arches from x0, spacing s, arch width w, height h.
  const arches = (y: number, h: number, x0: number, n: number, s: number, w: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = x0 + i * s;
      return (
        <path
          key={`${y}-${i}`}
          d={`M ${x} ${y} L ${x} ${y - h + w / 2} Q ${x + w / 2} ${y - h} ${x + w} ${y - h + w / 2} L ${x + w} ${y} Z`}
          fill={open}
        />
      );
    });

  const bodyPath =
    'M -200 0 L -200 -184 C -200 -238 -118 -262 0 -262 C 118 -262 200 -238 200 -184 L 200 0 Z';

  return (
    <g aria-hidden>
      {/* oval amphitheatre body (+ faint travertine lift so it isn't pure skyline-dark) */}
      <path d={bodyPath} fill={f} />
      <path d={bodyPath} fill={a} opacity={0.06} />
      {/* three arcade tiers */}
      {arches(-46, 58, -184, 9, 40, 30)}
      {arches(-108, 54, -184, 9, 40, 30)}
      {arches(-166, 48, -184, 9, 40, 28)}
      {/* attic level with small square windows */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = -150 + i * 30;
        return <rect key={i} x={x} y={-236} width={11} height={20} fill={open} />;
      })}
      {/* cornice lines between levels */}
      <rect x={-200} y={-184} width={400} height={5} fill={a} opacity={0.34} />
      <rect x={-196} y={-112} width={392} height={4} fill={a} opacity={0.3} />
      <rect x={-192} y={-52} width={384} height={4} fill={a} opacity={0.3} />
    </g>
  );
}
