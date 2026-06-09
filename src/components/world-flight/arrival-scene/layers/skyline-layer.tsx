import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { normalizeSkyline } from '../scene-registry';
import { randInt, randRange } from '../seed';

// City skyline behind the airfield. Four families (low / dense / highrise /
// historic). Buildings stand on a baseline just below the field top, so the
// later-drawn grass field occludes their bases and they read as "behind town".
export function SkylineLayer({ scene, palette, rand, idPrefix }: SceneLayerProps) {
  const family = normalizeSkyline(scene.skyline);
  const base = LAYOUT.apronY + 12;
  const isMoon = palette.light === 'moon';

  const ranges: Record<string, { wMin: number; wMax: number; hMin: number; hMax: number; gap: number }> = {
    low: { wMin: 70, wMax: 130, hMin: 36, hMax: 84, gap: 10 },
    dense: { wMin: 34, wMax: 62, hMin: 70, hMax: 190, gap: 4 },
    highrise: { wMin: 54, wMax: 92, hMin: 150, hMax: 330, gap: 16 },
    historic: { wMin: 78, wMax: 140, hMin: 70, hMax: 150, gap: 8 },
  };
  const r = ranges[family];

  // window emitter
  const windows = (x: number, w: number, h: number, top: number) => {
    const cols = Math.max(1, Math.floor(w / 16));
    const rows = Math.max(1, Math.floor(h / 22));
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < cols; c += 1) {
      for (let rw = 0; rw < rows; rw += 1) {
        if (rand() > (isMoon ? 0.45 : 0.7)) continue;
        cells.push(
          <rect
            key={`${c}-${rw}`}
            x={x + 6 + c * (w / cols)}
            y={top + 8 + rw * (h / rows)}
            width={Math.max(3, w / cols - 6)}
            height={Math.max(3, h / rows - 8)}
            fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
            opacity={isMoon ? 0.85 : 0.4}
          />,
        );
      }
    }
    return cells;
  };

  const buildings: React.ReactNode[] = [];
  let x = -50;
  let key = 0;
  while (x < VIEWBOX.w + 50) {
    const w = randRange(rand, r.wMin, r.wMax);
    const h = randRange(rand, r.hMin, r.hMax);
    const top = base - h;
    buildings.push(
      <g key={key}>
        <rect x={x} y={top} width={w} height={h} fill={palette.buildingSilhouette} />
        {/* family-specific rooflines */}
        {family === 'highrise' && rand() > 0.6 && (
          <rect x={x + w / 2 - 2} y={top - randInt(rand, 10, 34)} width={4} height={34} fill={palette.buildingSilhouette} />
        )}
        {family === 'historic' && (rand() > 0.5
          ? <polygon points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 16, 34)}, ${x + w} ${top}`} fill={palette.buildingSilhouette} />
          : <ellipse cx={x + w / 2} cy={top} rx={w / 2.4} ry={randRange(rand, 14, 28)} fill={palette.buildingSilhouette} />)}
        {windows(x, w, h, top)}
      </g>,
    );
    x += w + r.gap;
    key += 1;
  }

  return (
    <g aria-hidden data-skyline={family} data-id={idPrefix}>
      {buildings}
    </g>
  );
}
