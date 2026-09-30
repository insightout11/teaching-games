'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
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
