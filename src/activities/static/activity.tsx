'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Flame, Headphones, RotateCcw, Snail, Volume2, Zap } from 'lucide-react';
import type { ActivityProps, StaticContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { speak, warmUpSpeech } from '@/lib/speech';

// Static: a fast listening break. The screen shows a sentence; the voice reads it with ONE
// word swapped (ship/sheep, fifteen/fifty). Phones tap which word changed. Streaks for
// consecutive hits; results are class counts, and only streak leaders are ever named.

type Phase = 'idle' | 'round' | 'reveal' | 'done';
type Ballot = { clientId: string; studentId: string | null; name: string; pick: number };

function Sentence({ text, target, swap, revealed }: { text: string; target: string; swap: string; revealed: boolean }) {
  const re = new RegExp(`\\b(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
  const m = text.match(re);
  if (!revealed || !m || m.index == null) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.index)}
      <span className="relative inline-block">
        <span className="text-white/40 line-through decoration-rose-400 decoration-4">{m[1]}</span>
        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-rose-400 px-2 py-0.5 font-mono text-base text-slate-950">{swap}</motion.span>
      </span>
      {text.slice(m.index + m[1].length)}
    </>
  );
}

export function StaticActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as StaticContent;
  const all = content.rounds ?? [];
  const rounds = isMicroEvent ? all.slice(0, 3) : all;

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [results, setResults] = useState<Array<{ caught: number; answered: number }>>([]);
  const [streaks, setStreaks] = useState<Record<string, { name: string; now: number; best: number }>>({});
  const scoredRef = useRef<Set<number>>(new Set());
  const token = useRef(0);

  const round = rounds[idx];
  useEffect(() => { warmUpSpeech(); }, []);

  const stop = useCallback(() => {
    token.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);
  useEffect(() => () => stop(), [stop]);

  const play = useCallback((text: string, slow = false) => {
    stop();
    const t = ++token.current;
    setPlaying(true);
    setPlays((n) => n + 1);
    speak(text, slow ? 0.72 : 0.92, () => { if (t === token.current) setPlaying(false); });
  }, [stop]);

  // ─── Phones ───
  useEffect(() => {
    if (phase === 'round' && round) onSetInputSpec?.({ type: 'choice', gameKey: 'static', prompt: 'Which word was different?', options: round.options });
    else onSetInputSpec?.(null);
  }, [phase, round, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'round' || !round) return;
      const pick = round.options.indexOf(vote.choice);
      if (pick < 0) return;
      setBallots((prev) => [...prev.filter((b) => b.clientId !== vote.clientId), { clientId: vote.clientId, studentId: vote.studentId ?? null, name: vote.displayName, pick }]);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, round, onRegisterRemoteVoteHandler]);

  // ─── Flow ───
  const openRound = (i: number) => {
    stop();
    setIdx(i);
    setBallots([]);
    setPlays(0);
    setPhase('round');
    onPhaseChange?.('round');
    // Straight in: the voice starts a beat after the sentence appears.
    const r = rounds[i];
    if (r) window.setTimeout(() => play(r.spoken), 700);
  };

  const reveal = () => {
    if (!round) return;
    stop();
    if (!scoredRef.current.has(idx)) {
      scoredRef.current.add(idx);
      const caught = ballots.filter((b) => b.pick === round.correctIndex).length;
      setResults((r) => { const n = [...r]; n[idx] = { caught, answered: ballots.length }; return n; });
      setStreaks((prev) => {
        const next = { ...prev };
        ballots.forEach((b) => {
          const ok = b.pick === round.correctIndex;
          const cur = next[b.clientId] ?? { name: b.name, now: 0, best: 0 };
          const now = ok ? cur.now + 1 : 0;
          next[b.clientId] = { name: b.name, now, best: Math.max(cur.best, now) };
          void onScore?.({ studentId: b.studentId, clientId: b.clientId, displayName: b.name, promptIndex: idx + 1, points: ok ? 2 + Math.min(cur.now, 3) : 0, isCorrect: ok });
        });
        return next;
      });
    }
    setPhase('reveal');
    onPhaseChange?.('reveal');
  };

  const next = () => {
    if (idx + 1 < rounds.length) openRound(idx + 1);
    else { stop(); setPhase('done'); onPhaseChange?.('done'); }
  };

  const hot = Object.values(streaks).filter((s) => s.now >= 3).sort((a, b) => b.now - a.now).slice(0, 3);

  if (rounds.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Zap className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Static</p>
        <p className="text-white/60">No rounds came through for this topic. Try launching it again.</p>
      </div>
    );
  }

  // ─── IDLE ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Zap className="mx-auto h-10 w-10 text-rose-300" />
        <div>
          <KitLabel tone="rose">Static</KitLabel>
          <p className="mt-2 font-display text-5xl">Something&apos;s wrong on the line.</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">Read the sentence on the screen. The voice will say it with <span className="text-white">one word swapped</span>. Catch it and tap that word on your phone. Get them in a row for a streak!</p>
        <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.07] px-4 py-3 text-left">
          <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <p className="text-sm text-white/75">Sharing on Zoom? Tick <span className="text-white">&ldquo;Share sound&rdquo;</span> so students hear the voice.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="cyan" onClick={() => speak('Radio check. Can you hear me?')} icon={<Headphones className="h-3.5 w-3.5" />}>Sound check</KitButton>
          <KitButton tone="rose" solid onClick={() => openRound(0)} className="!px-8 !py-3 !text-base" icon={<Zap className="h-4 w-4" />}>Start</KitButton>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === 'done') {
    const caught = results.reduce((n, r) => n + (r?.caught ?? 0), 0);
    const answered = results.reduce((n, r) => n + (r?.answered ?? 0), 0);
    const best = Object.values(streaks).filter((s) => s.best >= 2).sort((a, b) => b.best - a.best).slice(0, 3);
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6 text-center text-white">
        <KitLabel tone="rose">Static · line clear</KitLabel>
        <p className="font-display text-5xl">{answered ? `The class caught ${caught} of ${answered}` : 'Line clear'}</p>
        {best.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {best.map((s) => <span key={s.name} className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-lg text-amber-50"><Flame className="h-4 w-4 text-amber-300" />{s.name} · {s.best} in a row</span>)}
          </div>
        )}
      </div>
    );
  }

  // ─── ROUND / REVEAL ───
  if (!round) return null;
  const revealed = phase === 'reveal';
  const caughtNow = ballots.filter((b) => b.pick === round.correctIndex).length;
  return (
    <div className="mx-auto max-w-5xl space-y-6 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="rose">Static · {idx + 1} of {rounds.length}</KitLabel>
        <KitReadout>{revealed ? `${caughtNow} of ${ballots.length} caught it` : `${ballots.length} answered`}</KitReadout>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-8 py-12">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)' }}
          animate={playing ? { opacity: [0.05, 0.14, 0.06, 0.12] } : { opacity: 0.05 }}
          transition={playing ? { duration: 0.4, repeat: Infinity } : { duration: 0.2 }}
        />
        <p className="relative text-center font-display text-4xl leading-[1.5] md:text-5xl">
          <Sentence text={round.sentence} target={round.target} swap={round.swap} revealed={revealed} />
        </p>
        {revealed && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mt-6 text-center text-lg text-white/70">
            The screen said <span className="text-white">&ldquo;{round.target}&rdquo;</span>, the voice said <span className="text-rose-200">&ldquo;{round.swap}&rdquo;</span>.
          </motion.p>
        )}
      </div>

      {hot.length > 0 && !revealed && (
        <p className="flex flex-wrap items-center justify-center gap-2 text-white/70">
          <Flame className="h-4 w-4 text-amber-300" />On a streak: {hot.map((s) => `${s.name} (${s.now})`).join(', ')}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <KitButton tone="rose" onClick={() => (playing ? stop() : play(round.spoken))} icon={<RotateCcw className="h-3.5 w-3.5" />}>{playing ? 'Stop' : revealed ? 'Hear it again' : 'Play again'}</KitButton>
          <KitButton tone="plain" onClick={() => play(round.spoken, true)} icon={<Snail className="h-3.5 w-3.5" />}>Slower</KitButton>
          {revealed && <KitButton tone="plain" onClick={() => play(round.sentence)} icon={<Volume2 className="h-3.5 w-3.5" />}>Hear the real one</KitButton>}
          {plays > 0 && <span className="self-center font-mono text-xs uppercase tracking-[0.12em] text-white/45">played {plays}×</span>}
        </div>
        {revealed
          ? <KitButton tone="rose" solid onClick={next} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < rounds.length ? 'Next' : 'Finish'}</KitButton>
          : <KitButton tone="emerald" solid onClick={reveal} className="!px-5 !py-2 !text-sm" icon={<Eye className="h-4 w-4" />}>Reveal</KitButton>}
      </div>
    </div>
  );
}
