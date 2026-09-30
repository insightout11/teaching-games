'use client';

import { Ban, Lock, Mic } from 'lucide-react';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** Mystery Flight "A classmate describes it": the traveller's secret card. */
export interface TravellerCardData { role: 'traveller'; city: string; country: string; photo?: string | null; prompts: string[] }

export function TravellerCard({ card }: { card: TravellerCardData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PhoneLabel tone="text-amber-300">You&apos;re the traveller</PhoneLabel>
        <span className="flex items-center gap-1 text-[11px] text-lc-text3"><Lock className="h-3 w-3" /> only you</span>
      </div>
      {card.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.photo} alt={card.city} className="max-h-48 w-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
      )}
      <div className="text-center">
        <p className="font-display text-[36px] leading-none text-lc-text">{card.city}</p>
        <p className="text-[16px] text-lc-text2">{card.country}</p>
      </div>
      <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
        <Mic className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <PhonePrompt>Describe it out loud so the class can find it on the map.</PhonePrompt>
      </div>
      <div className="space-y-1.5">
        <PhoneLabel>Talk about</PhoneLabel>
        {card.prompts.map((p) => <p key={p} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[15px] text-lc-text">{p}</p>)}
      </div>
      <p className="flex items-center justify-center gap-1.5 text-[13px] text-rose-200"><Ban className="h-3.5 w-3.5" />Don&apos;t say the city or country name!</p>
    </div>
  );
}
