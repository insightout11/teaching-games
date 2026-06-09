import type { LandmarkLayerProps } from '../types';

// Amsterdam canal houses — foreground slot. A row of narrow houses with varied
// gable tops (step, bell, neck, triangle). Base-center origin, built upward.
export function CanalHousesLandmark({ palette }: LandmarkLayerProps) {
  type Gable = 'step' | 'bell' | 'neck' | 'tri';
  const houses: { w: number; h: number; gable: Gable }[] = [
    { w: 86, h: 250, gable: 'step' },
    { w: 76, h: 290, gable: 'bell' },
    { w: 92, h: 230, gable: 'neck' },
    { w: 72, h: 300, gable: 'tri' },
    { w: 88, h: 262, gable: 'step' },
    { w: 78, h: 226, gable: 'bell' },
  ];
  const total = houses.reduce((s, h) => s + h.w, 0);
  let x = -total / 2;

  const gablePath = (gx: number, w: number, top: number, gable: Gable) => {
    const r = gx + w;
    switch (gable) {
      case 'step':
        return `M ${gx} ${top} L ${gx} ${top - 18} L ${gx + w * 0.22} ${top - 18} L ${gx + w * 0.22} ${top - 36} L ${gx + w * 0.39} ${top - 36} L ${gx + w * 0.39} ${top - 54} L ${gx + w * 0.61} ${top - 54} L ${gx + w * 0.61} ${top - 36} L ${gx + w * 0.78} ${top - 36} L ${gx + w * 0.78} ${top - 18} L ${r} ${top - 18} L ${r} ${top} Z`;
      case 'bell':
        return `M ${gx} ${top} C ${gx} ${top - 40} ${gx + w * 0.3} ${top - 44} ${gx + w * 0.5} ${top - 60} C ${gx + w * 0.7} ${top - 44} ${r} ${top - 40} ${r} ${top} Z`;
      case 'neck':
        return `M ${gx} ${top} L ${gx} ${top - 22} L ${gx + w * 0.34} ${top - 22} L ${gx + w * 0.34} ${top - 50} L ${gx + w * 0.66} ${top - 50} L ${gx + w * 0.66} ${top - 22} L ${r} ${top - 22} L ${r} ${top} Z`;
      default:
        return `M ${gx} ${top} L ${gx + w * 0.5} ${top - 52} L ${r} ${top} Z`;
    }
  };

  return (
    <g aria-hidden>
      {houses.map((h, i) => {
        const gx = x;
        x += h.w;
        const top = -h.h;
        return (
          <g key={i}>
            <rect x={gx} y={top} width={h.w} height={h.h} fill={palette.landmarkFill} />
            <path d={gablePath(gx, h.w, top, h.gable)} fill={palette.landmarkFill} />
            {/* two columns of lit windows */}
            {[0.28, 0.62].map((fx) =>
              [0.18, 0.4, 0.62, 0.82].map((fy) => (
                <rect
                  key={`${fx}-${fy}`}
                  x={gx + h.w * fx}
                  y={top + h.h * fy}
                  width={h.w * 0.16}
                  height={h.h * 0.08}
                  fill={palette.windowWarm}
                  opacity={(i + fy) % 0.5 > 0.2 ? 0.85 : 0.35}
                />
              )),
            )}
          </g>
        );
      })}
    </g>
  );
}
