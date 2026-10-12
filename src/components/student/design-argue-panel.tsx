'use client';

import { MessagesSquare } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PhoneLabel, PhonePrompt } from './phone-kit';

/** The finished design, sent to every phone at the end (room-wide, under `__blueprint`). */
export interface DesignPhoneBlueprint {
  title: string;
  pitch: string;
  decisions: Array<{ stage: string; title: string }>;
  cities: string[];
}

/** What one phone argues for before the vote. */
export interface DesignArgueCard {
  option: string;
  title: string;
  starters: string[];
}

/**
 * Design mission, "convince your partner": this phone's option to argue for and two sentence starters. Nothing to
 * tap or type: the student speaks, then the free vote follows. At the end the same panel shows the class's blueprint.
 */
export function DesignArguePanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const data = spec.perStudentData ?? {};
  const blueprint = data.__blueprint as DesignPhoneBlueprint | undefined;
  if (blueprint) {
    return (
      <div className="space-y-4 rounded-md bg-[#f4efe3] p-5 text-[#1b2233]">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a5a00]">Our class blueprint</p>
        <p className="font-display text-[32px] leading-[1.08]">{blueprint.title}</p>
        <p className="border-l-[3px] border-[#b7791f] pl-3 text-[17px] font-semibold leading-snug">{blueprint.pitch}</p>
        <ul className="space-y-2">
          {blueprint.decisions.map((decision, index) => (
            <li key={`${decision.stage}-${index}`} className="rounded border-[1.5px] border-[#1b2233]/25 bg-white/50 px-3 py-2">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#1b2233]/55">{index + 1} · {decision.stage}</span>
              <span className="block text-[16px] font-bold leading-tight">{decision.title}</span>
            </li>
          ))}
        </ul>
        {blueprint.cities.length > 0 && (
          <p className="border-t-[1.5px] border-[#1b2233]/20 pt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#1b2233]/65">From {blueprint.cities.join(' · ')}</p>
        )}
      </div>
    );
  }
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
