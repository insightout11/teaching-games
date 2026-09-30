'use client';

import { useState } from 'react';
import { Flame, Laugh, Lightbulb, Mic, Shield, Swords, ThumbsUp } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

export type DefendSide = 'DEFEND' | 'ATTACK';
/** Room-wide state rides in perStudentData.__room; per-student cards by id / clientId / name. */
export interface DefendRoomState { phase: 'sides' | 'debate' | 'verdict'; speaker?: string | null; speakerSide?: DefendSide | null; spotlight?: number }
export interface DefendCard { side: DefendSide; speaking?: boolean }

export const DEFEND_REACTIONS = [
  { key: 'convincing', label: 'Convincing', icon: Lightbulb },
  { key: 'strong', label: 'Strong point', icon: Flame },
  { key: 'funny', label: 'Funny', icon: Laugh },
  { key: 'applause', label: 'Applause', icon: ThumbsUp },
] as const;
export type DefendReaction = (typeof DEFEND_REACTIONS)[number]['key'];

const STARTERS: Record<DefendSide, string[]> = {
  DEFEND: ['Actually, this is a great idea because…', 'Think about the benefits: …', 'Imagine if everyone did this…', 'Some people say no, but…'],
  ATTACK: ['The problem with this is…', 'What would happen if…?', 'I disagree, because…', 'That sounds fun, but in reality…'],
};
const SIDE_STYLE: Record<DefendSide, { box: string; text: string; label: string; icon: typeof Shield; line: string }> = {
  DEFEND: { box: 'border-emerald-400/50 bg-emerald-400/10', text: 'text-emerald-300', label: 'Defend it', icon: Shield, line: 'Argue FOR the statement, however wild it is!' },
  ATTACK: { box: 'border-rose-400/50 bg-rose-400/10', text: 'text-rose-300', label: 'Attack it', icon: Swords, line: 'Argue AGAINST the statement.' },
};

export function DefendItPanel({ spec, displayName, studentId, clientId, onSubmit }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string; onSubmit: (content: string) => Promise<void> | void }) {
  const data = spec.perStudentData ?? {};
  const room = data.__room as DefendRoomState | undefined;
  const card = [studentId, clientId, displayName].map((k) => (k ? (data[k] as DefendCard | undefined) : undefined)).find(Boolean);
  // One reaction per speaker turn (the teacher also dedupes); a new spotlight resets.
  const [reactedTo, setReactedTo] = useState<number | null>(null);
  const [voted, setVoted] = useState<DefendSide | null>(null);

  if (!room) return null;

  if (room.phase === 'sides') {
    if (!card) return <PhonePrompt center>Sides are being assigned…</PhonePrompt>;
    const st = SIDE_STYLE[card.side];
    const Icon = st.icon;
    return (
      <div className="space-y-4">
        <div className={`space-y-2 rounded-2xl border-2 p-5 text-center ${st.box}`}>
          <PhoneLabel tone={st.text}>Your side</PhoneLabel>
          <p className={`flex items-center justify-center gap-2 font-display text-[36px] leading-none ${st.text}`}><Icon className="h-8 w-8" />{st.label}</p>
          <p className="text-[15px] text-lc-text2">{st.line}</p>
        </div>
        <div className="space-y-1.5">
          <PhoneLabel>Start with</PhoneLabel>
          {STARTERS[card.side].map((s) => <p key={s} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[15px] text-lc-text">{s}</p>)}
        </div>
      </div>
    );
  }

  if (room.phase === 'debate') {
    if (card?.speaking) {
      return (
        <div className="space-y-3 py-8 text-center">
          <Mic className="mx-auto h-10 w-10 text-amber-300" />
          <PhonePrompt center>You&apos;re speaking!</PhonePrompt>
          <p className="text-[15px] text-lc-text2">Your classmates are reacting live.</p>
        </div>
      );
    }
    if (!room.speaker) {
      return (
        <div className="space-y-2 py-6 text-center">
          <PhonePrompt center>Debate time!</PhonePrompt>
          {card && <p className={`text-[15px] ${SIDE_STYLE[card.side].text}`}>You&apos;re on the {card.side === 'DEFEND' ? 'Defend' : 'Attack'} side. Get your argument ready.</p>}
        </div>
      );
    }
    const done = reactedTo === (room.spotlight ?? 0);
    return (
      <div className="space-y-4">
        <PhonePrompt>{room.speaker} is speaking. React!</PhonePrompt>
        <div className="grid grid-cols-2 gap-2">
          {DEFEND_REACTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              disabled={done}
              onClick={() => { setReactedTo(room.spotlight ?? 0); void onSubmit(`react:${key}`); }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-lc-border bg-lc-card py-4 text-[15px] text-lc-text active:scale-95 disabled:opacity-40"
            >
              <Icon className="h-7 w-7 text-amber-300" />{label}
            </button>
          ))}
        </div>
        {done && <p className="text-center text-[13px] text-lc-text3">Reaction sent. Wait for the next speaker.</p>}
      </div>
    );
  }

  // Verdict
  return (
    <div className="space-y-4">
      <PhonePrompt>Who argued better?</PhonePrompt>
      <p className="text-[13px] text-lc-text3">Vote for the best arguments, not the side you agree with.</p>
      <div className="grid grid-cols-2 gap-2">
        {(['DEFEND', 'ATTACK'] as const).map((side) => {
          const st = SIDE_STYLE[side];
          const Icon = st.icon;
          return (
            <button key={side} type="button" disabled={voted !== null} onClick={() => { setVoted(side); void onSubmit(`verdict:${side}`); }} className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-5 active:scale-95 disabled:opacity-50 ${voted === side ? st.box : 'border-lc-border bg-lc-card'}`}>
              <Icon className={`h-7 w-7 ${st.text}`} /><span className={`text-[16px] font-semibold ${st.text}`}>{st.label}</span>
            </button>
          );
        })}
      </div>
      {voted && <p className="text-center text-[13px] text-lc-text3">Vote in. Watch the big screen!</p>}
    </div>
  );
}
