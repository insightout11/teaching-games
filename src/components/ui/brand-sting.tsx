'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { TakeoffSpark } from './takeoff-spark';

/**
 * BrandSting — the LessonCaptain signature reveal. Big fluffy cloud banks part
 * to break a pocket of luminous sky, the takeoff mark resolves in the clearing
 * (light breaking through), then the wordmark settles beneath. A premium,
 * low-frequency brand moment for session bookends and the first-load splash —
 * NOT a per-module transition (scarcity is what keeps it feeling premium).
 *
 * Root is `absolute inset-0`; wrap in a `fixed inset-0 z-[...]` parent to use it
 * as a full-screen overlay, or drop it in any relative box for a framed preview.
 */
export interface BrandStingProps {
  /** Fired once the sting (including its fade-out) has fully finished. */
  onComplete?: () => void;
  /** Show the wordmark lockup beneath the mark (default true). */
  showWordmark?: boolean;
  /** Optional one-line tagline under the wordmark. */
  tagline?: string;
  /** Hero size of the takeoff mark in px (default 128). */
  markSize?: number;
  /** Extra hold (ms) on the resolved frame before fading out (default 800). */
  holdMs?: number;
}

// ─── Timeline (seconds) ───────────────────────────────────────────────────────
const PART_DELAY = 0.4;   // clouds begin to part
const PART_DUR = 1.15;    // how long the part takes
const MARK_DELAY = 0.72;  // takeoff mark begins resolving in the clearing
const BLOOM_DELAY = 0.6;  // light-break glow ignites just before the mark
const WORD_DELAY = 1.62;  // wordmark settles in
const REVEAL_DONE = WORD_DELAY + 0.6;

// A single soft cumulus puff. Coordinates are % of the parent cloud bank box.
type Puff = { x: number; y: number; w: number; h: number; blur: number; op: number };

// Left bank: a billowy mass weighted toward its inner (right) edge so the two
// banks overlap and fully cover the centre before they part.
const LEFT_PUFFS: Puff[] = [
  { x: 86, y: 36, w: 50, h: 64, blur: 10, op: 1 },
  { x: 70, y: 56, w: 46, h: 58, blur: 12, op: 0.98 },
  { x: 56, y: 40, w: 42, h: 54, blur: 12, op: 0.96 },
  { x: 42, y: 62, w: 40, h: 52, blur: 14, op: 0.94 },
  { x: 26, y: 48, w: 38, h: 50, blur: 16, op: 0.9 },
  { x: 92, y: 72, w: 38, h: 50, blur: 12, op: 0.96 },
  { x: 62, y: 76, w: 44, h: 54, blur: 14, op: 0.94 },
  { x: 10, y: 64, w: 34, h: 46, blur: 18, op: 0.82 },
];

function bankPuffs(side: 'left' | 'right'): Puff[] {
  return side === 'left' ? LEFT_PUFFS : LEFT_PUFFS.map((p) => ({ ...p, x: 100 - p.x }));
}

