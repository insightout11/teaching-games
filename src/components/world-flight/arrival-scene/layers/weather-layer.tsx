import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { normalizeTerrain } from '../scene-registry';
import { DEP_CITY_LEAD, departureCameraPan } from '../cinematic-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { randRange, seededRand } from '../seed';
import { WEATHER_PROFILE } from '../weather';

const W = VIEWBOX.w;
const H = VIEWBOX.h;
const RUN_TOP = LAYOUT.runwayY - 38;

/** Colour and strength of the veil that dulls the foreground. Overcast is a flat grey day, not dusk. */
const VEIL: Record<string, { color: string; k: number }> = {
  overcast: { color: 'rgb(112,120,132)', k: 0.34 },
  rain: { color: 'rgb(26,36,56)', k: 0.4 },
  storm: { color: 'rgb(20,28,46)', k: 0.4 },
  snow: { color: 'rgb(206,216,232)', k: 0.32 },
  aurora: { color: 'rgb(26,36,56)', k: 0.4 },
};


/**
 * What the weather does to the ground: a darker apron and a glossy runway with puddles and ripples in rain; settled
 * snow on the grass, a bank along the runway edge and drifts on the runway in snow. Drawn by the runway layer, so it
 * sits BEHIND the plane and windsock and never washes them out.
 */
