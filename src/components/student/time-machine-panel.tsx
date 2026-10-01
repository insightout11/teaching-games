'use client';

import { useEffect } from 'react';
import { Clock, Mic } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhoneLabel } from './phone-kit';

interface TravellerCard {
  role: 'traveller';
  sceneTitle: string;
  scene: string;
  stop: { era: 'past' | 'present' | 'future'; tense: string; timeLabel: string; timeWords: string[]; starters: string[] };
  verbs: Array<{ base: string; past: string; ing: string }>;
  yourTurn: boolean;
}

const ERA_TONE = { past: 'text-amber-300', present: 'text-emerald-300', future: 'text-cyan-300' } as const;

/** Tense Time Machine phone: the scene, the tense of this stop, starters and the verb forms you need. */
export function TimeMachinePanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const per = spec.perStudentData ?? {};
  const card = [studentId, clientId, displayName].map((k) => (k ? per[k] : undefined)).find((c) => (c as TravellerCard | undefined)?.role === 'traveller') as TravellerCard | undefined;

  useEffect(() => { if (card?.yourTurn) buzz(BUZZ.yourTurn); }, [card?.yourTurn]);

  if (!card) return <p className="text-center text-lc-text2">Watch the big screen: the time machine is flying!</p>;
  const { stop } = card;
  const form = (v: { base: string; past: string; ing: string }) =>
    stop.era === 'past' ? v.past : stop.era === 'present' ? `is / are ${v.ing}` : `going to ${v.base}`;

  return (
    <div className="space-y-4">
      {card.yourTurn && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-400 bg-amber-400/15 px-4 py-3 text-[18px] text-amber-50">
          <Mic className="h-5 w-5 text-amber-300" />Your turn! Say one sentence.
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className={`flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] ${ERA_TONE[stop.era]}`}><Clock className="h-3.5 w-3.5" />{stop.timeLabel} · {stop.tense}</p>
        <p className="mt-1 font-display text-[22px] text-lc-text">{card.sceneTitle}</p>
        <p className="text-[15px] text-lc-text2">{card.scene}</p>
      </div>
      <div className="space-y-1.5">
        <PhoneLabel>Start with</PhoneLabel>
        {stop.starters.map((s) => <p key={s} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[16px] text-lc-text">{s}</p>)}
      </div>
      {card.verbs.length > 0 && (
        <div className="space-y-1.5">
          <PhoneLabel>Verbs</PhoneLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {card.verbs.map((v) => (
              <p key={v.base} className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[14px]"><span className="text-lc-text3">{v.base} → </span><span className="text-lc-text">{form(v)}</span></p>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">{stop.timeWords.map((w) => <span key={w} className="rounded-full border border-white/15 px-2.5 py-0.5 text-[13px] text-lc-text2">{w}</span>)}</div>
    </div>
  );
}
