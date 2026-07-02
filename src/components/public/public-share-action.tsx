'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export function PublicShareAction({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
  }, []);

  async function handleShare() {
    const url = window.location.href;
    const shareData = { title, text, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-cyan-200/20 bg-cyan-300/[0.1] px-3 text-xs font-bold text-cyan-50 transition-colors hover:bg-cyan-300/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      <span>{copied ? 'Copied' : 'Share'}</span>
    </button>
  );
}
