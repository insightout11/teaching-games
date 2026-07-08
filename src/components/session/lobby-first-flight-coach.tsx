'use client';

// First-flight onboarding (A3 / Captain's Flight Stage 6a). On a new teacher's
// first sessions, nudges them to scan the lobby Join QR with their OWN phone and
// ride along as a student — the demo crew is dead, so a real second device is the
// only way to feel the student loop. Interactive: celebrates when the first
// passenger boards, proving the loop end-to-end. Projected-safe copy (this strip
// renders on the shared lobby screen).

import { useEffect, useRef, useState } from 'react';
import { QrCode, PartyPopper, X, CornerRightDown } from 'lucide-react';

const COACH_DONE_KEY = 'lc-firstflight-coach-done';

interface LobbyFirstFlightCoachProps {
  /** Teacher is early enough in their tenure to be shown the nudge. */
  eligible: boolean;
  /** Live count of boarded passengers this session. */
  participantCount: number;
}

export function LobbyFirstFlightCoach({ eligible, participantCount }: LobbyFirstFlightCoachProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [boarded, setBoarded] = useState(false);
  const everBoardedRef = useRef(false);

  // Read the "already done it" flag after mount to stay hydration-safe.
  useEffect(() => {
    try {
      if (localStorage.getItem(COACH_DONE_KEY) === '1') setDismissed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Celebrate the first board — and mark the loop proven so it never re-nags.
  useEffect(() => {
    if (participantCount > 0 && !everBoardedRef.current) {
      everBoardedRef.current = true;
      setBoarded(true);
      try {
        localStorage.setItem(COACH_DONE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [participantCount]);

  const dismiss = () => {
    try {
      localStorage.setItem(COACH_DONE_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (!eligible || !ready || dismissed) return null;

  return (
    <div
      className={`mb-3 flex-shrink-0 flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-colors ${
        boarded
          ? 'border-emerald-400/30 bg-emerald-500/10'
          : 'border-cyan-400/30 bg-cyan-500/10'
      }`}
      role="status"
    >
      <span
        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${
          boarded ? 'bg-emerald-400/15 text-emerald-300' : 'bg-cyan-400/15 text-cyan-300'
        }`}
      >
        {boarded ? <PartyPopper className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
      </span>

      <div className="min-w-0 flex-1">
        {boarded ? (
          <>
            <p className="text-sm font-semibold text-emerald-200">Boarded — the student loop works.</p>
            <p className="text-xs text-emerald-100/70">
              That phone now sees exactly what your class sees. Press <span className="font-semibold">Cleared for takeoff</span> below to run a live round.
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-cyan-100">
              First flight? Ride along as a student.
            </p>
            <p className="text-xs text-cyan-100/70">
              Scan the <span className="font-semibold">Join QR</span>
              <CornerRightDown className="mx-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
              with your own phone to feel the student side before your class does.
            </p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 rounded-lg p-1.5 text-lc-text3 transition-colors hover:bg-white/5 hover:text-lc-text"
        aria-label="Dismiss first-flight tip"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
