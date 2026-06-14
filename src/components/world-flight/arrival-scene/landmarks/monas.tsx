import type { LandmarkLayerProps } from '../types';

// National Monument / Monas (Jakarta) — foreground slot. Tall obelisk-like
// column on a wide plinth, crowned with a gilded flame. Base-center origin.
export function MonasLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  return (
    <g aria-hidden>
      {/* wide cupped plinth */}
      <path d="M -120 0 L -90 -34 L 90 -34 L 120 0 Z" fill={f} />
      <rect x={-70} y={-58} width={140} height={24} fill={f} />
      {/* tall slender column */}
      <polygon points="-18 -58, -12 -330, 12 -330, 18 -58" fill={f} />
      {/* flame cup + gilded flame (always gold, day or night) */}
      <path d="M -22 -330 L 22 -330 L 12 -352 L -12 -352 Z" fill={f} />
      <path d="M 0 -440 C -18 -392 -14 -360 0 -352 C 14 -360 18 -392 0 -440 Z" fill="rgb(228,184,72)" />
      <path d="M 0 -426 C -10 -394 -8 -366 0 -360 C 8 -366 10 -394 0 -426 Z" fill="rgba(255,228,150,0.85)" />
    </g>
  );
}
