'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, Megaphone, RotateCcw, Trophy, Volume2, X } from 'lucide-react';
import type { ActivityProps, FixTheCaptainContent, FixTheCaptainItem } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { speak, warmUpSpeech } from '@/lib/speech';
import { useSessionStore } from '@/stores/session-store';

// Fix the Captain: the captain's cabin announcements (chime + voice + text on screen) each hide
// ONE grammar mistake. Phones have a "Found it!" button; the first student to tap says the fix
// out loud. Teacher: ✓ reveals the correction (and scores), ✗ passes to the next in the queue.
// "Show the fix" when nobody gets it, which records the miss in the lesson thread (struggles).

type Phase = 'idle' | 'announce' | 'fixed' | 'done';
type Buzz = { clientId: string; studentId: string | null; name: string };

/** Two-tone cabin chime (Web Audio): ding-dong. Silent if audio is blocked. */
function chime(then?: () => void) {
  try {
    const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) { then?.(); return; }
    const ctx = new Ctx();
    [[880, 0], [660, 0.45]].forEach(([f, t]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.9);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 1);
    });
    window.setTimeout(() => { void ctx.close(); then?.(); }, 1300);
  } catch { then?.(); }
}

function Announcement({ item, fixed }: { item: FixTheCaptainItem; fixed: boolean }) {
  const i = item.text.indexOf(item.error);
  if (i < 0 || !fixed) return <>{item.text}</>;
  return (
    <>
      {item.text.slice(0, i)}
      <span className="relative inline-block">
        <span className="text-white/40 line-through decoration-rose-400 decoration-4">{item.error}</span>
        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-400 px-2 py-0.5 font-sans text-xl text-slate-950">{item.fix}</motion.span>
      </span>
      {item.text.slice(i + item.error.length)}
    </>
  );
}

