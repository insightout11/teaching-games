import type { LandmarkLayerProps } from '../types';

// Saint Basil's Cathedral (Moscow) — foreground slot. A central tent tower ringed
// by COLORFUL onion-domed towers, each dome with its own pattern (spiral / facet
// / ribbed / chevron) like the real cathedral. Dome colours are iconic and
// palette-independent so it pops. Base-center origin, built upward.
type DomePattern = 'spiral' | 'facet' | 'rib' | 'chevron';
const DOMES: { color: string; pattern: DomePattern }[] = [
  { color: '#c44a32', pattern: 'spiral' },
  { color: '#3f8090', pattern: 'facet' },
  { color: '#d7a23c', pattern: 'rib' },
  { color: '#4f9455', pattern: 'chevron' },
];

export function SaintBasilsLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const fLit = 'rgba(255,255,255,0.14)';
  const gold = '#d7a23c';

  const Onion = ({ x, w, h, color, pattern }: { x: number; w: number; h: number; color: string; pattern: DomePattern }) => {
    const domeTop = -h - w * 1.62;
    const midY = -h - w * 0.72; // widest point of the bulb
    const onion =
      `M ${x - w / 2} ${-h} ` +
      `C ${x - w * 0.72} ${-h - w * 0.5} ${x - w * 0.4} ${-h - w * 1.16} ${x - w * 0.1} ${-h - w * 1.46} ` +
      `C ${x - w * 0.03} ${-h - w * 1.55} ${x} ${domeTop} ${x} ${domeTop} ` +
      `C ${x} ${domeTop} ${x + w * 0.03} ${-h - w * 1.55} ${x + w * 0.1} ${-h - w * 1.46} ` +
      `C ${x + w * 0.4} ${-h - w * 1.16} ${x + w * 0.72} ${-h - w * 0.5} ${x + w / 2} ${-h} Z`;
    const r = w * 0.5;
    return (
      <g>
        {/* tower body (two-tone) with a kokoshnik arch + window */}
        <rect x={x - w / 2} y={-h} width={w} height={h} fill={f} />
        <rect x={x} y={-h} width={w / 2} height={h} fill="rgba(0,0,0,0.16)" />
        <path d={`M ${x - w * 0.3} ${-h} A ${w * 0.3} ${w * 0.3} 0 0 1 ${x + w * 0.3} ${-h}`} fill={fLit} />
        <rect x={x - 3} y={-h + 10} width={6} height={h * 0.5} fill="rgba(255,236,180,0.35)" />
        {/* onion dome */}
        <path d={onion} fill={color} />
        <path d={`M ${x} ${domeTop} C ${x + w * 0.03} ${-h - w * 1.55} ${x + w * 0.4} ${-h - w * 1.16} ${x + w / 2} ${-h} L ${x} ${-h} Z`} fill="rgba(0,0,0,0.16)" />
        {/* per-dome pattern */}
        {pattern === 'spiral' && (
          <>
            <path d={`M ${x - r * 0.7} ${-h - r * 0.3} Q ${x} ${-h - r * 1.5} ${x + r * 0.5} ${-h - r * 2.3}`} stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} fill="none" />
            <path d={`M ${x - r * 0.2} ${-h - r * 0.2} Q ${x + r * 0.4} ${-h - r * 1.3} ${x + r * 0.2} ${-h - r * 2.4}`} stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="none" />
          </>
        )}
        {pattern === 'rib' && [-0.55, -0.18, 0.18, 0.55].map((t, i) => (
          <path key={i} d={`M ${x + t * r} ${-h} Q ${x + t * r * 0.5} ${midY} ${x + t * r * 0.12} ${domeTop + r * 0.4}`} stroke="rgba(0,0,0,0.2)" strokeWidth={1.6} fill="none" />
        ))}
        {pattern === 'facet' && [0, 1, 2].map((row) => (
          <g key={row}>
            {[-0.6, -0.2, 0.2, 0.6].map((t, i) => (
              <path key={i} d={`M ${x + t * r} ${midY + row * r * 0.5} l ${r * 0.2} ${-r * 0.28} l ${r * 0.2} ${r * 0.28} l ${-r * 0.2} ${r * 0.28} Z`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} />
            ))}
          </g>
        ))}
        {pattern === 'chevron' && [0, 1, 2].map((row) => (
          <path key={row} d={`M ${x - r * 0.6} ${midY + row * r * 0.5} L ${x} ${midY + row * r * 0.5 - r * 0.28} L ${x + r * 0.6} ${midY + row * r * 0.5}`} stroke="rgba(255,255,255,0.55)" strokeWidth={1.8} fill="none" />
        ))}
        {/* finial + cross */}
        <rect x={x - 1.5} y={domeTop - 16} width={3} height={16} fill={gold} />
        <rect x={x - 5} y={domeTop - 12} width={10} height={2.5} fill={gold} />
      </g>
    );
  };

  return (
    <g aria-hidden>
      {/* flanking colorful towers */}
      <Onion x={-100} w={40} h={150} color={DOMES[0].color} pattern={DOMES[0].pattern} />
      <Onion x={100} w={40} h={150} color={DOMES[1].color} pattern={DOMES[1].pattern} />
      <Onion x={-54} w={50} h={205} color={DOMES[2].color} pattern={DOMES[2].pattern} />
      <Onion x={54} w={50} h={205} color={DOMES[3].color} pattern={DOMES[3].pattern} />
      {/* central tent tower (two-tone) with tiered kokoshnik gables + gold cupola */}
      <rect x={-34} y={-250} width={68} height={250} fill={f} />
      <rect x={0} y={-250} width={34} height={250} fill="rgba(0,0,0,0.16)" />
      {[-70, -140].map((dy, i) => (
        <path key={i} d={`M ${-34} ${dy} A 34 20 0 0 1 34 ${dy}`} fill="rgba(255,255,255,0.12)" />
      ))}
      <rect x={-4} y={-240} width={8} height={150} fill="rgba(255,236,180,0.35)" />
      {/* tent roof */}
      <polygon points="-40 -250, 0 -392, 40 -250" fill="#b23a30" />
      <polygon points="0 -392, 40 -250, 0 -250" fill="rgba(0,0,0,0.18)" />
      {[-0.6, -0.2, 0.2, 0.6].map((t, i) => (
        <line key={i} x1={t * 40} y1={-250} x2={t * 16} y2={-360} stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
      ))}
      <path d="M -10 -392 C -16 -420 16 -420 10 -392 Z" fill={gold} />
      <rect x={-1.5} y={-432} width={3} height={20} fill={gold} />
      <rect x={-5} y={-426} width={10} height={2.5} fill={gold} />
    </g>
  );
}
