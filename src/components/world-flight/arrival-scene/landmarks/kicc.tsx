import type { LandmarkLayerProps } from '../types';

// Kenyatta International Convention Centre (Nairobi) — foreground slot. A ribbed
// cylindrical tower capped by its saucer-shaped revolving restaurant, beside the
// cone-roofed plenary amphitheatre. Base-center origin, built upward.
export function KiccLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(122, 91, 66)';
  const fLit = 'rgb(176, 139, 94)';
  const a = 'rgb(224, 183, 104)';
  return (
    <g aria-hidden>
      {/* plenary amphitheatre with conical roof (to the right) */}
      <rect x={58} y={-70} width={104} height={70} fill={f} />
      <polygon points="52 -70, 168 -70, 110 -150" fill={f} />
      {/* cylindrical tower */}
      <rect x={-50} y={-356} width={100} height={356} fill={f} />
      <rect x={-50} y={-356} width={34} height={356} fill={fLit} opacity={0.52} />
      {/* concrete ribs */}
      {[-34, -14, 6, 26].map((x) => (
        <rect key={x} x={x} y={-352} width={6} height={352} fill={a} opacity={0.2} />
      ))}
      {/* saucer top (revolving restaurant) */}
      <ellipse cx={0} cy={-356} rx={72} ry={18} fill={fLit} />
      <ellipse cx={0} cy={-374} rx={50} ry={14} fill={f} />
      <rect x={-44} y={-360} width={88} height={5} fill={palette.windowWarm} opacity={0.45} />
      {/* crowning mast */}
      <rect x={-2} y={-410} width={4} height={36} fill={f} />
      <circle cx={0} cy={-412} r={4} fill={a} />
    </g>
  );
}
