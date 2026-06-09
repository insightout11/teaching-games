import type { LandmarkLayerProps } from '../types';

// Third Mainland / lagoon bridge (Lagos) — foreground slot. A long low causeway
// of arched girder spans on piers over the lagoon. Base-center origin, upward.
export function LagoonBridgeLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const deckY = -44;
  const piers = [-240, -160, -80, 0, 80, 160, 240];
  return (
    <g aria-hidden>
      {/* lagoon water + glints */}
      <rect x={-280} y={deckY} width={560} height={44} fill={a} opacity={0.12} />
      {[-220, -120, 0, 120, 220].map((x) => (
        <rect key={x} x={x} y={deckY + 20 + (x % 16)} width={40} height={2} fill={a} opacity={0.28} />
      ))}
      {/* shallow arches between piers */}
      {piers.slice(0, -1).map((x, i) => (
        <path key={i} d={`M ${x} ${deckY} Q ${x + 40} ${deckY - 26} ${piers[i + 1]} ${deckY}`} fill="none" stroke={f} strokeWidth={6} />
      ))}
      {/* deck */}
      <rect x={-280} y={deckY - 10} width={560} height={10} fill={f} />
      {/* lamp posts */}
      {piers.map((x) => (
        <g key={`l${x}`}>
          <rect x={x - 1.5} y={deckY - 28} width={3} height={18} fill={f} />
          <circle cx={x} cy={deckY - 30} r={3} fill={palette.windowWarm} opacity={0.7} />
        </g>
      ))}
      {/* piers into the water */}
      {piers.map((x) => (
        <rect key={`p${x}`} x={x - 4} y={deckY} width={8} height={44} fill={f} />
      ))}
    </g>
  );
}
