import { motion } from 'framer-motion';
import { normalizeTerrain } from '../scene-registry';
import { DEP_CITY_LEAD, DEP_ROLL, departureCameraPan } from '../cinematic-motion';
import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { LcYacht } from './lc-yacht';

// A close side-profile airport foreground: destination-specific surroundings
// sit between the city and a deep runway surface that fills the lower frame.
export function RunwayLayer({ scene, palette, idPrefix, ambient, mode, progress }: SceneLayerProps) {
  // Takeoff: the nearest layer (the runway surface paint) scrolls left at the
  // full camera-pan rate, so the dashes/lights stream past = speed. The repeating
  // rows tile seamlessly (modulo their pitch); the one-off threshold keys recede
  // off the left edge. Zero on arrival/static → identical to before.
  const rolling = mode === 'departure';
  const pan = rolling ? departureCameraPan(Math.min(1, Math.max(0, progress))) : 0;
  // Takeoff starts the world shifted right by DEP_CITY_LEAD (plane further back in
  // the city); the threshold keys begin ahead of the plane and recede with the pan.
  // Ground-roll speed ramps to a peak at rotation (DEP_ROLL) then fades — drives
  // faint motion streaks on the tarmac during peak acceleration.
  const prog = Math.min(1, Math.max(0, progress));
  const rollSpeed = rolling ? (prog < DEP_ROLL ? prog / DEP_ROLL : Math.max(0, 1 - (prog - DEP_ROLL) / 0.18)) : 0;
  const terrain = normalizeTerrain(scene.terrain);
  const isDubaiBay = scene.skylineVariant === 'dubai';
  const isHomeBase = scene.skylineVariant === 'homebase';
  const isWaterfront = isDubaiBay || terrain === 'coastal' || terrain === 'island';
  const isDesert = terrain === 'desert';
  const isSnow = !isWaterfront && !isDesert && scene.palette === 'winter';

  const groundId = `${idPrefix}-airport-ground`;
  const waterId = `${idPrefix}-airport-water`;
  const sandId = `${idPrefix}-airport-sand`;
  const snowId = `${idPrefix}-airport-snow`;
  const tarId = `${idPrefix}-tarmac`;

  const surroundingsTop = LAYOUT.apronY;
  const runTop = LAYOUT.runwayY - 38;
  const runBottom = VIEWBOX.h + 80;
  const runH = runBottom - runTop;

  // Center markings on the visible runway, not the off-screen surface extension.
  // The threshold occupies a reserved gap so its bars never cross a center dash.
  const centerlineY = runTop + (VIEWBOX.h - runTop) / 2;
  const thresholdX = BLEED_X + 24;
  const thresholdEndX = thresholdX + 128;
  // Centerline dashes. On the takeoff roll they become a continuous tiled row
  // (the threshold gap recedes with the threshold itself) scrolled by pan % pitch.
  const DASH_PITCH = 120;
  const dashes = rolling
    ? Array.from({ length: Math.ceil((VIEWBOX.w + 2 * DASH_PITCH) / DASH_PITCH) }, (_, i) => -DASH_PITCH + i * DASH_PITCH)
    : Array.from({ length: Math.ceil((VIEWBOX.w + 100) / DASH_PITCH) }, (_, i) => 60 + i * DASH_PITCH).filter(
        (x) => x + 72 < thresholdX - 12 || x > thresholdEndX + 12,
      );
  const dashScrollX = rolling ? -(pan % DASH_PITCH) : 0;
  const thresholdBars = [
    { y: runTop + 31, width: 78, height: 7 },
    { y: runTop + 52, width: 86, height: 8 },
    { y: runTop + 75, width: 96, height: 9 },
    { y: centerlineY + 26, width: 104, height: 10 },
    { y: centerlineY + 53, width: 114, height: 11 },
    { y: centerlineY + 82, width: 126, height: 12 },
  ];
  const lightY = runTop + 11;
  const LIGHT_PITCH = 110;
  const lights = rolling
    ? Array.from({ length: Math.ceil((VIEWBOX.w + 2 * LIGHT_PITCH) / LIGHT_PITCH) }, (_, i) => -LIGHT_PITCH + i * LIGHT_PITCH)
    : Array.from({ length: Math.ceil((VIEWBOX.w + 100) / LIGHT_PITCH) }, (_, i) => 70 + i * LIGHT_PITCH);
  const lightScrollX = rolling ? -(pan % LIGHT_PITCH) : 0;

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.terrainTop} />
          <stop offset="1" stopColor={palette.terrainBottom} />
        </linearGradient>
        <linearGradient id={waterId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={isDubaiBay ? '#65aeba' : palette.waterTop} />
          <stop offset="1" stopColor={isDubaiBay ? '#316f82' : palette.waterBottom} />
        </linearGradient>
        <linearGradient id={sandId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={isDubaiBay ? '#d8bc7c' : palette.terrainTop} />
          <stop offset="1" stopColor={isDubaiBay ? '#9f7542' : palette.terrainBottom} />
        </linearGradient>
        <linearGradient id={snowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9eff5" />
          <stop offset="1" stopColor="#b6c3d2" />
        </linearGradient>
        <linearGradient id={tarId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#333d49" />
          <stop offset="0.5" stopColor="#222a35" />
          <stop offset="1" stopColor="#111720" />
        </linearGradient>
      </defs>

      {/* Destination-aware approach zone between the skyline and runway. */}
      {isWaterfront ? (
        <>
          <rect x="-200" y={surroundingsTop} width={VIEWBOX.w + 400} height={runTop - surroundingsTop} fill={`url(#${waterId})`} />
          <path
            d={`M-200 ${surroundingsTop + 18} C220 ${surroundingsTop + 8} 430 ${surroundingsTop + 30} 760 ${surroundingsTop + 17} S1320 ${surroundingsTop + 9} 1700 ${surroundingsTop + 21} S2450 ${surroundingsTop + 6} 3080 ${surroundingsTop + 18}`}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={2}
          />
          <path
            d={`M-200 ${runTop - 13} C180 ${runTop - 26} 420 ${runTop - 7} 770 ${runTop - 17} S1400 ${runTop - 29} 1780 ${runTop - 13} S2480 ${runTop - 25} 3080 ${runTop - 14} L3080 ${runTop} L-200 ${runTop} Z`}
            fill={`url(#${sandId})`}
            opacity={isDubaiBay ? 0.76 : 0.72}
          />
          {/* LessonCaptain yacht moored in the home-base bay, set back toward the
              city shore (near the top of the water band). */}
          {isHomeBase && (
            <LcYacht
              cx={BLEED_X + CONTENT_W * 0.6}
              waterY={surroundingsTop + (runTop - surroundingsTop) * 0.3}
              scale={1.05}
              ambient={ambient}
              warm={palette.windowWarm}
              isNight={palette.light === 'moon'}
            />
          )}
        </>
      ) : (
        <rect x="-200" y={surroundingsTop} width={VIEWBOX.w + 400} height={runTop - surroundingsTop} fill={isDesert ? `url(#${sandId})` : isSnow ? `url(#${snowId})` : `url(#${groundId})`} />
      )}

      {isSnow && (
        <g>
          {/* settled snow drift along the runway edge + a faint surface ripple */}
          <path d={`M-200 ${runTop - 12} Q300 ${runTop - 26} 760 ${runTop - 14} T1700 ${runTop - 16} T3080 ${runTop - 13} L3080 ${runTop} L-200 ${runTop} Z`} fill="#f3f7fb" opacity={0.78} />
          <path d={`M-200 ${surroundingsTop + 22} Q400 ${surroundingsTop + 12} 900 ${surroundingsTop + 24} T1900 ${surroundingsTop + 18} T3080 ${surroundingsTop + 20}`} fill="none" stroke="rgba(150,172,196,0.45)" strokeWidth={2} />
        </g>
      )}

      {isDubaiBay && (
        <g transform={`translate(${BLEED_X},0)`}>
          {/* Stylized offshore islands and sandy headlands in Dubai's bay. */}
          <path d={`M60 ${runTop - 10} C120 ${runTop - 48} 245 ${runTop - 47} 322 ${runTop - 13} C244 ${runTop - 22} 141 ${runTop - 20} 60 ${runTop - 10} Z`} fill={`url(#${sandId})`} />
          <path d={`M1190 ${runTop - 12} C1268 ${runTop - 52} 1415 ${runTop - 49} 1542 ${runTop - 11} C1434 ${runTop - 23} 1314 ${runTop - 22} 1190 ${runTop - 12} Z`} fill={`url(#${sandId})`} />
          <path
            d={`M695 ${runTop - 15} C745 ${runTop - 47} 852 ${runTop - 50} 909 ${runTop - 18} C855 ${runTop - 27} 756 ${runTop - 25} 695 ${runTop - 15} Z`}
            fill="#d9bd7d"
            opacity={0.86}
          />
          <path d={`M725 ${runTop - 30} Q803 ${runTop - 55} 881 ${runTop - 31}`} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
        </g>
      )}

      {isDesert && !isDubaiBay && (
        <g opacity={0.38}>
          <path d={`M-200 ${runTop - 31} Q250 ${surroundingsTop + 12} 650 ${runTop - 25} T1500 ${runTop - 28} T2350 ${runTop - 24} T3080 ${runTop - 30}`} fill="none" stroke="#f2d49b" strokeWidth={3} />
          <path d={`M-200 ${runTop - 13} Q320 ${surroundingsTop + 34} 900 ${runTop - 15} T2050 ${runTop - 16} T3080 ${runTop - 12}`} fill="none" stroke="#7d5937" strokeWidth={2} />
        </g>
      )}

      {/* Deep close-up runway surface. */}
      <rect x="-200" y={runTop} width={VIEWBOX.w + 400} height={runH} fill={`url(#${tarId})`} />
      <rect x="-200" y={runTop} width={VIEWBOX.w + 400} height={3} fill="rgba(0,0,0,0.35)" />
      <rect x="-200" y={runTop + 7} width={VIEWBOX.w + 400} height={4} fill="rgba(255,255,255,0.52)" />
      <rect x="-200" y={runTop + 17} width={VIEWBOX.w + 400} height={1} fill="rgba(255,255,255,0.08)" />

      {/* Shallow trapezoids make the paint feel laid onto the runway surface. */}
      <g transform={`translate(${dashScrollX},0)`}>
        {dashes.map((x) => (
          <path
            key={x}
            d={`M${x + 4} ${centerlineY - 3} H${x + 62} L${x + 68} ${centerlineY + 4} H${x} Z`}
            fill="rgba(255,255,255,0.62)"
          />
        ))}
      </g>

      {/* Motion streaks during peak acceleration — faint speed blur on the tarmac. */}
      {rollSpeed > 0.05 && (
        <g opacity={rollSpeed * 0.5} aria-hidden>
          {[0.16, 0.34, 0.52, 0.7, 0.86].map((fy, i) => (
            <rect key={i} x="-200" y={runTop + 22 + (VIEWBOX.h + 40 - runTop) * fy} width={VIEWBOX.w + 400} height={1.4} fill="rgba(255,255,255,0.18)" />
          ))}
        </g>
      )}

      {/* Threshold keys grow toward the camera and leave the center axis clear.
          On takeoff they START ahead of the plane (behind-the-crosswalk line-up)
          and recede with the rest of the ground (off the left edge). */}
      <g transform={rolling ? `translate(${DEP_CITY_LEAD - pan},0)` : undefined}>
        {thresholdBars.map(({ y, width, height }) => (
          <path
            key={y}
            d={`M${thresholdX + 3} ${y} H${thresholdX + width - 4} L${thresholdX + width} ${y + height} H${thresholdX} Z`}
            fill="rgba(255,255,255,0.82)"
          />
        ))}
      </g>

      {/* Far-edge runway lights. */}
      <g transform={`translate(${lightScrollX},0)`}>
        {lights.map((x, i) =>
          ambient ? (
            <motion.circle
              key={x}
              cx={x}
              cy={lightY}
              r={3.4}
              fill="#FFB347"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.18 }}
            />
          ) : (
            <circle key={x} cx={x} cy={lightY} r={3.4} fill="#FFB347" opacity={0.8} />
          ),
        )}
      </g>
    </g>
  );
}
