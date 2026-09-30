'use client';

import { useState } from 'react';
import { Check, Delete, Loader2, Send, Star, X } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_PRIMARY, PhoneLabel } from './phone-kit';

/** Room-wide Round 1 state (perStudentData.__room). */
export interface GridRushRoom { letters: string[]; bonusIndex: number; bonusLetter: string }
/** One phone's words (perStudentData[clientId]). */
export interface GridRushMine { words: Array<{ w: string; status: 'checking' | 'ok' | 'rejected'; pts?: number; reason?: string }> }

/**
 * GridRush Round 1 on the phone: a real 3×3 letter grid. Tap letters to build a
 * word (letters can be reused) or type it; each word shows checking → points or why not.
 */
export function GridRushPanel({ spec, clientId, onSubmit, timeLeft, timerSeconds }: { spec: InputSpec; clientId?: string; onSubmit: (content: string) => Promise<void> | void; timeLeft: number; timerSeconds: number }) {
  const room = spec.perStudentData?.__room as GridRushRoom | undefined;
  const mine = (clientId ? spec.perStudentData?.[clientId] : undefined) as GridRushMine | undefined;
  const [word, setWord] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  if (!room) return null;

  const pool = new Set(room.letters.map((l) => l.toUpperCase()));
  const valid = word.length >= 3 && word.toUpperCase().split('').every((c) => pool.has(c));
  const known = new Set((mine?.words ?? []).map((x) => x.w));
  // Words just sent that the teacher screen hasn't echoed yet show as "checking".
  const list = [
    ...pending.filter((w) => !known.has(w)).map((w) => ({ w, status: 'checking' as const })),
    ...[...(mine?.words ?? [])].reverse(),
  ];
  const total = (mine?.words ?? []).reduce((n, x) => n + (x.status === 'ok' ? x.pts ?? 0 : 0), 0);
  const expired = timerSeconds > 0 && timeLeft <= 0;

  const send = () => {
    const w = word.trim().toLowerCase();
    if (!valid || known.has(w) || expired) return;
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
      <div className="grid grid-cols-3 gap-2">
        {room.letters.map((l, i) => {
          const bonus = i === room.bonusIndex;
          return (
            <button key={i} type="button" onClick={() => setWord((w) => (w.length < 15 ? w + l.toLowerCase() : w))} className={`relative flex h-16 items-center justify-center rounded-2xl font-display text-[32px] active:scale-95 ${bonus ? 'border-2 border-amber-400 bg-amber-400/15 text-amber-100' : 'border border-lc-border bg-lc-card text-lc-text'}`}>
              {bonus && <Star className="absolute left-1.5 top-1.5 h-3 w-3 fill-amber-300 text-amber-300" />}
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input value={word} onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 15))} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Tap letters or type" autoCapitalize="none" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-lc-border bg-lc-bg px-4 py-3 text-center font-display text-[26px] uppercase tracking-[0.12em] text-lc-text placeholder:font-sans placeholder:text-base placeholder:normal-case placeholder:tracking-normal placeholder:text-lc-text3 focus:outline-none" />
        <button type="button" onClick={() => setWord((w) => w.slice(0, -1))} aria-label="Delete a letter" className="flex h-12 w-12 items-center justify-center rounded-xl border border-lc-border text-lc-text2 active:scale-95"><Delete className="h-5 w-5" /></button>
      </div>
      {word && !valid && <p className="text-center text-[13px] text-amber-200">{word.length < 3 ? '3 letters or more' : 'Only letters from the grid'}</p>}
      <button type="button" disabled={!valid || expired || known.has(word.toLowerCase())} onClick={send} className={`flex w-full items-center justify-center gap-2 py-4 text-lg ${PHONE_PRIMARY}`}>
        <Send className="h-4 w-4" />{known.has(word.toLowerCase()) ? 'Already sent' : expired ? 'Time’s up' : 'Send word'}
      </button>
      <div className="flex items-center justify-between">
        <PhoneLabel>Your words · {(mine?.words ?? []).filter((x) => x.status === 'ok').length}</PhoneLabel>
        <PhoneLabel tone="text-cyan-300">{total} pts</PhoneLabel>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((x) => (
          <span key={x.w} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[14px] ${x.status === 'ok' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : x.status === 'rejected' ? 'border-rose-400/40 bg-rose-400/10 text-rose-200 line-through' : 'border-white/12 text-lc-text2'}`} title={x.status === 'rejected' ? (x as { reason?: string }).reason : undefined}>
            {x.status === 'checking' ? <Loader2 className="h-3 w-3 animate-spin" /> : x.status === 'ok' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {x.w}{x.status === 'ok' && 'pts' in x && x.pts ? <span className="font-mono text-[11px] opacity-70">+{x.pts}</span> : null}
          </span>
        ))}
      </div>
      {list.some((x) => x.status === 'rejected') && <p className="text-[12px] text-lc-text3">Crossed-out words weren&apos;t accepted (not a real word, or letters missing).</p>}
    </div>
  );
}
