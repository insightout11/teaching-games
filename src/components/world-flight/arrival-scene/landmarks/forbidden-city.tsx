import type { LandmarkLayerProps } from '../types';

// Forbidden City gate (Beijing) — foreground slot. Red rampart base with arched
// passages under a double-eave hip roof. Base-center origin, built upward.
export function ForbiddenCityLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;

  const sweepRoof = (y: number, half: number, h: number) => (
    <path
      d={`M ${-half} ${y}
          Q ${-half - 24} ${y - 6} ${-half - 34} ${y - 20}
          L 0 ${y - h}
          L ${half + 34} ${y - 20}
          Q ${half + 24} ${y - 6} ${half} ${y} Z`}
      fill={f}
    />
  );

  return (
    <g aria-hidden>
      {/* rampart base */}
      <rect x={-190} y={-120} width={380} height={120} fill={f} />
      {/* arched passages */}
      {[-120, -40, 40, 120].map((x) => (
        <path key={x} d={`M ${x - 18} 0 L ${x - 18} -56 Q ${x} -78 ${x + 18} -56 L ${x + 18} 0 Z`} fill={a} opacity={0.3} />
      ))}
      {/* pavilion body */}
      <rect x={-150} y={-200} width={300} height={80} fill={f} />
      {/* window band */}
      <rect x={-140} y={-176} width={280} height={10} fill={a} opacity={0.4} />
      {/* double-eave roofs */}
      {sweepRoof(-200, 168, 60)}
      {sweepRoof(-256, 120, 52)}
      <rect x={-150} y={-208} width={300} height={8} fill={a} opacity={0.5} />
    </g>
  );
}