export function FixTheCaptainActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as FixTheCaptainContent;
  const all = content.announcements ?? [];
  const items = isMicroEvent ? all.slice(0, 2) : all;
  const recordStruggle = useSessionStore((s) => s.recordStruggle);

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [queue, setQueue] = useState<Buzz[]>([]);
  const [turn, setTurn] = useState(0); // index into queue of who is answering
  const [fixedBy, setFixedBy] = useState<string | null>(null);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [missed, setMissed] = useState(0);
  const token = useRef(0);

  const item = items[idx];
  const speaker = queue[turn];

  useEffect(() => { warmUpSpeech(); }, []);
  const stop = useCallback(() => { token.current += 1; try { window.speechSynthesis?.cancel(); } catch { /* none */ } }, []);
  useEffect(() => () => stop(), [stop]);

  const readOut = useCallback((it: FixTheCaptainItem, withChime = true) => {
    stop();
    const t = token.current;
    const go = () => { if (t === token.current) speak(it.text, 0.92); };
    if (withChime) chime(go); else go();
  }, [stop]);

  // ─── Phones: one "Found it!" per announcement ───
  useEffect(() => {
    if (phase === 'announce' && item) onSetInputSpec?.({ type: 'confirm', gameKey: 'fix-the-captain', prompt: `Announcement ${idx + 1}: spot the captain's mistake!`, buttonLabel: 'Found it!' });
    else onSetInputSpec?.(null);
  }, [phase, item, idx, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'announce') return;
      setQueue((q) => (q.some((b) => b.clientId === vote.clientId) ? q : [...q, { clientId: vote.clientId, studentId: vote.studentId ?? null, name: vote.displayName }]));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, onRegisterRemoteVoteHandler]);

  const open = (i: number) => {
    setIdx(i);
    setQueue([]);
    setTurn(0);
    setFixedBy(null);
    setPhase('announce');
    onPhaseChange?.('announce');
    const it = items[i];
    if (it) window.setTimeout(() => readOut(it), 300);
  };

  const right = () => {
    if (!speaker) return;
    const points = turn === 0 ? 3 : 2;
    void onScore?.({ studentId: speaker.studentId, clientId: speaker.clientId, displayName: speaker.name, promptIndex: idx + 1, points, isCorrect: true });
    setTally((t) => ({ ...t, [speaker.name]: (t[speaker.name] ?? 0) + 1 }));
    setFixedBy(speaker.name);
    setPhase('fixed');
    onPhaseChange?.('fixed');
  };
  const wrong = () => setTurn((n) => n + 1);
  const showFix = () => {
    if (!item) return;
    recordStruggle({ stage: 'fix-the-captain', text: item.text, fix: item.fix });
    setMissed((m) => m + 1);
    setFixedBy(null);
    setPhase('fixed');
    onPhaseChange?.('fixed');
  };
  const next = () => {
    stop();
    if (idx + 1 < items.length) open(idx + 1);
    else { setPhase('done'); onPhaseChange?.('done'); }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Megaphone className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Fix the Captain</p>
        <p className="text-white/60">No announcements came through. Try launching it again.</p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Megaphone className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Fix the Captain{content.grammarTarget ? ` · ${content.grammarTarget}` : ''}</KitLabel>
          <p className="mt-2 font-display text-5xl">The captain keeps making mistakes!</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">Each announcement has <span className="text-white">one</span> grammar mistake. Spot it? Tap <span className="text-white">&ldquo;Found it!&rdquo;</span> on your phone. If you&apos;re first, say the fix out loud!</p>
        <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.07] px-4 py-3 text-left">
          <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <p className="text-sm text-white/75">Sharing on Zoom? Tick <span className="text-white">&ldquo;Share sound&rdquo;</span> so students hear the captain.</p>
        </div>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={() => open(0)} className="!px-8 !py-3 !text-base" icon={<Megaphone className="h-4 w-4" />}>First announcement</KitButton></div>
      </div>
    );
  }

  if (phase === 'done') {
    const fixed = items.length - missed;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-8 text-center text-white">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">The class fixed {fixed} of {items.length}</p>
        {top.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {top.map(([name, n]) => <span key={name} className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-lg text-amber-50">{name} · {n} fix{n > 1 ? 'es' : ''}</span>)}
          </div>
        )}
        {missed > 0 && <p className="text-white/60">The {missed === 1 ? 'one' : missed} the class missed will come back later in the lesson.</p>}
      </div>
    );
  }

  if (!item) return null;
  const fixed = phase === 'fixed';
  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="amber">Fix the Captain · announcement {idx + 1} of {items.length}</KitLabel>
        <KitReadout>{queue.length} found it</KitReadout>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 px-8 pb-10 pt-6">
        <p className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-amber-300/80"><Megaphone className="h-4 w-4" />Cabin announcement</p>
        <p className="font-display text-4xl leading-[1.6]"><Announcement item={item} fixed={fixed} /></p>
        {fixed && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-lg text-white/70">{item.explanation}</motion.p>}
      </div>

      {!fixed && (
        speaker ? (
          <motion.div key={speaker.clientId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-400/[0.08] px-5 py-4">
            <p className="text-2xl"><span className="font-display text-4xl">{speaker.name}</span> {turn === 0 ? 'found it first!' : 'has a go!'} What&apos;s the fix?</p>
            <div className="flex gap-2">
              <KitButton tone="emerald" solid onClick={right} icon={<Check className="h-4 w-4" />}>Right</KitButton>
              <KitButton tone="rose" onClick={wrong} icon={<X className="h-4 w-4" />}>Not quite</KitButton>
            </div>
          </motion.div>
        ) : (
          <p className="text-center text-xl text-white/60">{queue.length > 0 ? 'Everyone in the queue has tried. Listen again?' : 'Listen… who can spot it?'}</p>
        )
      )}
      {!fixed && queue.length > turn + 1 && <p className="text-center text-white/50">Next up: {queue.slice(turn + 1, turn + 4).map((b) => b.name).join(', ')}</p>}
      {fixed && fixedBy && <p className="text-center text-2xl text-emerald-200">Fixed by {fixedBy}!</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitButton tone="plain" onClick={() => readOut(item, false)} icon={<RotateCcw className="h-3.5 w-3.5" />}>Hear it again</KitButton>
        {fixed
          ? <KitButton tone="amber" solid onClick={next} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < items.length ? 'Next announcement' : 'Finish'}</KitButton>
          : <KitButton tone="plain" onClick={showFix} icon={<Eye className="h-3.5 w-3.5" />}>Show the fix</KitButton>}
      </div>
    </div>
  );
}
