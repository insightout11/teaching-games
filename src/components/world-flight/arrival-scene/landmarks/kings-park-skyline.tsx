import type { LandmarkLayerProps } from '../types';

// Perth downtown cluster as seen from Kings Park — midground slot. A tight knot
// of towers of varied heights. Base-center origin, built upward.
export function KingsParkSkylineLandmark({ palette }: LandmarkLayerProps) {
  const facades = [
    'rgb(67,112,138)',
    'rgb(174,131,90)',
    'rgb(58,95,126)',
    'rgb(80,132,147)',
    'rgb(68,106,136)',
    'rgb(188,139,92)',
  ];
  const shade = 'rgba(22,42,60,0.42)';
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
        const facade = facades[i];
        return (
          <g key={i}>
            <rect x={gx} y={top} width={t.w} height={t.h} fill={facade} />
            <rect x={gx + t.w * 0.58} y={top} width={t.w * 0.42} height={t.h} fill={shade} />
            <rect x={gx + 5} y={top + 4} width={3} height={t.h - 8} fill="rgba(210,232,238,0.35)" />
            {t.top === 'pitch' && <polygon points={`${gx} ${top}, ${gx + t.w / 2} ${top - 22}, ${gx + t.w} ${top}`} fill={facade} />}
            {t.top === 'mast' && <rect x={gx + t.w / 2 - 2} y={top - 40} width={4} height={40} fill={facade} />}
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
