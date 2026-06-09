import { VIEWBOX, type LandmarkLayerProps, type LandmarkRegistryEntry } from '../types';

// Renders one landmark registry entry, applying its placement (anchorX, baseY,
// scale, opacity). The landmark component itself only draws around a base-center
// local origin — all positioning lives here / in the registry.
//
// Foreground & midground landmarks get a soft backlight halo so the silhouette
// always separates from the city behind it (otherwise a dark monument on a dark
// night/tropical skyline disappears). Distant background landmarks skip the halo
// so they stay reading as far away.
export function LandmarkLayer({
  entry,
  ...props
}: { entry: LandmarkRegistryEntry } & LandmarkLayerProps) {
  const Landmark = entry.component;
  const { palette, idPrefix } = props;
  const x = entry.anchorX * VIEWBOX.w;
  const halo = entry.depth !== 'background';
  const haloId = `${idPrefix}-lmk-halo`;
  const haloColor = palette.light === 'moon' ? 'rgba(150,196,255,0.85)' : 'rgba(255,242,210,0.7)';

  return (
    <g
      transform={`translate(${x} ${entry.baseY}) scale(${entry.scale})`}
      opacity={entry.opacity ?? 1}
      aria-hidden
    >
      {halo && (
        <defs>
          <filter id={haloId} x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={haloColor} floodOpacity="0.85" />
          </filter>
        </defs>
      )}
      <g filter={halo ? `url(#${haloId})` : undefined}>
        <Landmark {...props} />
      </g>
    </g>
  );
}
