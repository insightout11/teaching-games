'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Crosshair } from 'lucide-react';
import { HUNT_GOAL, HUNT_HEARTBEAT_MS, HUNT_MAX, huntMission, openHuntChannel, phraseMission } from '@/lib/live-room/hunt';
import { buzz, BUZZ } from './phone-shell';

/**
 * Grammar Hunt on the phone: a slim secret-mission strip under the boarding pass whenever the
 * lesson has a grammar target. "I did it!" stamps a slot (2 + a bonus). Self-reported, like the
 * phrasebook's "I used it!"; the total is broadcast to the teacher (re-announced periodically).
 */
export function GrammarHuntStrip({ sessionId, clientId, name, target, phrases }: { sessionId: string; clientId: string; name: string; target?: string | null; phrases?: string[] }) {
  const storageKey = `lc-hunt-${sessionId}-${target ?? 'phrases'}`;
  const [count, setCount] = useState(0);
  const [fresh, setFresh] = useState(false);
  const channel = useRef<ReturnType<typeof openHuntChannel> | null>(null);

  useEffect(() => {
    try { setCount(Math.min(HUNT_MAX, Number(localStorage.getItem(storageKey) ?? 0) || 0)); } catch { setCount(0); }
  }, [storageKey]);

  useEffect(() => {
    const ch = openHuntChannel(sessionId, () => {});
    channel.current = ch;
    return () => { ch.close(); channel.current = null; };
  }, [sessionId]);

  useEffect(() => {
    const announce = () => channel.current?.send({ type: 'stamps', clientId, name, count });
    announce();
    if (count === 0) return;
    const t = window.setInterval(announce, HUNT_HEARTBEAT_MS);
    return () => window.clearInterval(t);
  }, [count, clientId, name]);

  const stamp = () => {
    if (count >= HUNT_MAX) return;
    const next = count + 1;
    setCount(next);
    setFresh(true);
    window.setTimeout(() => setFresh(false), 700);
    buzz(BUZZ.stamp);
    try { localStorage.setItem(storageKey, String(next)); } catch { /* storage blocked */ }
  };

  const done = count >= HUNT_GOAL;
  return (
    <div className={`mb-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${done ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-violet-400/35 bg-violet-400/10'}`}>
      <Crosshair className={`h-5 w-5 shrink-0 ${done ? 'text-emerald-300' : 'text-violet-300'}`} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-lc-text3">Secret mission{done ? ' · complete!' : ''}</p>
        <p className="text-[14px] leading-snug text-lc-text">{target ? huntMission(target) : phraseMission(phrases ?? [])}</p>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: HUNT_MAX }).map((_, i) => (
          <span key={i} className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition ${i < count ? 'border-rose-400 bg-rose-400/80 text-white' : i < HUNT_GOAL ? 'border-white/30' : 'border-dashed border-white/25'} ${fresh && i === count - 1 ? 'scale-125' : ''}`}>{i < count ? <Check className="h-3 w-3" /> : null}</span>
        ))}
      </div>
      <button type="button" onClick={stamp} disabled={count >= HUNT_MAX} className="shrink-0 rounded-full bg-violet-400/90 px-3 py-1.5 text-[13px] font-semibold text-slate-950 disabled:opacity-40">I did it!</button>
    </div>
  );
}
