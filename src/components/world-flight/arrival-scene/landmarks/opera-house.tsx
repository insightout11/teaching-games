import type { LandmarkLayerProps } from '../types';

// Sydney Opera House — foreground slot. Overlapping shell sails on a low podium.
// Base-center origin, built upward.
export function OperaHouseLandmark({ palette }: LandmarkLayerProps) {
  const Sail = ({ x, w, h, lean }: { x: number; w: number; h: number; lean: number }) => (
    <path
      d={`M ${x} 0
          C ${x} ${-h * 0.5} ${x + lean} ${-h} ${x + w} ${-h * 1.05}
          C ${x + w * 0.7} ${-h * 0.45} ${x + w} 0 ${x + w} 0 Z`}
      fill={palette.landmarkFill}
    />
  );
  return (
    <g aria-hidden>
      {/* podium */}
      <rect x={-300} y={-34} width={600} height={34} fill={palette.landmarkFill} />
      {/* left cluster */}
      <Sail x={-280} w={150} h={150} lean={70} />
      <Sail x={-210} w={130} h={196} lean={64} />
      <Sail x={-130} w={120} h={150} lean={56} />
      {/* right cluster */}
      <Sail x={20} w={140} h={140} lean={66} />
      <Sail x={90} w={128} h={186} lean={60} />
      <Sail x={166} w={118} h={140} lean={52} />
      {/* sail seam highlights */}
      <path d="M -210 -34 C -180 -120 -150 -180 -82 -230" fill="none" stroke={palette.landmarkAccent} strokeWidth={4} opacity={0.5} />
      <path d="M 90 -34 C 120 -116 150 -172 218 -220" fill="none" stroke={palette.landmarkAccent} strokeWidth={4} opacity={0.5} />
    </g>
  );
}
