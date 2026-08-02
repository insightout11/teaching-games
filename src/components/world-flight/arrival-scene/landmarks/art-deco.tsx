import type { LandmarkLayerProps } from '../types';

// Ocean Drive Art Deco facades (Miami) — foreground slot. A streetfront row of
// three pastel deco hotels with stepped ziggurat parapets, central fins, deco
// eyebrow banding and porthole windows. Base-center origin, built upward.
export function ArtDecoLandmark({ palette }: LandmarkLayerProps) {
  const facades = ['rgb(213,137,139)', 'rgb(92,169,177)', 'rgb(229,174,112)'];
  // Restrained Miami neon teal — a meaningful accent the city is known for.
  const neon = 'rgba(64,196,206,0.55)';

  const Facade = ({ x, w, h, fill }: { x: number; w: number; h: number; fill: string }) => {
    const left = x - w / 2;
    return (
      <g>
        {/* body */}
        <rect x={left} y={-h} width={w} height={h} fill={fill} />
        <rect x={x} y={-h} width={w / 2} height={h} fill="rgba(28,42,58,0.18)" />
        {/* central stepped parapet (ziggurat) + mast fin */}
        <rect x={x - 18} y={-h - 16} width={36} height={16} fill={fill} />
        <rect x={x - 11} y={-h - 28} width={22} height={12} fill={fill} />
        <rect x={x - 2.5} y={-h - 52} width={5} height={24} fill={fill} />
        {/* deco eyebrow bands (neon trim) */}
        {[0.3, 0.52, 0.74].map((t) => (
          <rect key={t} x={left + 5} y={-h * t} width={w - 10} height={3} fill={neon} />
        ))}
        {/* windows */}
        {[0.36, 0.58, 0.8].map((t) =>
          [-0.28, 0, 0.28].map((dx) => (
            <rect
              key={`${t}-${dx}`}
              x={x + dx * w - 5}
              y={-h * t - 15}
              width={10}
              height={14}
              fill={palette.windowWarm}
              opacity={0.4}
            />
          )),
        )}
        {/* porthole accent */}
        <circle cx={x} cy={-h + 18} r={6} fill={neon} opacity={0.7} />
      </g>
    );
  };

  return (
    <g aria-hidden>
      <Facade x={-120} w={108} h={176} fill={facades[0]} />
      <Facade x={0} w={120} h={202} fill={facades[1]} />
      <Facade x={120} w={108} h={158} fill={facades[2]} />
    </g>
  );
}
