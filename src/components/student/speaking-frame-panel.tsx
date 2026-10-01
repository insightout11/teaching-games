'use client';

import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import type { SpeakingFrameCard } from '@/activities/shared/speaking-turns';
import { buzz, BUZZ } from './phone-shell';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** Phone side of the grammar speaking games: the prompt, helper banks, and "your turn" (buzz). */
export function SpeakingFramePanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const per = spec.perStudentData ?? {};
  const card = [studentId, clientId, displayName].map((k) => (k ? per[k] : undefined)).find((c) => (c as SpeakingFrameCard | undefined)?.role === 'speaking-frame') as SpeakingFrameCard | undefined;
  useEffect(() => { if (card?.yourTurn) buzz(BUZZ.yourTurn); }, [card?.yourTurn]);

  if (!card) return <p className="text-center text-lc-text2">Watch the big screen!</p>;
  return (
    <div className="space-y-4">
      {card.yourTurn && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-400 bg-amber-400/15 px-4 py-3 text-[18px] text-amber-50">
          <Mic className="h-5 w-5 text-amber-300" />Your turn! Say it out loud.
        </div>
      )}
      <div>
        <PhoneLabel>{card.title}</PhoneLabel>
        <PhonePrompt>{card.prompt}</PhonePrompt>
      </div>
      {card.helpers.filter((h) => h.items.length).map((h) => (
        <div key={h.label} className="space-y-1.5">
          <PhoneLabel>{h.label}</PhoneLabel>
          <div className="flex flex-wrap gap-1.5">
            {h.items.map((it) => <span key={it} className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[15px] text-lc-text">{it}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