export function WeatherGround({ weather, ambient, idPrefix, scene, palette, mode, progress }: SceneLayerProps) {
  const prof = WEATHER_PROFILE[weather];
  if (prof.rain === 0 && prof.snow === 0) return null;
  const rand = seededRand(`${idPrefix}:${weather}:ground`);
  const night = palette.light === 'moon';
  // Puddles and drifts are things lying on the ground: on takeoff they move with the world, not with the plane.
  const worldShift = mode === 'departure' ? DEP_CITY_LEAD - departureCameraPan(Math.min(1, Math.max(0, progress))) : 0;
  // Scenes whose "ground" is water or a canal take no snow blanket (the runway edge still gets a drift).
  const terrain = normalizeTerrain(scene.terrain);
  const waterfront = scene.skylineVariant === 'dubai' || scene.skylineVariant === 'amsterdam' || scene.skylineVariant === 'singapore' || terrain === 'coastal' || terrain === 'island';
  const winter = scene.palette === 'winter';

  // Puddles stay below the plane (it sits on the runway line).
  const puddleTop = LAYOUT.runwayY + 44;
  const puddles =
    prof.rain > 0
      ? Array.from({ length: 9 }, () => {
          const rx = randRange(rand, 80, 210);
          return { cx: randRange(rand, -60, W + 60), cy: randRange(rand, puddleTop, H - 24), rx, ry: rx * randRange(rand, 0.055, 0.09), delay: randRange(rand, 0, 2.4) };
        })
      : [];
  const puddleFill = night ? 'rgba(96,114,156,0.34)' : 'rgba(168,190,222,0.36)';

  // ── Settled snow: a blanket over the grass, a bank along the runway edge, drifts and a dusting on the runway ─────
  const k = winter ? 0.4 : 1;
  const drifts =
    prof.snow > 0
      ? Array.from({ length: 11 }, () => ({ cx: randRange(rand, -60, W + 60), cy: randRange(rand, puddleTop - 16, H - 16), rx: randRange(rand, 70, 220), ry: randRange(rand, 4, 9), o: randRange(rand, 0.22, 0.46) }))
      : [];

  return (
    <g aria-hidden>
      <defs>
        <filter id={`${idPrefix}-soft`} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <linearGradient id={`${idPrefix}-wet-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(200,214,236)" stopOpacity={night ? 0.14 : 0.32} />
          <stop offset="0.3" stopColor="rgb(150,168,200)" stopOpacity={night ? 0.08 : 0.14} />
          <stop offset="1" stopColor="rgb(8,14,26)" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-snow-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? 'rgb(168,182,214)' : 'rgb(250,252,255)'} stopOpacity={0.86 * k} />
          <stop offset="1" stopColor={night ? 'rgb(132,148,186)' : 'rgb(226,236,248)'} stopOpacity={0.74 * k} />
        </linearGradient>
      </defs>
      {prof.rain > 0 && (
        <>
          <rect x="-200" y={LAYOUT.apronY} width={W + 400} height={RUN_TOP - LAYOUT.apronY} fill="rgb(10,18,30)" opacity={0.16 * prof.rain} />
          <rect x="-200" y={RUN_TOP} width={W + 400} height={H - RUN_TOP + 80} fill={`url(#${idPrefix}-wet-sheen)`} />
          <g transform={`translate(${worldShift},0)`}>
          {puddles.map((p, i) => (
            <g key={i}>
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={puddleFill} />
              <ellipse cx={p.cx - p.rx * 0.12} cy={p.cy - p.ry * 0.25} rx={p.rx * 0.7} ry={p.ry * 0.42} fill="rgba(255,255,255,0.2)" filter={`url(#${idPrefix}-soft)`} />
              <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.4} />
              {[0, 1].map((r) => {
                const rx0 = p.cx + (r ? p.rx * 0.28 : -p.rx * 0.22);
                const ring = <ellipse cx={rx0} cy={p.cy} rx={p.rx * 0.1} ry={p.ry * 0.1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} />;
                return ambient ? (
                  <motion.g key={r} style={{ transformOrigin: `${rx0}px ${p.cy}px` }} animate={{ scale: [0.3, 2.6], opacity: [0.7, 0] }} transition={{ duration: 1.1, delay: p.delay + r * 0.55, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.5 }}>
                    {ring}
                  </motion.g>
                ) : (
                  <g key={r} opacity={0.35}>{ring}</g>
                );
              })}
            </g>
          ))}
          </g>
        </>
      )}

      {prof.snow > 0 && (
        <>
          {!waterfront && (
            <path d={`M-200 ${LAYOUT.apronY + 6} Q300 ${LAYOUT.apronY - 10} 760 ${LAYOUT.apronY + 4} T1700 ${LAYOUT.apronY - 2} T3080 ${LAYOUT.apronY + 3} L3080 ${RUN_TOP} L-200 ${RUN_TOP} Z`} fill={`url(#${idPrefix}-snow-ground)`} />
          )}
          {/* the bank along the runway edge */}
          <path d={`M-200 ${RUN_TOP - 12} Q300 ${RUN_TOP - 30} 760 ${RUN_TOP - 15} T1700 ${RUN_TOP - 19} T3080 ${RUN_TOP - 13} L3080 ${RUN_TOP + 4} L-200 ${RUN_TOP + 4} Z`} fill={night ? '#aab8d4' : '#f3f7fb'} opacity={0.7} />
          {/* a thin dusting on the runway, heavier toward the edge, with a few drifts in the foreground */}
          <rect x="-200" y={RUN_TOP + 4} width={W + 400} height={H - RUN_TOP + 80} fill={night ? 'rgb(150,166,204)' : 'rgb(238,244,252)'} opacity={0.1} />
          <rect x="-200" y={RUN_TOP + 4} width={W + 400} height={26} fill={night ? 'rgb(168,182,214)' : 'rgb(244,248,255)'} opacity={0.3} />
          <g transform={`translate(${worldShift},0)`}>
          {drifts.map((d, i) => (
            <ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={night ? 'rgb(172,186,218)' : 'rgb(244,248,255)'} opacity={d.o} />
          ))}
          </g>
        </>
      )}
    </g>
  );
}

type Depth = { count: number; a: number; b: number; oMin: number; oMax: number; tile: number; fall: number; sway: number; blur: number };

