import type { LandmarkLayerProps } from '../types';

// Capibaribe waterfront (Recife) — foreground slot. A row of colourful colonial
// row-house facades and a baroque church tower along the river, with an arched
// bridge spanning the water. Base-center origin, built upward.
export function RecifeWaterfrontLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(61, 104, 117)';
  const a = 'rgb(86, 174, 176)';
  const rowColors = ['rgb(205, 113, 92)', 'rgb(225, 176, 112)', 'rgb(109, 157, 161)'];

  const Row = ({ x, w, h, fill }: { x: number; w: number; h: number; fill: string }) => (
    <g>
      <rect x={x - w / 2} y={-h} width={w} height={h} fill={fill} />
      <rect x={x} y={-h} width={w / 2} height={h} fill="rgba(24,42,58,0.2)" />
      {/* pitched roof */}
      <polygon points={`${x - w / 2 - 4} ${-h}, ${x} ${-h - 22}, ${x + w / 2 + 4} ${-h}`} fill={fill} />
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
      <rect x={-176} y={-150} width={44} height={150} fill={rowColors[1]} />
      <rect x={-180} y={-176} width={52} height={26} fill={rowColors[1]} />
      <path d="M -180 -176 A 26 26 0 0 1 -128 -176 Z" fill={rowColors[1]} />
      <circle cx={-154} cy={-200} r={3} fill={a} />
      {/* colonial row houses */}
      <Row x={-104} w={56} h={118} fill={rowColors[0]} />
      <Row x={-46} w={56} h={132} fill={rowColors[1]} />
      <Row x={12} w={56} h={110} fill={rowColors[2]} />
      {/* arched river bridge (right) */}
      <path d="M 70 -14 Q 140 -78 210 -14" fill="none" stroke={f} strokeWidth={6} />
      <path d="M 72 -18 Q 140 -80 208 -18" fill="none" stroke={a} strokeWidth={2} opacity={0.8} />
      {[70, 140, 210].map((x) => (
        <rect key={x} x={x - 4} y={-44} width={8} height={30} fill={f} />
      ))}
    </g>
  );
}
