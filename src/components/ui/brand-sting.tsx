'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { TakeoffSpark } from './takeoff-spark';

/**
 * BrandSting — the LessonCaptain signature reveal. The frame starts FULLY white
 * (you're inside the cloud), then cloud billows rush toward and past the camera
 * — a forward flight THROUGH the cloud — thinning until the mark emerges through
 * it and resolves, with the wordmark settling beneath. A premium, low-frequency
 * brand moment.
 *
 * Two presets:
 *  - `full`  — the unhurried hero reveal (first-load splash).
 *  - `short` — a tighter version for session bookends (don't hold the class up).
 *
 * Root is `absolute inset-0`; wrap in a `fixed inset-0 z-[...]` parent to use it
 * as a full-screen overlay, or drop it in any relative box for a framed preview.
 */
export type BrandStingVariant = 'full' | 'short';

export interface BrandStingProps {
  /** Pacing preset (default 'full'). */
  variant?: BrandStingVariant;
  /** Fired once the sting (including its fade-out) has fully finished. */
  onComplete?: () => void;
  /** Show the wordmark lockup beneath the mark (default true). */
  showWordmark?: boolean;
  /** Optional one-line tagline under the wordmark. */
  tagline?: string;
  /** Hero size of the takeoff mark in px (default 210 — near full-size). */
  markSize?: number;
  /** Override the end-hold (ms) before fade-out. Defaults per variant. */
  holdMs?: number;
}

// ─── Timeline presets (seconds) ───────────────────────────────────────────────
interface Timeline {
  HOLD: number;       // frame sits FULLY white before pushing through
  FILL_FADE: number;  // the white-out thins as you break through
  RUSH_SPAN: number;  // stagger window over which billows keep streaming past
  PUFF_DUR: number;   // how long a single billow takes to rush past the camera
  MARK_DELAY: number; // the mark begins emerging through the thinning cloud
  MARK_DUR: number;   // mark fade/scale-in (coming toward you out of the murk)
  WORD_DELAY: number; // wordmark settles in
  TAIL: number;       // pad after the wordmark before the end-hold
  defaultHold: number;
}

const TIMELINES: Record<BrandStingVariant, Timeline> = {
  // The mark mounts LATE (MARK_DELAY) so its takeoff one-shot — trail draw + plane
  // spark — plays as the climax once the cloud has cleared, not buried mid-reveal.
  // TAIL covers the ~1.1s one-shot so the spark always completes before fade-out.
  full: {
    HOLD: 0.25, FILL_FADE: 1.5, RUSH_SPAN: 1.5, PUFF_DUR: 1.7,
    MARK_DELAY: 1.7, MARK_DUR: 0.6, WORD_DELAY: 2.55, TAIL: 0.7, defaultHold: 600,
  },
  short: {
    // Mark + wordmark emerge together (WORD_DELAY === MARK_DELAY).
    HOLD: 0.12, FILL_FADE: 0.75, RUSH_SPAN: 0.65, PUFF_DUR: 1.0,
    MARK_DELAY: 0.85, MARK_DUR: 0.45, WORD_DELAY: 0.85, TAIL: 1.15, defaultHold: 320,
  },
};

// Billows of cloud arranged radially. Each rushes outward from the centre,
// scaling up and fading as it sweeps past the camera — the forward-flight cue.
// Golden-angle placement keeps the field even with no obvious pattern.
const RUSH_PUFFS = Array.from({ length: 12 }, (_, i) => {
  const ang = (i * 137.508 * Math.PI) / 180;
  const tier = i % 4;
  return {
    dx: Math.cos(ang),
    dy: Math.sin(ang),
    endDist: 48 + tier * 12,            // vw outward at the end of its life
    size: 26 + ((i * 7) % 5) * 7,       // vw
    base: 0.74 + (i % 3) * 0.08,        // start opacity
    s0: 0.55 + (tier % 2) * 0.16,       // start scale (small, far ahead)
    s1: 1.95 + tier * 0.34,             // end scale (large, passing the lens)
    rel: (i % 6) / 6,                   // 0..0.83 stagger fraction
  };
});

