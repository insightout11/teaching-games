'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * The cloud tops seen from above when the plane flies over thick weather: soft billows with a shaded underside,
 * tiled sideways, laid flat in perspective and drifting past. Drawn from an SVG noise filter, so there is no image
 * file. `tint` is the cloud colour as "r,g,b"; `strength` (0 to 1) how solid the deck is.
 */
export function CloudDeck({ tint, strength, speed = 0.55 }: { tint: string; strength: number; speed?: number }) {
  const reduce = useReducedMotion();
  const [light, dark] = useMemo(() => {
    const [r, g, b] = tint.split(',').map((n) => Number(n) / 255);
    const layer = (cr: number, cg: number, cb: number, seed: number) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0045 0.014" numOctaves="4" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${cr} 0 0 0 0 ${cg} 0 0 0 0 ${cb} 0 0 0 2.2 -0.62"/></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    };
    return [layer(Math.min(1, r * 1.05), Math.min(1, g * 1.05), Math.min(1, b * 1.05), 4), layer(r * 0.55, g * 0.58, b * 0.68, 4)];
  }, [tint]);
  const drift = reduce ? 0 : 1;
  const base = { backgroundRepeat: 'repeat-x', backgroundSize: '1200px 100%' } as const;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ top: '56%', opacity: strength, maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%)' }}
    >
      <div className="absolute inset-x-[-60%] top-0" style={{ bottom: '-70%', transform: 'perspective(420px) rotateX(62deg)', transformOrigin: '50% 0%' }}>
        {/* shaded underside, offset down and across so each billow has a dark lower edge */}
        <motion.div
          className="absolute inset-0"
          style={{ ...base, backgroundImage: dark, backgroundPositionY: '14px' }}
          animate={{ backgroundPositionX: drift ? ['-22px', '1178px'] : '-22px' }}
          transition={{ duration: 120 / Math.max(0.2, speed), repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ ...base, backgroundImage: light }}
          animate={{ backgroundPositionX: drift ? ['0px', '1200px'] : '0px' }}
          transition={{ duration: 120 / Math.max(0.2, speed), repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
