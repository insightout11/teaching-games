'use client';

import { motion } from 'framer-motion';
import { CONTENT_W, LAYOUT, type SceneLayerProps } from '../types';
import { randRange } from '../seed';

// Subtle signs of life over the city. ENTIRELY ambient: renders nothing unless
// `ambient` is true (motion === 'animated' AND prefers-reduced-motion is off),
// so static thumbnails and reduced-motion users see a still scene. Effects are
// palette-aware so they fit the time of day (birds by day, flickering lights +
// a blinking aircraft beacon at night). Never drawn on top of monuments — these
// sit in the open sky and over the generic city band only.
export function AmbientLayer({ palette, rand, ambient }: SceneLayerProps) {
  if (!ambient) return null;
  const isNight = palette.light === 'moon';

  // ── Flickering window / sign lights over the city band ──
  const twCount = isNight ? 9 : 5;
  const peak = isNight ? 0.95 : 0.5;
  const twinkles = Array.from({ length: twCount }, (_, i) => {
    const cx = randRange(rand, 40, CONTENT_W - 40);
    const cy = randRange(rand, 360, LAYOUT.apronY - 12);
    const r = randRange(rand, 1.6, 3.2);
    const color = rand() > 0.5 ? palette.windowWarm : palette.windowCool;
    const dur = randRange(rand, 1.6, 3.6);
    const delay = randRange(rand, 0, 2.6);
    return (
      <motion.circle
        key={`tw${i}`}
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.15, peak, 0.15] }}
        transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  });

  // ── Blinking red aircraft-warning beacon, high up (night skylines) ──
  const beacon = isNight ? (
    <motion.circle
      cx={randRange(rand, CONTENT_W * 0.42, CONTENT_W * 0.66)}
      cy={randRange(rand, 300, 358)}
      r={2.8}
      fill="rgba(255,86,86,0.95)"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.12, 1], ease: 'easeOut' }}
    />
  ) : null;

  // ── Birds drifting across the sky (daylight only) ──
  const birds =
    palette.light === 'sun'
      ? Array.from({ length: 3 }, (_, i) => {
          const y = randRange(rand, 140, 320);
          const dur = randRange(rand, 17, 27);
          const delay = randRange(rand, 0, 9);
          const ltr = rand() > 0.5;
          const flap = randRange(rand, 0.45, 0.7);
          return (
            <motion.g
              key={`bird${i}`}
              initial={{ x: ltr ? -60 : CONTENT_W + 60, y }}
              animate={{ x: ltr ? CONTENT_W + 60 : -60 }}
              transition={{ duration: dur, delay, repeat: Infinity, ease: 'linear' }}
            >
              <motion.path
                d="M -7 0 Q 0 -6 7 0"
                fill="none"
                stroke="rgba(38,44,58,0.55)"
                strokeWidth={2}
                strokeLinecap="round"
                animate={{ d: ['M -7 0 Q 0 -6 7 0', 'M -7 0 Q 0 1 7 0', 'M -7 0 Q 0 -6 7 0'] }}
                transition={{ duration: flap, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          );
        })
      : [];

  // ── Distant aircraft crossing the sky, occasionally (day + night) ──
  const tint = isNight ? 'rgba(150,160,182,0.42)' : 'rgba(68,76,92,0.45)';
  const off = 820; // far enough past the full 2880 canvas (focal is offset by BLEED_X)
  const planes = Array.from({ length: 1 }, (_, i) => {
    const y = randRange(rand, 80, 200);
    const dur = randRange(rand, 46, 64);
    const delay = randRange(rand, 2, 12);
    const gap = randRange(rand, 8, 18);
    const ltr = rand() > 0.5;
    const sc = randRange(rand, 0.8, 1.2);
    const body = (
      <g transform={ltr ? `scale(${sc})` : `scale(${-sc} ${sc})`}>
        {/* contrail */}
        <path d="M -22 -0.6 L -74 -1.6 L -74 0.2 L -22 0.8 Z" fill={tint} opacity={0.32} />
        {/* fuselage */}
        <path d="M -20 0 Q -20 -3 -10 -3.2 L 12 -2.9 Q 20 -2.3 22 0 Q 20 2.3 12 2.9 L -10 3.2 Q -20 3 -20 0 Z" fill={tint} />
        {/* swept wing + tail fin + h-stab */}
        <path d="M -1 1.6 L -15 9 L -7 1.6 Z" fill={tint} />
        <path d="M -16 -1 L -21 -10 L -13 -1 Z" fill={tint} />
        <path d="M -17 1 L -23 4.5 L -14 1 Z" fill={tint} />
        {/* night nav beacon */}
        {isNight && (
          <motion.circle cx={20} cy={-1} r={1.7} fill="rgba(255,92,92,0.95)" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }} />
        )}
      </g>
    );
    return (
      <motion.g
        key={`plane${i}`}
        initial={{ x: ltr ? -off : CONTENT_W + off, y }}
        animate={{ x: ltr ? CONTENT_W + off : -off }}
        transition={{ duration: dur, delay, repeat: Infinity, repeatDelay: gap, ease: 'linear' }}
      >
        {body}
      </motion.g>
    );
  });

  return (
    <g aria-hidden>
      {planes}
      {birds}
      {twinkles}
      {beacon}
    </g>
  );
}
