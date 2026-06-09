import type { LandmarkLayerProps } from '../types';

// Saint Basil's Cathedral (Moscow) — foreground slot. A central tent spire ringed
// by COLORFUL onion-domed towers (the cathedral's signature). Dome colours are
// iconic and intentionally palette-independent so it pops. Base-center origin.
const DOME_COLORS = ['#c44a32', '#3f8090', '#d7a23c', '#4f9455', '#9a5bb0'];

export function SaintBasilsLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;

  const Onion = ({ x, w, h, color }: { x: number; w: number; h: number; color: string }) => {
    const domeTop = -h - w * 1.5;
    return (
      <g>
        {/* tower body */}
        <rect x={x - w / 2} y={-h} width={w} height={h} fill={f} />
        {/* onion dome */}
        <path
          d={`M ${x - w / 2} ${-h}
              C ${x - w / 1.15} ${-h - w * 0.7} ${x - w * 0.3} ${-h - w * 1.3} ${x} ${domeTop}
              C ${x + w * 0.3} ${-h - w * 1.3} ${x + w / 1.15} ${-h - w * 0.7} ${x + w / 2} ${-h} Z`}
          fill={color}
        />
        {/* highlight swirl + white spiral hint */}
        <path d={`M ${x - w * 0.28} ${-h - w * 0.45} Q ${x} ${-h - w * 0.05} ${x + w * 0.28} ${-h - w * 0.45}`} stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} fill="none" />
        <path d={`M ${x - w * 0.16} ${-h - w * 0.85} Q ${x} ${-h - w * 0.5} ${x + w * 0.16} ${-h - w * 0.85}`} stroke="rgba(255,255,255,0.45)" strokeWidth={2} fill="none" />
        {/* finial + cross */}
        <rect x={x - 1.5} y={domeTop - 16} width={3} height={16} fill="#d7a23c" />
        <rect x={x - 5} y={domeTop - 12} width={10} height={2.5} fill="#d7a23c" />
      </g>
    );
  };

  return (
    <g aria-hidden>
      {/* flanking colorful towers */}
      <Onion x={-100} w={40} h={150} color={DOME_COLORS[0]} />
      <Onion x={100} w={40} h={150} color={DOME_COLORS[1]} />
      <Onion x={-54} w={50} h={205} color={DOME_COLORS[2]} />
      <Onion x={54} w={50} h={205} color={DOME_COLORS[3]} />
      {/* central tent tower with a small gold cupola */}
      <rect x={-34} y={-250} width={68} height={250} fill={f} />
      {/* tier rings */}
      <rect x={-34} y={-180} width={68} height={6} fill="rgba(255,255,255,0.15)" />
      <polygon points="-40 -250, 0 -392, 40 -250" fill="#b23a30" />
      <path d="M -40 -250 L 0 -392 L 40 -250" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
      <path d="M -10 -392 C -16 -420 16 -420 10 -392 Z" fill="#d7a23c" />
      <rect x={-1.5} y={-432} width={3} height={20} fill="#d7a23c" />
      <rect x={-5} y={-426} width={10} height={2.5} fill="#d7a23c" />
    </g>
  );
}
