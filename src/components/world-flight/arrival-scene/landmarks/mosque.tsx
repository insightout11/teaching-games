import type { LandmarkLayerProps } from '../types';

// Grand mosque (Istanbul) — foreground slot. A cascading central dome with
// semi-domes, flanked by slender minarets. Base-center origin, built upward.
export function MosqueLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;

  const Minaret = ({ x }: { x: number }) => (
    <g>
      <rect x={x - 7} y={-300} width={14} height={300} fill={f} />
      <rect x={x - 10} y={-322} width={20} height={10} fill={f} />
      <polygon points={`${x - 10} -322, ${x} -372, ${x + 10} -322`} fill={f} />
      <circle cx={x} cy={-376} r={4} fill={palette.landmarkAccent} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* prayer hall block */}
      <rect x={-150} y={-110} width={300} height={110} fill={f} />
      {/* semi-domes */}
      <path d="M -120 -110 A 60 60 0 0 1 0 -110 Z" fill={f} />
      <path d="M 0 -110 A 60 60 0 0 1 120 -110 Z" fill={f} />
      {/* central dome on drum */}
      <rect x={-58} y={-176} width={116} height={66} fill={f} />
      <path d="M -64 -176 A 64 64 0 0 1 64 -176 Z" fill={f} />
      <rect x={-2} y={-272} width={4} height={32} fill={f} />
      <circle cx={0} cy={-274} r={6} fill={palette.landmarkAccent} />
      {/* minarets */}
      <Minaret x={-140} />
      <Minaret x={140} />
      <Minaret x={-92} />
      <Minaret x={92} />
    </g>
  );
}
