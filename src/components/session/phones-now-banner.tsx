'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { play } from '@/lib/audio/manager';
import { useFocusBus } from '@/stores/focus-bus-store';
import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';

/**
 * On the shared screen: tells the class when their phones want something (Oct 2026 rethink).
 * - Announced once per kind of task (a game, the Class Board, a vote): not on every round inside an activity (rounds
 *   clear the phones for a moment), and not again after a short gap (under 20 s) in the same task.
 * - A small banner slides in at the top for a few seconds (with the seatbelt chime, if on), then a corner chip says
 *   what is on the phones while they are open. No full-screen takeover: the phones themselves buzz.
 * - The teacher chooses in the room menu: announce with chime, announce quietly, or off (`lc-phones-announce`).
 */

export type PhonesAnnounce = 'chime' | 'quiet' | 'off';
export const PHONES_ANNOUNCE_KEY = 'lc-phones-announce';
export function phonesAnnounceMode(): PhonesAnnounce {
  try { const v = localStorage.getItem(PHONES_ANNOUNCE_KEY); return v === 'quiet' || v === 'off' ? v : 'chime'; } catch { return 'chime'; }
}
export function setPhonesAnnounceMode(mode: PhonesAnnounce) {
  try { localStorage.setItem(PHONES_ANNOUNCE_KEY, mode); } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent('lc-phones-announce', { detail: mode }));
}

const BANNER_MS = 3500;
const SAME_TASK_GAP_MS = 20_000;

function taskLabel(key: string): string {
  if (key === 'board') return 'Class Board';
  if (key === 'poll') return 'Class vote';
  if (key === 'phones') return 'Answer on your phones';
  return getGame(key)?.name ?? getActivity(key)?.name ?? 'Answer on your phones';
}

export function PhonesNowBanner() {
  const spec = useSessionStore((s) => s.inputSpec);
  const asks = useFocusBus((s) => s.phoneAsks);
  // what is on the phones: the task (its game or activity), the Class Board, or a vote
  const taskKey: string | null = spec ? (spec.type === 'board' ? 'board' : spec.gameKey || 'phones') : asks[0] ?? null;
  const [mode, setMode] = useState<PhonesAnnounce>('chime');
  useEffect(() => {
    setMode(phonesAnnounceMode());
    const on = (e: Event) => setMode((e as CustomEvent<PhonesAnnounce>).detail);
    window.addEventListener('lc-phones-announce', on);
    return () => window.removeEventListener('lc-phones-announce', on);
  }, []);

  const [banner, setBanner] = useState<string | null>(null);
  const last = useRef<{ key: string | null; endedAt: number }>({ key: null, endedAt: 0 });
  const wasActive = useRef(false);
  useEffect(() => {
    const active = taskKey !== null;
    if (!active) {
      if (wasActive.current) last.current.endedAt = Date.now();
      wasActive.current = false;
      return;
    }
    const sameTask = last.current.key === taskKey && (wasActive.current || Date.now() - last.current.endedAt < SAME_TASK_GAP_MS);
    wasActive.current = true;
    last.current.key = taskKey;
    if (sameTask || mode === 'off') return;
    setBanner(taskLabel(taskKey));
    if (mode === 'chime') { try { play('seatbelt'); } catch { /* sound off */ } }
    const t = window.setTimeout(() => setBanner(null), BANNER_MS);
    return () => window.clearTimeout(t);
  }, [taskKey, mode]);

  const label = taskKey ? taskLabel(taskKey) : null;
  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key="banner"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          className="pointer-events-none fixed left-1/2 top-16 z-[70] -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-full border-2 border-amber-300 bg-amber-300 px-5 py-2 font-game text-xl text-slate-900 shadow-[0_0_30px_rgba(252,211,77,0.55)]">
            <Smartphone className="h-6 w-6" aria-hidden />
            On your phones: {banner}
          </div>
        </motion.div>
      )}
      {!banner && label && mode !== 'off' && (
        <motion.div
          key="chip"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.9, scale: 1 }}
          exit={{ opacity: 0 }}
          title="On the students' phones now"
          className="pointer-events-none fixed right-4 top-16 z-[70]"
        >
          <span className="flex max-w-[16rem] items-center gap-1.5 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
            <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">Phones: {label}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
