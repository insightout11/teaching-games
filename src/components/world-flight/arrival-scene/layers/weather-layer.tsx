import { motion } from 'framer-motion';
import { VIEWBOX, type SceneLayerProps } from '../types';
import { randRange } from '../seed';
import { WEATHER_PROFILE } from '../weather';

const W = VIEWBOX.w;
const H = VIEWBOX.h;
const TILE = 320; // vertical period for the seamless precipitation sheets
const TILE_KS = [-1, 0, 1, 2, 3]; // copies covering -TILE..H+TILE

// Precipitation (rain / snow) + lightning, full-canvas, drawn in FRONT of the
// scene. Falling sheets are periodic tiles translated by exactly one period and
// looped, so the wrap is seamless. Motion is AMBIENT-only; a still frame shows a
// frozen sheet (so thumbnails still read as wet/snowy) but no lightning flash.
export function WeatherLayer({ weather, rand, ambient }: SceneLayerProps) {
  const prof = WEATHER_PROFILE[weather];
  if (prof.rain === 0 && prof.snow === 0 && !prof.lightning && prof.dim === 0) return null;

  // ── Rain — near-vertical streaks ──────────────────────────────────────────
  const rainTile =
    prof.rain > 0
      ? Array.from({ length: Math.round(34 * prof.rain) }, () => ({
          x: randRange(rand, 0, W),
          y: randRange(rand, 0, TILE),
          len: randRange(rand, 16, 30),
          o: randRange(rand, 0.16, 0.4),
        }))
      : [];
  const rainSheet = (
    <g>
      {TILE_KS.map((k) => (
        <g key={k} transform={`translate(0 ${k * TILE})`}>
          {rainTile.map((d, i) => (
            <line
              key={i}
              x1={d.x}
              y1={d.y}
              x2={d.x - d.len * 0.16}
              y2={d.y + d.len}
              stroke={`rgba(196,210,233,${d.o})`}
              strokeWidth={1.1}
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
    </g>
  );

  // ── Snow — drifting flakes ────────────────────────────────────────────────
  const snowTile =
    prof.snow > 0
      ? Array.from({ length: Math.round(30 * prof.snow) }, () => ({
          x: randRange(rand, 0, W),
          y: randRange(rand, 0, TILE),
          r: randRange(rand, 1.5, 3.6),
          o: randRange(rand, 0.5, 0.95),
        }))
      : [];
  const snowSheet = (
    <g>
      {TILE_KS.map((k) => (
        <g key={k} transform={`translate(0 ${k * TILE})`}>
          {snowTile.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`rgba(255,255,255,${d.o})`} />
          ))}
        </g>
      ))}
    </g>
  );

  // ── Lightning — periodic flash + a jagged bolt (storm only) ───────────────
  const boltX = randRange(rand, W * 0.3, W * 0.7);
  const bolt = `M ${boltX} 0 L ${boltX - 36} 150 L ${boltX + 14} 168 L ${boltX - 30} 320 L ${boltX + 40} 300 L ${boltX - 8} 470`;
  const flashKeyframes = { opacity: [0, 0, 0.85, 0.15, 0.6, 0, 0] };
  const flashTransition = { duration: 6.5, times: [0, 0.8, 0.82, 0.85, 0.88, 0.93, 1], repeat: Infinity, ease: 'linear' as const, repeatDelay: 1.5 };

  return (
    <g aria-hidden>
      {/* Foreground veil — ties the city/ground/plane into the gloom (kept light so
          the plane stays readable; the sky is darkened more in the atmosphere layer). */}
      {prof.dim > 0 && <rect x="0" y="0" width={W} height={H} fill="rgb(26,36,56)" opacity={prof.dim * 0.4} />}

      {/* Rain */}
      {prof.rain > 0 &&
        (ambient ? (
          <motion.g animate={{ y: [0, TILE] }} transition={{ duration: 0.42 / Math.max(0.4, prof.rain), repeat: Infinity, ease: 'linear' }}>
            {rainSheet}
          </motion.g>
        ) : (
          rainSheet
        ))}

      {/* Snow — slow fall inside a gentle side-to-side drift */}
      {prof.snow > 0 &&
        (ambient ? (
          <motion.g animate={{ x: [0, 26, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
            <motion.g animate={{ y: [0, TILE] }} transition={{ duration: 7.5 / Math.max(0.4, prof.snow), repeat: Infinity, ease: 'linear' }}>
              {snowSheet}
            </motion.g>
          </motion.g>
        ) : (
          snowSheet
        ))}

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
