import { motion } from 'framer-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps, type TimeOfDay } from '../types';
import { WEATHER_PROFILE } from '../weather';

const W = VIEWBOX.w;
const RUN_TOP = LAYOUT.runwayY - 38;

/** How the light should feel: night, low warm sun (dawn, dusk), or high day sun. */
function mood(props: SceneLayerProps): { time: TimeOfDay; warm: number; open: number } {
  const wx = WEATHER_PROFILE[props.weather];
  const baked = props.scene.palette;
  const time: TimeOfDay = props.palette.light === 'moon' ? 'night' : props.timeOfDay ?? (baked === 'dawn' || baked === 'golden' ? 'dusk' : 'day');
  // `open` is how much direct light gets through: thick cloud takes the sun's rays and its wash away.
  return { time, warm: time === 'dawn' || time === 'dusk' ? 1 : time === 'day' ? 0.3 : 0, open: Math.max(0, 1 - wx.cloudCover * 1.1) };
}

/**
 * Soft rays fanning out from the sun through the haze. Drawn right after the sky and BEFORE the landmarks, skyline and
 * ground, so buildings and hills stand in front of them: the rays only show in the gaps, as they would. The sun does
 * not move when the takeoff camera does, so neither do they.
 */
export function SunRays(props: SceneLayerProps) {
  const { palette, idPrefix, ambient, sun } = props;
  const { time, warm, open } = mood(props);
  if (!sun || time === 'night' || open <= 0) return null;
  // Real sunbeams through haze: many narrow shafts of uneven width and strength with uneven gaps, soft-edged, faint
  // near the glare of the sun itself, strongest a little way out and fading long before their ends; a soft bloom
  // sits on the sun. Laid out once per scene from its id, so a city always has the same rays.
  let seed = 2166136261;
  for (let i = 0; i < idPrefix.length; i++) seed = Math.imul(seed ^ idPrefix.charCodeAt(i), 16777619);
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const rays = Array.from({ length: 15 }, (_, i) => {
    // Spread across a wide fan pointing down and away from the sun, never evenly spaced.
    const spread = (i / 14 - 0.5) * 2.5 + (rnd() - 0.5) * 0.16;
    const reach = 1100 + rnd() * 900;
    return {
      x2: sun.x + Math.sin(spread) * reach,
      y2: sun.y + Math.cos(spread) * reach * 0.7,
      w: 18 + rnd() * rnd() * 120, // mostly thin, a few broad
      strength: 0.35 + rnd() * 0.65,
      dur: 9 + rnd() * 9,
    };
  });
  const peak = 0.26 + warm * 0.22;
  return (
    <g aria-hidden style={{ mixBlendMode: 'screen' }} opacity={open * (0.45 + warm * 0.55)}>
      <defs>
        <filter id={`${idPrefix}-raysoft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <radialGradient id={`${idPrefix}-sunbloom`} gradientUnits="userSpaceOnUse" cx={sun.x} cy={sun.y} r={360}>
          <stop offset="0" stopColor={palette.lightColor} stopOpacity={0.42 + warm * 0.2} />
          <stop offset="0.25" stopColor={palette.lightColor} stopOpacity={0.16 + warm * 0.08} />
          <stop offset="1" stopColor={palette.lightColor} stopOpacity="0" />
        </radialGradient>
        {rays.map((r, i) => (
          <linearGradient key={i} id={`${idPrefix}-ray-${i}`} gradientUnits="userSpaceOnUse" x1={sun.x} y1={sun.y} x2={r.x2} y2={r.y2}>
            <stop offset="0" stopColor={palette.lightColor} stopOpacity="0" />
            <stop offset="0.12" stopColor={palette.lightColor} stopOpacity={peak * r.strength} />
            <stop offset="0.55" stopColor={palette.lightColor} stopOpacity={peak * r.strength * 0.45} />
            <stop offset="1" stopColor={palette.lightColor} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <circle cx={sun.x} cy={sun.y} r={360} fill={`url(#${idPrefix}-sunbloom)`} />
      <g filter={`url(#${idPrefix}-raysoft)`}>
        {rays.map((r, i) => {
          const poly = <polygon points={`${sun.x - 2},${sun.y} ${sun.x + 2},${sun.y} ${r.x2 + r.w},${r.y2} ${r.x2 - r.w},${r.y2}`} fill={`url(#${idPrefix}-ray-${i})`} />;
          return ambient ? (
            <motion.g key={i} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: r.dur, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.8 }}>
              {poly}
            </motion.g>
          ) : (
            <g key={i} opacity={0.85}>{poly}</g>
          );
        })}
      </g>
    </g>
  );
}

