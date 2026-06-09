import type { LandmarkLayerProps } from '../types';

// Burj Khalifa (Dubai) — foreground slot. Tapering tiered spire with setbacks
// and a slender pinnacle. Base-center origin, built upward.
export function BurjLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  // Stacked setbacks: each is narrower and taller.
  const tiers = [
    { y: 0, w: 116, h: 150 },
    { y: -150, w: 92, h: 130 },
    { y: -280, w: 70, h: 120 },
    { y: -400, w: 50, h: 96 },
    { y: -496, w: 32, h: 70 },
  ];
  return (
    <g aria-hidden>
      {tiers.map((t, i) => (
        <rect key={i} x={-t.w / 2} y={t.y - t.h} width={t.w} height={t.h} fill={f} />
      ))}
      {/* pinnacle */}
      <polygon points="-6 -566, 0 -660, 6 -566" fill={f} />
      {/* central mullion glow */}
      <rect x={-2} y={-560} width={4} height={540} fill={palette.landmarkAccent} opacity={0.3} />
      {/* a few lit bands */}
      {[-90, -220, -350].map((y) => (
        <rect key={y} x={-44} y={y} width={88} height={3} fill={palette.windowWarm} opacity={0.5} />
      ))}
    </g>
  );
}
