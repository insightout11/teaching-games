import type { LandmarkLayerProps } from '../types';

// Diamond Head crater (Honolulu) — background slot. A low, wide volcanic tuff
// cone with a notched profile. Base-center origin, built upward.
export function DiamondHeadLandmark({ palette }: LandmarkLayerProps) {
  return (
    <g aria-hidden>
      <path
        d="M -430 0
           C -360 -40 -300 -120 -210 -150
           C -150 -170 -120 -150 -70 -158
           L -10 -176 L 60 -150
           C 150 -120 250 -150 360 -70
           C 400 -42 420 -16 440 0 Z"
        fill={palette.landmarkFill}
      />
      {/* slope shading */}
      <path
        d="M -10 -176 L 60 -150 C 150 -120 250 -150 360 -70 C 400 -42 420 -16 440 0 L 60 0 Z"
        fill={palette.landmarkAccent}
        opacity={0.18}
      />
    </g>
  );
}
