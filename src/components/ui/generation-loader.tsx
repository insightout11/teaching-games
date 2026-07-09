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
import { TriangleAlert } from 'lucide-react';

/** Side-view jet silhouette, nose pointing right, drawn level (fuselage + nose
 *  cone + tail fin + wing). lucide only ships a top-down Plane, which looks like
 *  a wing is stuck in the runway once rotated flat — so we draw our own. */
function SidePlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 20" fill="currentColor" className={className} aria-hidden>
      {/* fuselage */}
      <rect x="6" y="8.4" width="26" height="3.6" rx="1.8" />
      {/* nose cone */}
      <path d="M30 8.4 L30 12 Q38 11.7 38 10.2 Q38 8.7 30 8.4 Z" />
      {/* tail fin (rear, up) */}
      <path d="M6.5 8.7 L11 8.7 L9.6 3.4 L7.4 3.9 Z" />
      {/* wing (mid, down) */}
      <path d="M17 11.6 L23 11.6 L18 17 L14.5 17 Z" />
    </svg>
  );
}

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
        {/* Plane: level while taxiing, tilts nose-up + climbs only at the end. */}
        <div className="gl-plane absolute bottom-1 left-0" aria-hidden>
          <SidePlane className="h-6 w-11 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        </div>
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
          /* The silhouette is drawn level, so taxiing needs no rotation; the nose
             only lifts (negative rotate) at the very end, just before takeoff. */
          animation: gl-taxi 2.8s ease-in infinite;
        }
        @keyframes gl-scroll {
          to {
            background-position-x: -30px;
          }
        }
        @keyframes gl-taxi {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
            opacity: 0;
          }
          14% {
            opacity: 1;
          }
          /* Taxi phase: level all the way down the runway. */
          72% {
            transform: translateX(150px) translateY(0) rotate(0deg);
            opacity: 1;
          }
          /* Nose-up + climb happen only here, at the end. */
          100% {
            transform: translateX(190px) translateY(-22px) rotate(-16deg);
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
            transform: translateX(-50%);
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
