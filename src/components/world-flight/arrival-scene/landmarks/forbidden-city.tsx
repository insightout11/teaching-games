import type { LandmarkLayerProps } from '../types';

// Forbidden City gate (Beijing) — foreground slot. Red rampart base with arched
// passages under a double-eave hip roof. Base-center origin, built upward.
export function ForbiddenCityLandmark({}: LandmarkLayerProps) {
  const wall = 'rgb(153,45,42)';
  const wallLit = 'rgb(198,68,54)';
  const wallShade = 'rgba(52,29,42,0.42)';
  const roof = 'rgb(207,157,58)';
  const roofLit = 'rgb(238,198,91)';
  const doorway = 'rgba(42,32,41,0.72)';

  const sweepRoof = (y: number, half: number, h: number) => (
    <path
      d={`M ${-half} ${y}
          Q ${-half - 24} ${y - 6} ${-half - 34} ${y - 20}
          L 0 ${y - h}
          L ${half + 34} ${y - 20}
          Q ${half + 24} ${y - 6} ${half} ${y} Z`}
      fill={roof}
    />
  );

  return (
    <g aria-hidden>
      {/* rampart base */}
      <rect x={-190} y={-120} width={380} height={120} fill={wall} />
      <rect x={-190} y={-120} width={190} height={120} fill={wallLit} opacity={0.46} />
      <rect x={-190} y={-120} width={380} height={8} fill={roofLit} opacity={0.72} />
      {/* arched passages */}
      {[-120, -40, 40, 120].map((x) => (
        <path key={x} d={`M ${x - 18} 0 L ${x - 18} -56 Q ${x} -78 ${x + 18} -56 L ${x + 18} 0 Z`} fill={doorway} />
      ))}
      {/* pavilion body */}
      <rect x={-150} y={-200} width={300} height={80} fill={wallLit} />
      <rect x={0} y={-200} width={150} height={80} fill={wallShade} />
      {/* window band */}
      <rect x={-140} y={-176} width={280} height={10} fill={roofLit} opacity={0.86} />
      {/* double-eave roofs */}
      {sweepRoof(-200, 168, 60)}
      {sweepRoof(-256, 120, 52)}
      <rect x={-150} y={-208} width={300} height={8} fill={roofLit} opacity={0.9} />
    </g>
  );
}
