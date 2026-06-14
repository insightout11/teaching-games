import type { LandmarkLayerProps } from '../types';

// Gran Torre Santiago (Santiago) — background slot. The Andes rise as a broad
// snow-capped range BEHIND the city, with the slender Gran Torre (Costanera
// Center) — tallest tower in Latin America — climbing above the skyline in
// front of the peaks. Base-center origin (range base at y=0), built upward.
export function GranTorreLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* far ridge */}
      <path
        d="M -560 0 L -380 -190 L -230 -90 L -70 -250 L 110 -120 L 280 -240 L 440 -110 L 560 0 Z"
        fill={f}
        opacity={0.72}
      />
      {/* near ridge (taller) */}
      <path
        d="M -560 0 L -400 -300 L -250 -150 L -80 -384 L 90 -180 L 250 -360 L 430 -170 L 560 0 Z"
        fill={f}
      />
      {/* snow caps on the tallest peaks */}
      <path d="M -80 -384 L -130 -300 L -30 -300 Z" fill={a} opacity={0.9} />
      <path d="M 250 -360 L 206 -286 L 296 -286 Z" fill={a} opacity={0.9} />
      <path d="M -400 -300 L -438 -242 L -362 -242 Z" fill={a} opacity={0.7} />

      {/* Gran Torre — slender tapered tower rising above the city */}
      <g transform="translate(-210,0)">
        <polygon points="-30 0, -22 -430, 22 -430, 30 0" fill={f} />
        {/* glass mullions */}
        {[-16, -5, 6, 17].map((x) => (
          <rect key={x} x={x - 1} y={-426} width={2} height={426} fill={a} opacity={0.24} />
        ))}
        {/* lit floor bands */}
        {[-100, -200, -300, -400].map((y) => (
          <rect key={y} x={-22} y={y} width={44} height={3} fill={palette.windowWarm} opacity={0.45} />
        ))}
        {/* stepped pointed crown + mast */}
        <polygon points="-22 -430, -13 -462, 13 -462, 22 -430" fill={f} />
        <rect x={-2.5} y={-484} width={5} height={22} fill={f} />
        <circle cx={0} cy={-486} r={3.5} fill={a} />
      </g>
    </g>
  );
}
