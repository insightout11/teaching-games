'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotlightPayload {
  type: 'spotlight';
  label: string;
  studentName: string;
  text: string;
  createdAt: string;
}

interface ActiveSpotlight {
  label: string;
  studentName: string;
  text: string;
  key: string; // unique key per spotlight so AnimatePresence re-mounts on new spotlight
}

const DISMISS_MS = 5000;

export function CaptainPickCard({ sessionId }: { sessionId: string }) {
  const [spotlight, setSpotlight] = useState<ActiveSpotlight | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpotlight(null);
  };

  const showSpotlight = (payload: SpotlightPayload, createdAt: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpotlight({
      label: payload.label,
      studentName: payload.studentName,
      text: payload.text,
      key: createdAt,
    });
    timerRef.current = setTimeout(() => setSpotlight(null), DISMISS_MS);
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

  return (
    <AnimatePresence>
      {spotlight && (
        <motion.div
          key={spotlight.key}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[160] w-full max-w-lg px-4"
          onClick={dismiss}
        >
          <div className="glass rounded-2xl border border-amber-500/40 shadow-2xl shadow-amber-500/20 p-6 space-y-3 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">✦</span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">{spotlight.label}</span>
              <span className="ml-auto text-xs opacity-40">tap to dismiss</span>
            </div>
            <p className="text-xl leading-snug font-medium">&ldquo;{spotlight.text}&rdquo;</p>
            <p className="text-sm opacity-60">{spotlight.studentName}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
