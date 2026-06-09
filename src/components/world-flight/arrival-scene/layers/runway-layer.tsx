import { motion } from 'framer-motion';
import { LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';

// The airfield ground for the side-profile camera: a grassy field with a
// HORIZONTAL tarmac runway band across the foreground (no perspective vanishing
// point — all plane art is side-view). Edge-light pulse is ambient only.
export function RunwayLayer({ palette, idPrefix, ambient }: SceneLayerProps) {
  const grassId = `${idPrefix}-grass`;
  const tarId = `${idPrefix}-tarmac`;

  const fieldTop = LAYOUT.apronY;
  const runTop = LAYOUT.runwayY - 26;
  const runH = 92;
  const runBottom = runTop + runH;

  // Centerline dashes run horizontally down the middle of the band.
  const dashY = LAYOUT.runwayY + 6;
  const dashes = Array.from({ length: 13 }, (_, i) => 60 + i * 120);
  // Edge lights line the near edge of the runway band.
  const lightY = runBottom - 6;
  const lights = Array.from({ length: 14 }, (_, i) => 70 + i * 110);

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={grassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#274326" />
          <stop offset="1" stopColor="#14271a" />
        </linearGradient>
        <linearGradient id={tarId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3340" />
          <stop offset="1" stopColor="#11161e" />
        </linearGradient>
      </defs>

      {/* grass field (bleeds past viewBox to fill corners) */}
      <rect x="-200" y={fieldTop} width={VIEWBOX.w + 400} height={VIEWBOX.h - fieldTop + 200} fill={`url(#${grassId})`} />
      {/* time-of-day wash to tie the field to the palette */}
      <rect x="-200" y={fieldTop} width={VIEWBOX.w + 400} height={VIEWBOX.h - fieldTop + 200} fill={palette.skyBottom} opacity={0.1} />

      {/* runway band */}
      <rect x="-200" y={runTop} width={VIEWBOX.w + 400} height={runH} fill={`url(#${tarId})`} />
      <rect x="-200" y={runTop} width={VIEWBOX.w + 400} height={2} fill="rgba(255,255,255,0.08)" />
      <rect x="-200" y={runBottom - 2} width={VIEWBOX.w + 400} height={2} fill="rgba(0,0,0,0.35)" />

      {/* centerline dashes */}
      {dashes.map((x) => (
        <rect key={x} x={x} y={dashY} width={64} height={5} rx={2} fill="rgba(255,255,255,0.5)" />
      ))}

      {/* threshold piano keys at the left end */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={6} y={runTop + 12 + i * 16} width={42} height={9} fill="rgba(255,255,255,0.4)" />
      ))}

      {/* edge lights */}
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
  );
}
