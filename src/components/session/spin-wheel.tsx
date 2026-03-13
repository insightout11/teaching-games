'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, WHEEL_SEGMENTS, type TurnModifier } from '@/stores/session-store';

const SEGMENT_COLORS = [
  'from-cyan-500 to-blue-600',      // x1
  'from-lc-blue to-blue-500',       // x2
  'from-yellow-400 to-orange-500',  // x3
  'from-green-500 to-emerald-600',  // +5
  'from-lc-blue to-sky-500',        // Shield
];

export function SpinWheel({ onComplete }: { onComplete?: (modifier: TurnModifier) => void }) {
  const needsSpin = useSessionStore((s) => s.needsSpin);
  const spinWheel = useSessionStore((s) => s.spinWheel);
  const students = useSessionStore((s) => s.students);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const [spinning, setSpinning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [result, setResult] = useState<TurnModifier | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Animate through segments
    let count = 0;
    const interval = setInterval(() => {
      setDisplayIndex(Math.floor(Math.random() * WHEEL_SEGMENTS.length));
      count++;
      if (count > 20) {
        clearInterval(interval);
        const modifier = spinWheel();
        setResult(modifier);
        setSpinning(false);
        // Don't auto-dismiss - wait for user to click Continue
      }
    }, 100);
  }, [spinning, spinWheel]);

  const handleContinue = useCallback(() => {
    setResult(null);
    onComplete?.(result!);
  }, [result, onComplete]);

  // Show if needsSpin OR if we have a result to show
  const showModal = needsSpin || result !== null;

  if (!currentStudentId) return null;
  if (!showModal) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass p-8 rounded-3xl max-w-md w-full mx-4 text-center"
          >
            {/* Student name */}
            <p className="text-cyan-400 font-bold text-lg mb-2">
              {currentStudent?.name}&apos;s Turn
            </p>

            {/* Wheel display */}
            <div className="relative my-8">
              <motion.div
                animate={spinning ? { rotate: 360 } : {}}
                transition={spinning ? { duration: 0.5, repeat: Infinity, ease: 'linear' } : {}}
                className={`w-40 h-40 mx-auto rounded-full bg-gradient-to-br ${SEGMENT_COLORS[displayIndex]} flex items-center justify-center shadow-2xl border-4 border-white/20`}
              >
                <span className="text-4xl font-game text-white drop-shadow-lg">
                  {result ? result.label : WHEEL_SEGMENTS[displayIndex].modifier.label}
                </span>
              </motion.div>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white" />
              </div>
            </div>

            {/* Result or spin button */}
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-2xl font-game text-yellow-400">
                  {result.label}
                </p>
                <p className="text-sm opacity-60">
                  {result.multiplier > 1 && `Points multiplied by ${result.multiplier}!`}
                  {result.bonus > 0 && `+${result.bonus} bonus points!`}
                  {result.shield && 'Shield active - keeps streak if wrong!'}
                </p>
                <button
                  onClick={handleContinue}
                  className="px-10 py-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full font-game text-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/20"
                >
                  CONTINUE
                </button>
              </motion.div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="px-12 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full font-game text-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/20 disabled:opacity-50"
              >
                {spinning ? 'SPINNING...' : 'SPIN!'}
              </button>
            )}

            {/* Segment legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 text-xs opacity-60">
              {WHEEL_SEGMENTS.map((seg, i) => (
                <span key={i} className="px-2 py-1 rounded bg-white/5">
                  {seg.modifier.label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Badge to show current modifier
export function ModifierBadge() {
  const turnModifier = useSessionStore((s) => s.turnModifier);

  if (!turnModifier) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
        turnModifier.multiplier === 3
          ? 'bg-yellow-500 text-black'
          : turnModifier.multiplier === 2
          ? 'bg-lc-blue text-white'
          : turnModifier.shield
          ? 'bg-sky-500 text-white'
          : turnModifier.bonus > 0
          ? 'bg-green-500 text-white'
          : 'bg-gray-500 text-white'
      }`}
    >
      {turnModifier.label}
    </motion.span>
  );
}
