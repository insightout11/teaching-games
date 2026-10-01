'use client';

import { useState } from 'react';
import { Check, Crosshair } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Briefing mission on the phone: catch each answer while the video plays (any order, changeable). */
export function BriefingMissionPanel({ spec, onSubmit }: { spec: InputSpec; onSubmit: (choice: string) => Promise<void> | void }) {
  const mission = ((spec.perStudentData?.__mission as Array<{ q: string; options: string[] }> | undefined) ?? []);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const done = Object.keys(picks).length;

  const pick = (i: number, a: number) => {
    setPicks((p) => ({ ...p, [i]: a }));
    buzz(BUZZ.sent);
    void onSubmit(JSON.stringify({ i, a }));
  };

  return (
    <div className="space-y-4">
      <PhonePrompt>{spec.prompt}</PhonePrompt>
      <p className="flex items-center gap-1.5 text-[14px] text-lc-text2"><Crosshair className="h-4 w-4 text-amber-300" />{done} of {mission.length} caught</p>
      {mission.map((m, i) => (
        <div key={m.q} className={`space-y-2 rounded-2xl border px-3 py-3 ${picks[i] != null ? 'border-emerald-400/40 bg-emerald-400/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
          <p className="text-[16px] leading-snug text-lc-text">{i + 1}. {m.q}</p>
          <div className="grid gap-1.5">
            {m.options.map((o, a) => (
              <button key={o} type="button" onClick={() => pick(i, a)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[15px] ${picks[i] === a ? 'border-amber-400 bg-amber-400/15 text-amber-50' : 'border-white/10 text-lc-text'}`}>
                {picks[i] === a && <Check className="h-4 w-4 shrink-0 text-amber-300" />}{o}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
