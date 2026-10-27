'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { MascotFigure } from '@/components/ui/mascot-figure';
import { DEFAULT_MASCOT, MASCOT_LABELS, parseMascotLook, type MascotLook } from '@/lib/mascot';
import type { InputSpec } from '@/lib/input-spec';

type Part = keyof MascotLook;
const ROWS: Array<{ key: Part; label: string }> = [
  { key: 'body', label: 'Creature' },
  { key: 'color', label: 'Colour' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'head', label: 'On its head' },
  { key: 'extra', label: 'Extra' },
];

/**
 * The phone side of "Make our mascot" (Oct 2026 rethink: five quick class votes could never stay in step with phones,
 * which only check for a new vote every few seconds). Every student designs a whole mascot on one screen with a live
 * preview and sends it once; the room mixes the class's choices.
 */
export function MascotBuildInput({ spec, onSubmit, isSubmitting }: { spec: InputSpec; onSubmit: (value: string) => Promise<void>; isSubmitting: boolean }) {
  const parts = spec.mascotParts;
  const first = (k: Part) => parts?.[k]?.[0] ?? DEFAULT_MASCOT[k];
  const [look, setLook] = useState<MascotLook>(() => parseMascotLook({ body: first('body'), color: first('color'), eyes: first('eyes'), head: first('head'), extra: first('extra') }) ?? DEFAULT_MASCOT);
  const [sent, setSent] = useState(false);
  if (!parts) return null;
  const send = async () => {
    await onSubmit(JSON.stringify({ roundId: spec.roundId, look }));
    setSent(true);
  };
  return (
    <div className="space-y-3">
      <p className="text-center font-display text-2xl text-white">{spec.prompt ?? 'Design our mascot!'}</p>
      <div className="flex justify-center"><div className="rounded-3xl bg-white/[0.06] p-2"><MascotFigure look={look} size={150} /></div></div>
      {ROWS.map((r) => (
        <div key={r.key}>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">{r.label}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(parts[r.key] ?? []).map((v) => {
              const on = look[r.key] === v;
              return (
                <button key={v} type="button" disabled={sent} onClick={() => setLook((l) => parseMascotLook({ ...l, [r.key]: v }) ?? l)} aria-pressed={on}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm ${on ? 'border-amber-300 bg-amber-300/20 text-amber-50' : 'border-white/15 bg-white/5 text-white/80'} disabled:opacity-60`}>
                  {r.key === 'color' ? <span className="h-5 w-5 rounded-full border border-white/30" style={{ background: v }} aria-label={v} /> : (MASCOT_LABELS[v] ?? v)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" disabled={sent || isSubmitting} onClick={() => void send()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 py-3 text-base font-bold text-slate-950 disabled:opacity-60">
        {sent ? <><Check className="h-5 w-5" /> Sent! Watch the big screen</> : isSubmitting ? 'Sending…' : 'Send my mascot'}
      </button>
    </div>
  );
}
