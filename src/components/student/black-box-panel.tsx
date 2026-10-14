'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/**
 * Black Box phone: a word cloud. Tap every word you HEARD; tap again to take it back.
 * Each tap is sent straight away as {w, on}; the teacher screen keeps each student's set.
 */
export function BlackBoxPanel({ spec, onSubmit }: { spec: InputSpec; onSubmit: (choice: string) => Promise<void> | void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const words = spec.options ?? [];

  const toggle = (w: string) => {
    const on = !picked.has(w);
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(w); else next.delete(w);
      return next;
    });
    void onSubmit(JSON.stringify({ w, on }));
  };

  return (
    <div className="space-y-4">
      <PhonePrompt>{spec.prompt ?? 'Tap every word you heard.'}</PhonePrompt>
      <PhoneLabel>{picked.size} picked · some words were never said!</PhoneLabel>
      <div className="flex flex-wrap gap-2">
        {words.map((w) => {
          const on = picked.has(w);
          return (
            <button
              key={w}
              type="button"
              onClick={() => toggle(w)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[17px] transition ${on ? 'border-amber-400 bg-amber-400/20 text-amber-50' : 'border-white/15 bg-white/[0.04] text-lc-text'}`}
            >
              {on && <Check className="h-4 w-4 text-amber-300" />}
              {w}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** What one phone gets when the box is opened: how many hidden words it caught, and each word it picked. */
export interface BlackBoxResult { caught: number; total: number; words: Array<{ w: string; said: boolean }> }

export function BlackBoxResultPanel({ spec, clientId }: { spec: InputSpec; clientId?: string }) {
  const mine = clientId ? (spec.perStudentData?.[clientId] as BlackBoxResult | undefined) : undefined;
  if (!mine || mine.words.length === 0) {
    return (
      <div className="space-y-3">
        <PhonePrompt>The box is open.</PhonePrompt>
        <PhoneLabel>You did not pick any words this time. Look at the screen to see what was said.</PhoneLabel>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PhonePrompt>You caught {mine.caught} of {mine.total} hidden words.</PhonePrompt>
      <div className="flex flex-wrap gap-2">
        {mine.words.map(({ w, said }) => (
          <span
            key={w}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[17px] ${said ? 'border-emerald-400 bg-emerald-400/15 text-emerald-50' : 'border-rose-400/60 bg-rose-400/10 text-rose-100'}`}
          >
            {said ? <Check className="h-4 w-4 text-emerald-300" /> : <X className="h-4 w-4 text-rose-300" />}
            {w}
          </span>
        ))}
      </div>
      <PhoneLabel><span className="text-emerald-300">Green</span> was said. <span className="text-rose-300">Red</span> was never said.</PhoneLabel>
    </div>
  );
}
