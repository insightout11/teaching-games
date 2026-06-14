import type { LandmarkLayerProps } from '../types';

// African Union headquarters (Addis Ababa) — foreground slot. The tall glass
// office tower beside the round, domed plenary assembly hall. Base-center
// origin, built upward.
export function AuHeadquartersLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* round domed plenary hall (front-left) */}
      <rect x={-178} y={-92} width={150} height={92} fill={f} />
      <path d="M -178 -92 A 75 75 0 0 1 -28 -92 Z" fill={f} />
      <rect x={-170} y={-72} width={134} height={6} fill={palette.windowWarm} opacity={0.4} />
      <circle cx={-103} cy={-170} r={4} fill={a} />
      {/* tall office tower (right) */}
      <rect x={-14} y={-378} width={72} height={378} fill={f} />
      {/* curtain-wall mullions */}
      {[-2, 14, 30, 46].map((x) => (
        <rect key={x} x={x} y={-374} width={4} height={374} fill={a} opacity={0.18} />
      ))}
      {/* lit floor bands */}
      {[-90, -180, -270].map((y) => (
        <rect key={y} x={-14} y={y} width={72} height={3} fill={palette.windowWarm} opacity={0.38} />
      ))}
      {/* rooftop mast */}
      <rect x={19} y={-402} width={4} height={24} fill={f} />
      <circle cx={21} cy={-404} r={3.5} fill={a} />
    </g>
  );
}
