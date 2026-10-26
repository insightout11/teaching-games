'use client';

import { useState } from 'react';
import { Lock, Shuffle } from 'lucide-react';
import { MascotFigure } from '@/components/ui/mascot-figure';
import { MascotBuilder } from '@/components/session/live-room/mascot-builder';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import {
  DEFAULT_MASCOT, MASCOT_BODIES, MASCOT_COLORS, MASCOT_EXTRAS, MASCOT_EYES, MASCOT_HEADS, MASCOT_LABELS, MASCOT_LOCKED,
  randomMascot, type MascotLook,
} from '@/lib/mascot';

/** Every part on its own, then random mascots, then one next to crew avatars for scale (twice their size). */
export function MascotGallery() {
  const [seed, setSeed] = useState(0);
  const [building, setBuilding] = useState(false);
  const [made, setMade] = useState<{ look: MascotLook; name: string } | null>(null);
  const randoms = Array.from({ length: 12 }, (_, i) => {
    let s = (seed * 97 + i * 31 + 7) % 2147483647;
    const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    rand(); rand(); rand(); // the first values of this generator are small: skip them so every body appears
    return randomMascot(rand);
  });
  const row = (label: string, items: readonly string[], toLook: (v: string) => MascotLook) => (
    <section className="space-y-2">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">{label}</h2>
      <div className="flex flex-wrap gap-3">
        {items.map((v) => (
          <figure key={v} className="flex w-28 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <MascotFigure look={toLook(v)} size={96} />
            <figcaption className="flex items-center gap-1 text-center text-xs text-white/80">
              {MASCOT_LOCKED[v] && <Lock className="h-3 w-3 text-amber-300" />}{MASCOT_LABELS[v] ?? v}
            </figcaption>
            {MASCOT_LOCKED[v] && <p className="text-center text-[10px] leading-tight text-white/45">{MASCOT_LOCKED[v]!.earnedBy}</p>}
          </figure>
        ))}
      </div>
    </section>
  );
  return (
    <main className="min-h-screen space-y-8 bg-[#0b1220] p-6 text-white">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl">Class mascot parts</h1>
        <button type="button" onClick={() => setBuilding(true)} className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-slate-950">Try the class vote</button>
        {made && <span className="flex items-center gap-2 text-sm"><MascotFigure look={made.look} size={48} /> {made.name} boarded</span>}
      </div>
      {building && <div className="relative h-[460px]"><MascotBuilder sessionId="00000000-0000-4000-8000-000000000000" unlocks={new Set()} onClose={() => setBuilding(false)} onDone={(look, name) => { setMade({ look, name }); setBuilding(false); }} /></div>}
      {row('1. Body', MASCOT_BODIES, (v) => ({ ...DEFAULT_MASCOT, body: v as MascotLook['body'] }))}
      {row('2. Colour', MASCOT_COLORS, (v) => ({ ...DEFAULT_MASCOT, color: v }))}
      {row('3. Eyes', MASCOT_EYES, (v) => ({ ...DEFAULT_MASCOT, eyes: v as MascotLook['eyes'] }))}
      {row('4. On its head', MASCOT_HEADS, (v) => ({ ...DEFAULT_MASCOT, head: v as MascotLook['head'] }))}
      {row('5. Extra', MASCOT_EXTRAS, (v) => ({ ...DEFAULT_MASCOT, extra: v as MascotLook['extra'] }))}
      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Random mascots</h2>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"><Shuffle className="h-3.5 w-3.5" /> More</button>
        </div>
        <div className="flex flex-wrap gap-3">{randoms.map((l, i) => <MascotFigure key={i} look={l} size={120} />)}</div>
      </section>
      <section className="space-y-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Beside the cabin (twice an avatar)</h2>
        <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-[#141e32] p-4">
          {['c1', 'Mai', 'Ken', 'Lina'].map((n) => <CrewAvatar key={n} seed={n} name={n} size={44} />)}
          <MascotFigure look={randoms[0]} size={92} />
        </div>
      </section>
    </main>
  );
}
