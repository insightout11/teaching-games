import type { LandmarkLayerProps } from '../types';

// Grand mosque (Istanbul) — foreground slot. An Ottoman mosque: a great central
// dome on a windowed drum, a cascade of descending semi-domes, and slender
// minarets with balconies (şerefe). Pale stone (two-tone) so it reads against a
// dark city; drum + windows glow warm. Base-center origin, built upward.
export function MosqueLandmark({ palette }: LandmarkLayerProps) {
  const stone = 'rgb(212,204,186)';
  const stoneLit = 'rgb(230,222,204)';
  const stoneShade = 'rgba(0,0,0,0.18)';
  const gold = 'rgb(226,190,104)';
  const warm = palette.windowWarm;

  const Minaret = ({ x, h }: { x: number; h: number }) => (
    <g>
      <rect x={x - 6} y={-h} width={12} height={h} fill={stone} />
      <rect x={x} y={-h} width={6} height={h} fill={stoneShade} />
      {/* two balconies (şerefe) */}
      <rect x={x - 8} y={-h * 0.66} width={16} height={4} fill={gold} opacity={0.75} />
      <rect x={x - 8} y={-h * 0.4} width={16} height={4} fill={gold} opacity={0.6} />
      {/* cap + conical spire + finial */}
      <rect x={x - 9} y={-h - 12} width={18} height={12} fill={stone} />
      <polygon points={`${x - 9} ${-h - 12}, ${x} ${-h - 54}, ${x + 9} ${-h - 12}`} fill={stone} />
      <polygon points={`${x} ${-h - 54}, ${x + 9} ${-h - 12}, ${x} ${-h - 12}`} fill={stoneShade} />
      <circle cx={x} cy={-h - 56} r={3.5} fill={gold} />
    </g>
  );

  // A semi-dome of radius r seated at (cx, y).
  const semiDome = (cx: number, y: number, r: number, key: string) => (
    <g key={key}>
      <path d={`M ${cx - r} ${y} A ${r} ${r} 0 0 1 ${cx + r} ${y} Z`} fill={stone} />
      <path d={`M ${cx} ${y - r} A ${r} ${r} 0 0 1 ${cx + r} ${y} L ${cx} ${y} Z`} fill={stoneShade} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* prayer-hall block (two-tone) */}
      <rect x={-150} y={-116} width={300} height={116} fill={stone} />
      <rect x={0} y={-116} width={150} height={116} fill={stoneShade} />
      {/* arched portal + lit windows */}
      <path d="M -18 0 L -18 -60 Q 0 -82 18 -60 L 18 0 Z" fill={warm} opacity={0.5} />
      {[-118, -78, 78, 118].map((wx, i) => (
        <rect key={i} x={wx - 6} y={-70} width={12} height={30} fill={warm} opacity={0.4} />
      ))}
      {/* cascade of descending semi-domes flanking the center */}
      {semiDome(-96, -116, 40, 'sdL')}
      {semiDome(96, -116, 40, 'sdR')}
      {semiDome(-52, -140, 30, 'sdL2')}
      {semiDome(52, -140, 30, 'sdR2')}
      {/* windowed drum */}
      <rect x={-58} y={-182} width={116} height={66} fill={stone} />
      <rect x={0} y={-182} width={58} height={66} fill={stoneShade} />
      {[-46, -28, -10, 8, 26, 44].map((wx, i) => (
        <rect key={i} x={wx - 2} y={-176} width={5} height={22} fill={warm} opacity={0.55} />
      ))}
      {/* great central dome (two-tone + rib highlight) */}
      <path d="M -64 -182 A 64 64 0 0 1 64 -182 Z" fill={stone} />
      <path d="M 0 -246 A 64 64 0 0 1 64 -182 L 0 -182 Z" fill={stoneShade} />
      <path d="M -48 -196 A 48 48 0 0 1 48 -196" fill="none" stroke={stoneLit} strokeWidth={2} opacity={0.5} />
      {/* gold finial */}
      <rect x={-2} y={-276} width={4} height={32} fill={gold} />
      <circle cx={0} cy={-278} r={6} fill={gold} />
      {/* four minarets */}
      <Minaret x={-140} h={306} />
      <Minaret x={140} h={306} />
      <Minaret x={-92} h={250} />
      <Minaret x={92} h={250} />
    </g>
  );
}
