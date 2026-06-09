import type { LandmarkLayerProps } from '../types';

// Mount Fuji (Tokyo) — background slot. Snow-capped cone with gently concave
// slopes. Base-center origin: y=0 base line, built upward (negative y).
export function FujiLandmark({ palette }: LandmarkLayerProps) {
  return (
    <g aria-hidden>
      <path
        d="M -360 0 C -200 -120 -90 -300 0 -360 C 90 -300 200 -120 360 0 Z"
        fill={palette.landmarkFill}
      />
      {/* snow cap */}
      <path
        d="M -118 -252 C -70 -300 -40 -330 0 -360 C 40 -330 70 -300 118 -252 C 70 -236 40 -244 0 -236 C -40 -244 -70 -236 -118 -252 Z"
        fill={palette.landmarkAccent}
        opacity={0.9}
      />
      {/* snow runnels */}
      <path d="M -40 -244 L -58 -190" stroke={palette.landmarkAccent} strokeWidth={6} fill="none" opacity={0.5} />
      <path d="M 36 -248 L 54 -196" stroke={palette.landmarkAccent} strokeWidth={6} fill="none" opacity={0.5} />
    </g>
  );
}
