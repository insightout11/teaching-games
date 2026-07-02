import type { LandmarkLayerProps } from '../types';

// Colosseum (Rome) — foreground slot. Honey travertine amphitheatre with its
// iconic ruined profile: the outer wall stands full-height (four levels) on the
// left, then breaks down to the lower inner ring on the right. Three arcade
// tiers of arches with piers, a windowed attic, two-tone shading, and arches
// that glow warm at night. Base-center origin, built upward.
export function ColosseumLandmark({ palette }: LandmarkLayerProps) {
  const trav = 'rgb(208,190,156)';
  const travLit = 'rgb(226,210,178)';
  const travShade = 'rgba(0,0,0,0.2)';
  const open = palette.light === 'moon' ? 'rgba(255,206,140,0.5)' : 'rgba(58,44,28,0.5)';

  // A row of arches with piers between them.
  const arches = (y: number, h: number, x0: number, n: number, s: number, w: number, key: string) =>
    Array.from({ length: n }, (_, i) => {
      const x = x0 + i * s;
      return (
        <g key={`${key}-${i}`}>
          <path
            d={`M ${x} ${y} L ${x} ${y - h + w / 2} Q ${x + w / 2} ${y - h} ${x + w} ${y - h + w / 2} L ${x + w} ${y} Z`}
            fill={open}
          />
          {/* lit pier edge to the right of each arch */}
          <rect x={x + w} y={y - h + 4} width={2} height={h - 4} fill={travLit} opacity={0.5} />
        </g>
      );
    });

  // Left/centre full-height; right side descends to a jagged broken crest.
  const bodyPath =
    'M -200 0 L -200 -184 C -200 -238 -118 -262 0 -262 C 68 -262 112 -256 140 -242 L 150 -236 L 160 -208 L 174 -220 L 186 -198 L 200 -206 L 200 0 Z';
  const shadePath =
    'M 0 -262 C 68 -262 112 -256 140 -242 L 150 -236 L 160 -208 L 174 -220 L 186 -198 L 200 -206 L 200 0 L 0 0 Z';

  return (
    <g aria-hidden>
      <path d={bodyPath} fill={trav} />
      <path d={shadePath} fill={travShade} />
      {/* three arcade tiers — lower two full width, third only where the wall stands */}
      {arches(-52, 58, -184, 9, 40, 30, 't1')}
      {arches(-112, 54, -184, 9, 40, 30, 't2')}
      {arches(-172, 48, -184, 7, 40, 28, 't3')}
      {/* attic windows (left, intact section only) */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = -150 + i * 34;
        return <rect key={i} x={x} y={-236} width={11} height={20} fill={open} />;
      })}
      {/* cornice bands between levels */}
      <rect x={-200} y={-184} width={400} height={5} fill={travLit} opacity={0.4} />
      <rect x={-196} y={-112} width={392} height={4} fill={travLit} opacity={0.35} />
      <rect x={-192} y={-52} width={384} height={4} fill={travLit} opacity={0.35} />
    </g>
  );
}
