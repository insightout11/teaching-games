'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** The join link, copied in one click (paste it into the Zoom chat). */
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: select-and-copy fallback.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* give up quietly */ }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return { copied, copy };
}

/** The link as text you can click to copy. */
export function CopyLinkText({ url, className = '' }: { url: string; className?: string }) {
  const { copied, copy } = useCopy(url);
  return (
    <button type="button" onClick={() => void copy()} title="Copy the join link" className={`group inline-flex max-w-full items-start gap-1.5 text-left hover:text-white ${className}`}>
      <span className="break-all">{url.replace(/^https?:\/\//, '')}</span>
      {copied
        ? <span className="flex shrink-0 items-center gap-0.5 text-emerald-300"><Check className="h-3.5 w-3.5" />Copied</span>
        : <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />}
    </button>
  );
}

/** Toolbar button: "Copy join link". */
export function CopyLinkButton({ url, className = '' }: { url: string; className?: string }) {
  const { copied, copy } = useCopy(url);
  return (
    <button type="button" onClick={() => void copy()} title={url} className={className}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied!' : 'Copy join link'}
    </button>
  );
}
