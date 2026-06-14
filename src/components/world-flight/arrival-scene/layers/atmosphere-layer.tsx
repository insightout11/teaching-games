import { motion } from 'framer-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { randRange } from '../seed';
import { WEATHER_PROFILE } from '../weather';

// Soft puffy clouds — clusters of circles softened by a Gaussian blur, matching
// the weather SkyBackground (components/ui/sky-background.tsx). Local coords.
const CLOUD_SHAPES: ReadonlyArray<ReadonlyArray<{ cx: number; cy: number; r: number }>> = [
  [{ cx: 0, cy: 0, r: 46 }, { cx: 54, cy: -12, r: 54 }, { cx: 110, cy: -2, r: 42 }, { cx: -44, cy: 8, r: 38 }, { cx: 150, cy: 6, r: 30 }],
  [{ cx: 0, cy: 0, r: 40 }, { cx: 48, cy: -14, r: 48 }, { cx: 92, cy: -4, r: 36 }, { cx: -38, cy: 6, r: 30 }],
  [{ cx: 0, cy: 0, r: 52 }, { cx: 62, cy: -16, r: 60 }, { cx: 124, cy: -4, r: 46 }, { cx: -50, cy: 10, r: 40 }, { cx: 162, cy: 8, r: 30 }],
];

// Sky gradient + sun/moon + stars (night) + a few drifting clouds. Drift /
// twinkle are AMBIENT only (disabled when !ambient) and never affect the plane.
export function AtmosphereLayer({ palette, rand, idPrefix, ambient, weather }: SceneLayerProps) {
  const skyId = `${idPrefix}-sky`;
  const glowId = `${idPrefix}-horizon`;
  const lightId = `${idPrefix}-light`;
  const auroraId = `${idPrefix}-aurora`;
  const isMoon = palette.light === 'moon';
  const wx = WEATHER_PROFILE[weather];

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

  // Overcast cloud deck — a low, dark layer that thickens with cloudCover and
  // sits in front of the sun, so heavy skies actually read as heavy.
  const deckFill = isMoon ? 'rgba(34,42,60,0.94)' : 'rgba(78,88,108,0.94)';
  const deck =
    wx.cloudCover > 0.4
      ? Array.from({ length: 6 }, (_, i) => ({
          x: -120 + i * (VIEWBOX.w / 5),
          y: randRange(rand, 70, 250),
          s: randRange(rand, 1.7, 2.7),
          shape: CLOUD_SHAPES[i % CLOUD_SHAPES.length],
          dur: 70 + i * 12,
          drift: (i % 2 === 0 ? 1 : -1) * randRange(rand, 40, 90),
        }))
      : [];

  // Aurora ribbons — wavy translucent bands high in the (night) sky.
  const auroraBands = wx.aurora
    ? Array.from({ length: 3 }, (_, i) => ({
        y: 120 + i * 46,
        amp: randRange(rand, 26, 46),
        o: randRange(rand, 0.34, 0.6),
        dur: 16 + i * 5,
        drift: (i % 2 === 0 ? 1 : -1) * randRange(rand, 40, 80),
      }))
    : [];
  const auroraBand = (y: number, amp: number, h = 64) => {
    const w = VIEWBOX.w;
    return (
      `M -80 ${y} C ${w * 0.18} ${y - amp} ${w * 0.32} ${y + amp} ${w * 0.5} ${y} S ${w * 0.82} ${y - amp} ${w + 80} ${y}` +
      ` L ${w + 80} ${y + h} C ${w * 0.82} ${y + h - amp} ${w * 0.5} ${y + h + amp} ${w * 0.5} ${y + h} S ${w * 0.18} ${y + h - amp} -80 ${y + h} Z`
    );
  };

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
        <linearGradient id={auroraId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,240,180,0)" />
          <stop offset="0.32" stopColor="rgba(110,240,168,0.9)" />
          <stop offset="0.7" stopColor="rgba(92,200,232,0.65)" />
          <stop offset="1" stopColor="rgba(126,140,255,0)" />
        </linearGradient>
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

      {/* Overcast deck — dark low clouds in front of the sun */}
      {deck.map((c, i) => {
        const node = (
          <g filter={`url(#${cloudFilterId})`}>
            {c.shape.map((cc, j) => (
              <circle key={j} cx={cc.cx} cy={cc.cy} r={cc.r} fill={deckFill} />
            ))}
          </g>
        );
        return ambient ? (
          <motion.g key={i} initial={{ x: c.x, y: c.y }} animate={{ x: [c.x, c.x + c.drift, c.x] }} transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }} style={{ scale: c.s }}>
            {node}
          </motion.g>
        ) : (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            {node}
          </g>
        );
      })}

      {/* Weather sky dim — darkens the sky (sun + clouds) for overcast/rain/storm */}
      {wx.dim > 0 && <rect x="0" y="0" width={VIEWBOX.w} height={VIEWBOX.h} fill="rgb(20,28,46)" opacity={wx.dim} />}

      {/* Aurora ribbons — glow on top of the dimmed night sky */}
      {auroraBands.map((b, i) => {
        const node = <path d={auroraBand(b.y, b.amp)} fill={`url(#${auroraId})`} opacity={b.o} filter={`url(#${cloudFilterId})`} />;
        return ambient ? (
          <motion.g key={i} animate={{ x: [0, b.drift, 0], opacity: [b.o * 0.7, b.o, b.o * 0.7] }} transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}>
            {node}
          </motion.g>
        ) : (
          <g key={i}>{node}</g>
        );
      })}
    </g>
  );
}
