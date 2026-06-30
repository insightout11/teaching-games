import type { LandmarkLayerProps } from '../types';

// Brandenburg Gate (Berlin) — foreground slot. Neoclassical sandstone gate: a
// Doric colonnade with recessed passages under a deep entablature + attic,
// crowned by the dark-bronze Quadriga (Victory's four-horse chariot). Base-center
// origin, built upward. Fixed iconic stone colours (two-tone) so it reads at any
// time of day; the passages warm at night.
export function BrandenburgGateLandmark({ palette }: LandmarkLayerProps) {
  const stone = 'rgb(208,194,166)';
  const stoneLit = 'rgb(224,212,186)';
  const stoneShade = 'rgba(0,0,0,0.2)';
  const bronze = 'rgb(72,86,74)'; // patinated Quadriga
  const bronzeLit = 'rgba(150,180,160,0.5)';
  const reveal = palette.light === 'moon' ? 'rgba(255,210,140,0.28)' : 'rgba(26,28,34,0.5)';
  const cols = [-150, -90, -30, 30, 90, 150];

  return (
    <g aria-hidden>
      {/* recessed colonnade depth (passages behind the columns) */}
      <rect x={-162} y={-206} width={324} height={190} fill={reveal} />

      {/* plinth */}
      <rect x={-176} y={-16} width={352} height={16} fill={stone} />
      <rect x={0} y={-16} width={176} height={16} fill={stoneShade} />

      {/* Doric columns (two-tone + flutes + base + capital) */}
      {cols.map((x) => (
        <g key={x}>
          <rect x={x - 13} y={-200} width={26} height={184} fill={stone} />
          <rect x={x + 4} y={-200} width={9} height={184} fill={stoneShade} />
          {[-8, 0, 8].map((fx) => (
            <rect key={fx} x={x + fx - 0.6} y={-196} width={1.2} height={176} fill="rgba(0,0,0,0.12)" />
          ))}
          {/* base + capital */}
          <rect x={x - 15} y={-20} width={30} height={6} fill={stone} />
          <rect x={x - 16} y={-210} width={32} height={10} fill={stoneLit} />
          <rect x={x + 4} y={-210} width={12} height={10} fill={stoneShade} />
        </g>
      ))}

      {/* entablature + cornice + frieze */}
      <rect x={-184} y={-246} width={368} height={36} fill={stone} />
      <rect x={0} y={-246} width={184} height={36} fill={stoneShade} />
      <rect x={-188} y={-254} width={376} height={9} fill={stoneLit} />
      {/* triglyph hints along the frieze */}
      {[-150, -110, -70, -30, 30, 70, 110, 150].map((x) => (
        <rect key={x} x={x - 2} y={-242} width={4} height={20} fill="rgba(0,0,0,0.16)" />
      ))}

      {/* attic block the Quadriga stands on */}
      <rect x={-54} y={-272} width={108} height={26} fill={stone} />
      <rect x={0} y={-272} width={54} height={26} fill={stoneShade} />

      {/* ── Quadriga: Victory's chariot drawn by four horses (facing right) ── */}
      <g transform="translate(-16,0)">
        {/* chariot wheel + body */}
        <circle cx={-26} cy={-282} r={11} fill="none" stroke={bronze} strokeWidth={3} />
        <path d="M -40 -286 L -14 -286 L -12 -298 L -38 -298 Z" fill={bronze} />
        {/* Victory figure with a raised standard */}
        <rect x={-30} y={-322} width={5} height={26} fill={bronze} />
        <circle cx={-27.5} cy={-326} r={4} fill={bronze} />
        <line x1={-26} y1={-318} x2={-8} y2={-334} stroke={bronze} strokeWidth={2.4} />
        <rect x={-9} y={-344} width={2.4} height={26} fill={bronze} />
        <path d="M -9 -344 q 8 2 12 6 q -8 1 -12 4 Z" fill={bronze} />
        {/* four horses, overlapping, in profile */}
        {[0, 9, 18, 27].map((o, i) => (
          <g key={i} transform={`translate(${o},0)`}>
            <path d="M -6 -298 q 16 -7 30 -1 l 1 14 q -16 5 -31 0 Z" fill={bronze} />
            <path d="M 24 -299 q 10 -3 9 -16 q 5 6 3 16 q -2 3 -5 4 Z" fill={bronze} />
            <line x1={-2} y1={-285} x2={-3} y2={-272} stroke={bronze} strokeWidth={2.2} />
            <line x1={10} y1={-284} x2={10} y2={-272} stroke={bronze} strokeWidth={2.2} />
            <line x1={20} y1={-284} x2={22} y2={-272} stroke={bronze} strokeWidth={2.2} />
          </g>
        ))}
        {/* lit top edge on the lead horses */}
        <path d="M 28 -298 q 14 -6 24 -2" fill="none" stroke={bronzeLit} strokeWidth={1.4} />
      </g>
    </g>
  );
}
