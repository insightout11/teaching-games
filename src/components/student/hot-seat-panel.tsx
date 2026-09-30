'use client';

import { Armchair, Ban, Ear, Lock, Mic } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** Room-wide state (perStudentData.__room). */
export interface HotSeatRoom { phase: 'ready' | 'turn'; hotSeat: string; clueGiver?: string | null }
/** Per-student cards (by id / clientId / name). Everyone not in the hot seat gets the word. */
export type HotSeatCard =
  | { role: 'hot' }
  | { role: 'clue'; word: string; hint: string; yourTurn: boolean };

/**
 * Hot Seat on the phone: the guesser's phone hides the word; every other phone
 * shows it with a reminder to give a one-sentence clue out loud.
 */
export function HotSeatPanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const data = spec.perStudentData ?? {};
  const room = data.__room as HotSeatRoom | undefined;
  const card = [studentId, clientId, displayName].map((k) => (k ? (data[k] as HotSeatCard | undefined) : undefined)).find(Boolean);
  if (!room) return null;

  if (card?.role === 'hot') {
    return (
      <div className="space-y-3 py-6 text-center">
        <Armchair className="mx-auto h-12 w-12 text-amber-300" />
        <PhonePrompt center>You&apos;re in the hot seat!</PhonePrompt>
        <p className="text-[16px] text-lc-text2">Everyone else can see a secret word. Listen to their clues and say your guess out loud.</p>
        <p className="flex items-center justify-center gap-1.5 text-[13px] text-lc-text3"><Ear className="h-4 w-4" />No peeking at anyone&apos;s screen!</p>
      </div>
    );
  }

  if (room.phase === 'ready' || !card) {
    return (
      <div className="space-y-2 py-6 text-center">
        <PhonePrompt center>{room.hotSeat} is in the hot seat</PhonePrompt>
        <p className="text-[15px] text-lc-text2">Get ready to give clues. The word appears here when the clock starts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-5 text-center">
        <div className="flex items-center justify-between">
          <PhoneLabel tone="text-amber-300">The secret word</PhoneLabel>
          <span className="flex items-center gap-1 text-[11px] text-lc-text3"><Lock className="h-3 w-3" /> hide from {room.hotSeat}</span>
        </div>
        <p className="font-display text-[42px] leading-none text-lc-text">{card.word}</p>
        {card.hint && <p className="text-[14px] text-lc-text2">{card.hint}</p>}
      </div>
      {card.yourTurn ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
          <Mic className="h-6 w-6 shrink-0 text-emerald-300" />
          <p className="text-[16px] text-emerald-100">Your turn! Give {room.hotSeat} one clue, out loud.</p>
        </div>
      ) : (
        <p className="text-center text-[14px] text-lc-text2">{room.clueGiver ? `${room.clueGiver} is giving a clue. You're next soon!` : 'Wait for your turn to give a clue.'}</p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-[13px] text-lc-text3"><Ban className="h-3.5 w-3.5" />Don&apos;t say the word itself!</p>
    </div>
  );
}
