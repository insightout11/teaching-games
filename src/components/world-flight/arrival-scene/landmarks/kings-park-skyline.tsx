import type { LandmarkLayerProps } from '../types';

// Perth downtown cluster as seen from Kings Park — midground slot. A tight knot
// of towers of varied heights. Base-center origin, built upward.
export function KingsParkSkylineLandmark({ palette }: LandmarkLayerProps) {
  const towers = [
    { x: -180, w: 56, h: 200, top: 'flat' },
    { x: -120, w: 64, h: 300, top: 'pitch' },
    { x: -52, w: 50, h: 250, top: 'flat' },
    { x: 0, w: 72, h: 360, top: 'mast' },
    { x: 78, w: 58, h: 280, top: 'flat' },
    { x: 140, w: 60, h: 224, top: 'pitch' },
  ] as const;
  return (
    <g aria-hidden>
      {towers.map((t, i) => {
        const gx = t.x;
        const top = -t.h;
        return (
          <g key={i}>
            <rect x={gx} y={top} width={t.w} height={t.h} fill={palette.landmarkFill} />
            {t.top === 'pitch' && <polygon points={`${gx} ${top}, ${gx + t.w / 2} ${top - 22}, ${gx + t.w} ${top}`} fill={palette.landmarkFill} />}
            {t.top === 'mast' && <rect x={gx + t.w / 2 - 2} y={top - 40} width={4} height={40} fill={palette.landmarkFill} />}
            {/* window grid */}
            {Array.from({ length: Math.floor(t.h / 26) }).map((_, r) =>
              [0.2, 0.5, 0.8].map((fx) => (
                <rect
                  key={`${r}-${fx}`}
                  x={gx + t.w * fx - 4}
                  y={top + 14 + r * 26}
                  width={8}
                  height={10}
                  fill={(i + r) % 3 === 0 ? palette.windowWarm : palette.windowCool}
                  opacity={(i + r) % 2 === 0 ? 0.7 : 0.3}
                />
              )),
            )}
          </g>
        );
      })}
    </g>
  );
}
