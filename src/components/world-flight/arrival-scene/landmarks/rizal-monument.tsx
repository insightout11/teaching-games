import type { LandmarkLayerProps } from '../types';

// Rizal Monument (Manila) — foreground slot. The bronze statue of José Rizal on
// its stepped stone base, backed by the tall commemorative obelisk crowned with
// a finial. Base-center origin, built upward.
export function RizalMonumentLandmark({}: LandmarkLayerProps) {
  const f = 'rgb(183, 177, 163)';
  const fShade = 'rgba(31,44,58,0.42)';
  const bronze = 'rgb(128, 82, 54)';
  const a = 'rgb(226, 176, 91)';
  return (
    <g aria-hidden>
      {/* stepped base */}
      <rect x={-74} y={-28} width={148} height={28} fill={f} />
      <rect x={-52} y={-70} width={104} height={42} fill={f} />
      {/* obelisk pylon behind */}
      <polygon points="-18 -70, -12 -300, 12 -300, 18 -70" fill={f} />
      <polygon points="0 -70, 12 -300, 18 -70" fill={fShade} />
      <polygon points="-12 -300, 0 -336, 12 -300" fill={f} />
      {/* three-star finial hint */}
      <circle cx={0} cy={-346} r={4} fill={a} />
      {[-9, 9].map((x) => (
        <circle key={x} cx={x} cy={-338} r={2.5} fill={a} />
      ))}
      {/* Rizal figure in overcoat (front) */}
      <g>
        <path d="M -15 -70 L -11 -150 L 11 -150 L 15 -70 Z" fill={bronze} />
        <circle cx={0} cy={-162} r={9} fill={bronze} />
        {/* arm holding a book to the chest */}
        <rect x={-21} y={-128} width={10} height={26} fill={bronze} />
        <rect x={-25} y={-118} width={12} height={14} fill={a} opacity={0.35} />
      </g>
    </g>
  );
}
