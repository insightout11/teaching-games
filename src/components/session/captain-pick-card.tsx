'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { SPOTLIGHT_TAG_META, type SpotlightPayload, type SpotlightTag } from '@/lib/spotlight';

interface ActiveSpotlight {
  label: string;
  studentName: string;
  text: string;
  tag?: SpotlightTag;
  highlight?: string | null;
  prompt?: string | null;
  key: string; // unique key per spotlight so AnimatePresence re-mounts on new spotlight
}

// How long the full reveal stays up before docking to a corner chip.
// The chip then persists until dismissed or replaced — a Captain's Pick is a
// reference point for the class, not a toast.
const DOCK_MS = 9000;

/** Render the quote with the highlighted phrase marked, when present. */
function QuoteText({ text, highlight }: { text: string; highlight?: string | null }) {
  if (!highlight) return <>&ldquo;{text}&rdquo;</>;
  const index = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (index < 0) return <>&ldquo;{text}&rdquo;</>;
  const before = text.slice(0, index);
  const match = text.slice(index, index + highlight.length);
  const after = text.slice(index + highlight.length);
  return (
    <>
      &ldquo;{before}
      <span className="rounded bg-amber-400/20 px-1 text-amber-200 shadow-[inset_0_-2px_0_rgba(251,191,36,0.6)]">
        {match}
      </span>
      {after}&rdquo;
    </>
  );
}

export function CaptainPickCard({ sessionId }: { sessionId: string }) {
  const [spotlight, setSpotlight] = useState<ActiveSpotlight | null>(null);
  const [docked, setDocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpotlight(null);
    setDocked(false);
  };

  const showSpotlight = (payload: SpotlightPayload, createdAt: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpotlight({
      label: payload.label,
      studentName: payload.studentName,
      text: payload.text,
      tag: payload.tag,
      highlight: payload.highlight,
      prompt: payload.prompt,
      key: createdAt,
    });
    setDocked(false);
    timerRef.current = setTimeout(() => setDocked(true), DOCK_MS);
  };

  useEffect(() => {
    if (isMockMode()) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`captain-pick:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_private_state',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const row = payload.new as { key: string; payload: SpotlightPayload; updated_at: string } | null;
          if (row?.key === 'spotlight' && row.payload?.type === 'spotlight') {
            showSpotlight(row.payload, row.updated_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const tagLabel = spotlight?.tag ? SPOTLIGHT_TAG_META[spotlight.tag]?.label : null;

  return (
    <>
      {/* Full reveal — center stage, stamps in like a passport stamp */}
      <AnimatePresence>
        {spotlight && !docked && (
          <motion.div
            key={`reveal-${spotlight.key}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="fixed inset-0 z-[160] flex items-center justify-center px-4 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setDocked(true)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 1.45, rotate: -7 }}
              animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, mass: 0.9 }}
              className="w-full max-w-2xl cursor-pointer rounded-3xl border-2 border-amber-400/50 bg-[#0d1a2e]/95 p-8 shadow-[0_0_60px_rgba(251,191,36,0.25)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-amber-400 text-2xl">✦</span>
                <span className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">{spotlight.label}</span>
                {tagLabel && (
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
                    {tagLabel}
                  </span>
                )}
                <span className="ml-auto text-xs opacity-35">tap to dock</span>
              </div>
              {spotlight.prompt && (
                <p className="mt-4 text-sm text-amber-100/50">
                  <span className="uppercase tracking-widest text-[11px] text-amber-300/60">Question</span>
                  <br />
                  {spotlight.prompt}
                </p>
              )}
              <p className="mt-5 text-2xl md:text-3xl leading-snug font-medium text-white">
                <QuoteText text={spotlight.text} highlight={spotlight.highlight} />
              </p>
              <p className="mt-4 text-base text-amber-100/70">— {spotlight.studentName}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked chip — stays until dismissed or replaced so the class can keep referring to it */}
      <AnimatePresence>
        {spotlight && docked && (
          <motion.button
            key={`dock-${spotlight.key}`}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={dismiss}
            className="fixed bottom-6 right-6 z-[160] max-w-sm rounded-2xl border border-amber-500/40 bg-[#0d1a2e]/95 px-4 py-3 text-left shadow-lg shadow-amber-500/15 hover:border-amber-400/60 transition-colors"
            title="Dismiss"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400">✦</span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {tagLabel ?? spotlight.label}
              </span>
              <span className="text-xs text-white/40">· {spotlight.studentName}</span>
            </div>
            <p className="mt-1 truncate text-sm text-white/80">&ldquo;{spotlight.text}&rdquo;</p>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
