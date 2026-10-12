'use client';

import { MessagesSquare } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** What one phone argues for before the vote. */
export interface DesignArgueCard {
  option: string;
  title: string;
  starters: string[];
}

/**
 * Design mission, "convince your partner": this phone's option to argue for and two sentence starters. Nothing to
 * tap or type: the student speaks, then the free vote follows.
 */
export function DesignArguePanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const data = spec.perStudentData ?? {};
  const card = [studentId, clientId, displayName]
    .map((k) => (k ? (data[k] as DesignArgueCard | undefined) : undefined))
    .find(Boolean);

  if (!card) {
    return (
      <div className="space-y-3 py-6 text-center">
        <MessagesSquare className="mx-auto h-8 w-8 text-amber-300" aria-hidden />
        <PhonePrompt center>{spec.prompt}</PhonePrompt>
        <p className="text-[15px] text-lc-text2">Tell a partner which one you would choose, and why.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-5">
        <PhoneLabel tone="text-amber-300">Convince your partner</PhoneLabel>
        <p className="font-display text-[30px] leading-[1.1] text-lc-text">
          <span className="mr-2 font-mono text-[22px] font-bold text-amber-300">{card.option}</span>
          {card.title}
        </p>
      </div>
      <div className="space-y-2">
        <PhoneLabel>Start like this</PhoneLabel>
        {card.starters.map((starter) => (
          <p key={starter} className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[17px] leading-snug text-lc-text">{starter}</p>
        ))}
      </div>
      <p className="text-center text-[15px] text-lc-text2">Say it out loud. Then you vote for the one you really want.</p>
    </div>
  );
}
