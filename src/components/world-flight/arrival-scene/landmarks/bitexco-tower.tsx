import type { LandmarkLayerProps } from '../types';

// Bitexco Financial Tower (Ho Chi Minh City) — foreground slot. The lotus-bud
// tapering tower with its signature cantilevered helipad disc near the top.
// Base-center origin, built upward.
export function BitexcoTowerLandmark({ palette }: LandmarkLayerProps) {
  const f = 'rgb(47, 101, 124)';
  const fShade = 'rgba(18,43,65,0.46)';
  const a = 'rgb(126, 195, 202)';
  return (
    <g aria-hidden>
      {/* lotus-bud body (curved taper) */}
      <path d="M -42 0 C -50 -180 -34 -362 0 -470 C 34 -362 50 -180 42 0 Z" fill={f} />
      <path d="M 0 0 C 36 -180 26 -364 0 -470 C 34 -362 50 -180 42 0 Z" fill={fShade} />
      {/* glass mullions */}
      {[-26, -13, 0, 13, 26].map((x) => (
        <rect key={x} x={x - 1} y={-452} width={2} height={452} fill={a} opacity={0.18} />
      ))}
      {/* lit floor bands */}
      {[-120, -240, -360].map((y) => (
        <rect key={y} x={-30} y={y} width={60} height={3} fill={palette.windowWarm} opacity={0.4} />
      ))}
      {/* cantilevered helipad disc (signature) */}
      <path d="M 22 -358 L 46 -358" stroke={f} strokeWidth={5} />
      <ellipse cx={52} cy={-360} rx={34} ry={9} fill={f} />
      <circle cx={56} cy={-362} r={5} fill="none" stroke={a} strokeWidth={1.5} opacity={0.6} />
      {/* slender tip */}
      <path d="M -6 -470 L 0 -512 L 6 -470 Z" fill={f} />
      <circle cx={0} cy={-514} r={3} fill={a} />
    </g>
  );
}