/**
 * The sun's light on the city, shared by every scene: a warm wash that grows toward the sun, and the buildings
 * settling into the ground with a contact shadow. By night the city's own glow lifts its
 * base. Sits above the city and below the runway; everything fades out as the cloud thickens.
 */
export function CityLighting(props: SceneLayerProps) {
  const { palette, idPrefix, sun } = props;
  const { time, warm, open } = mood(props);
  const night = time === 'night';
  // from the very top of the sky: the wash's glow reaches above the old line at horizon - 400 and left a hard edge
  const top = 0;
  const base = LAYOUT.apronY;

  return (
    <g aria-hidden>
      <defs>
        {sun && (
          <radialGradient id={`${idPrefix}-sunwash`} gradientUnits="userSpaceOnUse" cx={sun.x} cy={LAYOUT.horizonY - 40} r={1500} gradientTransform={`translate(${sun.x} ${LAYOUT.horizonY - 40}) scale(1 0.34) translate(${-sun.x} ${-(LAYOUT.horizonY - 40)})`}>
            <stop offset="0" stopColor={palette.lightColor} stopOpacity="1" />
            <stop offset="0.45" stopColor={palette.lightColor} stopOpacity="0.45" />
            <stop offset="1" stopColor={palette.lightColor} stopOpacity="0" />
          </radialGradient>
        )}
        <linearGradient id={`${idPrefix}-contact`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(8,12,28)" stopOpacity="0" />
          <stop offset="1" stopColor="rgb(8,12,28)" stopOpacity={night ? 0.34 : 0.26} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-citylit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(255,190,110)" stopOpacity="0" />
          <stop offset="1" stopColor="rgb(255,190,110)" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {sun && !night && open > 0 && (
        <>
          {/* A warm wash across the city, strongest on the sun's side; soft-light so it lifts the buildings
              rather than painting over them */}
          <g style={{ mixBlendMode: 'soft-light' }} opacity={open * (0.28 + warm * 0.55)}>
            <rect x="0" y={top} width={W} height={base - top} fill={`url(#${idPrefix}-sunwash)`} />
          </g>
        </>
      )}
      {night && <rect x="0" y={base - 240} width={W} height={240} fill={`url(#${idPrefix}-citylit)`} />}
      {/* Buildings settle into the ground */}
      <rect x="0" y={base - 90} width={W} height={92} fill={`url(#${idPrefix}-contact)`} />
    </g>
  );
}

/**
 * The same light on the ground, drawn by the runway layer: a sun glint across the runway, and at night warm pools
 * under the edge lights (smeared downward when the surface is wet). The glints are skipped while the runway scrolls on takeoff: a spot of light that stayed put under the sun would look as if it followed the plane.
 */
export function GroundLighting(props: SceneLayerProps) {
  const { palette, idPrefix, mode, weather, sun } = props;
  const { time, warm, open } = mood(props);
  const wx = WEATHER_PROFILE[weather];
  const night = time === 'night';
  const wet = wx.rain > 0;
  const lights = mode === 'departure' ? [] : Array.from({ length: Math.ceil((W + 100) / 110) }, (_, i) => 70 + i * 110);

  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={`${idPrefix}-glint`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.lightColor} stopOpacity="1" />
          <stop offset="1" stopColor={palette.lightColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-pool`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(255,184,84)" stopOpacity="0.55" />
          <stop offset="1" stopColor="rgb(255,184,84)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-smear`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(255,196,110)" stopOpacity="0.5" />
          <stop offset="1" stopColor="rgb(255,196,110)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sun (or moon) glint on the runway, under the light in the sky */}
      {sun && mode !== 'departure' && (night || open > 0.2) && !wet && (
        <ellipse cx={sun.x} cy={RUN_TOP + 74} rx={night ? 260 : 340} ry={night ? 28 : 34} fill={`url(#${idPrefix}-glint)`} opacity={night ? 0.22 : open * (0.2 + warm * 0.22)} />
      )}
      {sun && mode !== 'departure' && !night && open > 0.2 && !wet && (
        <ellipse cx={sun.x} cy={LAYOUT.apronY + 34} rx={420} ry={22} fill={`url(#${idPrefix}-glint)`} opacity={open * (0.12 + warm * 0.18)} />
      )}

      {/* Edge lights: a warm pool on the tarmac under each one, and a reflected smear when it's wet */}
      {night &&
        lights.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={RUN_TOP + 24} rx={58} ry={14} fill={`url(#${idPrefix}-pool)`} />
            {wet && <rect x={x - 3.5} y={RUN_TOP + 16} width={7} height={86} fill={`url(#${idPrefix}-smear)`} />}
          </g>
        ))}
    </g>
  );
}
