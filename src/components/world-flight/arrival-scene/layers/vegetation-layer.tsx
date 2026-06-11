import { CONTENT_W, LAYOUT, type SceneLayerProps } from '../types';
import { normalizeVegetation } from '../scene-registry';
import { randRange } from '../seed';

// Trees along the grassy field edge, between the city and the runway band.
// Four variants; 'none' renders nothing. Positions are deterministic per city.
export function VegetationLayer({ scene, palette, rand }: SceneLayerProps) {
  const veg = normalizeVegetation(scene.vegetation);
  if (veg === 'none') return null;

  const baseY = LAYOUT.apronY + 64; // on the grass strip, in front of the city

  // Scatter trees, avoiding the centre where the plane lands/taxis.
  const slots: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    const x = randRange(rand, 30, CONTENT_W - 30);
    if (x > CONTENT_W * 0.34 && x < CONTENT_W * 0.74) continue; // keep runway centre clear
    slots.push(x);
  }

  const palm = (k: number, x: number, s: number) => (
    <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
      <path d="M 0 0 C -4 -40 -8 -72 -16 -104" fill="none" stroke={palette.trunk} strokeWidth={7} />
      {[-1, -0.5, 0, 0.5, 1].map((a, i) => (
        <path
          key={i}
          d={`M -16 -104 Q ${-16 + a * 50} ${-128 - Math.abs(a) * 6} ${-16 + a * 84} ${-104 + Math.abs(a) * 26}`}
          fill="none"
          stroke={palette.foliage}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ))}
    </g>
  );

  const pine = (k: number, x: number, s: number) => (
    <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
      <rect x={-4} y={-22} width={8} height={22} fill={palette.trunk} />
      <polygon points="0,-110 -34,-40 34,-40" fill={palette.foliage} />
      <polygon points="0,-86 -28,-20 28,-20" fill={palette.foliage} />
    </g>
  );

  const broadleaf = (k: number, x: number, s: number) => (
    <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
      <rect x={-5} y={-44} width={10} height={44} fill={palette.trunk} />
      <circle cx={0} cy={-66} r={34} fill={palette.foliage} />
      <circle cx={-24} cy={-50} r={24} fill={palette.foliage} />
      <circle cx={24} cy={-52} r={22} fill={palette.foliage} />
    </g>
  );

  const draw = veg === 'palms' ? palm : veg === 'pines' ? pine : broadleaf;

  return (
    <g aria-hidden>
      {slots.map((x, i) => draw(i, x, randRange(rand, 0.7, 1.15)))}
    </g>
  );
}
