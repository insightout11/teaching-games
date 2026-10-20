'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clapperboard, Captions, CaptionsOff, Film, Megaphone, RefreshCw, Shuffle, Sparkles, Star, Users } from 'lucide-react';
import type { ActivityProps, SceneIgniterContent, SceneIgniterScene } from '../types';
import { assignSceneRoles, audienceJobs, rolesMatchGroup, sceneCastOf, sceneGroups, scenePhoneCards, withCharacterNames } from './casting';
import type { Student } from '@/lib/supabase/types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// Scene Igniter: "You're in a movie." The class is cast as named characters; each actor's
// phone holds THEIR script (their lines + the cue before each). The shared screen is the
// stage, never the script: who's speaking, as whom, and how. Teacher advances each line.
// Take 1 -> Director's notes (sent to one actor's phone) -> Take 2 -> "The scene continues…"
// (unscripted, in character) -> credits. Subtitles (off by default) show a line only AFTER it's said.

type Phase = 'idle' | 'casting' | 'take' | 'notes' | 'improv' | 'wrap';

const NOTES = ['More feeling!', 'Louder!', 'Slow down', 'Big pause for drama', 'Look at the other character', 'Bigger face!'];
const GENRE_TONE: Record<string, string> = { comedy: 'text-amber-300', mystery: 'text-violet-300', drama: 'text-rose-300', adventure: 'text-emerald-300' };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SceneIgniterActivity({ students, generatedContent, onPhaseChange, onScore, onSetInputSpec }: ActivityProps) {
  const content = generatedContent as SceneIgniterContent;
  const scenes = useMemo(() => content.scenes ?? [], [content.scenes]);

  const groups = useMemo(() => sceneGroups(students, scenes), [students, scenes]);
  const hasSecondCast = groups[1].length >= 2 && !!scenes[1];

  const [castNo, setCastNo] = useState<0 | 1>(0);
  const [alt, setAlt] = useState(false);
  const scene: SceneIgniterScene | undefined = scenes[castNo + (alt ? 2 : 0)] ?? scenes[castNo];
  const cast = useMemo(() => (scene ? sceneCastOf(scene) : []), [scene]);
  const group = groups[castNo];

  const [phase, setPhase] = useState<Phase>('idle');
  const [take, setTake] = useState<1 | 2>(1);
  const [lineIdx, setLineIdx] = useState(0);
  const [roles, setRoles] = useState<Map<string, Student>>(new Map());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [subtitles, setSubtitles] = useState(false);
  const [flash, setFlash] = useState<'action' | 'cut' | null>(null);
  const scored = useRef<Set<string>>(new Set());
  const [credits, setCredits] = useState<Array<{ key: string; character: string; actor?: string }>>([]);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p); };
  const clap = (kind: 'action' | 'cut') => { setFlash(kind); window.setTimeout(() => setFlash(null), 1100); };

  const castScene = useCallback((shuffle = false) => {
    if (!scene) return;
    setRoles(assignSceneRoles(scene.lines, shuffle ? shuffled(group) : group));
  }, [scene, group]);

  useEffect(() => { if (phase === 'casting') castScene(); }, [phase, castScene]);

  const line = scene?.lines[lineIdx];
  const speaker = line ? cast.find((c) => c.id === line.character) : undefined;
  const actor = line ? roles.get(line.character) : undefined;
  const prevLine = scene && lineIdx > 0 ? scene.lines[lineIdx - 1] : undefined;

  // ─── Phones: each actor gets their own script; everyone else is the audience ───
  useEffect(() => {
    // On the transition to a second cast, do not publish its script using the
    // previous cast's assignments while the casting effect is still updating.
    if (!scene || phase === 'idle' || phase === 'wrap' || (phase === 'casting' && !rolesMatchGroup(roles, group))) { onSetInputSpec?.(null); return; }
    const per = scenePhoneCards(scene, roles, students, phase, lineIdx, take, notes);
    onSetInputSpec?.({ type: 'confirm', gameKey: 'scene-igniter', prompt: `Scene: ${scene.title}`, perStudentData: per, stableInput: true });
  }, [scene, roles, group, students, phase, lineIdx, take, notes, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // ─── Flow ───
  const startTake = (n: 1 | 2) => { setTake(n); setLineIdx(0); go('take'); clap('action'); };

  const nextLine = () => {
    if (!scene || !line) return;
    const key = `${castNo}:${alt}:${line.lineIndex}`;
    if (take === 1 && actor?.id && !scored.current.has(key)) {
      scored.current.add(key);
      void onScore?.({ studentId: actor.id, clientId: null, displayName: actor.name, promptIndex: line.lineIndex, points: 1, isCorrect: null });
    }
    if (lineIdx + 1 >= scene.lines.length) {
      clap('cut');
      window.setTimeout(() => go(take === 1 ? 'notes' : 'improv'), 900);
    } else setLineIdx((i) => i + 1);
  };

  const endImprov = () => {
    setCredits((prev) => [...prev, ...cast.map((c) => ({ key: `${castNo}-${alt}-${c.id}`, character: c.name, actor: roles.get(c.id)?.name }))]);
    if (castNo === 0 && hasSecondCast) { setCastNo(1); setAlt(false); setNotes({}); go('casting'); }
    else go('wrap');
  };

  if (!scene) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Film className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Scene Igniter</p>
        <p className="text-white/60">No scene came through for this topic. Try launching it again.</p>
      </div>
    );
  }

  const genreTone = GENRE_TONE[scene.genre ?? ''] ?? 'text-amber-300';
  const overlay = (
    <AnimatePresence>
      {flash && (
        <motion.div key={flash} initial={{ opacity: 0, scale: 0.8, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className={`flex items-center gap-4 rounded-3xl border-4 px-10 py-6 font-display text-7xl shadow-2xl ${flash === 'action' ? 'border-amber-300 bg-slate-950/90 text-amber-300' : 'border-rose-300 bg-slate-950/90 text-rose-300'}`}>
            <Clapperboard className="h-16 w-16" />{flash === 'action' ? 'ACTION!' : 'CUT!'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const sceneHeader = (
    <div className="text-center">
      <p className={`font-mono text-xs uppercase tracking-[0.3em] ${genreTone}`}>{scene.genre ?? 'scene'}{castNo === 1 ? ' · second cast' : ''}</p>
      <p className="mt-1 font-display text-5xl">{scene.title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-lg text-white/70">{scene.context}</p>
    </div>
  );

  // ─── IDLE ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Clapperboard className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Scene Igniter</KitLabel>
          <p className="mt-2 font-display text-5xl">Lights, camera… English!</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">You&apos;re in a movie. Each actor gets their script on their phone: their lines, and the cue that tells them when to speak. Everyone else gets a director, narrator or critic job on their phone. One speaker at a time!</p>
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={() => go('casting')} className="!px-8 !py-3 !text-base" icon={<Users className="h-4 w-4" />}>Cast the scene</KitButton>
        </div>
      </div>
    );
  }

  // ─── CASTING ───
  if (phase === 'casting') {
    return (
      <div className="mx-auto max-w-5xl space-y-6 text-white">
        {sceneHeader}
        <div className="flex flex-wrap justify-center gap-3">
          {cast.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-56 rounded-2xl border border-amber-300/30 bg-slate-950/60 p-4 text-center">
              <p className="font-display text-3xl text-amber-200">{c.name}</p>
              {c.role && <p className="text-white/70">{c.role}</p>}
              {c.want && <p className="mt-2 text-sm italic text-white/55">{c.want}</p>}
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-white/45">played by</p>
              <p className="text-xl">{roles.get(c.id)?.name ?? '—'}</p>
            </motion.div>
          ))}
        </div>
        {audienceJobs(students, roles).size > 0 && <p className="text-center text-white/55">Audience jobs are on your phones. The teacher calls one person at a time.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="plain" onClick={() => castScene(true)} icon={<Shuffle className="h-3.5 w-3.5" />}>Recast</KitButton>
          {scenes[castNo + 2] && <KitButton tone="plain" onClick={() => setAlt((a) => !a)} icon={<RefreshCw className="h-3.5 w-3.5" />}>Another scene</KitButton>}
          <KitButton tone="amber" solid onClick={() => startTake(1)} className="!px-6 !py-2.5" icon={<Clapperboard className="h-4 w-4" />}>Take 1: Action!</KitButton>
        </div>
      </div>
    );
  }

  // ─── TAKE ───
  if (phase === 'take') {
    return (
      <div className="mx-auto max-w-5xl space-y-5 text-white">
        {overlay}
        <div className="flex items-center justify-between">
          <KitLabel tone="amber">Take {take} · {scene.title}</KitLabel>
          <KitReadout>line {lineIdx + 1} / {scene.lines.length}</KitReadout>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 px-6 py-10 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-300/10 to-transparent" />
          <AnimatePresence mode="wait">
            <motion.div key={lineIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/45">now speaking</p>
              <p className="mt-2 font-display text-6xl">{actor?.name ?? speaker?.name}</p>
              <p className="mt-1 text-2xl text-amber-200">as {speaker?.name}</p>
              {line?.direction && <p className="mt-4 inline-block rounded-full border border-white/15 px-4 py-1 text-lg italic text-white/75">({line.direction})</p>}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {cast.map((c) => (
              <span key={c.id} className={`rounded-full border px-3 py-1 text-sm transition ${c.id === line?.character ? 'border-amber-300 bg-amber-300/15 text-amber-50' : 'border-white/10 text-white/45'}`}>{c.name} · {roles.get(c.id)?.name}</span>
            ))}
          </div>
        </div>

        {subtitles && prevLine && (
          <p className="mx-auto max-w-3xl rounded-xl bg-black/60 px-5 py-3 text-center text-xl text-white/90">
            <span className="text-amber-200">{cast.find((c) => c.id === prevLine.character)?.name}:</span> {withCharacterNames(prevLine.text, cast)}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <KitButton tone="plain" disabled={lineIdx === 0} onClick={() => setLineIdx((i) => Math.max(0, i - 1))} icon={<ArrowLeft className="h-3.5 w-3.5" />}>Back</KitButton>
            <KitButton tone="plain" onClick={() => setSubtitles((v) => !v)} icon={subtitles ? <CaptionsOff className="h-3.5 w-3.5" /> : <Captions className="h-3.5 w-3.5" />}>{subtitles ? 'Subtitles off' : 'Subtitles'}</KitButton>
          </div>
          <KitButton tone="amber" solid onClick={nextLine} className="!px-6 !py-2.5" icon={<ArrowRight className="h-4 w-4" />}>{lineIdx + 1 >= scene.lines.length ? 'Cut!' : 'Next line'}</KitButton>
        </div>
      </div>
    );
  }

  // ─── DIRECTOR'S NOTES ───
  if (phase === 'notes') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        {overlay}
        <div className="text-center">
          <Megaphone className="mx-auto h-9 w-9 text-amber-300" />
          <p className="mt-2 font-display text-5xl">Director&apos;s notes</p>
          <p className="text-lg text-white/65">Great take! Send each actor a note. It appears on their phone for Take 2.</p>
        </div>
        <div className="space-y-2">
          {cast.map((c) => {
            const st = roles.get(c.id);
            if (!st) return null;
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <span className="w-44 shrink-0"><span className="font-display text-2xl">{st.name}</span> <span className="text-white/50">as {c.name}</span></span>
                {NOTES.map((n) => (
                  <button key={n} type="button" onClick={() => setNotes((prev) => ({ ...prev, [st.id]: prev[st.id] === n ? '' : n }))} className={`rounded-full border px-3 py-1 text-sm transition ${notes[st.id] === n ? 'border-amber-300 bg-amber-300/20 text-amber-50' : 'border-white/15 text-white/65 hover:border-white/30'}`}>{n}</button>
                ))}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="plain" onClick={() => go('improv')} icon={<Sparkles className="h-3.5 w-3.5" />}>Skip to the twist</KitButton>
          <KitButton tone="amber" solid onClick={() => startTake(2)} className="!px-6 !py-2.5" icon={<Clapperboard className="h-4 w-4" />}>Take 2: Action!</KitButton>
        </div>
      </div>
    );
  }

  // ─── THE SCENE CONTINUES (improv) ───
  if (phase === 'improv') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-2 text-center text-white">
        {overlay}
        <KitLabel tone="violet">The scene continues…</KitLabel>
        <motion.p initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-violet-300/40 bg-violet-400/[0.08] px-8 py-8 font-display text-4xl leading-snug">{scene.improvPrompt}</motion.p>
        <p className="text-xl text-white/70">No script now. Stay in character and keep the scene going! Your phone has your character and a few lines you can reuse.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {cast.map((c) => <span key={c.id} className="rounded-full border border-white/15 px-4 py-1.5 text-lg">{roles.get(c.id)?.name} <span className="text-white/50">as {c.name}</span></span>)}
        </div>
        <div className="flex justify-center">
          <KitButton tone="violet" solid onClick={endImprov} className="!px-6 !py-2.5" icon={<Clapperboard className="h-4 w-4" />}>{castNo === 0 && hasSecondCast ? 'Cut! Next cast' : "Cut! That's a wrap"}</KitButton>
        </div>
      </div>
    );
  }

  // ─── WRAP (credits) ───
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 text-center text-white">
      <Star className="mx-auto h-10 w-10 text-amber-300" />
      <p className="font-display text-6xl">That&apos;s a wrap!</p>
      <p className="text-xl text-white/65">Starring…</p>
      <div className="space-y-1">
        {credits.map((c, i) => (
          <motion.p key={c.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25 }} className="text-2xl">
            <span className="text-amber-200">{c.character}</span>{c.actor ? <span className="text-white/60"> · {c.actor}</span> : null}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
