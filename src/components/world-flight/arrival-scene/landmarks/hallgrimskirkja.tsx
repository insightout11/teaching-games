import type { LandmarkLayerProps } from '../types';

// Hallgrímskirkja (Reykjavik) — foreground slot. Expressionist church whose
// stepped, splayed wings echo cooling basalt columns, rising to a tall central
// tower + spire. Pale concrete (two-tone) so it reads bright against the dark
// volcanic backdrop. Base-center origin, built upward. Fixed iconic colours.
export function HallgrimskirkjaLandmark({ palette }: LandmarkLayerProps) {
  const stone = 'rgb(228,226,218)';
  const stoneShade = 'rgba(0,0,0,0.16)';
  const warm = palette.windowWarm;
  const wings = [
    { x: 30, w: 26, h: 150 },
    { x: 56, w: 26, h: 120 },
    { x: 82, w: 26, h: 94 },
    { x: 108, w: 26, h: 70 },
    { x: 134, w: 26, h: 48 },
  ];
  return (
    <g aria-hidden>
      {/* splayed stepped wings — left lit, right shaded */}
      {wings.map((s, i) => (
        <g key={i}>
          <rect x={-s.x - s.w} y={-s.h} width={s.w} height={s.h} fill={stone} />
          <rect x={s.x} y={-s.h} width={s.w} height={s.h} fill={stone} />
          <rect x={s.x} y={-s.h} width={s.w} height={s.h} fill={stoneShade} />
        </g>
      ))}
      {/* central tower (two-tone) */}
      <rect x={-30} y={-300} width={60} height={300} fill={stone} />
      <rect x={0} y={-300} width={30} height={300} fill={stoneShade} />
      {/* tapering stepped spire (two-tone) */}
      <polygon points="-30 -300, 0 -420, 30 -300" fill={stone} />
      <polygon points="0 -420, 30 -300, 0 -300" fill={stoneShade} />
      <polygon points="-12 -380, 0 -456, 12 -380" fill={stone} />
      {/* basalt-column fluting on the wings */}
      {wings.map((s, i) => (
        <g key={`fl${i}`}>
          <rect x={-s.x - s.w / 2 - 1} y={-s.h + 6} width={2} height={s.h - 12} fill={stoneShade} opacity={0.5} />
          <rect x={s.x + s.w / 2 - 1} y={-s.h + 6} width={2} height={s.h - 12} fill="rgba(0,0,0,0.24)" />
        </g>
      ))}
      {/* tall arched door + lit slit windows up the tower */}
      <path d="M -16 0 L -16 -54 Q 0 -70 16 -54 L 16 0 Z" fill={warm} opacity={0.6} />
      <rect x={-4} y={-296} width={8} height={150} fill={warm} opacity={0.4} />
      <rect x={-20} y={-150} width={5} height={90} fill={warm} opacity={0.3} />
      <rect x={15} y={-150} width={5} height={90} fill={warm} opacity={0.25} />
    </g>
  );
}
