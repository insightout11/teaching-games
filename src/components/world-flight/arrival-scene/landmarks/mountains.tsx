import type { LandmarkLayerProps } from '../types';

// Coastal mountain range (Vancouver) — background slot. A row of overlapping
// snow-tipped peaks. Base-center origin, built upward.
export function MountainsLandmark({ palette }: LandmarkLayerProps) {
  return (
    <g aria-hidden>
      {/* back ridge */}
      <path
        d="M -520 0 L -360 -150 L -210 -60 L -70 -210 L 90 -90 L 240 -200 L 400 -80 L 520 0 Z"
        fill={palette.landmarkFill}
        opacity={0.75}
      />
      {/* front ridge */}
      <path
        d="M -520 0 L -400 -210 L -250 -110 L -90 -280 L 70 -130 L 230 -300 L 380 -120 L 520 0 Z"
        fill={palette.landmarkFill}
      />
      {/* snow caps on the two tallest fronts */}
      <path d="M -90 -280 L -130 -222 L -52 -222 Z" fill={palette.landmarkAccent} opacity={0.9} />
      <path d="M 230 -300 L 188 -238 L 272 -238 Z" fill={palette.landmarkAccent} opacity={0.9} />
    </g>
  );
}