// Precipitation (rain / snow), what it does to the ground (wet runway with puddles and ripples, settled snow) and
// lightning, full-canvas, drawn in FRONT of the scene. Falling sheets are periodic tiles translated by exactly one
// period and looped, so the wrap is seamless. Motion is AMBIENT-only; a still frame shows a frozen sheet (so
// thumbnails still read as wet/snowy) but no lightning flash.
export function WeatherLayer({ weather, rand, ambient, idPrefix, palette }: SceneLayerProps) {
  const prof = WEATHER_PROFILE[weather];
  if (prof.rain === 0 && prof.snow === 0 && !prof.lightning && prof.dim === 0) return null;
  const night = palette.light === 'moon';
  const veil = night && weather === 'snow' ? { color: 'rgb(54,66,96)', k: 0.3 } : VEIL[weather] ?? VEIL.rain;

  // ── Falling sheets: a few depths each, every depth with its own period so the sheets never line up ──────────────
  const sheetOf = (d: Depth, draw: (f: { x: number; y: number; a: number; o: number }, i: number) => ReactNode) => {
    const flakes = Array.from({ length: d.count }, () => ({
      x: randRange(rand, 0, W),
      y: randRange(rand, 0, d.tile),
      a: randRange(rand, d.a, d.b),
      o: randRange(rand, d.oMin, d.oMax),
    }));
    const ks = Array.from({ length: Math.ceil(H / d.tile) + 3 }, (_, i) => i - 1);
    return (
      <g filter={d.blur ? `url(#${idPrefix}-fall-blur-${d.blur})` : undefined}>
        {ks.map((k) => (
          <g key={k} transform={`translate(0 ${k * d.tile})`}>
            {flakes.map(draw)}
          </g>
        ))}
      </g>
    );
  };
  const slant = prof.lightning ? 0.3 : 0.18;

  const RAIN_DEPTHS: Depth[] = [
    { count: 150, a: 9, b: 17, oMin: 0.16, oMax: 0.3, tile: 240, fall: 0.5, sway: 0, blur: 0 },
    { count: 74, a: 20, b: 34, oMin: 0.26, oMax: 0.5, tile: 320, fall: 0.38, sway: 0, blur: 0 },
    { count: 22, a: 50, b: 82, oMin: 0.18, oMax: 0.34, tile: 420, fall: 0.3, sway: 0, blur: 1 },
  ];
  const rainDepths =
    prof.rain > 0
      ? RAIN_DEPTHS.map((d, di) => ({
          d,
          sheet: sheetOf({ ...d, count: Math.round(d.count * prof.rain) }, (f, i) => (
            <line key={i} x1={f.x} y1={f.y} x2={f.x - f.a * slant} y2={f.y + f.a} stroke={`rgba(206,220,242,${f.o})`} strokeWidth={[0.9, 1.4, 2.6][di]} strokeLinecap="round" />
          )),
        }))
      : [];

  const SNOW_DEPTHS: Depth[] = [
    { count: 230, a: 0.9, b: 1.8, oMin: 0.35, oMax: 0.6, tile: 200, fall: 11, sway: 14, blur: 0 },
    { count: 120, a: 2, b: 3.4, oMin: 0.6, oMax: 0.9, tile: 300, fall: 7.5, sway: 26, blur: 0 },
    { count: 36, a: 4.5, b: 8, oMin: 0.5, oMax: 0.8, tile: 420, fall: 5.2, sway: 40, blur: 2 },
  ];
  const snowDepths =
    prof.snow > 0
      ? SNOW_DEPTHS.map((d) => ({
          d,
          sheet: sheetOf({ ...d, count: Math.round(d.count * prof.snow) }, (f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.a} fill={`rgba(255,255,255,${f.o})`} />),
        }))
      : [];

  // ── Lightning — periodic flash + a jagged bolt (storm only) ───────────────
  const boltX = randRange(rand, W * 0.3, W * 0.7);
  const bolt = `M ${boltX} 0 L ${boltX - 36} 150 L ${boltX + 14} 168 L ${boltX - 30} 320 L ${boltX + 40} 300 L ${boltX - 8} 470`;
  const flashKeyframes = { opacity: [0, 0, 0.85, 0.15, 0.6, 0, 0] };
  const flashTransition = { duration: 6.5, times: [0, 0.8, 0.82, 0.85, 0.88, 0.93, 1], repeat: Infinity, ease: 'linear' as const, repeatDelay: 1.5 };

  const fall = (i: number, d: Depth, sheet: ReactNode, duration: number) =>
    ambient ? (
      <motion.g key={i} animate={d.sway ? { x: [0, d.sway, 0] } : undefined} transition={d.sway ? { duration: 8 + i * 2.5, repeat: Infinity, ease: 'easeInOut' } : undefined}>
        <motion.g animate={{ y: [0, d.tile] }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
          {sheet}
        </motion.g>
      </motion.g>
    ) : (
      <g key={i}>{sheet}</g>
    );

  return (
    <g aria-hidden>
      <defs>
        <filter id={`${idPrefix}-fall-blur-1`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.9" /></filter>
        <filter id={`${idPrefix}-fall-blur-2`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.8" /></filter>
        <linearGradient id={`${idPrefix}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(196,206,222)" stopOpacity="0" />
          <stop offset="0.6" stopColor="rgb(196,206,222)" stopOpacity={night ? 0.1 : 0.24} />
          <stop offset="1" stopColor="rgb(196,206,222)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-snow-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(222,232,248)" stopOpacity="0.06" />
          <stop offset="0.55" stopColor="rgb(226,236,250)" stopOpacity="0.16" />
          <stop offset="1" stopColor="rgb(244,248,255)" stopOpacity={night ? 0.14 : 0.34} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-flat-light`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(222,227,234)" stopOpacity="0" />
          <stop offset="0.7" stopColor="rgb(222,227,234)" stopOpacity={night ? 0.1 : 0.3} />
          <stop offset="1" stopColor="rgb(222,227,234)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Foreground veil — ties the city/ground/plane into the weather (kept light so the plane stays readable; the
          sky is dimmed separately in the atmosphere layer). */}
      {prof.dim > 0 && <rect x="0" y="0" width={W} height={H} fill={veil.color} opacity={prof.dim * veil.k} />}

      {/* Overcast: even grey light, with the horizon washed out — a flat day, not dusk */}
      {weather === 'overcast' && <rect x="0" y={LAYOUT.horizonY - 160} width={W} height={260} fill={`url(#${idPrefix}-flat-light)`} />}

      {/* Rain: mist over the base of the city */}
      {prof.rain > 0 && <rect x="0" y={LAYOUT.horizonY - 70} width={W} height={170} fill={`url(#${idPrefix}-mist)`} />}

      {/* Rain — three depths of streaks, slanting more in a storm */}
      {rainDepths.map(({ d, sheet }, i) => fall(i, d, sheet, (d.fall / Math.max(0.5, prof.rain)) * 0.9))}

      {/* Snow — cold haze, settled snow on the ground, then the flakes */}
      {prof.snow > 0 && (
        <>
          <rect x="0" y="0" width={W} height={H} fill={`url(#${idPrefix}-snow-haze)`} />
        </>
      )}
      {snowDepths.map(({ d, sheet }, i) => fall(i, d, sheet, d.fall / Math.max(0.5, prof.snow)))}

      {/* Lightning — only when animated (a still frame stays calm) */}
      {prof.lightning && ambient && (
        <>
          <motion.rect x="0" y="0" width={W} height={H} fill="rgba(214,226,255,0.9)" initial={{ opacity: 0 }} animate={flashKeyframes} transition={flashTransition} />
          <motion.path d={bolt} fill="none" stroke="rgba(245,249,255,0.95)" strokeWidth={3} strokeLinejoin="round" initial={{ opacity: 0 }} animate={flashKeyframes} transition={flashTransition} />
        </>
      )}
    </g>
  );
}
