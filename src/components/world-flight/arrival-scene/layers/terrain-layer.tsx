import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { normalizeTerrain } from '../scene-registry';
import { randRange } from '../seed';

// Distant land/horizon backdrop sitting BEHIND the city, in the strip just above
// the airfield (≈horizonY → apronY). Six terrain variants. The airfield ground
// itself is drawn by the runway layer.
//
// Split into TWO layers so the cinematic camera can treat them correctly:
//   • TerrainBaseLayer — the flat base colour band(s), full-canvas + FIXED. A flat
//     vertical gradient has no horizontal reference, so it must NOT pan on takeoff
//     (and stays pixel-identical in the focal zone on any width).
//   • TerrainSilhouetteLayer — the distinctive SILHOUETTES (hills, dunes, island,
//     headland, ridgelines, water glints), drawn in focal (CONTENT_W) space. The
//     composer wraps it in focalAt(depth) so it pans with the rest of the world on
//     takeoff and picks up the same restrained 2.5D parallax on arrival.
// Both share the gradient <defs> ids (same idPrefix) defined by the base layer.

const TOP = LAYOUT.horizonY;
const BASE = LAYOUT.apronY + 24; // overlap slightly under the field
const WATER_BOTTOM = TOP + 12; // distant sea ribbon thickness

// ── Base: flat colour bands, full-canvas, fixed ─────────────────────────────
export function TerrainBaseLayer({ scene, palette, idPrefix }: SceneLayerProps) {
  const terrain = normalizeTerrain(scene.terrain);
  const gId = `${idPrefix}-terrain`;
  const wId = `${idPrefix}-water`;

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
  const baseBand = (fill: string, y: number = TOP) => (
    <rect x={-40} y={y} width={VIEWBOX.w + 80} height={BASE - y} fill={fill} />
  );

  if (terrain === 'coastal' || terrain === 'island') {
    // The sea is only a thin distant line at the very horizon; a land band fills
    // the rest of the strip so the city stands on SHORE on solid ground. Both
    // bands are full-canvas, so the bleed seam stays continuous on wide windows.
    return (
      <g aria-hidden>
        {Defs}
        <rect x={-40} y={TOP} width={VIEWBOX.w + 80} height={WATER_BOTTOM - TOP} fill={`url(#${wId})`} />
        <rect x={-40} y={WATER_BOTTOM} width={VIEWBOX.w + 80} height={BASE - WATER_BOTTOM} fill={`url(#${gId})`} />
      </g>
    );
  }

  if (terrain === 'mountain') {
    // Hills only (in the silhouette layer) — no full-width base band: the margins
    // read like the centre (distant bleed skyline + grass + sky gaps).
    return <g aria-hidden>{Defs}</g>;
  }

  if (terrain === 'desert') {
    return (
      <g aria-hidden>
        {Defs}
        {baseBand(`url(#${gId})`)}
      </g>
    );
  }

  // flatland / urban — low ground plane
  return (
    <g aria-hidden>
      {Defs}
      {baseBand(`url(#${gId})`, TOP + 18)}
    </g>
  );
}

// ── Silhouettes: focal space, pannable (composer wraps in focalAt(depth)) ────
// Drawn across the FULL canvas (focal + both bleed margins) so the scene's own
// landforms — hills, mountains, coastline, dunes — continue into the widescreen
// overflow instead of leaving the side margins flat behind the distant city.
const SIL_L = -BLEED_X - 40;
const SIL_R = CONTENT_W + BLEED_X + 40;
const SIL_MID = (SIL_L + SIL_R) / 2;

export function TerrainSilhouetteLayer({ scene, rand, idPrefix }: SceneLayerProps) {
  const terrain = normalizeTerrain(scene.terrain);
  const gId = `${idPrefix}-terrain`;

  // A row of distant hills as a single path across the whole canvas.
  const hills = (amp: number, n: number) => {
    let d = `M ${SIL_L} ${BASE} L ${SIL_L} ${TOP + 10}`;
    const span = (SIL_R - SIL_L) / n;
    for (let i = 0; i <= n; i += 1) {
      const x = SIL_L + i * span;
      const peak = TOP + 10 - randRange(rand, amp * 0.3, amp);
      d += ` Q ${x - span / 2} ${peak} ${x} ${TOP + 10}`;
    }
    d += ` L ${SIL_R} ${BASE} Z`;
    return d;
  };

  if (terrain === 'coastal' || terrain === 'island') {
    return (
      <g aria-hidden>
        {/* sun/sky glints on the sea ribbon (across the full bay) */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect
            key={i}
            x={randRange(rand, SIL_L + 80, SIL_R - 160)}
            y={TOP + randRange(rand, 2, 9)}
            width={randRange(rand, 30, 90)}
            height={2}
            fill="rgba(255,255,255,0.25)"
          />
        ))}
        {terrain === 'island' ? (
          <path
            d={`M ${CONTENT_W * 0.5} ${WATER_BOTTOM} Q ${CONTENT_W * 0.74} ${TOP - 22} ${SIL_R} ${WATER_BOTTOM} Z`}
            fill={`url(#${gId})`}
            opacity={0.95}
          />
        ) : (
          <path
            d={`M ${SIL_L} ${WATER_BOTTOM} Q ${CONTENT_W * 0.3} ${TOP - 10} ${CONTENT_W * 0.62} ${WATER_BOTTOM} T ${SIL_R} ${WATER_BOTTOM} Z`}
            fill={`url(#${gId})`}
            opacity={0.9}
          />
        )}
      </g>
    );
  }

  if (terrain === 'mountain') {
    // Higher hill counts keep the ridge size consistent across the wider span.
    return (
      <g aria-hidden>
        <path d={hills(120, 11)} fill={`url(#${gId})`} opacity={0.85} />
        <path d={hills(78, 16)} fill={`url(#${gId})`} />
      </g>
    );
  }

  if (terrain === 'desert') {
    return (
      <g aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <path
            key={i}
            d={`M ${SIL_L} ${TOP + 16 + i * 12} Q ${randRange(rand, SIL_L + 240, SIL_MID)} ${TOP + 2 + i * 12} ${SIL_MID} ${TOP + 14 + i * 12} T ${SIL_R} ${TOP + 16 + i * 12}`}
            fill="none"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth={3}
          />
        ))}
      </g>
    );
  }

  // flatland / urban — faint ridge
  return (
    <g aria-hidden>
      <path
        d={`M ${SIL_L} ${TOP + 20} Q ${SIL_MID} ${TOP + (terrain === 'urban' ? 4 : 12)} ${SIL_R} ${TOP + 20}`}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={3}
      />
    </g>
  );
}
