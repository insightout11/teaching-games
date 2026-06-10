'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

// Teacher control to publish a class's World Flight journey as a public,
// read-only page and copy the link. Enabling is idempotent; the server returns
// the stable share token.
export function ShareJourneyButton({ classId }: { classId: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'error'>('idle');

  async function share() {
    setStatus('working');
    try {
      const res = await fetch('/api/world-flight/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, enabled: true }),
      });
      const data = await res.json();
      if (res.ok && data.shareToken) {
        const url = `${window.location.origin}/journey/${data.shareToken}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          /* clipboard may be blocked — link is still live */
        }
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2500);
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <button
      onClick={share}
      disabled={status === 'working'}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-400/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 transition-colors hover:border-cyan-300/55 hover:bg-cyan-400/12 disabled:opacity-60"
    >
      {status === 'copied' ? (
        <><Check className="h-3.5 w-3.5" aria-hidden /> Link copied!</>
      ) : (
        <><Share2 className="h-3.5 w-3.5" aria-hidden /> {status === 'working' ? 'Sharing…' : status === 'error' ? 'Try again' : 'Share journey'}</>
      )}
    </button>
  );
}
