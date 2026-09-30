'use client';

import { useState } from 'react';
import { Check, Loader2, Send, X } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_FIELD, PHONE_PRIMARY, PhoneLabel, PhonePrompt } from './phone-kit';

export interface SynonymRoom { target: string; sentence: string }
export interface SynonymMine { words: Array<{ w: string; status: 'checking' | 'ok' | 'bad'; pts?: number; feedback?: string }> }

/** Synonym Showdown race on the phone: type many synonyms, see each one checked. */
export function SynonymPanel({ spec, clientId, onSubmit, timeLeft, timerSeconds }: { spec: InputSpec; clientId?: string; onSubmit: (content: string) => Promise<void> | void; timeLeft: number; timerSeconds: number }) {
  const room = spec.perStudentData?.__room as SynonymRoom | undefined;
  const mine = (clientId ? spec.perStudentData?.[clientId] : undefined) as SynonymMine | undefined;
  const [word, setWord] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  if (!room) return null;
  const known = new Set((mine?.words ?? []).map((x) => x.w));
  const list = [...pending.filter((w) => !known.has(w)).map((w) => ({ w, status: 'checking' as const })), ...[...(mine?.words ?? [])].reverse()];
  const total = (mine?.words ?? []).reduce((n, x) => n + (x.status === 'ok' ? x.pts ?? 0 : 0), 0);
  const expired = timerSeconds > 0 && timeLeft <= 0;
  const send = () => {
    const w = word.trim().toLowerCase();
    if (!w || known.has(w) || pending.includes(w) || expired) return;
    void onSubmit(w);
    setPending((p) => [w, ...p]);
    setWord('');
  };
  return (
    <div className="space-y-4">
      {timerSeconds > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full transition-[width] duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-rose-400' : 'bg-cyan-400'}`} style={{ width: `${Math.max(0, Math.min(100, (timeLeft / timerSeconds) * 100))}%` }} />
        </div>
      )}
      <div className="rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-3 text-center">
        <PhoneLabel tone="text-cyan-300">Other words for</PhoneLabel>
        <p className="font-display text-[34px] leading-tight text-lc-text">{room.target}</p>
        {room.sentence && <p className="mt-1 text-[14px] italic text-lc-text2">&ldquo;{room.sentence}&rdquo;</p>}
      </div>
      <PhonePrompt>Type as many as you can. Rare words score a bonus!</PhonePrompt>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input value={word} onChange={(e) => setWord(e.target.value.slice(0, 40))} autoCapitalize="none" autoComplete="off" placeholder="Type a synonym" className={`min-w-0 flex-1 ${PHONE_FIELD}`} />
        <button type="submit" disabled={!word.trim() || expired} className={`flex items-center gap-1.5 px-5 ${PHONE_PRIMARY}`}><Send className="h-4 w-4" /></button>
      </form>
      {expired && <p className="text-center text-sm text-lc-text2">Time&apos;s up!</p>}
      <div className="flex items-center justify-between">
        <PhoneLabel>Your words · {(mine?.words ?? []).filter((x) => x.status === 'ok').length}</PhoneLabel>
        <PhoneLabel tone="text-cyan-300">{total} pts</PhoneLabel>
      </div>
      <div className="space-y-1.5">
        {list.map((x) => (
          <div key={x.w} className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${x.status === 'ok' ? 'border-emerald-400/40 bg-emerald-400/10' : x.status === 'bad' ? 'border-rose-400/40 bg-rose-400/10' : 'border-white/10'}`}>
            {x.status === 'checking' ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-lc-text3" /> : x.status === 'ok' ? <Check className="mt-0.5 h-4 w-4 text-emerald-300" /> : <X className="mt-0.5 h-4 w-4 text-rose-300" />}
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] ${x.status === 'bad' ? 'text-rose-100 line-through' : 'text-lc-text'}`}>{x.w}{x.status === 'ok' && 'pts' in x && x.pts ? <span className="ml-1.5 font-mono text-[12px] text-emerald-200">+{x.pts}</span> : null}</p>
              {'feedback' in x && x.feedback && x.status === 'bad' && <p className="text-[12px] text-lc-text3">{x.feedback}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
