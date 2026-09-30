'use client';

import { useState } from 'react';
import { BookOpen, Check, Ear, Mic, Send } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_FIELD, PhoneLabel, PhonePrompt } from './phone-kit';

/** Room-wide state (perStudentData.__room). */
export interface StoryChainRoom { teller: string | null; lastLine: string | null; turn: number }
/** The storyteller's card (by id / clientId / name). */
export interface StoryChainCard { role: 'teller'; card: string }

/**
 * Story Chain on the phone: the storyteller gets a story card and says their
 * sentence OUT LOUD (typing a few key words for the board is optional);
 * everyone else listens.
 */
export function StoryChainPanel({ spec, displayName, studentId, clientId, onSubmit }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string; onSubmit: (content: string) => Promise<void> | void }) {
  const data = spec.perStudentData ?? {};
  const room = data.__room as StoryChainRoom | undefined;
  const card = [studentId, clientId, displayName].map((k) => (k ? (data[k] as StoryChainCard | undefined) : undefined)).find(Boolean);
  const [words, setWords] = useState('');
  const [sentFor, setSentFor] = useState<number | null>(null);
  if (!room) return null;

  if (card?.role === 'teller') {
    const sent = sentFor === room.turn;
    return (
      <div className="space-y-4">
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 p-5 text-center">
          <Mic className="mx-auto h-9 w-9 text-emerald-300" />
          <PhonePrompt center>Your turn! Say the next sentence out loud.</PhonePrompt>
        </div>
        <div className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-center">
          <PhoneLabel tone="text-amber-300">Your story card</PhoneLabel>
          <p className="mt-1 font-display text-[24px] leading-snug text-lc-text">{card.card}</p>
        </div>
        {room.lastLine && (
          <div>
            <PhoneLabel>The story so far ends with</PhoneLabel>
            <p className="mt-1 text-[15px] italic text-lc-text2">&ldquo;{room.lastLine}&rdquo;</p>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); if (words.trim()) { void onSubmit(`line:${words.trim()}`); setSentFor(room.turn); setWords(''); } }} className="space-y-2">
          <PhoneLabel>Optional: type a few words for the board</PhoneLabel>
          <div className="flex gap-2">
            <input value={words} onChange={(e) => setWords(e.target.value.slice(0, 120))} placeholder="dragon ate the map" className={`min-w-0 flex-1 ${PHONE_FIELD}`} />
            <button type="submit" disabled={!words.trim()} aria-label="Add to board" className="rounded-xl border border-lc-border px-4 text-lc-text2 disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </div>
          {sent && <p className="flex items-center gap-1.5 text-[13px] text-emerald-200"><Check className="h-3.5 w-3.5" />On the board</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-6 text-center">
      {room.teller ? <Ear className="mx-auto h-10 w-10 text-amber-300" /> : <BookOpen className="mx-auto h-10 w-10 text-amber-300" />}
      <PhonePrompt center>{room.teller ? `Listen: ${room.teller} is telling the story` : 'Story Chain'}</PhonePrompt>
      <p className="text-[15px] text-lc-text2">{room.teller ? 'Get ready: you might be next. Think about what could happen!' : 'The story is about to start.'}</p>
      {room.lastLine && <p className="text-[15px] italic text-lc-text3">&ldquo;{room.lastLine}&rdquo;</p>}
    </div>
  );
}
