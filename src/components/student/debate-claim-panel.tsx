'use client';

import { useState } from 'react';
import { Check, Hand } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Tag-team prep: your side's points and evidence; tap the one you'll make (no typing). Changeable. */
export function DebateClaimPanel({ spec, displayName, studentId, clientId, onSubmit }: {
  spec: InputSpec; displayName?: string; studentId?: string; clientId?: string;
  onSubmit: (choice: string) => Promise<void> | void;
}) {
  const card = [studentId, clientId, displayName]
    .map((k) => (k ? (spec.perStudentData?.[k] as { side: string; sideLabel: string; motion: string; options: string[] } | undefined) : undefined))
    .find((c) => c?.options);
  const [claimed, setClaimed] = useState<string | null>(null);
  if (!card) return <PhonePrompt>{spec.prompt ?? 'Waiting for your team…'}</PhonePrompt>;
  const forSide = card.side === 'for';
  return (
    <div className="space-y-4">
      <p className={`text-[13px] font-bold uppercase tracking-[0.2em] ${forSide ? 'text-sky-300' : 'text-orange-300'}`}>You’re arguing {card.sideLabel}</p>
      <PhonePrompt>{card.motion}</PhonePrompt>
      <p className="flex items-center gap-1.5 text-[14px] text-lc-text2"><Hand className="h-4 w-4" />Tap the point you’ll make</p>
      <div className="grid gap-2">
        {card.options.map((o) => (
          <button key={o} type="button" onClick={() => { setClaimed(o); buzz(BUZZ.sent); void onSubmit(o); }}
            className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-left text-[15px] ${claimed === o ? (forSide ? 'border-sky-400 bg-sky-500/15 text-sky-50' : 'border-orange-400 bg-orange-500/15 text-orange-50') : 'border-white/10 bg-white/[0.03] text-lc-text'}`}>
            {claimed === o && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}{o}
          </button>
        ))}
      </div>
    </div>
  );
}
