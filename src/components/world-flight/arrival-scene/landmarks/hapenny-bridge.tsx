import type { LandmarkLayerProps } from '../types';

// Ha'penny Bridge (Dublin) — foreground slot. A single shallow cast-iron
// pedestrian arch over the Liffey, with a humped railing, balusters and three
// ornate lamp standards. Base-center origin, built upward.
export function HapennyBridgeLandmark({}: LandmarkLayerProps) {
  const f = 'rgb(58, 69, 83)';
  const fLit = 'rgb(111, 129, 145)';
  const a = 'rgb(224, 186, 106)';
  const span = 178;
  // Deck height curve: highest at centre, meeting abutments at the ends.
  const deckY = (x: number) => -30 - 112 * (1 - (x / span) ** 2);

  const balusters = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const lamps = [-92, 0, 92];

  return (
    <g aria-hidden>
      {/* water + glints */}
      <rect x={-220} y={-10} width={440} height={10} fill={a} opacity={0.12} />
      {[-160, -60, 50, 150].map((x) => (
        <rect key={x} x={x} y={-7 + (x % 5)} width={28} height={2} fill={a} opacity={0.3} />
      ))}
      {/* stone abutments */}
      <rect x={-198} y={-44} width={26} height={44} fill={f} />
      <rect x={172} y={-44} width={26} height={44} fill={f} />
      {/* structural arch rib */}
      <path d={`M -178 -28 Q 0 -132 178 -28`} fill="none" stroke={f} strokeWidth={9} />
      <path d={`M -174 -31 Q 0 -135 174 -31`} fill="none" stroke={fLit} strokeWidth={2} opacity={0.72} />
      {/* railing top rail (offset above the arch) */}
      <path
        d={`M -176 -46 Q 0 -150 176 -46`}
        fill="none"
        stroke={f}
        strokeWidth={4}
        opacity={0.85}
      />
      {/* balusters between arch and rail */}
      {balusters.map((x) => (
        <line key={x} x1={x} y1={deckY(x)} x2={x} y2={deckY(x) - 18} stroke={f} strokeWidth={2} opacity={0.7} />
      ))}
      {/* lamp standards */}
      {lamps.map((x) => {
        const top = deckY(x) - 18;
        return (
          <g key={x}>
            <rect x={x - 1.5} y={top - 30} width={3} height={30} fill={f} />
            <circle cx={x} cy={top - 34} r={5} fill={a} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
}
