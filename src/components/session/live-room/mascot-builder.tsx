'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Blend, Plane, Sparkles, X } from 'lucide-react';
import { MascotFigure } from '@/components/ui/mascot-figure';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import {
  MASCOT_BODIES, MASCOT_COLORS, MASCOT_EXTRAS, MASCOT_EYES, MASCOT_HEADS,
  isMascotPartOpen, parseMascotLook, type MascotLook,
} from '@/lib/mascot';
import type { InputSpec } from '@/lib/input-spec';

export const ROOM_MASCOT_KEY = 'room-mascot';
const NAMES = ['Captain Fluff', 'Zoomy', 'Sir Wobble', 'Pickles', 'Nimbus', 'Rocket', 'Biscuit', 'Mango', 'Dr Bounce', 'Turbo', 'Noodle', 'Sprocket', 'Bubbles', 'Captain Crumbs', 'Zigzag', 'Pudding'];
const shuffle = <T,>(a: readonly T[]) => [...a].sort(() => Math.random() - 0.5);

/** The class's mix: the most popular choice for each part (ties go to the first designs sent). */
export function mixLooks(looks: MascotLook[]): MascotLook | null {
  if (!looks.length) return null;
  const pick = (k: keyof MascotLook) => {
    const counts = new Map<string, number>();
    for (const l of looks) counts.set(l[k], (counts.get(l[k]) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  };
  return parseMascotLook({ body: pick('body'), color: pick('color'), eyes: pick('eyes'), head: pick('head'), extra: pick('extra') });
}

/**
 * Make a class mascot (Oct 2026 rethink). Five quick class votes could never stay in step: phones only check for a new
 * vote every few seconds. Now every phone designs a whole mascot on one screen (sent once, on the fast channel the map
 * pins use), the designs appear here as they arrive, and "Mix them" builds the class mascot from the most popular
 * choice for each part. The captain can also pick one design, then names it. It can run while the class talks.
 */
export function MascotBuilder({ sessionId, unlocks, onDone, onClose }: {
  sessionId: string;
  unlocks: ReadonlySet<string>;
  onDone: (look: MascotLook, name: string) => void;
  onClose: () => void;
}) {
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const roundId = useRef(`mascot-${Date.now()}`).current;
  const [designs, setDesigns] = useState<Array<{ id: string; name: string; look: MascotLook }>>([]);
  const [look, setLook] = useState<MascotLook | null>(null);
  const [name, setName] = useState('');
  const names = useMemo(() => shuffle(NAMES).slice(0, 3), []);

  // Open the designer on every phone, with only the parts this class has unlocked
  useEffect(() => {
    const open = (list: readonly string[]) => list.filter((p) => p !== 'none' && isMascotPartOpen(p, unlocks));
    void setInputSpec({
      type: 'mascot-build',
      gameKey: ROOM_MASCOT_KEY,
      prompt: 'Design our class mascot!',
      roundId,
      mascotParts: { body: open(MASCOT_BODIES), color: open(MASCOT_COLORS), eyes: open(MASCOT_EYES), head: open(MASCOT_HEADS), extra: open(MASCOT_EXTRAS) },
    } as InputSpec);
    return () => { void setInputSpec(null); };
    // once, when the builder opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Designs arriving from the phones
  useEffect(() => {
    if (isMockMode() || look) return;
    const supabase = createClient();
    let stop = false;
    const read = async () => {
      const { data } = await supabase.from('scores').select('client_id, display_name, response_data').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (stop || !data) return;
      const byId = new Map<string, { id: string; name: string; look: MascotLook }>();
      for (const row of data as Array<{ client_id: string | null; display_name: string | null; response_data: Record<string, unknown> | null }>) {
        const r = row.response_data;
        if (r?.gameKey !== ROOM_MASCOT_KEY || typeof r.choice !== 'string') continue;
        try {
          const d = JSON.parse(r.choice) as { roundId?: string; look?: unknown };
          const l = d.roundId === roundId ? parseMascotLook(d.look) : null;
          if (l) { const id = row.client_id ?? row.display_name ?? String(byId.size); byId.set(id, { id, name: row.display_name ?? 'A student', look: l }); }
        } catch { /* not a design */ }
      }
      setDesigns(Array.from(byId.values()));
    };
    void read();
    const t = window.setInterval(read, 2000);
    return () => { stop = true; window.clearInterval(t); };
  }, [sessionId, roundId, look]);

  const choose = (l: MascotLook) => { setLook(l); void setInputSpec(null); };
  const mix = mixLooks(designs.map((d) => d.look));

  return (
    <div className="absolute inset-x-0 top-3 z-30 mx-auto w-[min(880px,94%)]">
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-amber-300"><Sparkles className="h-4 w-4" /> Make our mascot · {look ? 'name it' : `${designs.length} design${designs.length === 1 ? '' : 's'} in`}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {!look ? (
          <div className="p-5">
            <p className="font-display text-2xl">Design our mascot on your phone!</p>
            <p className="mb-3 text-sm text-white/60">Everyone builds one and sends it. Then we mix the class&apos;s favourite parts, or the captain picks a design.</p>
            <div className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-6">
              {designs.map((d) => (
                <motion.button key={d.id} type="button" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={() => choose(d.look)} title={`Use ${d.name}'s design`} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-1.5 hover:border-amber-300/60">
                  <MascotFigure look={d.look} size={88} />
                  <span className="max-w-full truncate text-xs text-white/70">{d.name}</span>
                </motion.button>
              ))}
              {designs.length === 0 && <p className="col-span-full py-8 text-center text-white/50">Waiting for the first designs…</p>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <span className="mr-auto text-xs text-white/45">Click a design to use it. You can keep talking while phones design.</span>
              <button type="button" disabled={!mix} onClick={() => mix && choose(mix)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">
                <Blend className="h-4 w-4" /> Mix them
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-5 p-5">
            <div className="flex w-48 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/[0.04] p-2">
              <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
                <MascotFigure look={look} size={160} />
              </motion.div>
              {name && <p className="font-display text-2xl">{name}</p>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl">What is our mascot called?</p>
              <p className="mb-3 text-sm text-white/60">Ask the class, then pick a name or type one.</p>
              <div className="flex flex-wrap gap-2">
                {names.map((n) => (
                  <button key={n} type="button" onClick={() => setName(n)} className={`rounded-2xl border px-4 py-3 font-display text-xl ${name === n ? 'border-amber-300 bg-amber-300/15' : 'border-white/12 bg-white/5 hover:border-amber-300/60'}`}>{n}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); const n = (e.currentTarget.elements.namedItem('mascot-name') as HTMLInputElement).value.trim().slice(0, 40); if (n) setName(n); }} className="mt-3 flex items-center gap-1.5">
                <input name="mascot-name" placeholder="Or type a name" aria-label="Mascot name" className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-sm" />
                <button type="submit" className="rounded-lg border border-white/20 px-2 py-1 text-sm hover:bg-white/10">Use it</button>
              </form>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setLook(null); setName(''); }} className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white">Back to the designs</button>
                {name && (
                  <button type="button" onClick={() => onDone(look, name)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-slate-950"><Plane className="h-4 w-4" /> Board {name}</button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
