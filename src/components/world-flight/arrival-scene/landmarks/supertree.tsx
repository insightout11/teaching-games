import type { LandmarkLayerProps } from '../types';

// Supertree Grove (Singapore) — foreground slot. Tree-like vertical gardens:
// tapering trunks wrapped in planted foliage panels, flaring to radiating steel
// canopies, linked by the OCBC Skyway. Base-center origin, built upward. Fixed
// iconic colours with two-tone shading; the canopies glow magenta at night (the
// grove's signature lights), green-gold by day.
export function SupertreeLandmark({ palette }: LandmarkLayerProps) {
  const isNight = palette.light === 'moon';
  const steel = 'rgb(96,104,102)';
  const steelShade = 'rgba(0,0,0,0.22)';
  const foliage = isNight ? 'rgb(46,92,58)' : 'rgb(70,134,78)';
  const glow = isNight ? 'rgba(206,96,190,0.5)' : 'rgba(150,200,120,0.4)';
  const canopyEdge = isNight ? 'rgba(236,150,224,0.85)' : 'rgba(190,224,150,0.7)';

  const Tree = ({ x, h, s }: { x: number; h: number; s: number }) => (
    <g transform={`translate(${x} 0) scale(${s})`}>
      {/* trunk — tapers in, then flares out to the canopy */}
      <path d={`M -9 0 L -11 ${-h * 0.62} L -26 ${-h} L 26 ${-h} L 11 ${-h * 0.62} L 9 0 Z`} fill={steel} />
      <path d={`M 0 0 L 0 ${-h} L 26 ${-h} L 11 ${-h * 0.62} L 9 0 Z`} fill={steelShade} />
      {/* planted vertical-garden foliage panels climbing the trunk */}
      {[0.12, 0.3, 0.48, 0.66].map((t, i) => (
        <g key={i}>
          <ellipse cx={-7 + i * 1.5} cy={-h * t} rx={7} ry={11} fill={foliage} opacity={0.92} />
          <ellipse cx={6 - i * 1.2} cy={-h * (t + 0.08)} rx={6} ry={9} fill={foliage} opacity={0.8} />
        </g>
      ))}
      {/* radiating steel canopy ribs */}
      {[-60, -40, -22, 0, 22, 40, 60].map((bx) => (
        <path key={bx} d={`M 0 ${-h + 2} Q ${bx * 0.5} ${-h - 26} ${bx} ${-h - 44}`} stroke={steel} strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      {/* canopy disc + glow */}
      <ellipse cx={0} cy={-h - 2} rx={58} ry={15} fill={foliage} />
      <ellipse cx={0} cy={-h - 8} rx={64} ry={20} fill={glow} />
      <path d={`M -58 ${-h - 2} Q 0 ${-h - 22} 58 ${-h - 2}`} fill="none" stroke={canopyEdge} strokeWidth={2} opacity={0.8} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* OCBC Skyway linking the two tall trees (drawn behind the near trunks) */}
      <path d="M -8 -176 Q 28 -188 64 -150" fill="none" stroke={steel} strokeWidth={5} />
      <path d="M -8 -182 Q 28 -194 64 -156" fill="none" stroke={canopyEdge} strokeWidth={1.6} opacity={0.7} />

      <Tree x={-72} h={150} s={0.8} />
      <Tree x={64} h={170} s={0.85} />
      <Tree x={-8} h={230} s={1} />
    </g>
  );
}
