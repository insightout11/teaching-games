'use client';

import { useState } from 'react';
import { Check, Link2Off, Share2 } from 'lucide-react';

export function JourneyShareControl({
  classId,
  initialShareEnabled,
  initialShareToken,
}: {
  classId: string;
  initialShareEnabled: boolean;
  initialShareToken: string | null;
}) {
  const [enabled, setEnabled] = useState(initialShareEnabled);
  const [token, setToken] = useState(initialShareToken);
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'error'>('idle');

  async function toggle(nextEnabled: boolean) {
    setStatus('working');
    try {
      const res = await fetch('/api/world-flight/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, enabled: nextEnabled }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); return; }

      setEnabled(data.shareEnabled);
      setToken(data.shareToken);

      if (nextEnabled) {
        const url = `${window.location.origin}/journey/${data.shareToken}`;
        try { await navigator.clipboard.writeText(url); } catch { /* clipboard may be blocked — link is still live */ }
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('error');
    }
  }

  async function copyLink() {
    if (!token) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/journey/${token}`); } catch { /* ignore */ }
    setStatus('copied');
    setTimeout(() => setStatus('idle'), 2000);
  }

  if (!enabled) {
    return (
      <button
        onClick={() => toggle(true)}
        disabled={status === 'working'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors disabled:opacity-60"
      >
        <Share2 className="w-3.5 h-3.5" />
        {status === 'working' ? 'Sharing…' : 'Share journey'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs text-lc-success">
        <span className="w-1.5 h-1.5 rounded-full bg-lc-success" />
        Link live
      </span>
      <button onClick={copyLink} className="text-xs font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors inline-flex items-center gap-1">
        {status === 'copied' ? <><Check className="w-3.5 h-3.5" /> Copied</> : 'Copy link'}
      </button>
      <button
        onClick={() => toggle(false)}
        disabled={status === 'working'}
        title="Turn off sharing"
        className="text-lc-text3 hover:text-lc-danger transition-colors disabled:opacity-60"
      >
        <Link2Off className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
