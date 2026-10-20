'use client';

import { useEffect, useRef } from 'react';
import { Clapperboard, Megaphone, Sparkles, Users } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhoneLabel, PhonePrompt } from './phone-kit';
import type { SceneActorCard, SceneAudienceCard } from '@/activities/scene-igniter/casting';


/**
 * Scene Igniter phone: the actor's own script. Their lines, each with the cue line before it;
 * the line to say now is big and amber (buzz), the next one is marked "get ready".
 * Non-actors see an audience card.
 */
export function SceneScriptPanel({ spec, displayName, studentId, clientId }: { spec: InputSpec; displayName?: string; studentId?: string | null; clientId?: string }) {
  const per = spec.perStudentData ?? {};
  const mine = [studentId, clientId, displayName].map(k => k ? per[k] as SceneActorCard | SceneAudienceCard | undefined : undefined)
    .find(candidate => candidate?.role === 'actor' || candidate?.role === 'audience');
  const card = mine?.role === 'actor' ? mine : undefined;
  const nowRef = useRef<HTMLDivElement>(null);
  const saying = card?.mode === 'script' ? card.lines.find((l) => l.i === card.current) : undefined;
  const next = card?.mode === 'script' ? card.lines.find((l) => l.i > card.current) : undefined;

  useEffect(() => {
    if (saying) { buzz(BUZZ.yourTurn); nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, [saying?.i]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mine?.role === 'audience') {
    return (
      <div className="space-y-4">
        <Users className="mx-auto h-8 w-8 text-cyan-300" />
        <PhonePrompt center>{mine.title}</PhonePrompt>
        <p className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-[17px] text-lc-text">{mine.instruction}</p>
        <p className="text-[13px] text-lc-text3">{mine.progress}</p>
        <div className="space-y-2 rounded-xl border border-white/10 p-4">
          <PhoneLabel>{mine.scene}</PhoneLabel>
          <p className="text-[15px] text-lc-text2">{mine.context}</p>
        </div>
      </div>
    );
  }
  if (!card) {
    return (
      <div className="space-y-3 text-center">
        <Users className="mx-auto h-8 w-8 text-cyan-300" />
        <PhonePrompt center>You&apos;re in the audience</PhonePrompt>
        <p className="text-[15px] text-lc-text2">Watch the scene. Listen: what does each character want?</p>
      </div>
    );
  }

  const header = (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-4 py-3">
      <PhoneLabel tone="text-amber-300">You play</PhoneLabel>
      <p className="font-display text-[30px] leading-tight text-lc-text">{card.character.name}</p>
      {(card.characters?.length ?? 0) > 1 && <p className="text-[14px] text-lc-text2">Your parts: {card.characters.map(character => character.name).join(', ')}</p>}
      {card.character.role && <p className="text-[15px] text-lc-text2">{card.character.role}</p>}
      {card.character.want && <p className="mt-1 text-[14px] italic text-lc-text3">{card.character.want}</p>}
    </div>
  );

  const note = card.note ? (
    <p className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-300/15 px-3 py-2 text-[15px] text-amber-50"><Megaphone className="h-4 w-4 text-amber-300" />Director: {card.note}</p>
  ) : null;

  if (card.mode === 'improv') {
    return (
      <div className="space-y-4">
        {header}
        <div className="rounded-2xl border border-violet-300/40 bg-violet-400/10 px-4 py-3">
          <PhoneLabel tone="text-violet-300">The scene continues…</PhoneLabel>
          <p className="text-[17px] text-lc-text">{card.improv?.prompt}</p>
        </div>
        <p className="flex items-center gap-2 text-[15px] text-lc-text2"><Sparkles className="h-4 w-4 text-violet-300" />No script now: stay in character!</p>
        <div className="space-y-1.5">
          <PhoneLabel>Lines you can reuse</PhoneLabel>
          {card.lines.slice(0, 3).map((l) => <p key={l.i} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[15px] text-lc-text">{l.text}</p>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {note}
      <p className="flex items-center gap-2 text-[13px] text-lc-text3"><Clapperboard className="h-4 w-4" />Take {card.take} · {card.scene.title}</p>
      <div className="space-y-3">
        {card.lines.map((l) => {
          const now = saying?.i === l.i;
          const soon = !saying && next?.i === l.i;
          const done = l.i < card.current;
          return (
            <div key={l.i} ref={now ? nowRef : undefined} className={`rounded-2xl border px-4 py-3 transition ${now ? 'border-amber-400 bg-amber-400/15' : soon ? 'border-cyan-300/50 bg-cyan-400/[0.07]' : 'border-white/10 bg-white/[0.02]'} ${done ? 'opacity-45' : ''}`}>
              {l.cue && <p className="text-[13px] text-lc-text3"><span className="uppercase tracking-wide">Cue</span>{l.cue.by ? ` · ${l.cue.by}` : ''}: &ldquo;{l.cue.text}&rdquo;</p>}
              {now && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">Say it now</p>}
              {soon && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Get ready</p>}
              {(card.characters?.length ?? 0) > 1 && <p className="text-[13px] text-amber-200">As {l.by}</p>}
              <p className={`mt-1 ${now ? 'text-[22px] leading-snug text-amber-50' : 'text-[17px] text-lc-text'}`}>{l.text}</p>
              {l.direction && <p className="mt-1 text-[14px] italic text-lc-text2">({l.direction})</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
