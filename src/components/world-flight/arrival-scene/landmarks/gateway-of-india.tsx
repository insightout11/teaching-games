import type { LandmarkLayerProps } from '../types';

// Gateway of India (Mumbai) — foreground slot, on the harbour. The Indo-Saracenic
// basalt arch: a great central archway through a honey-stone block, a large
// central dome, flanking corner turrets with chhatris, jali latticework and
// gilded finials. Base-center origin, built upward. Fixed iconic stone colours
// (floodlit) with two-tone shading; the arch reveal warms at night.
export function GatewayOfIndiaLandmark({ palette }: LandmarkLayerProps) {
  const stone = 'rgb(198,172,128)';
  const stoneLit = 'rgb(218,194,152)';
  const stoneShade = 'rgba(0,0,0,0.2)';
  const gold = 'rgb(226,190,104)';
  const reveal = palette.light === 'moon' ? 'rgba(255,206,130,0.32)' : 'rgba(28,32,42,0.5)';

  // A small domed kiosk (chhatri) crowning a corner turret.
  const chhatri = (cx: number, top: number, key: string) => (
    <g key={key}>
      <rect x={cx - 10} y={top} width={20} height={6} fill={stone} />
      <path d={`M ${cx - 11} ${top} C ${cx - 13} ${top - 18} ${cx + 13} ${top - 18} ${cx + 11} ${top} Z`} fill={stone} />
      <path d={`M ${cx} ${top - 19} C ${cx + 13} ${top - 18} ${cx + 11} ${top} ${cx} ${top} Z`} fill={stoneShade} />
      <rect x={cx - 1.4} y={top - 30} width={2.8} height={12} fill={gold} />
      <circle cx={cx} cy={top - 31} r={2.6} fill={gold} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* plinth */}
      <rect x={-130} y={-20} width={260} height={20} fill={stone} />
      <rect x={0} y={-20} width={130} height={20} fill={stoneShade} />

      {/* main block (two-tone) + cornice */}
      <rect x={-118} y={-176} width={236} height={156} fill={stone} />
      <rect x={0} y={-176} width={118} height={156} fill={stoneShade} />
      <rect x={-118} y={-176} width={6} height={156} fill={stoneLit} />
      <rect x={-126} y={-190} width={252} height={14} fill={stone} />
      <rect x={0} y={-190} width={126} height={14} fill={stoneShade} />
      {/* string courses */}
      {[-60, -120].map((y) => (
        <rect key={y} x={-118} y={y} width={236} height={3} fill="rgba(0,0,0,0.14)" />
      ))}

      {/* great central arch (reveal) + stone frame */}
      <path d="M -46 -20 L -46 -96 C -46 -134 -24 -158 0 -158 C 24 -158 46 -134 46 -96 L 46 -20 Z" fill={reveal} />
      <path
        d="M -46 -20 L -46 -96 C -46 -134 -24 -158 0 -158 C 24 -158 46 -134 46 -96 L 46 -20"
        fill="none"
        stroke={gold}
        strokeWidth={3}
        opacity={0.85}
      />
      {/* flanking side arches (smaller reveals) */}
      {[-84, 84].map((cx) => (
        <path key={cx} d={`M ${cx - 13} -20 L ${cx - 13} -64 C ${cx - 13} -84 ${cx + 13} -84 ${cx + 13} -64 L ${cx + 13} -20 Z`} fill={reveal} />
      ))}
      {/* jali lattice panels above the side arches */}
      {[-84, 84].map((cx) => (
        <g key={`j${cx}`} opacity={0.5}>
          {[-150, -142, -134, -126].map((y) => (
            <rect key={y} x={cx - 16} y={y} width={32} height={1.4} fill="rgba(0,0,0,0.3)" />
          ))}
          {[-16, -8, 0, 8, 16].map((dx) => (
            <rect key={dx} x={cx + dx} y={-152} width={1.4} height={28} fill="rgba(0,0,0,0.3)" />
          ))}
        </g>
      ))}

      {/* corner turrets with chhatris */}
      {[-104, 104].map((cx) => (
        <g key={cx}>
          <rect x={cx - 9} y={-220} width={18} height={44} fill={stone} />
          <rect x={cx} y={-220} width={9} height={44} fill={stoneShade} />
          {chhatri(cx, -220, `ch${cx}`)}
        </g>
      ))}

      {/* central dome on a drum (two-tone) + ribs + finial */}
      <rect x={-40} y={-214} width={80} height={24} fill={stone} />
      <rect x={0} y={-214} width={40} height={24} fill={stoneShade} />
      <path d="M -44 -214 C -52 -262 -24 -290 0 -290 C 24 -290 52 -262 44 -214 Z" fill={stone} />
      <path d="M 0 -290 C 24 -290 52 -262 44 -214 L 0 -214 Z" fill={stoneShade} />
      {[-26, 0, 26].map((dx) => (
        <path key={dx} d={`M ${dx * 0.4} -214 C ${dx} -252 ${dx} -252 ${dx * 0.16} -286`} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1.4} />
      ))}
      <rect x={-7} y={-302} width={14} height={12} fill={stone} />
      <rect x={-1.6} y={-320} width={3.2} height={18} fill={gold} />
      <circle cx={0} cy={-322} r={4} fill={gold} />
    </g>
  );
}
