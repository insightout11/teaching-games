import type { LandmarkLayerProps } from '../types';

// Capibaribe waterfront (Recife) — foreground slot. A row of colourful colonial
// row-house facades and a baroque church tower along the river, with an arched
// bridge spanning the water. Base-center origin, built upward.
export function RecifeWaterfrontLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;

  const Row = ({ x, w, h }: { x: number; w: number; h: number }) => (
    <g>
      <rect x={x - w / 2} y={-h} width={w} height={h} fill={f} />
      {/* pitched roof */}
      <polygon points={`${x - w / 2 - 4} ${-h}, ${x} ${-h - 22}, ${x + w / 2 + 4} ${-h}`} fill={f} />
      {/* shuttered windows */}
      {[0.4, 0.66].map((t) => (
        <rect key={t} x={x - 7} y={-h * t - 12} width={14} height={18} fill={palette.windowWarm} opacity={0.38} />
      ))}
    </g>
  );

  return (
    <g aria-hidden>
      {/* water + glints */}
      <rect x={-220} y={-14} width={440} height={14} fill={a} opacity={0.12} />
      {[-180, -90, 60, 150].map((x) => (
        <rect key={x} x={x} y={-10 + (x % 6)} width={30} height={2} fill={a} opacity={0.3} />
      ))}
      {/* baroque church tower (anchor of the row) */}
      <rect x={-176} y={-150} width={44} height={150} fill={f} />
      <rect x={-180} y={-176} width={52} height={26} fill={f} />
      <path d="M -180 -176 A 26 26 0 0 1 -128 -176 Z" fill={f} />
      <circle cx={-154} cy={-200} r={3} fill={a} />
      {/* colonial row houses */}
      <Row x={-104} w={56} h={118} />
      <Row x={-46} w={56} h={132} />
      <Row x={12} w={56} h={110} />
      {/* arched river bridge (right) */}
      <path d="M 70 -14 Q 140 -78 210 -14" fill="none" stroke={f} strokeWidth={6} />
      {[70, 140, 210].map((x) => (
        <rect key={x} x={x - 4} y={-44} width={8} height={30} fill={f} />
      ))}
    </g>
  );
}
