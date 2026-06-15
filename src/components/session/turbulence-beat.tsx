'use client';

import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { getPlaneViewAsset } from '@/lib/plane-progression';

// ─────────────────────────────────────────────────────────────────────────────
// Turbulence driver — ASSET-AGNOSTIC on purpose. Layered incommensurate sines
// approximate band-limited noise, so the jitter is smooth but never repeats and
// is genuinely multi-axis (real turbulence is stochastic, not a clean rock). It
// returns motion values to apply to ANY element: the front-facing plane now, a
// cabin-POV view later — upgrading the visual never touches the motion.
// ─────────────────────────────────────────────────────────────────────────────
export function useTurbulence(intensity: number) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  useAnimationFrame((t) => {
    if (intensity <= 0) {
      x.set(0);
      y.set(0);
      rotate.set(0);
      return;
    }
    const s = t / 1000;
    const jx = Math.sin(s * 13.1) + 0.6 * Math.sin(s * 27.7) + 0.4 * Math.sin(s * 41.3 + 1.1);
    const jy = Math.sin(s * 11.7 + 1.3) + 0.6 * Math.sin(s * 23.9 + 0.7) + 0.4 * Math.sin(s * 37.1);
    const jr = Math.sin(s * 9.3 + 2.1) + 0.5 * Math.sin(s * 19.7 + 0.4);
    x.set(jx * 6 * intensity);
    y.set(jy * 5 * intensity);
    rotate.set(jr * 1.8 * intensity);
  });
  return { x, y, rotate };
}

interface TurbulenceBeatProps {
  planeKey?: string | null;
  /** 0 = still, 1 = a firm bump. The plane buffets at this; callers can shake the
   *  whole frame separately via useTurbulence (see the dev preview). */
  intensity?: number;
  showSeatbelt?: boolean;
  /** Reduced-motion: freeze everything (no jitter, no blinking sign). */
  reduce?: boolean;
}

// The turbulence subject: the front-3q plane being buffeted, + a fasten-seatbelt
// cue. Renders transparent so it composites over whatever sky is behind it.
export function TurbulenceBeat({ planeKey, intensity = 1, showSeatbelt = true, reduce = false }: TurbulenceBeatProps) {
  const jitter = useTurbulence(reduce ? 0 : intensity);
  const front = getPlaneViewAsset(planeKey, 'front-3q', 'webp');
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.img
          src={front}
          alt=""
          aria-hidden
          draggable={false}
          style={{ x: jitter.x, y: jitter.y, rotate: jitter.rotate, width: 'min(42vw, 460px)', filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.45))' }}
        />
      </div>
      {showSeatbelt && !reduce && (
        <div className="absolute left-1/2 top-[13%] -translate-x-1/2">
          <motion.div
            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{
              background: 'rgba(20,28,46,0.72)',
              border: '1px solid rgba(245,200,90,0.5)',
              color: 'rgb(246,206,120)',
              backdropFilter: 'blur(8px)',
            }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span aria-hidden>⚠</span> Fasten Seatbelt · Turbulence
          </motion.div>
        </div>
      )}
    </div>
  );
}
