'use client';

import { useState } from 'react';
import { Check, Utensils, Wallet, Star, User } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { BUDGET_LABEL, type TravellerCard } from '@/lib/world-flight/traveller-cards';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Travel boarding: this phone's Traveller Card. The student introduces themselves aloud as it. */
export function TripTravellerCardPanel({ spec, displayName, studentId, clientId, onSubmit }: {
  spec: InputSpec; displayName?: string; studentId?: string; clientId?: string;
  onSubmit: (choice: string) => Promise<void> | void;
}) {
  const card = [studentId, clientId, displayName]
    .map((k) => (k ? (spec.perStudentData?.[k] as TravellerCard | undefined) : undefined))
    .find((c) => c?.persona);
  const [sent, setSent] = useState(false);

  if (!card) return <PhonePrompt>{spec.prompt ?? 'Your Traveller Card is on its way…'}</PhonePrompt>;

  const rows = [
    { icon: Wallet, label: 'Budget', value: `${card.budget} · ${BUDGET_LABEL[card.budget]}` },
    { icon: Utensils, label: 'Food', value: card.food },
    { icon: Star, label: 'You want to', value: card.want },
  ];

  return (
    <div className="space-y-4">
      <PhonePrompt>{spec.prompt}</PhonePrompt>
      <div className="overflow-hidden rounded-2xl border border-cyan-400/40 bg-cyan-500/[0.08]">
        <div className="flex items-center gap-2 border-b border-dashed border-cyan-400/30 px-4 py-3">
          <User className="h-5 w-5 text-cyan-300" aria-hidden />
          <p className="text-[18px] font-semibold capitalize text-lc-text">{card.persona.replace(/^an? /, '')}</p>
        </div>
        <div className="space-y-2.5 px-4 py-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <p key={label} className="flex items-start gap-2 text-[15px] text-lc-text">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
              <span><span className="text-lc-text2">{label}: </span>{value}</span>
            </p>
          ))}
        </div>
      </div>
      <p className="text-[14px] text-lc-text2">Say it aloud: “I’m {card.persona}. I’m on a {BUDGET_LABEL[card.budget]}, and I want to {card.want}.”</p>
      <button type="button" disabled={sent}
        onClick={() => { setSent(true); buzz(BUZZ.sent); void onSubmit('ready'); }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[16px] font-semibold ${sent ? 'bg-emerald-500/20 text-emerald-100' : 'bg-cyan-500 text-white'}`}>
        {sent && <Check className="h-4 w-4" aria-hidden />}{sent ? 'Introduced' : 'I said it'}
      </button>
    </div>
  );
}
