import type { LandmarkLayerProps } from '../types';

// India Gate (Delhi) — foreground slot. The war-memorial triumphal arch: a
// single great archway through a broad block, a moulded cornice and attic with
// a shallow cupola. Base-center origin, built upward.
export function IndiaGateLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(190, 145, 91)';
  const fLit = 'rgb(222, 180, 113)';
  const a = 'rgb(232, 193, 103)';
  const open = palette.light === 'moon' ? 'rgba(255,212,130,0.3)' : 'rgba(0,0,0,0.34)';
  return (
    <g aria-hidden>
      {/* base block */}
      <rect x={-110} y={-212} width={220} height={212} fill={f} />
      <rect x={-110} y={-212} width={54} height={212} fill={fLit} opacity={0.5} />
      {/* great arch */}
      <path d="M -50 0 L -50 -150 Q 0 -212 50 -150 L 50 0 Z" fill={open} />
      {/* horizontal mouldings */}
      {[-180, -120].map((y) => (
        <rect key={y} x={-110} y={y} width={220} height={4} fill={a} opacity={0.24} />
      ))}
      {/* cornice */}
      <rect x={-122} y={-226} width={244} height={20} fill={f} />
      {/* attic block */}
      <rect x={-86} y={-262} width={172} height={36} fill={fLit} />
      {/* shallow cupola + finial */}
      <ellipse cx={0} cy={-262} rx={26} ry={13} fill={f} />
      <rect x={-3} y={-290} width={6} height={16} fill={f} />
      <circle cx={0} cy={-292} r={4} fill={a} />
    </g>
  );
}
