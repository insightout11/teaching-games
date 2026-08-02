'use client';

// First-flight cockpit nudge (A3 / Captain's Flight Stage 6b). New teachers don't
// discover the private cockpit on their own, so on their first sessions the lobby
// points at the existing "Open cockpit" control. Dismissible; projected-safe copy.

import { useEffect, useState } from 'react';
import { LayoutDashboard, X } from 'lucide-react';

const DONE_KEY = 'lc-cockpit-nudge-done';
// Shared dev override with the other first-flight coaches: ?coach=1 forces it on.
const FORCE_KEY = 'lc-firstflight-coach-force';

interface LobbyCockpitNudgeProps {
  /** Teacher is early enough in their tenure to be shown the nudge. */
  eligible: boolean;
}

export function LobbyCockpitNudge({ eligible }: LobbyCockpitNudgeProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('coach') === '1' || localStorage.getItem(FORCE_KEY) === '1') {
        setForced(true);
      } else if (localStorage.getItem(DONE_KEY) === '1') {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if ((!eligible && !forced) || !ready || dismissed) return null;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-left">
      <LayoutDashboard className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-300" aria-hidden />
      <p className="flex-1 text-xs leading-snug text-violet-100/85">
        New here? <span className="font-semibold">Open Teacher Cockpit</span> on your phone or a second tab — it&apos;s your private control panel, and students never see it.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 rounded p-0.5 text-violet-200/60 transition-colors hover:bg-white/5 hover:text-violet-100"
        aria-label="Dismiss cockpit tip"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
