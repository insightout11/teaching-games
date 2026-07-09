'use client';

// Shared generation loader (perf plan Phase 3 / B1). One aviation-branded wait
// state replacing the ~38 bare spinners scattered across games/activities.
//
// Two behaviours that a bare spinner can't give:
// 1. Self-skip: renders nothing for the first ~400ms, so cache hits (which return
//    almost instantly) never flash a loader — only genuine waits show it.
// 2. Staged, reassuring copy that advances as the wait grows ("Filing your flight
//    plan…" → "Taxiing…" → "Cleared for takeoff"), so a 2–8s custom-topic /
//    source generation feels intentional rather than stuck.
//
// GenerationDegradedNote lives here too — the same surface communicates when the
// system fell back to a backup set (degraded: true from the generate routes).

import { useEffect, useState } from 'react';
import { Plane, TriangleAlert } from 'lucide-react';

// Below this, a loader would only flash — cache hits land here. Keep in sync with
// the perf-plan note (~400ms).
const SELF_SKIP_MS = 400;

const STAGES = [
  'Filing your flight plan…',
  'Taxiing to the runway…',
  'Cleared for takeoff…',
] as const;
// How long each stage shows before advancing to the next (last one holds).
const STAGE_MS = 2200;

interface GenerationLoaderProps {
  /** What is being made, woven into the copy (e.g. "quiz", "puzzle"). Optional. */
  label?: string;
  /** Extra classes for the outer wrapper (sizing/spacing per host). */
  className?: string;
}

export function GenerationLoader({ label, className }: GenerationLoaderProps) {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(0);

  // Hold the UI back briefly so fast/cached responses don't flash a loader.
  useEffect(() => {
    const show = setTimeout(() => setVisible(true), SELF_SKIP_MS);
    return () => clearTimeout(show);
  }, []);

  // Advance the reassuring copy while the wait continues.
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const headline = label
    ? `Preparing your ${label}`
    : STAGES[stage];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 py-12 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      {/* Runway: the plane taxis LEVEL along the centerline, then rotates nose-up
          and lifts off only in the final moment — a takeoff pose while still
          taxiing looks unnatural. */}
      <div className="relative h-16 w-56 overflow-hidden">
        {/* Runway surface */}
        <div className="absolute inset-x-0 bottom-3 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        {/* Dashed centerline sliding left → conveys forward motion */}
        <div className="gl-runway absolute inset-x-0 bottom-[13px] h-[2px]" aria-hidden />
        {/* Plane: level while taxiing, tilts + climbs only at the end. */}
        <Plane className="gl-plane absolute bottom-1 left-0 h-7 w-7 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" aria-hidden />
      </div>

      <div className="space-y-1 text-center">
        <p className="font-instrument text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
          {label ? STAGES[stage] : 'Generating'}
        </p>
        <p className="font-game text-lg tracking-wide text-lc-text">{headline}</p>
      </div>

      <style jsx>{`
        .gl-runway {
          background-image: linear-gradient(
            to right,
            rgba(148, 163, 184, 0.5) 0 14px,
            transparent 14px 30px
          );
          background-size: 30px 100%;
          animation: gl-scroll 0.8s linear infinite;
        }
        .gl-plane {
          /* lucide's plane points straight up by default; rotate(90deg) makes it
             sit level, nose pointing right down the runway. Takeoff eases back
             toward nose-up (less rotation). */
          transform: rotate(90deg);
          animation: gl-taxi 2.8s ease-in infinite;
        }
        @keyframes gl-scroll {
          to {
            background-position-x: -30px;
          }
        }
        @keyframes gl-taxi {
          0% {
            transform: translateX(0) translateY(0) rotate(90deg);
            opacity: 0;
          }
          14% {
            opacity: 1;
          }
          /* Taxi phase: level (rotate held at 90deg) all the way down the runway. */
          72% {
            transform: translateX(168px) translateY(0) rotate(90deg);
            opacity: 1;
          }
          /* Rotation + climb happen only here, at the end. */
          100% {
            transform: translateX(210px) translateY(-22px) rotate(62deg);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gl-runway {
            animation: none;
          }
          .gl-plane {
            left: 50%;
            animation: none;
            transform: translateX(-50%) rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}

interface GenerationDegradedNoteProps {
  className?: string;
}

/** Shown alongside generated content when the route fell back (degraded: true).
 *  Reassures the teacher the lesson is still usable and on-topic. */
export function GenerationDegradedNote({ className }: GenerationDegradedNoteProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 ${className ?? ''}`}
      role="status"
    >
      <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 text-amber-300" aria-hidden />
      <p className="text-xs text-amber-100/80">Using a backup set — still on topic. Regenerate if you want a fresh one.</p>
    </div>
  );
}
