'use client';

import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
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
  // Read the live intensity from a ref each frame so changing it (a slider) takes
  // effect immediately, with no stale closure and no re-subscribing the loop.
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = intensityRef.current;
      if (k <= 0) {
        x.set(0);
        y.set(0);
        rotate.set(0);
      } else {
        const s = (now - start) / 1000;
        const jx = Math.sin(s * 13.1) + 0.6 * Math.sin(s * 27.7) + 0.4 * Math.sin(s * 41.3 + 1.1);
        const jy = Math.sin(s * 11.7 + 1.3) + 0.6 * Math.sin(s * 23.9 + 0.7) + 0.4 * Math.sin(s * 37.1);
        const jr = Math.sin(s * 9.3 + 2.1) + 0.5 * Math.sin(s * 19.7 + 0.4);
        x.set(jx * 6 * k);
        y.set(jy * 5 * k);
        rotate.set(jr * 1.8 * k);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [x, y, rotate]);

  return { x, y, rotate };
}

/**
 * Cabin shake for the Live Room: the whole cockpit is thrown about while `active`. Unlike the steady jitter above it
 * comes in gusts (a slow heave with hard rattles on top), eases in, and settles when it ends. The loop only runs
 * while there is something to shake.
 */
export function useCabinShake(active: boolean, strength = 1) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const strengthRef = useRef(strength);
  strengthRef.current = strength;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let level = 0;
    const start = performance.now();
    let last = start;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // In fast, out slowly: the air settles rather than switching off.
      level += ((activeRef.current ? 1 : 0) - level) * Math.min(1, dt * (activeRef.current ? 9 : 2.6));
      if (!activeRef.current && level < 0.01) {
        x.set(0); y.set(0); rotate.set(0);
        return;
      }
      const s = (now - start) / 1000;
      const gust = 0.5 + 0.5 * Math.max(0, Math.sin(s * 2.3) + 0.7 * Math.sin(s * 3.7 + 1.2)) / 1.7;
      const k = level * gust * strengthRef.current;
      const rattleX = Math.sin(s * 31.1) + 0.6 * Math.sin(s * 47.7 + 0.4);
      const rattleY = Math.sin(s * 27.3 + 1.3) + 0.6 * Math.sin(s * 43.9 + 0.7);
      const heave = Math.sin(s * 5.1) + 0.5 * Math.sin(s * 8.3 + 2);
      x.set(rattleX * 3.5 * k);
      y.set((rattleY * 4 + heave * 9) * k);
      rotate.set((Math.sin(s * 3.9 + 2.1) + 0.5 * Math.sin(s * 7.7 + 0.4)) * 0.45 * k);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, x, y, rotate]);

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
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Fasten Seatbelt · Turbulence
          </motion.div>
        </div>
      )}
    </div>
  );
}
