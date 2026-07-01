import type { LandmarkLayerProps } from '../types';

// Gwanghwamun palace gate (Seoul) — foreground slot. Stone base with arched
// gateways under a dancheong-painted timber pavilion and an upswept tiled roof.
// Base-center origin, built upward. Fixed iconic colours (the painted woodwork
// carries the identity); the gate reveals warm at night.
export function PalaceGateLandmark({ palette }: LandmarkLayerProps) {
  const stone = 'rgb(150,142,128)';
  const stoneShade = 'rgba(0,0,0,0.18)';
  const tile = 'rgb(76,84,94)'; // dark roof tiles
  const tileShade = 'rgba(0,0,0,0.24)';
  const woodRed = 'rgb(170,74,58)'; // dancheong red
  const dcGreen = 'rgb(60,124,104)';
  const dcBlue = 'rgb(70,108,152)';
  const gate = palette.light === 'moon' ? 'rgba(255,210,140,0.3)' : 'rgba(28,28,34,0.5)';

  return (
    <g aria-hidden>
      {/* stone base (two-tone) */}
      <rect x={-170} y={-104} width={340} height={104} fill={stone} />
      <rect x={0} y={-104} width={170} height={104} fill={stoneShade} />
      {/* three arched gateways */}
      {[-100, 0, 100].map((x) => (
        <path key={x} d={`M ${x - 22} 0 L ${x - 22} -52 Q ${x} -80 ${x + 22} -52 L ${x + 22} 0 Z`} fill={gate} />
      ))}
      {/* parapet + merlons */}
      <rect x={-150} y={-120} width={300} height={16} fill={stone} />
      <rect x={0} y={-120} width={150} height={16} fill={stoneShade} />
      {[-130, -90, -50, -10, 30, 70, 110].map((x) => (
        <rect key={x} x={x} y={-130} width={18} height={12} fill={stone} />
      ))}

      {/* dancheong-painted pavilion body — red woodwork + colour beam bands */}
      <rect x={-130} y={-172} width={260} height={52} fill={woodRed} />
      <rect x={0} y={-172} width={130} height={52} fill="rgba(0,0,0,0.16)" />
      {[-116, -80, -44, -8, 28, 64, 100].map((x) => (
        <rect key={x} x={x} y={-168} width={6} height={48} fill="rgba(0,0,0,0.18)" />
      ))}
      {/* painted beam bands under the eaves */}
      <rect x={-134} y={-182} width={268} height={7} fill={dcGreen} />
      <rect x={-134} y={-176} width={268} height={3} fill={dcBlue} />
      {[-120, -84, -48, -12, 24, 60, 96].map((x) => (
        <circle key={x} cx={x + 3} cy={-178} r={2} fill="rgba(240,220,150,0.8)" />
      ))}

      {/* upswept tiled roof (two-tone) + ridge */}
      <path d="M -158 -172 Q -176 -184 -190 -206 L 0 -248 L 190 -206 Q 176 -184 158 -172 Z" fill={tile} />
      <path d="M 0 -248 L 190 -206 Q 176 -184 158 -172 L 0 -172 Z" fill={tileShade} />
      <path d="M -190 -206 L 0 -248 L 190 -206" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
      {/* ridge end ornaments */}
      <rect x={-192} y={-214} width={8} height={10} fill={tile} />
      <rect x={184} y={-214} width={8} height={10} fill={tile} />
      <rect x={-3} y={-260} width={6} height={14} fill={tile} />
    </g>
  );
}
