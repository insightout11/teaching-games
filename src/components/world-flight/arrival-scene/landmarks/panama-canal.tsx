import type { LandmarkLayerProps } from '../types';

// Panama Canal (Panama City) — foreground slot, FULL-WIDTH waterway. The canal
// runs the length of the scene in front of the city, with a container ship
// transiting a lock chamber framed by concrete walls and a miter gate. Drawn
// wide (registered at anchorX 0.5 / scale 1) so the water spans the whole canvas
// including the side bleed. Base-center origin (waterline near y=0), upward.
export function PanamaCanalLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const water = palette.waterTop;
  const waterDeep = palette.waterBottom;
  // Restrained container-stack accents — a canal scene reads by its cargo colour.
  const red = 'rgba(176,72,58,0.85)';
  const blue = 'rgba(70,104,150,0.85)';
  const wl = -46; // waterline (top surface of the canal)

  return (
    <g aria-hidden>
      {/* full-width canal water (extends into the side bleed on wide windows) */}
      <rect x={-1500} y={wl} width={3000} height={-wl + 34} fill={water} />
      <rect x={-1500} y={-16} width={3000} height={50} fill={waterDeep} opacity={0.5} />
      {/* surface glints along the canal */}
      {[-1260, -900, -560, -240, 140, 420, 760, 1080, 1380].map((x) => (
        <rect key={x} x={x} y={wl + 7} width={60} height={2} fill="rgba(255,255,255,0.28)" />
      ))}

      {/* lock walls framing the chamber (focal centre) */}
      <rect x={-250} y={-94} width={26} height={94} fill={f} />
      <rect x={224} y={-94} width={26} height={94} fill={f} />
      {/* bollards / lamp posts */}
      {[-237, 237].map((x) => (
        <g key={x}>
          <rect x={x - 2} y={-120} width={4} height={26} fill={f} />
          <circle cx={x} cy={-124} r={3} fill={a} />
        </g>
      ))}
      {/* miter gate */}
      <rect x={-2} y={-72} width={4} height={30} fill={f} opacity={0.5} />

      {/* container ship transiting the lock */}
      <g transform="translate(-12,0)">
        {/* hull sitting in the water */}
        <path d={`M -120 ${wl - 30} L 120 ${wl - 30} L 98 ${wl + 8} L -98 ${wl + 8} Z`} fill={f} />
        {/* superstructure + funnel (aft) */}
        <rect x={62} y={wl - 64} width={44} height={34} fill={f} />
        <rect x={78} y={wl - 84} width={14} height={20} fill={f} />
        {/* container stacks */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = -106 + i * 28;
          const c = i % 3 === 0 ? red : i % 3 === 1 ? blue : f;
          return <rect key={i} x={x} y={wl - 54} width={24} height={24} fill={c} />;
        })}
      </g>
    </g>
  );
}
