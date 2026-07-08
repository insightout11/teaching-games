'use client';

// First-run stage coaching (A3 / Captain's Flight Stage 6b). A dismissible one-line
// "what you do now" hint under the live stage header, shown only for a teacher's
// first few sessions. Projected-safe copy (renders on the shared class screen).

import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { getStageHint } from '@/lib/stage-coaching';

// Shared with the lobby first-flight coach: ?coach=1 forces coaching on any account.
const COACH_FORCE_KEY = 'lc-firstflight-coach-force';
const DISMISSED_KEY = 'lc-stage-coach-dismissed';

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

interface StageCoachHintProps {
  /** Current module/game/activity key (LessonSlot.key). */
  moduleKey: string | undefined;
  /** Teacher is early enough in their tenure to be coached. */
  eligible: boolean;
}

export function StageCoachHint({ moduleKey, eligible }: StageCoachHintProps) {
  const [ready, setReady] = useState(false);
  const [forced, setForced] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('coach') === '1' || localStorage.getItem(COACH_FORCE_KEY) === '1') {
        setForced(true);
      }
      setDismissedKeys(readDismissed());
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const hint = getStageHint(moduleKey);

  const dismiss = () => {
    if (!moduleKey) return;
    const next = new Set(dismissedKeys);
    next.add(moduleKey);
    setDismissedKeys(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* ignore */
    }
  };

  if (!ready || !hint || !moduleKey) return null;
  if (!eligible && !forced) return null;
  // A forced dev preview ignores prior dismissals so the hint can always be re-seen.
  if (!forced && dismissedKeys.has(moduleKey)) return null;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2">
      <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" aria-hidden />
      <p className="flex-1 text-xs leading-snug text-amber-100/90">{hint}</p>
      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 rounded p-0.5 text-amber-200/60 transition-colors hover:bg-white/5 hover:text-amber-100"
        aria-label="Dismiss tip"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
