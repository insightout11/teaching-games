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
  const isAmsterdam = scene.skylineVariant === 'amsterdam';
  const isSingapore = scene.skylineVariant === 'singapore';
  const isWaterfront = isDubaiBay || terrain === 'coastal' || terrain === 'island';
  const isDesert = terrain === 'desert';
  const isSnow = !isWaterfront && !isDesert && scene.palette === 'winter';

  const groundId = `${idPrefix}-airport-ground`;
  const waterId = `${idPrefix}-airport-water`;
  const sandId = `${idPrefix}-airport-sand`;
  const snowId = `${idPrefix}-airport-snow`;
  const canalId = `${idPrefix}-canal`;
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

  // Amsterdam: a canal + quayside road with animated cyclists, filling the
  // approach band in front of the canal houses (replaces the plain grass apron).
  const canalTop = surroundingsTop;
  const canalBot = surroundingsTop + 36;
  const isNightAms = palette.light === 'moon';
  const cyc = 'rgba(26,28,38,0.92)';
  const warm = 'rgba(255,206,120,0.92)';
  const Cyclist = ({ y, dir }: { y: number; dir: number }) => (
    <g transform={dir < 0 ? 'scale(-1,1)' : undefined}>
      <circle cx={-7} cy={y} r={4.6} fill="none" stroke={cyc} strokeWidth={1.6} />
      <circle cx={7} cy={y} r={4.6} fill="none" stroke={cyc} strokeWidth={1.6} />
      <path d={`M -7 ${y} L -1 ${y - 9} L 7 ${y} M -1 ${y - 9} L 3 ${y}`} stroke={cyc} strokeWidth={1.5} fill="none" />
      <line x1={-1} y1={y - 9} x2={-2} y2={y - 18} stroke={cyc} strokeWidth={2.4} />
      <circle cx={-2} cy={y - 21} r={2.9} fill={cyc} />
      <path d={`M -2 ${y - 16} L -6 ${y - 10}`} stroke={cyc} strokeWidth={1.5} fill="none" />
    </g>
  );
  const ry = runTop - 7;
  const riders = [
    { from: -140, to: VIEWBOX.w + 140, dur: 17, delay: 0, dir: 1, y: ry },
    { from: -140, to: VIEWBOX.w + 140, dur: 13, delay: 5.5, dir: 1, y: ry + 3 },
    { from: VIEWBOX.w + 140, to: -140, dur: 19, delay: 2.5, dir: -1, y: ry - 2 },
    { from: VIEWBOX.w + 140, to: -140, dur: 15, delay: 9, dir: -1, y: ry + 1 },
  ];
  const bx = BLEED_X + CONTENT_W * 0.72;
  const boatX = BLEED_X + CONTENT_W * 0.38;
  const by = canalTop + 20;
  const amsterdamGround = (
    <g>
      {/* canal water + ripple + reflected light streaks */}
      <rect x="-200" y={canalTop} width={VIEWBOX.w + 400} height={canalBot - canalTop} fill={`url(#${canalId})`} />
      <path d={`M-200 ${canalTop + 10} Q 400 ${canalTop + 6} 900 ${canalTop + 11} T 2000 ${canalTop + 9} T 3080 ${canalTop + 10}`} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} />
      {[0.16, 0.3, 0.52, 0.66, 0.86].map((fx, i) => (
        <rect key={i} x={BLEED_X + CONTENT_W * fx} y={canalTop + 6} width={2} height={canalBot - canalTop - 8} fill={warm} opacity={isNightAms ? 0.5 : 0.22} />
      ))}
      {/* canal boat */}
      <path d={`M ${boatX - 28} ${by} q 5 9 16 9 h 24 q 11 0 16 -9 Z`} fill="rgb(54,50,46)" />
      <rect x={boatX - 8} y={by - 9} width={26} height={9} rx={2} fill="rgb(78,70,62)" />
      <rect x={boatX - 4} y={by - 7} width={6} height={5} fill={warm} opacity={isNightAms ? 0.9 : 0.4} />
      {/* quayside road */}
      <rect x="-200" y={canalBot} width={VIEWBOX.w + 400} height={runTop - canalBot} fill="rgb(92,88,94)" />
      <rect x="-200" y={canalBot} width={VIEWBOX.w + 400} height={3} fill="rgb(150,144,150)" />
      <rect x="-200" y={canalBot + 3} width={VIEWBOX.w + 400} height={2} fill="rgba(0,0,0,0.2)" />
      {/* humpback bridge over the canal */}
      <path d={`M ${bx - 58} ${canalBot} Q ${bx} ${canalTop - 14} ${bx + 58} ${canalBot}`} fill="none" stroke="rgb(150,128,104)" strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${bx - 58} ${canalBot} Q ${bx} ${canalTop - 6} ${bx + 58} ${canalBot}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.4} />
      {/* canalside lamps */}
      {[BLEED_X + CONTENT_W * 0.26, BLEED_X + CONTENT_W * 0.84].map((lx, i) => (
        <g key={i}>
          <rect x={lx - 1} y={canalBot - 24} width={2} height={24} fill="rgb(40,42,50)" />
          <circle cx={lx} cy={canalBot - 26} r={3} fill={warm} opacity={isNightAms ? 0.95 : 0.5} />
        </g>
      ))}
      {/* animated cyclists on the road */}
      {riders.map((c, i) =>
        ambient ? (
          <motion.g key={i} initial={{ x: c.from }} animate={{ x: [c.from, c.to] }} transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'linear' }}>
            <Cyclist y={c.y} dir={c.dir} />
          </motion.g>
        ) : (
          <g key={i} transform={`translate(${(c.from + c.to) / 2},0)`}>
            <Cyclist y={c.y} dir={c.dir} />
          </g>
        ),
      )}
    </g>
  );

  // Merlion (Singapore) — the lion-headed fish statue spouting water into the
  // bay, on the far promenade so its jet arcs toward the viewer. Animated when
  // ambient (droplets travel the arc + ripple rings at the splash).
  const mlx = BLEED_X + CONTENT_W * 0.5;
  const gY = surroundingsTop + 26;
  const mStone = 'rgb(236,238,236)';
  const mShade = 'rgba(0,0,0,0.16)';
  const water = 'rgba(210,238,255,0.9)';
  const mouthX = mlx - 19;
  const mouthY = gY - 48;
  const ctrlX = mlx - 44;
  const ctrlY = gY - 62;
  const landX = mlx - 66;
  const landY = runTop - 12;
  const spoutPt = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * mouthX + 2 * u * t * ctrlX + t * t * landX,
      y: u * u * mouthY + 2 * u * t * ctrlY + t * t * landY,
    };
  };
  const spoutT = [0, 0.25, 0.5, 0.75, 1];
  const spoutXs = spoutT.map((t) => spoutPt(t).x);
  const spoutYs = spoutT.map((t) => spoutPt(t).y);
  const spoutPath = `M ${mouthX} ${mouthY} Q ${ctrlX} ${ctrlY} ${landX} ${landY}`;
  const merlion = isSingapore ? (
    <g>
      {/* pedestal */}
      <rect x={mlx - 18} y={gY - 7} width={36} height={7} fill="rgba(0,0,0,0.2)" />
      <rect x={mlx - 18} y={gY - 10} width={36} height={3} fill={mStone} />
      {/* body (two-tone) */}
      <path d={`M ${mlx - 14} ${gY - 7} C ${mlx - 18} ${gY - 30} ${mlx - 12} ${gY - 42} ${mlx - 2} ${gY - 44} C ${mlx + 12} ${gY - 46} ${mlx + 20} ${gY - 30} ${mlx + 16} ${gY - 12} C ${mlx + 14} ${gY - 7} ${mlx + 10} ${gY - 7} ${mlx + 8} ${gY - 7} Z`} fill={mStone} />
      <path d={`M ${mlx} ${gY - 45} C ${mlx + 12} ${gY - 46} ${mlx + 20} ${gY - 30} ${mlx + 16} ${gY - 12} C ${mlx + 14} ${gY - 7} ${mlx + 10} ${gY - 7} ${mlx + 8} ${gY - 7} L ${mlx} ${gY - 7} Z`} fill={mShade} />
      {/* fish scales */}
      {[-18, -26, -34].map((dy, i) => (
        <path key={i} d={`M ${mlx - 10} ${gY + dy} q 6 4 12 0 q 6 4 12 0`} fill="none" stroke={mShade} strokeWidth={1} />
      ))}
      {/* curled tail (lower right) */}
      <path d={`M ${mlx + 14} ${gY - 14} q 14 -2 16 -16 q -2 10 -10 12 q 6 2 10 -2`} fill={mStone} />
      {/* head + mane + snout */}
      <circle cx={mlx - 6} cy={gY - 50} r={9} fill={mStone} />
      <path d={`M ${mlx - 6} ${gY - 59} A 9 9 0 0 1 ${mlx - 6} ${gY - 41} Z`} fill={mShade} opacity={0.5} />
      {[-14, -6, 2].map((dx, i) => (
        <circle key={`m${i}`} cx={mlx + dx} cy={gY - 44} r={3.4} fill={mStone} />
      ))}
      {[-12, -2].map((dx, i) => (
        <circle key={`u${i}`} cx={mlx + dx} cy={gY - 58} r={3.2} fill={mStone} />
      ))}
      <path d={`M ${mlx - 15} ${gY - 50} l -6 -1 l 1 5 Z`} fill={mStone} />
      <circle cx={mlx - 16} cy={gY - 49} r={1.5} fill="rgba(0,0,0,0.4)" />
      {/* continuous water stream */}
      <path d={spoutPath} fill="none" stroke="rgba(200,232,255,0.45)" strokeWidth={4} strokeLinecap="round" />
      <path d={spoutPath} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.4} />
      {/* animated droplets + splash ripples (static fallback otherwise) */}
      {ambient ? (
        <>
          {[0, 1, 2, 3].map((d) => (
            <motion.circle key={`d${d}`} r={2.2} fill={water} initial={{ opacity: 0 }} animate={{ cx: spoutXs, cy: spoutYs, opacity: [0, 1, 1, 0.8, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeIn', delay: d * 0.27 }} />
          ))}
          {[0, 1].map((r) => (
            <motion.ellipse key={`r${r}`} cx={landX} cy={landY} fill="none" stroke={water} strokeWidth={1} initial={{ rx: 2, ry: 1, opacity: 0.8 }} animate={{ rx: [2, 16], ry: [1, 5], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: r * 0.7 }} />
          ))}
        </>
      ) : (
        <ellipse cx={landX} cy={landY} rx={8} ry={2.6} fill="none" stroke={water} strokeWidth={1} opacity={0.6} />
      )}
    </g>
  ) : null;

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
        <linearGradient id={canalId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.waterTop} />
          <stop offset="1" stopColor={palette.waterBottom} />
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
          {merlion}
        </>
      ) : isAmsterdam ? (
        amsterdamGround
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
