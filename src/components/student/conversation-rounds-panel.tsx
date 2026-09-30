'use client';

import { useState } from 'react';
import { Ear, Lock } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** A speaker's private role card (only their phone gets it). */
export interface ConversationRoleCard {
  side: 0 | 1;
  title: string;
  goal: string;
  situation: string;
  phrases: string[];
}

const TONE = [
  { border: 'border-teal-400/50', bg: 'bg-teal-400/10', text: 'text-teal-300', chip: 'border-teal-400/40 bg-teal-400/10 text-teal-100', lit: 'border-teal-300 bg-teal-400/35 text-white' },
  { border: 'border-violet-400/50', bg: 'bg-violet-400/10', text: 'text-violet-300', chip: 'border-violet-400/40 bg-violet-400/10 text-violet-100', lit: 'border-violet-300 bg-violet-400/35 text-white' },
];

/**
 * Conversation Rounds on the phone: speakers see their secret role card;
 * everyone else spots phrases as they hear them (each tap reaches the teacher).
 */
export function ConversationRoundsPanel({ spec, displayName, onSubmit }: { spec: InputSpec; displayName?: string; onSubmit: (content: string) => Promise<void> | void }) {
  const card = displayName ? (spec.perStudentData?.[displayName] as ConversationRoleCard | undefined) : undefined;
  const [spotted, setSpotted] = useState<Set<string>>(new Set());

  if (card) {
    const t = TONE[card.side];
    return (
      <div className={`space-y-4 rounded-2xl border-2 p-5 ${t.border} ${t.bg}`}>
        <div className="flex items-center justify-between">
          <PhoneLabel tone={t.text}>Your role</PhoneLabel>
          <span className="flex items-center gap-1 text-[11px] text-lc-text3"><Lock className="h-3 w-3" /> secret</span>
        </div>
        <p className="font-display text-[26px] leading-tight text-lc-text">{card.title}</p>
        <div className="space-y-1">
          <PhoneLabel>Your goal</PhoneLabel>
          <p className="text-[17px] leading-snug text-lc-text">{card.goal}</p>
        </div>
        <div className="space-y-1">
          <PhoneLabel>Situation</PhoneLabel>
          <p className="text-[15px] leading-snug text-lc-text2">{card.situation}</p>
        </div>
        <div className="space-y-1.5">
          <PhoneLabel>Try to use</PhoneLabel>
          <div className="flex flex-wrap gap-1.5">
            {card.phrases.map((p) => <span key={p} className={`rounded-full border px-3 py-1 text-[14px] ${t.chip}`}>{p}</span>)}
          </div>
        </div>
      </div>
    );
  }

  const groups = spec.keywordGroups ?? [];
  const tap = (phrase: string, gi: number) => {
    if (spotted.has(phrase)) return;
    setSpotted((prev) => new Set(prev).add(phrase));
    try { navigator.vibrate?.(15); } catch { /* no vibration */ }
    void onSubmit(`spot:${gi}:${phrase}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <Ear className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
        <PhonePrompt>Listen! Tap a phrase when you hear someone use it.</PhonePrompt>
      </div>
      {groups.map((g, gi) => {
        const t = TONE[gi % 2];
        return (
          <div key={gi} className="space-y-1.5">
            <PhoneLabel tone={t.text}>{g.label}</PhoneLabel>
            <div className="flex flex-wrap gap-2">
              {g.phrases.map((p) => {
                const on = spotted.has(p);
                return (
                  <button key={p} type="button" onClick={() => tap(p, gi)} className={`rounded-full border px-3.5 py-2 text-left text-[15px] transition-colors active:scale-95 ${on ? t.lit : t.chip}`}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {spotted.size > 0 && <p className="text-center text-[13px] text-lc-text3">{spotted.size} spotted</p>}
    </div>
  );
}
