import type { LandmarkLayerProps } from '../types';

// Metropolitan Cathedral (Mexico City) — foreground slot. Twin baroque bell
// towers flanking a central dome and portal. Base-center origin, built upward.
export function CathedralLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;

  const Tower = ({ x }: { x: number }) => (
    <g>
      <rect x={x - 26} y={-260} width={52} height={260} fill={f} />
      <rect x={x - 30} y={-300} width={60} height={40} fill={f} />
      {/* belfry arch */}
      <path d={`M ${x - 16} -262 A 16 28 0 0 1 ${x + 16} -262 Z`} fill={palette.landmarkAccent} opacity={0.35} />
      {/* cupola */}
      <path d={`M ${x - 30} -300 Q ${x} -344 ${x + 30} -300 Z`} fill={f} />
      <rect x={x - 2} y={-366} width={4} height={24} fill={f} />
      <circle cx={x} cy={-368} r={4} fill={palette.landmarkAccent} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* nave facade */}
      <rect x={-150} y={-180} width={300} height={180} fill={f} />
      {/* central portal */}
      <path d="M -22 0 L -22 -78 Q 0 -100 22 -78 L 22 0 Z" fill={palette.landmarkAccent} opacity={0.32} />
      {/* central dome */}
      <rect x={-44} y={-238} width={88} height={58} fill={f} />
      <path d="M -48 -238 A 48 48 0 0 1 48 -238 Z" fill={f} />
      <rect x={-2} y={-310} width={4} height={24} fill={f} />
      <circle cx={0} cy={-312} r={5} fill={palette.landmarkAccent} />
      {/* twin towers */}
      <Tower x={-120} />
      <Tower x={120} />
    </g>
  );
}
