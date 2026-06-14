import type { LandmarkLayerProps } from '../types';

// Plaza Mayor cathedral (Lima) — foreground slot. A Spanish colonial cathedral:
// twin pyramidal-capped bell towers flanking a central pedimented facade with a
// great portal and a rose window. Base-center origin, built upward.
export function PlazaMayorLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const open = palette.light === 'moon' ? 'rgba(255,212,130,0.32)' : 'rgba(0,0,0,0.34)';

  const Tower = ({ x }: { x: number }) => (
    <g>
      <rect x={x - 18} y={-300} width={36} height={300} fill={f} />
      {/* belfry openings */}
      <path d={`M ${x - 9} -300 L ${x - 9} -332 Q ${x} -346 ${x + 9} -332 L ${x + 9} -300 Z`} fill={open} />
      <rect x={x - 24} y={-342} width={48} height={42} fill={f} />
      {/* pyramidal cap */}
      <polygon points={`${x - 24} -342, ${x} -388, ${x + 24} -342`} fill={f} />
      <circle cx={x} cy={-392} r={4} fill={a} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* central facade */}
      <rect x={-72} y={-232} width={144} height={232} fill={f} />
      {/* great portal */}
      <path d="M -24 0 L -24 -150 Q 0 -182 24 -150 L 24 0 Z" fill={open} />
      {/* rose window */}
      <circle cx={0} cy={-196} r={16} fill={open} />
      <circle cx={0} cy={-196} r={16} fill="none" stroke={a} strokeWidth={2} opacity={0.4} />
      {/* pediment */}
      <polygon points="-80 -232, 0 -292, 80 -232" fill={f} />
      <circle cx={0} cy={-296} r={4} fill={a} />
      {/* twin bell towers */}
      <Tower x={-94} />
      <Tower x={94} />
    </g>
  );
}
