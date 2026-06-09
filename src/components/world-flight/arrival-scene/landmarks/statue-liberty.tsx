import type { LandmarkLayerProps } from '../types';

// Statue of Liberty (New York) — foreground slot. Robed figure on a star-fort
// pedestal, raising a torch, with a spiked crown. Base-center origin, upward.
export function StatueLibertyLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* pedestal */}
      <polygon points="-70 0, -58 -70, 58 -70, 70 0" fill={f} />
      <rect x={-46} y={-150} width={92} height={80} fill={f} />
      <rect x={-30} y={-176} width={60} height={26} fill={f} />
      {/* robed body */}
      <path d="M -26 -176 L -16 -300 L 16 -300 L 26 -176 Z" fill={f} />
      {/* head */}
      <circle cx={0} cy={-318} r={14} fill={f} />
      {/* spiked crown */}
      {[-12, -6, 0, 6, 12].map((dx, i) => (
        <polygon key={i} points={`${dx} -330, ${dx - 2} -348, ${dx + 2} -348`} fill={f} />
      ))}
      {/* raised torch arm */}
      <path d="M 14 -284 L 40 -360 L 52 -356 L 30 -280 Z" fill={f} />
      <circle cx={46} cy={-372} r={9} fill={a} />
      <path d="M 46 -381 C 40 -396 52 -396 46 -381 Z" fill={a} />
      {/* tablet */}
      <rect x={-44} y={-250} width={26} height={34} transform="rotate(-16 -31 -233)" fill={f} />
    </g>
  );
}
