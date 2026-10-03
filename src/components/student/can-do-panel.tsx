'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Travel can-do check: tick any you could do (none is fine), then send. Re-sendable. */
export function CanDoPanel({ spec, onSubmit }: { spec: InputSpec; onSubmit: (choice: string) => Promise<void> | void }) {
  const items = (spec.perStudentData?.__cando as Array<{ id: string; text: string }> | undefined) ?? [];
  const [ticked, setTicked] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const toggle = (id: string) => { setSent(false); setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id])); };

  return (
    <div className="space-y-4">
      <PhonePrompt>{spec.prompt}</PhonePrompt>
      {spec.instruction && <p className="text-[14px] text-lc-text2">{spec.instruction}</p>}
      <div className="grid gap-2">
        {items.map((it) => {
          const on = ticked.includes(it.id);
          return (
            <button key={it.id} type="button" onClick={() => toggle(it.id)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[16px] ${on ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-50' : 'border-white/10 bg-white/[0.03] text-lc-text'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? 'border-emerald-300 bg-emerald-400/30' : 'border-white/25'}`}>
                {on && <Check className="h-4 w-4 text-emerald-100" aria-hidden />}
              </span>
              {it.text}
            </button>
          );
        })}
      </div>
      <button type="button" disabled={sent}
        onClick={() => { setSent(true); buzz(BUZZ.sent); void onSubmit(JSON.stringify(ticked)); }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[16px] font-semibold ${sent ? 'bg-emerald-500/20 text-emerald-100' : 'bg-cyan-500 text-white'}`}>
        {sent && <Check className="h-4 w-4" aria-hidden />}{sent ? 'Sent' : 'Send'}
      </button>
    </div>
  );
}
