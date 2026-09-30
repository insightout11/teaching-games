'use client';

import { useState } from 'react';
import { Ban, Ear, Lock, SkipForward } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_FIELD, PHONE_PRIMARY, PhoneLabel, PhonePrompt } from './phone-kit';

/** What one phone gets. Students not in the map are guessers. */
export type TabooPhoneCard =
  | { role: 'describer'; word: string; forbidden: string[] }
  | { role: 'bench' };

/**
 * Taboo Sprint on the phone: the describer sees the secret card (never the shared
 * screen), guessers type guesses, the other team (team mode) listens for taboo words.
 */
export function TabooSprintPanel({ spec, displayName, studentId, clientId, onSubmit }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string; onSubmit: (content: string) => Promise<void> | void }) {
  const data = spec.perStudentData ?? {};
  const card = [studentId, clientId, displayName]
    .map((k) => (k ? (data[k] as TabooPhoneCard | undefined) : undefined))
    .find(Boolean);
  const [guess, setGuess] = useState('');
  const [sent, setSent] = useState<string[]>([]);

  if (card?.role === 'describer') {
    return (
      <div className="space-y-4">
        <div className="space-y-4 rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-5 text-center">
          <div className="flex items-center justify-between">
            <PhoneLabel tone="text-amber-300">Describe this</PhoneLabel>
            <span className="flex items-center gap-1 text-[11px] text-lc-text3"><Lock className="h-3 w-3" /> only you</span>
          </div>
          <p className="font-display text-[40px] leading-none text-lc-text">{card.word}</p>
          <div className="space-y-2 border-t border-white/10 pt-3">
            <PhoneLabel tone="text-rose-300">Don&apos;t say</PhoneLabel>
            <div className="flex flex-wrap justify-center gap-1.5">
              {card.forbidden.map((w) => (
                <span key={w} className="flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-400/10 px-3 py-1 text-[15px] text-rose-100">
                  <Ban className="h-3.5 w-3.5" />{w}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => void onSubmit('skip')} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-3 text-[15px] text-lc-text2 active:scale-[0.98]">
          <SkipForward className="h-4 w-4" /> Skip this word
        </button>
      </div>
    );
  }

  if (card?.role === 'bench') {
    return (
      <div className="space-y-3 py-6 text-center">
        <Ear className="mx-auto h-8 w-8 text-amber-300" />
        <PhonePrompt center>The other team is describing.</PhonePrompt>
        <p className="text-[15px] text-lc-text2">Listen: if they say a forbidden word, shout &ldquo;Taboo!&rdquo;</p>
      </div>
    );
  }

  const send = () => {
    const g = guess.trim();
    if (!g) return;
    void onSubmit(`guess:${g}`);
    setSent((prev) => [g, ...prev].slice(0, 5));
    setGuess('');
  };

  return (
    <div className="space-y-4">
      <PhonePrompt>What&apos;s the word? Guess as many times as you like.</PhonePrompt>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="space-y-3">
        <input value={guess} onChange={(e) => setGuess(e.target.value)} maxLength={40} autoCapitalize="none" autoComplete="off" placeholder="Type a guess…" className={`w-full ${PHONE_FIELD}`} />
        <button type="submit" disabled={!guess.trim()} className={`w-full py-4 text-lg ${PHONE_PRIMARY}`}>Guess</button>
      </form>
      {sent.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sent.map((g, i) => <span key={`${g}-${i}`} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[13px] text-lc-text3">{g}</span>)}
        </div>
      )}
    </div>
  );
}
