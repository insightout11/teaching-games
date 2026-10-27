import type { ReactNode } from 'react';
import { normalizeTerrain } from '../scene-registry';
import { LAYOUT, VIEWBOX, type ScenePalette } from '../types';
import type { DestinationScene } from '@/lib/world-flight/types';

// Water reflections (Oct 2026, gallery first). The city across the water, mirrored and softened: the classic travel-
// poster move. Only where a scene has water in front of the city: the waterfront bays (coastal, island, Dubai), the
// Amsterdam canal, and a river band for the river cities (the Seine, the Sumida, the Thames...).

const RUN_TOP = LAYOUT.runwayY - 38;
/** Cities whose centre sits on a river, so the approach band in front of them is drawn as that river. */
const RIVER_CITIES = new Set(['paris', 'tokyo', 'london', 'seoul', 'bangkok', 'shanghai', 'budapest', 'prague']);

export interface WaterBand {
  top: number;
  bottom: number;
  /** True when the scene has no water of its own there, so the band draws the river too. */
  river: boolean;
}

export function waterBand(scene: DestinationScene): WaterBand | null {
  const terrain = normalizeTerrain(scene.terrain);
  if (scene.skylineVariant === 'dubai' || terrain === 'coastal' || terrain === 'island') {
    return { top: LAYOUT.apronY, bottom: RUN_TOP - 16, river: false };
  }
  if (scene.skylineVariant === 'amsterdam') return { top: LAYOUT.apronY, bottom: LAYOUT.apronY + 36, river: false };
  if (scene.skylineVariant && RIVER_CITIES.has(scene.skylineVariant)) {
    return { top: LAYOUT.apronY, bottom: LAYOUT.apronY + 50, river: true };
  }
  return null;
}

/** How tall the mirrored city is compared with the real one: shorter reads as distance and soft water. */
const SQUASH = 0.5;

/**
 * Draws inside the runway layer, right after the water surface and before the boats and islands, so those stay on top.
 * `children` is the city drawn again (skyline, landmark, distant bleed city), already moved to match the real one.
 */
export function ReflectionLayer({ band, palette, idPrefix, ambient, children }: {
  band: WaterBand;
  palette: ScenePalette;
  idPrefix: string;
  ambient: boolean;
  children: ReactNode;
}) {
  const { top, bottom, river } = band;
  const h = bottom - top;
  const night = palette.light === 'moon';
  // The mirror line sits just under the shore, where the city's foot meets the water.
  const axis = top + 6;
  const id = `${idPrefix}-rf`;
  return (
    <g aria-hidden>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={-200} y={top} width={VIEWBOX.w + 400} height={h} />
        </clipPath>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.waterTop} />
          <stop offset="1" stopColor={palette.waterBottom} />
        </linearGradient>
        {/* The reflection is clearest at the shore and fades into the water further out. */}
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.waterTop} stopOpacity={0} />
          <stop offset="0.6" stopColor={palette.waterBottom} stopOpacity={0.25} />
          <stop offset="1" stopColor={palette.waterBottom} stopOpacity={0.6} />
        </linearGradient>
        {/* Thin calm lines of water across the mirrored city: the ripples that break a reflection up. */}
        <pattern id={`${id}-ripple`} x="0" y={top} width="64" height="7" patternUnits="userSpaceOnUse">
          <rect x="0" y="4.6" width="64" height="1.2" fill={palette.waterBottom} opacity={0.55} />
          <rect x="22" y="1.4" width="30" height="1" fill={palette.waterTop} opacity={0.45} />
        </pattern>
      </defs>
      {river && (
        <>
          <rect x={-200} y={top} width={VIEWBOX.w + 400} height={h} fill={`url(#${id}-water)`} />
          {/* The quay on the city side, and the bank on ours */}
          <rect x={-200} y={top} width={VIEWBOX.w + 400} height={3} fill={palette.buildingSilhouette} opacity={0.55} />
          <rect x={-200} y={bottom - 2} width={VIEWBOX.w + 400} height={3} fill={palette.terrainTop} opacity={0.9} />
        </>
      )}
      <g clipPath={`url(#${id}-clip)`}>
        <g opacity={night ? 0.8 : 0.55}>
          <g transform={`translate(0 ${axis * (1 + SQUASH)}) scale(1 ${-SQUASH})`}>{children}</g>
        </g>
        <rect x={-200} y={top} width={VIEWBOX.w + 400} height={h} fill={`url(#${id}-fade)`} />
        <rect x={-200} y={top} width={VIEWBOX.w + 400} height={h} fill={`url(#${id}-ripple)`} />
        {/* A few slow light glints drifting along the water */}
        <g className={ambient ? 'lc-rf-glint' : undefined}>
          {[0.12, 0.31, 0.47, 0.66, 0.83].map((f, i) => (
            <rect
              key={i}
              x={VIEWBOX.w * f}
              y={top + h * (0.3 + 0.13 * (i % 3))}
              width={50 + 22 * (i % 3)}
              height={1.4}
              rx={0.7}
              fill={night ? palette.windowWarm : '#ffffff'}
              opacity={night ? 0.5 : 0.35}
            />
          ))}
        </g>
      </g>
      {ambient && <style>{'@keyframes lc-rf-glint{0%,100%{transform:translateX(-18px)}50%{transform:translateX(18px)}}.lc-rf-glint{animation:lc-rf-glint 9s ease-in-out infinite}'}</style>}
    </g>
  );
}
