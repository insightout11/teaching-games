import { motion } from 'framer-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { randRange } from '../seed';

// Soft puffy clouds — clusters of circles softened by a Gaussian blur, matching
// the weather SkyBackground (components/ui/sky-background.tsx). Local coords.
const CLOUD_SHAPES: ReadonlyArray<ReadonlyArray<{ cx: number; cy: number; r: number }>> = [
  [{ cx: 0, cy: 0, r: 46 }, { cx: 54, cy: -12, r: 54 }, { cx: 110, cy: -2, r: 42 }, { cx: -44, cy: 8, r: 38 }, { cx: 150, cy: 6, r: 30 }],
  [{ cx: 0, cy: 0, r: 40 }, { cx: 48, cy: -14, r: 48 }, { cx: 92, cy: -4, r: 36 }, { cx: -38, cy: 6, r: 30 }],
  [{ cx: 0, cy: 0, r: 52 }, { cx: 62, cy: -16, r: 60 }, { cx: 124, cy: -4, r: 46 }, { cx: -50, cy: 10, r: 40 }, { cx: 162, cy: 8, r: 30 }],
];

// Sky gradient + sun/moon + stars (night) + a few drifting clouds. Drift /
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

  const cloudFilterId = `${idPrefix}-cloud`;
  const cloudFill = isMoon ? 'rgba(208,222,246,0.5)' : 'rgba(255,255,255,0.82)';
  const clouds = Array.from({ length: 4 }, (_, i) => ({
    x: randRange(rand, 80, VIEWBOX.w - 360),
    y: randRange(rand, 56, LAYOUT.horizonY - 230),
    s: randRange(rand, 0.8, 1.4),
    shape: CLOUD_SHAPES[Math.floor(randRange(rand, 0, CLOUD_SHAPES.length))],
    dur: 54 + i * 14,
    drift: (i % 2 === 0 ? 1 : -1) * randRange(rand, 120, 240),
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
        <filter id={cloudFilterId} x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>

      {/* sky */}
      <rect x="0" y="0" width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${skyId})`} />

      {/* slow saturation "breath" — a soft-light wash over the sky that pulses
          every ~10s (ambient only) so each scene gently comes alive */}
      {ambient && (
        <motion.rect
          x="0"
          y="0"
          width={VIEWBOX.w}
          height={LAYOUT.horizonY}
          fill={palette.skyMid}
          style={{ mixBlendMode: 'soft-light' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

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

      {/* clouds — soft blurred puffs (matching the weather SkyBackground) */}
      {clouds.map((c, i) => {
        const cloud = (
          <g filter={`url(#${cloudFilterId})`}>
            {c.shape.map((cc, j) => (
              <circle key={j} cx={cc.cx} cy={cc.cy} r={cc.r} fill={cloudFill} />
            ))}
          </g>
        );
        return ambient ? (
          <motion.g
            key={i}
            initial={{ x: c.x, y: c.y }}
            animate={{ x: [c.x, c.x + c.drift, c.x], y: [c.y, c.y - 7, c.y] }}
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
