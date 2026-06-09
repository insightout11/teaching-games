import type { LandmarkLayerProps } from '../types';

// Table Mountain (Cape Town) — background slot. A broad, flat-topped massif with
// the Devil's Peak shoulder to one side. Base-center origin, built upward.
export function TableMountainLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      <path
        d="M -440 0
           L -360 -120
           C -300 -210 -240 -250 -150 -252
           L 210 -252
           C 250 -252 270 -240 286 -210
           L 330 -150
           L 388 -210
           L 440 0 Z"
        fill={f}
      />
      {/* flat-top edge highlight */}
      <path d="M -150 -252 L 210 -252" stroke={palette.landmarkAccent} strokeWidth={4} opacity={0.35} />
      {/* a couple of gully shadows */}
      <path d="M -60 -250 L -40 -120 M 90 -250 L 110 -120" stroke="rgba(0,0,0,0.18)" strokeWidth={6} />
    </g>
  );
}
