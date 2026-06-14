import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { normalizeTerrain } from '../scene-registry';
import { randRange } from '../seed';

// Distant land/horizon backdrop sitting BEHIND the city, in the strip just above
// the airfield (≈horizonY → apronY). Six terrain variants. The airfield ground
// itself is drawn by the runway layer.
//
// Wide-canvas split: the flat base color band fills the FULL canvas (so the
// horizon strip never gaps in the side bleed), while the distinctive SILHOUETTES
// (hills, dunes, island, headland, ridgelines, water glints) stay in the centered
// focal zone (CONTENT_W, offset by BLEED_X) so the 16:9 view is pixel-identical.
export function TerrainLayer({ scene, palette, rand, idPrefix }: SceneLayerProps) {
  const terrain = normalizeTerrain(scene.terrain);
  const gId = `${idPrefix}-terrain`;
  const wId = `${idPrefix}-water`;
  const top = LAYOUT.horizonY;
  const base = LAYOUT.apronY + 24; // overlap slightly under the field
  const focal = `translate(${BLEED_X},0)`;

  const Defs = (
    <defs>
      <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.terrainTop} />
        <stop offset="1" stopColor={palette.terrainBottom} />
      </linearGradient>
      <linearGradient id={wId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.waterTop} />
        <stop offset="1" stopColor={palette.waterBottom} />
      </linearGradient>
    </defs>
  );

  // Full-canvas base band — fills the horizon strip edge-to-edge (incl. bleed).
  // x-uniform vertical gradient, so widening it is pixel-identical in the focal zone.
  const baseBand = (fill: string, y: number = top) => (
    <rect x={-40} y={y} width={VIEWBOX.w + 80} height={base - y} fill={fill} />
  );

  // helper: a row of distant hills as a single path, in FOCAL (CONTENT_W) space.
  const hills = (amp: number, n: number) => {
    let d = `M -40 ${base} L -40 ${top + 10}`;
    const span = (CONTENT_W + 80) / n;
    for (let i = 0; i <= n; i += 1) {
      const x = -40 + i * span;
      const peak = top + 10 - randRange(rand, amp * 0.3, amp);
      d += ` Q ${x - span / 2} ${peak} ${x} ${top + 10}`;
    }
    d += ` L ${CONTENT_W + 40} ${base} Z`;
    return d;
  };

  if (terrain === 'coastal' || terrain === 'island') {
    // The sea is only a thin distant line at the very horizon; a land band fills
    // the rest of the strip so the city stands on SHORE on solid ground, with the
    // water reading as far behind it (not a band at the building bases). Both
    // bands are full-canvas, so the bleed seam stays continuous on wide windows.
    const waterBottomY = top + 12;
    return (
      <g aria-hidden>
        {Defs}
        {/* distant sea ribbon — full canvas */}
        <rect x={-40} y={top} width={VIEWBOX.w + 80} height={waterBottomY - top} fill={`url(#${wId})`} />
        {/* shore/land the city sits on — full canvas, in front of the sea */}
        <rect x={-40} y={waterBottomY} width={VIEWBOX.w + 80} height={base - waterBottomY} fill={`url(#${gId})`} />
        <g transform={focal}>
          {/* sun/sky glints on the sea ribbon (focal) */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x={randRange(rand, 60, CONTENT_W - 120)}
              y={top + randRange(rand, 2, 9)}
              width={randRange(rand, 30, 90)}
              height={2}
              fill="rgba(255,255,255,0.25)"
            />
          ))}
          {terrain === 'island' ? (
            // a low island headland rising from the sea ribbon to one side
            <path
              d={`M ${CONTENT_W * 0.5} ${waterBottomY} Q ${CONTENT_W * 0.74} ${top - 22} ${CONTENT_W + 40} ${waterBottomY} Z`}
              fill={`url(#${gId})`}
              opacity={0.95}
            />
          ) : (
            // a low far headland peeking above the waterline
            <path
              d={`M -40 ${waterBottomY} Q ${CONTENT_W * 0.3} ${top - 10} ${CONTENT_W * 0.62} ${waterBottomY} T ${CONTENT_W + 40} ${waterBottomY} Z`}
              fill={`url(#${gId})`}
              opacity={0.9}
            />
          )}
        </g>
      </g>
    );
  }

  if (terrain === 'mountain') {
    // Hills only (focal) — no full-width base band: the margins read like the
    // center (distant bleed skyline + grass + sky gaps), so a land tint here would
    // only alter the pixel-identical focal zone behind the peaks.
    return (
      <g aria-hidden>
        {Defs}
        <g transform={focal}>
          <path d={hills(120, 6)} fill={`url(#${gId})`} opacity={0.85} />
          <path d={hills(78, 9)} fill={`url(#${gId})`} />
        </g>
      </g>
    );
  }

  if (terrain === 'desert') {
    return (
      <g aria-hidden>
        {Defs}
        {/* sand — full canvas */}
        {baseBand(`url(#${gId})`)}
        <g transform={focal}>
          {/* soft dune ridgelines (focal) */}
          {Array.from({ length: 3 }).map((_, i) => (
            <path
              key={i}
              d={`M -40 ${top + 16 + i * 12} Q ${randRange(rand, 300, 700)} ${top + 2 + i * 12} ${CONTENT_W / 2} ${top + 14 + i * 12} T ${CONTENT_W + 40} ${top + 16 + i * 12}`}
              fill="none"
              stroke="rgba(0,0,0,0.10)"
              strokeWidth={3}
            />
          ))}
        </g>
      </g>
    );
  }

  // flatland / urban — low ground plane with a faint ridge
  return (
    <g aria-hidden>
      {Defs}
      {/* ground — full canvas */}
      {baseBand(`url(#${gId})`, top + 18)}
      <g transform={focal}>
        <path
          d={`M -40 ${top + 20} Q ${CONTENT_W / 2} ${top + (terrain === 'urban' ? 4 : 12)} ${CONTENT_W + 40} ${top + 20}`}
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={3}
        />
      </g>
    </g>
  );
}