// Soft puffy-cumulus textures, baked as SVG background-images. The bumpy
// multi-lobe silhouette + Gaussian blur + lit-crown gradient are rendered INTO
// the image, so each puff stays a cached, GPU-scaled texture (soft edges with
// zero per-frame filter cost). Lumps are [cx, cy, r] in a 240×160 viewBox.
function cloudDataUri(lumps: [number, number, number][]): string {
  const circles = lumps.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#ffffff"/>` +
    `<stop offset="0.5" stop-color="#f1f6ff"/>` +
    `<stop offset="1" stop-color="#d3e2fa"/>` +
    `</linearGradient>` +
    `<filter id="b" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="8"/></filter>` +
    `</defs>` +
    `<g filter="url(#b)" fill="url(#g)"><ellipse cx="120" cy="116" rx="102" ry="32"/>${circles}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const CLOUD_TEX = [
  cloudDataUri([[120, 80, 46], [68, 98, 38], [172, 96, 36], [90, 60, 34], [150, 58, 36], [116, 48, 28]]),
  cloudDataUri([[110, 82, 44], [62, 96, 36], [166, 90, 40], [96, 58, 32], [140, 54, 34], [120, 44, 26]]),
  cloudDataUri([[124, 78, 44], [72, 94, 40], [176, 98, 34], [88, 62, 30], [148, 60, 32], [112, 46, 30]]),
];

// Full-bleed white-out — guarantees a fully immersed white frame at the start,
// then thins as you push through into clear sky.
function CloudFill({ reduce, t }: { reduce: boolean; t: Timeline }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 6,
        background: 'radial-gradient(ellipse 95% 95% at 50% 48%, #ffffff 0%, #f4f8ff 55%, #e9f1fd 100%)',
      }}
      initial={reduce ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={reduce ? { duration: 0 } : { delay: t.HOLD, duration: t.FILL_FADE, ease: 'easeIn' }}
    />
  );
}

function CloudRush({ reduce, t }: { reduce: boolean; t: Timeline }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 8 }}>
      {RUSH_PUFFS.map((p, i) => {
        // Match the texture's 240×160 aspect so the cloud isn't squashed.
        const w = p.size * 2;
        const h = w * (160 / 240);
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: `${w}vw`,
              height: `${h}vw`,
              marginLeft: `-${w / 2}vw`,
              marginTop: `-${h / 2}vw`,
              // Pre-blurred SVG cloud texture → soft edges with no per-frame
              // filter; each puff stays a GPU-composited transform layer.
              willChange: 'transform, opacity',
              backgroundImage: CLOUD_TEX[i % 3],
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
            initial={
              reduce
                ? { opacity: 0 }
                : { x: `${p.dx * 6}vw`, y: `${p.dy * 6}vw`, scale: p.s0, opacity: p.base }
            }
            animate={
              reduce
                ? { opacity: 0 }
                : { x: `${p.dx * p.endDist}vw`, y: `${p.dy * p.endDist}vw`, scale: p.s1, opacity: 0 }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    // Accelerate as it nears the lens (easeIn) → it whips past.
                    x: { delay: t.HOLD + p.rel * t.RUSH_SPAN, duration: t.PUFF_DUR, ease: 'easeIn' },
                    y: { delay: t.HOLD + p.rel * t.RUSH_SPAN, duration: t.PUFF_DUR, ease: 'easeIn' },
                    scale: { delay: t.HOLD + p.rel * t.RUSH_SPAN, duration: t.PUFF_DUR, ease: 'easeIn' },
                    opacity: { delay: t.HOLD + p.rel * t.RUSH_SPAN + t.PUFF_DUR * 0.3, duration: t.PUFF_DUR * 0.7, ease: 'easeOut' },
                  }
            }
          />
        );
      })}
    </div>
  );
}

export function BrandSting({
  variant = 'full',
  onComplete,
  showWordmark = true,
  tagline,
  markSize = 210,
  holdMs,
}: BrandStingProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduce = !!prefersReducedMotion;
  const t = TIMELINES[variant];
  const hold = holdMs ?? t.defaultHold;
  const revealDone = t.WORD_DELAY + t.TAIL;
  const sceneDur = revealDone + hold / 1000 + 0.5;

  const [phase, setPhase] = useState<'in' | 'out'>('in');
  // Mount the mark as the cloud thins so its draw plays while it emerges through.
  const [showMark, setShowMark] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    const markTimer = setTimeout(() => setShowMark(true), t.MARK_DELAY * 1000);
    return () => clearTimeout(markTimer);
  }, [reduce, t.MARK_DELAY]);

  useEffect(() => {
    const totalMs = reduce ? 1400 : revealDone * 1000 + hold;
    const outTimer = setTimeout(() => setPhase('out'), totalMs);
    const doneTimer = setTimeout(() => onComplete?.(), totalMs + 500);
    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [reduce, hold, revealDone, onComplete]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        // Deep brand-blue sky you break through into — white clouds pop and the
        // on-dark wordmark stays legible.
        background:
          'linear-gradient(180deg, #04122b 0%, #0a2550 40%, #0e3468 72%, #134080 100%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: phase === 'out' ? 0.45 : 0.2, ease: 'easeOut' }}
    >
      {/* Cinematic push-in — the whole scene drives forward through the cloud. */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: '50% 48%', willChange: 'transform' }}
        initial={{ scale: 1 }}
        animate={{ scale: reduce ? 1 : 1.08 }}
        transition={reduce ? { duration: 0 } : { duration: sceneDur, ease: 'easeOut' }}
      >
        {/* The mark — emerges through the thinning cloud, coming toward you. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 4 }}>
          <motion.div
            className="flex items-center justify-center"
            style={{ height: markSize }}
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { delay: t.MARK_DELAY, duration: t.MARK_DUR, ease: [0.16, 1, 0.3, 1] }}
          >
            {showMark && <TakeoffSpark key={markSize} size={markSize} label="LessonCaptain" />}
          </motion.div>

          {showWordmark && (
            <motion.div
              className="mt-6 flex flex-col items-center"
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { delay: t.WORD_DELAY, duration: 0.6, ease: 'easeOut' }}
            >
              <Image
                src="/lessoncaptain-logo-on-dark-v2.svg"
                alt="LessonCaptain"
                width={360}
                height={58}
                unoptimized
                priority
                style={{ height: Math.round(markSize * 0.3), width: 'auto' }}
              />
              {tagline && (
                <p
                  className="mt-2.5 text-center font-medium tracking-[0.18em] uppercase"
                  style={{ fontSize: 11, color: 'rgba(207,226,255,0.72)' }}
                >
                  {tagline}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Full white immersion, then billows rushing past the lens. */}
        <CloudFill reduce={reduce} t={t} />
        <CloudRush reduce={reduce} t={t} />
      </motion.div>

      {/* Soft vignette to seat the whole frame (outside the push-in). */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 14, background: 'radial-gradient(ellipse 82% 82% at 50% 50%, transparent 60%, rgba(4,12,28,0.38) 100%)' }}
      />
    </motion.div>
  );
}
