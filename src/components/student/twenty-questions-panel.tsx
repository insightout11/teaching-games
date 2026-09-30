'use client';

import { useEffect, useState } from 'react';
import { Check, Hand, HelpCircle, KeyRound, Mic, Send } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_FIELD, PHONE_PRIMARY, PhoneLabel, PhonePrompt } from './phone-kit';

export type TwentyQStyle = 'any' | 'yesno' | 'wh';
/** Room-wide state (perStudentData.__room). */
export interface TwentyQRoom {
  phase: 'secret' | 'asking' | 'guessing';
  remaining: number;
  style: TwentyQStyle;
  /** The question waiting for the keeper, if any. */
  pending?: { id: string; text: string; asker: string } | null;
  /** Speak it: hands up, the called student asks out loud. */
  askMode?: 'speak' | 'type';
  keeper?: string;
}
/** Per-student cards (by id / clientId / name). */
export type TwentyQCard =
  | { role: 'keeper'; secret?: string }
  | { role: 'asker'; rejected?: { reason: string; n: number }; handUp?: boolean; yourTurn?: boolean };

const STARTERS: Record<TwentyQStyle, string[]> = {
  any: ['Is it…', 'Can you…', 'Does it…', 'Where is it…', 'What colour…'],
  yesno: ['Is it…', 'Can you…', 'Does it…', 'Have you…', 'Would you…'],
  wh: ['What…', 'Where…', 'When…', 'Who…', 'How…'],
};
const ANSWERS = [
  { key: 'yes', label: 'Yes', cls: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-100' },
  { key: 'no', label: 'No', cls: 'border-rose-400/50 bg-rose-400/15 text-rose-100' },
  { key: 'maybe', label: 'Maybe', cls: 'border-amber-400/50 bg-amber-400/15 text-amber-100' },
  { key: 'sort of', label: 'Sort of', cls: 'border-sky-400/50 bg-sky-400/15 text-sky-100' },
];

export function TwentyQuestionsPanel({ spec, displayName, studentId, clientId, onSubmit }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string; onSubmit: (content: string) => Promise<void> | void }) {
  const data = spec.perStudentData ?? {};
  const room = data.__room as TwentyQRoom | undefined;
  const card = [studentId, clientId, displayName].map((k) => (k ? (data[k] as TwentyQCard | undefined) : undefined)).find(Boolean);
  const [text, setText] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const rejected = card?.role === 'asker' ? card.rejected : undefined;
  // A rejected question comes back to the box so it can be fixed.
  useEffect(() => { if (rejected && sent) { setText(sent); setSent(null); } }, [rejected?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return null;

  // ─── Keeper ───
  if (card?.role === 'keeper') {
    if (room.phase === 'secret') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-violet-300" /><PhonePrompt>You&apos;re the keeper!</PhonePrompt></div>
          <p className="text-[15px] text-lc-text2">Think of a person, place or thing. Only you will see it.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void onSubmit(`secret:${text.trim()}`); setText(''); } }} className="space-y-3">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="e.g. The Eiffel Tower" className={`w-full ${PHONE_FIELD}`} />
            <button type="submit" disabled={!text.trim()} className={`w-full py-4 text-lg ${PHONE_PRIMARY}`}>Lock it in</button>
          </form>
        </div>
      );
    }
    const q = room.pending;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-400/40 bg-violet-400/10 px-4 py-3 text-center">
          <PhoneLabel tone="text-violet-300">Your secret</PhoneLabel>
          <p className="font-display text-[28px] leading-tight text-lc-text">{card.secret ?? '…'}</p>
        </div>
        {q && room.phase === 'asking' ? (
          <>
            <div>
              <PhoneLabel>{q.asker} asks</PhoneLabel>
              <p className="mt-1 font-display text-[24px] leading-snug text-lc-text">{q.text}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ANSWERS.map((a) => (
                <button key={a.key} type="button" disabled={answered === q.id} onClick={() => { setAnswered(q.id); void onSubmit(`answer:${q.id}:${a.key}`); }} className={`rounded-2xl border-2 py-4 text-lg font-semibold active:scale-95 disabled:opacity-40 ${a.cls}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-[15px] text-lc-text2">{room.phase === 'guessing' ? 'Guessing time. Keep a straight face!' : 'Waiting for the next question…'}</p>
        )}
      </div>
    );
  }

  // ─── Askers ───
  if (room.phase === 'secret') {
    return <PhonePrompt center>The keeper is choosing a secret…</PhonePrompt>;
  }
  const guessing = room.phase === 'guessing';
  // Speak it: raise a hand; when called, ask out loud (typing it for the board is optional).
  if (room.askMode === 'speak' && !guessing) {
    const mine = card?.role === 'asker' ? card : undefined;
    if (mine?.yourTurn) {
      return (
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 p-5 text-center">
            <Mic className="mx-auto h-9 w-9 text-emerald-300" />
            <PhonePrompt center>Your turn! Ask {room.keeper ?? 'the keeper'} out loud.</PhonePrompt>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {STARTERS[room.style].map((st) => <span key={st} className="rounded-full border border-white/12 px-2.5 py-1 text-[13px] text-lc-text2">{st}</span>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void onSubmit(`ask:${text.trim()}`); setSent(text.trim()); setText(''); } }} className="space-y-2">
            <PhoneLabel>Optional: type it for the clue board</PhoneLabel>
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={160} placeholder="Is it an animal?" className={`min-w-0 flex-1 ${PHONE_FIELD}`} />
              <button type="submit" disabled={!text.trim()} className="rounded-xl border border-lc-border px-4 text-lc-text2 disabled:opacity-40" aria-label="Add to board"><Send className="h-4 w-4" /></button>
            </div>
          </form>
          {sent && <p className="text-center text-[13px] text-lc-text3">On the board: &ldquo;{sent}&rdquo;</p>}
        </div>
      );
    }
    return (
      <div className="space-y-4 py-4 text-center">
        <PhonePrompt center>{mine?.handUp ? 'Hand up! Wait to be called.' : 'Got a question?'}</PhonePrompt>
        <p className="text-[15px] text-lc-text2">{room.remaining} questions left{room.style !== 'any' ? ` · ${room.style === 'yesno' ? 'yes/no questions only' : 'WH-questions only'}` : ''}</p>
        <button type="button" disabled={mine?.handUp} onClick={() => void onSubmit('hand:up')} className={`mx-auto flex w-full items-center justify-center gap-2 py-5 text-lg ${PHONE_PRIMARY}`}>
          <Hand className="h-5 w-5" />{mine?.handUp ? 'Hand is up' : 'Raise hand'}
        </button>
      </div>
    );
  }
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    void onSubmit(guessing ? `guess:${t}` : `ask:${t}`);
    setSent(t);
    setText('');
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PhonePrompt>{guessing ? 'What is it? Guess!' : 'Ask a question'}</PhonePrompt>
        {!guessing && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[13px] text-lc-text2">{room.remaining} left</span>}
      </div>
      {!guessing && room.style !== 'any' && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-200"><HelpCircle className="h-3.5 w-3.5" />{room.style === 'yesno' ? 'Yes/no questions only' : 'Who / What / Where / When / Why / How only'}</p>
      )}
      {rejected && <p className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{rejected.reason}. Try again!</p>}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={guessing ? 80 : 160} placeholder={guessing ? 'Is it… ?' : 'Is it an animal?'} className={`w-full ${PHONE_FIELD}`} autoCapitalize="sentences" />
        {!guessing && (
          <div className="flex flex-wrap gap-1.5">
            {STARTERS[room.style].map((st) => (
              <button key={st} type="button" onClick={() => setText(st.replace('…', ' '))} className="rounded-full border border-white/12 px-2.5 py-1 text-[13px] text-lc-text2 active:scale-95">{st}</button>
            ))}
          </div>
        )}
        <button type="submit" disabled={!text.trim()} className={`flex w-full items-center justify-center gap-2 py-4 text-lg ${PHONE_PRIMARY}`}><Send className="h-4 w-4" />{guessing ? 'Guess' : 'Ask'}</button>
      </form>
      {sent && !rejected && <p className="flex items-center justify-center gap-1.5 text-[13px] text-lc-text3"><Check className="h-3.5 w-3.5 text-emerald-300" />Sent: &ldquo;{sent}&rdquo;</p>}
    </div>
  );
}
