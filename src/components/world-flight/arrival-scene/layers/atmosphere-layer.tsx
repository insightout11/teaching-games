import { motion } from 'framer-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { randRange } from '../seed';

// Sky gradient + sun/moon + stars (night) + a couple of drifting clouds. Drift /
// twinkle are AMBIENT only (disabled when !ambient) and never affect the plane.
export function AtmosphereLayer({ palette, rand, idPrefix, ambient }: SceneLayerProps) {
  const skyId = `${idPrefix}-sky`;
  const glowId = `${idPrefix}-horizon`;
  const lightId = `${idPrefix}-light`;
  const isMoon = palette.light === 'moon';

  // Deterministic stars (only meaningful on the night palette but cheap anyway).
  const stars = isMoon
    ? Array.from({ length: 46 }, () => ({
        x: randRange(rand, 20, VIEWBOX.w - 20),
        y: randRange(rand, 20, LAYOUT.horizonY - 60),
        r: randRange(rand, 0.7, 1.8),
        o: randRange(rand, 0.4, 0.95),
      }))
    : [];

  const clouds = Array.from({ length: 3 }, (_, i) => ({
    x: randRange(rand, 100, VIEWBOX.w - 300),
    y: randRange(rand, 70, LAYOUT.horizonY - 200),
    s: randRange(rand, 0.7, 1.3),
    dur: 90 + i * 24,
  }));

  const lightX = randRange(rand, VIEWBOX.w * 0.3, VIEWBOX.w * 0.7);
  const lightY = randRange(rand, 120, 240);

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset="0.55" stopColor={palette.skyMid} />
          <stop offset="1" stopColor={palette.skyBottom} />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor={palette.horizonGlow} />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={lightId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.lightColor} />
          <stop offset="0.55" stopColor={palette.lightColor} stopOpacity={isMoon ? 0.85 : 0.95} />
          <stop offset="1" stopColor={palette.lightColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect x="0" y="0" width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${skyId})`} />

      {/* stars */}
      {stars.map((s, i) =>
        ambient ? (
          <motion.circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="rgba(255,255,255,0.95)"
            animate={{ opacity: [s.o, s.o * 0.3, s.o] }}
            transition={{ duration: 2.6 + (i % 5) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.5) % 3 }}
          />
        ) : (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(255,255,255,0.95)" opacity={s.o} />
        ),
      )}

      {/* sun / moon */}
      <circle cx={lightX} cy={lightY} r={isMoon ? 56 : 70} fill={`url(#${lightId})`} />
      <circle cx={lightX} cy={lightY} r={isMoon ? 30 : 40} fill={palette.lightColor} opacity={isMoon ? 0.9 : 0.85} />

      {/* horizon glow */}
      <rect x="0" y={LAYOUT.horizonY - 220} width={VIEWBOX.w} height={260} fill={`url(#${glowId})`} />

      {/* clouds */}
      {clouds.map((c, i) => {
        const cloud = (
          <g opacity={0.5}>
            <ellipse cx={0} cy={0} rx={120} ry={34} fill="rgba(255,255,255,0.5)" />
            <ellipse cx={-70} cy={12} rx={80} ry={26} fill="rgba(255,255,255,0.42)" />
            <ellipse cx={80} cy={14} rx={70} ry={24} fill="rgba(255,255,255,0.42)" />
          </g>
        );
        return ambient ? (
          <motion.g
            key={i}
            initial={{ x: c.x, y: c.y }}
            animate={{ x: [c.x, c.x + 40, c.x] }}
            transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
            style={{ scale: c.s }}
          >
            {cloud}
          </motion.g>
        ) : (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            {cloud}
          </g>
        );
      })}
    </g>
  );
}
