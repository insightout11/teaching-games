'use client';

import { useState } from 'react';
import { Check, Link2Off, Share2 } from 'lucide-react';

export function ClassLogbookShareControl({
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
      const response = await fetch('/api/class-logbook/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, enabled: nextEnabled }),
      });
      const data = await response.json().catch(() => null) as { shareEnabled?: boolean; shareToken?: string; error?: string } | null;
      if (!response.ok || !data?.shareToken) {
        setStatus('error');
        return;
      }

      setEnabled(Boolean(data.shareEnabled));
      setToken(data.shareToken);

      if (nextEnabled) {
        const url = `${window.location.origin}/logbook/${data.shareToken}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // Clipboard can be blocked; the link is still live.
        }
        setStatus('copied');
        window.setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('error');
    }
  }

  async function copyLink() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/logbook/${token}`);
    } catch {
      // Ignore clipboard failures.
    }
    setStatus('copied');
    window.setTimeout(() => setStatus('idle'), 2000);
  }

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => toggle(true)}
        disabled={status === 'working'}
        title="This page is public and searchable — your class name is shown"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover disabled:opacity-60"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        {status === 'working' ? 'Sharing...' : status === 'error' ? 'Try again' : 'Share logbook'}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-lc-success">
          <span className="h-1.5 w-1.5 rounded-full bg-lc-success" />
          Link live
        </span>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1 text-xs font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover"
        >
          {status === 'copied' ? <><Check className="h-3.5 w-3.5" aria-hidden /> Copied</> : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={status === 'working'}
          title="Turn off sharing"
          className="text-lc-text3 transition-colors hover:text-lc-danger disabled:opacity-60"
        >
          <Link2Off className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <p className="text-[10px] text-lc-text3">Public and searchable — your class name is shown.</p>
    </div>
  );
}