function CloudBank({ side, reduce }: { side: 'left' | 'right'; reduce: boolean }) {
  const puffs = bankPuffs(side);
  // Banks are 80vw wide and overlap in the middle (left covers -10→70vw,
  // right covers 30→110vw) so the clearing is sealed before the part.
  const left = side === 'left' ? '-10vw' : '30vw';
  const partX = side === 'left' ? '-44vw' : '44vw';
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ left, width: '80vw', height: '100%', zIndex: 12 }}
      initial={reduce ? { x: partX } : { x: 0, scale: 1 }}
      animate={reduce ? { x: partX } : { x: partX, scale: 1.06 }}
      transition={reduce ? { duration: 0 } : { delay: PART_DELAY, duration: PART_DUR, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {puffs.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.w}%`,
            height: `${p.h}%`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            opacity: p.op,
            filter: `blur(${p.blur}px)`,
            // Warm-lit crown, cool blue underside — gives the puffs real volume.
            background:
              'radial-gradient(ellipse 64% 60% at 50% 36%, #ffffff 0%, #f4f8ff 42%, #dbe8fb 70%, rgba(196,216,248,0.55) 86%, rgba(196,216,248,0) 100%)',
          }}
        />
      ))}
    </motion.div>
  );
}

// Slow, distant clouds for parallax depth behind the parting banks.
function DepthClouds({ reduce }: { reduce: boolean }) {
  const bands = [
    { top: '18%', w: 30, h: 14, op: 0.32, dur: 26, from: '-20vw', to: '120vw' },
    { top: '64%', w: 38, h: 17, op: 0.26, dur: 34, from: '120vw', to: '-30vw' },
    { top: '44%', w: 24, h: 11, op: 0.22, dur: 30, from: '-15vw', to: '120vw' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 4 }}>
      {bands.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: b.top,
            width: `${b.w}vw`,
            height: `${b.h}vh`,
            borderRadius: '50%',
            opacity: b.op,
            filter: 'blur(20px)',
            background: 'radial-gradient(ellipse at center, #eef4ff 0%, #cfe0fa 55%, rgba(207,224,250,0) 80%)',
          }}
          initial={{ x: reduce ? b.from : b.from }}
          animate={reduce ? { x: b.from } : { x: b.to }}
          transition={reduce ? { duration: 0 } : { duration: b.dur, ease: 'linear', repeat: Infinity }}
        />
      ))}
    </div>
  );
}

export function BrandSting({
  onComplete,
  showWordmark = true,
  tagline,
  markSize = 128,
  holdMs = 800,
}: BrandStingProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduce = !!prefersReducedMotion;
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const totalMs = reduce ? 1400 : REVEAL_DONE * 1000 + holdMs;
    const outTimer = setTimeout(() => setPhase('out'), totalMs);
    const doneTimer = setTimeout(() => onComplete?.(), totalMs + 520);
    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [reduce, holdMs, onComplete]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        // Deep, premium brand-blue sky so white clouds pop and the mark reads in
        // the clearing — the pocket the clouds reveal is luminous, not flat.
        background:
          'linear-gradient(180deg, #061634 0%, #0b2a5e 38%, #15498f 72%, #1d63b8 100%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: phase === 'out' ? 0.5 : 0.35, ease: 'easeOut' }}
    >
      {/* Light-break bloom — warm-white sun glow behind the clearing, igniting as
          the clouds open so the mark looks lit from behind. */}
      <motion.div
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: '120vmin',
          height: '120vmin',
          transform: 'translate(-50%, -54%)',
          borderRadius: '50%',
          zIndex: 6,
          background:
            'radial-gradient(circle at center, rgba(255,252,240,0.85) 0%, rgba(180,214,255,0.4) 26%, rgba(120,170,250,0.12) 48%, rgba(120,170,250,0) 70%)',
          filter: 'blur(8px)',
        }}
        initial={reduce ? { opacity: 0.9, scale: 1 } : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: reduce ? 0.9 : [0, 0.95, 0.7], scale: reduce ? 1 : [0.7, 1.05, 1] }}
        transition={reduce ? { duration: 0 } : { delay: BLOOM_DELAY, duration: 1.6, ease: 'easeOut', times: [0, 0.5, 1] }}
      />

      <DepthClouds reduce={reduce} />

      {/* The hero lockup — mark resolves in the clearing, wordmark settles under. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
        <motion.div
          initial={reduce ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.86, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { delay: MARK_DELAY, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* key remount via markSize so the dev replay re-runs the takeoff one-shot */}
          <TakeoffSpark key={markSize} size={markSize} label="LessonCaptain" />
        </motion.div>

        {showWordmark && (
          <motion.div
            className="mt-5 flex flex-col items-center"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { delay: WORD_DELAY, duration: 0.6, ease: 'easeOut' }}
          >
            <Image
              src="/lessoncaptain-logo-on-dark-v2.svg"
              alt="LessonCaptain"
              width={360}
              height={58}
              unoptimized
              priority
              style={{ height: Math.round(markSize * 0.34), width: 'auto' }}
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

      {/* Parting cloud banks sit ABOVE the lockup so the mark is revealed from
          behind them, not faded on top. */}
      <CloudBank side="left" reduce={reduce} />
      <CloudBank side="right" reduce={reduce} />

      {/* Soft vignette to seat the whole frame. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 14, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 58%, rgba(4,12,28,0.4) 100%)' }}
      />
    </motion.div>
  );
}
