import type { LandmarkLayerProps } from '../types';

// Belém Tower (Lisbon) — foreground slot. A Manueline fortified tower on the
// Tagus: a low bastion with rounded merlons fronting a four-storey keep crowned
// by battlements and domed corner bartizans, over water. Base-center origin.
export function BelemTowerLandmark({}: LandmarkLayerProps) {
  const f = 'rgb(183, 139, 87)';
  const fLit = 'rgb(222, 183, 118)';
  const a = 'rgb(225, 189, 103)';

  // Rounded Manueline merlons along a wall top.
  const Merlons = ({ x0, x1, y }: { x0: number; x1: number; y: number }) => {
    const out: React.ReactNode[] = [];
    for (let x = x0; x < x1; x += 18) {
      out.push(<path key={x} d={`M ${x} ${y} q 6 -10 12 0 Z`} fill={f} />);
    }
    return <g>{out}</g>;
  };

  return (
    <g aria-hidden>
      {/* water + glints */}
      <rect x={-200} y={-12} width={400} height={12} fill={a} opacity={0.12} />
      {[-150, -70, 30, 120].map((x) => (
        <rect key={x} x={x} y={-8 + (x % 6)} width={30} height={2} fill={a} opacity={0.3} />
      ))}
      {/* bastion */}
      <rect x={-128} y={-86} width={166} height={86} fill={f} />
      <rect x={-128} y={-86} width={40} height={86} fill={fLit} opacity={0.52} />
      <Merlons x0={-126} x1={36} y={-92} />
      {/* keep (rises behind the bastion, right side) */}
      <rect x={-30} y={-296} width={84} height={210} fill={fLit} />
      <rect x={12} y={-296} width={42} height={210} fill="rgba(62,45,37,0.3)" />
      {/* storey window slits */}
      {[-230, -180, -130].map((y) => (
        <rect key={y} x={-6} y={y} width={12} height={26} fill={a} opacity={0.3} />
      ))}
      {/* keep battlements */}
      <Merlons x0={-30} x1={54} y={-302} />
      {/* domed corner bartizans */}
      {[-30, 54].map((x) => (
        <g key={x}>
          <rect x={x - 9} y={-318} width={18} height={26} fill={f} />
          <path d={`M ${x - 9} -318 A 9 9 0 0 1 ${x + 9} -318 Z`} fill={f} />
          <circle cx={x} cy={-330} r={3} fill={a} />
        </g>
      ))}
    </g>
  );
}
