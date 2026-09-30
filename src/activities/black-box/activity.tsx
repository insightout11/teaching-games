'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Headphones, MessageCircleQuestion, Play, RotateCcw, Snail, Unlock, Volume2 } from 'lucide-react';
import type { ActivityProps, BlackBoxContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { speak, warmUpSpeech } from '@/lib/speech';

// Black Box: the "flight recorder". A short passage is read aloud (twice); its key words are
// hidden on screen. Phones tap every word they heard from a cloud that includes sound-alike
// decoys. A hidden word appears on screen once enough of the class caught it. Then the class
// talks about the gaps that are left, and a final listen opens the box.

type Phase = 'idle' | 'listening' | 'talk' | 'open' | 'done';

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BlackBoxActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as BlackBoxContent;
  const all = content.passages ?? [];
  const passages = isMicroEvent ? all.slice(0, 1) : all;

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  // clientId -> { name, studentId, words picked }
  const [picks, setPicks] = useState<Record<string, { name: string; studentId: string | null; words: string[] }>>({});
  const [results, setResults] = useState<Array<{ recovered: number; total: number }>>([]);
  const token = useRef(0);
  const scored = useRef<Set<number>>(new Set());

  const passage = passages[idx];
  const cloud = useMemo(() => (passage ? shuffle([...passage.gaps, ...passage.decoys]) : []), [passage]);
  const gapSet = useMemo(() => new Set((passage?.gaps ?? []).map(clean)), [passage]);

  useEffect(() => { warmUpSpeech(); }, []);

  const stop = useCallback(() => {
    token.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);
  useEffect(() => () => stop(), [stop]);

  const play = useCallback((slow = false) => {
    if (!passage) return;
    stop();
    const t = ++token.current;
    setPlaying(true);
    setPlays((n) => n + 1);
    speak(passage.text, slow ? 0.72 : 0.9, () => { if (t === token.current) setPlaying(false); });
  }, [passage, stop]);

  // ─── Phones: word cloud while listening and talking ───
  useEffect(() => {
    if ((phase === 'listening' || phase === 'talk') && passage) {
      onSetInputSpec?.({ type: 'confirm', gameKey: 'black-box', prompt: `Recording ${idx + 1}: tap every word you heard.`, options: cloud, allowMultiple: true, stableInput: true });
    } else onSetInputSpec?.(null);
  }, [phase, passage, cloud, idx, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'listening' && phase !== 'talk') return;
      let msg: { w?: string; on?: boolean } = {};
      try { msg = JSON.parse(vote.choice); } catch { return; }
      if (!msg.w || !cloud.includes(msg.w)) return;
      setPicks((prev) => {
        const cur = prev[vote.clientId] ?? { name: vote.displayName, studentId: vote.studentId ?? null, words: [] };
        const words = msg.on ? Array.from(new Set([...cur.words, msg.w!])) : cur.words.filter((x) => x !== msg.w);
        return { ...prev, [vote.clientId]: { ...cur, words } };
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, cloud, onRegisterRemoteVoteHandler]);

  // A hidden word is "recovered" once at least half of the students who tapped anything caught it.
  const answerers = Object.values(picks).filter((p) => p.words.length > 0);
  const need = Math.max(1, Math.ceil(answerers.length / 2));
  const countFor = (w: string) => answerers.filter((p) => p.words.includes(w)).length;
  const recovered = new Set((passage?.gaps ?? []).filter((g) => countFor(g) >= need));
  const noise = (passage?.decoys ?? []).filter((d) => countFor(d) >= need);

  // ─── Flow ───
  const openPassage = (i: number) => {
    stop();
    setIdx(i);
    setPicks({});
    setPlays(0);
    setPhase('listening');
    onPhaseChange?.('listening');
  };

  const openBox = () => {
    if (!passage) return;
    if (!scored.current.has(idx)) {
      scored.current.add(idx);
      setResults((r) => { const n = [...r]; n[idx] = { recovered: recovered.size, total: passage.gaps.length }; return n; });
      Object.entries(picks).forEach(([clientId, p]) => {
        if (!p.words.length) return;
        const hits = p.words.filter((w) => gapSet.has(clean(w))).length;
        void onScore?.({ studentId: p.studentId, clientId, displayName: p.name, promptIndex: idx + 1, points: hits, isCorrect: hits >= Math.ceil(passage.gaps.length / 2) });
      });
    }
    setPhase('open');
    onPhaseChange?.('open');
    play();
  };

  const next = () => {
    if (idx + 1 < passages.length) openPassage(idx + 1);
    else { stop(); setPhase('done'); onPhaseChange?.('done'); }
  };

  if (passages.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Box className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Black Box</p>
        <p className="text-white/60">No recordings came through for this topic. Try launching it again.</p>
      </div>
    );
  }

  // ─── IDLE ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Box className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Black Box</KitLabel>
          <p className="mt-2 font-display text-5xl">Rebuild the recording.</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">We found the flight recorder, but some words are missing. Listen twice and tap every word you hear on your phone. Careful: some words on your phone were <span className="text-white">never said</span>. Together, we rebuild what happened.</p>
        <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.07] px-4 py-3 text-left">
          <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <p className="text-sm text-white/75">Sharing on Zoom? Tick <span className="text-white">&ldquo;Share sound&rdquo;</span> so students hear the voice.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="cyan" onClick={() => speak('Radio check. Can you hear me?')} icon={<Headphones className="h-3.5 w-3.5" />}>Sound check</KitButton>
          <KitButton tone="amber" solid onClick={() => openPassage(0)} className="!px-8 !py-3 !text-base" icon={<Box className="h-4 w-4" />}>Open recording 1</KitButton>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === 'done') {
    const got = results.reduce((n, r) => n + (r?.recovered ?? 0), 0);
    const total = results.reduce((n, r) => n + (r?.total ?? 0), 0);
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8 text-center text-white">
        <KitLabel tone="amber">Black Box · recordings recovered</KitLabel>
        <p className="font-display text-5xl">{total ? `The class rebuilt ${got} of ${total} words by ear` : 'Recordings recovered'}</p>
      </div>
    );
  }

  if (!passage) return null;
  const opened = phase === 'open';

  // Render the passage with gaps: words recovered by the class (or all, once opened) show.
  const tokens = passage.text.split(/(\s+)/);
  const usedGap = new Set<string>();
  const rendered = tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return tok;
    const c = clean(tok);
    const gap = passage.gaps.find((g) => clean(g) === c && !usedGap.has(clean(g)));
    if (!gap) return <span key={i}>{tok}</span>;
    usedGap.add(clean(gap));
    const shown = opened || recovered.has(gap);
    const byClass = recovered.has(gap);
    return (
      <span key={i} className="relative inline-block align-baseline">
        {shown ? (
          <motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-md px-1 ${byClass ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-300/25 text-amber-50'}`}>{tok}</motion.span>
        ) : (
          <span className="inline-block min-w-[4.5ch] border-b-4 border-dashed border-white/40 text-transparent">{tok}</span>
        )}
      </span>
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="amber">Black Box · recording {idx + 1} of {passages.length}</KitLabel>
        <KitReadout>{recovered.size} / {passage.gaps.length} words recovered · {answerers.length} listening</KitReadout>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-8 py-10">
        <p className="text-center font-display text-3xl leading-[1.7] md:text-4xl">{rendered}</p>
      </div>

      {noise.length > 0 && !opened && (
        <p className="text-center text-white/60">Static on the line: some of you heard <span className="text-rose-200">{noise.map((n) => `“${n}”`).join(', ')}</span>. Was it really said?</p>
      )}
      {phase === 'talk' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-4 text-xl text-amber-50">
          <MessageCircleQuestion className="h-6 w-6 text-amber-300" />What goes in the gaps? Talk about it, then open the box.
        </motion.div>
      )}
      {opened && <p className="text-center text-white/60"><span className="text-emerald-200">Green</span> = the class caught it. <span className="text-amber-200">Amber</span> = recovered from the box.</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {!opened && (
            <>
              <KitButton tone="amber" solid={plays === 0} onClick={() => (playing ? stop() : play())} icon={plays === 0 ? <Play className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}>{playing ? 'Stop' : plays === 0 ? 'Play' : 'Play again'}</KitButton>
              {plays > 0 && <KitButton tone="plain" onClick={() => play(true)} icon={<Snail className="h-3.5 w-3.5" />}>Slower</KitButton>}
            </>
          )}
          {opened && <KitButton tone="amber" onClick={() => (playing ? stop() : play())} icon={<RotateCcw className="h-3.5 w-3.5" />}>{playing ? 'Stop' : 'Hear it again'}</KitButton>}
          {plays > 0 && <span className="self-center font-mono text-xs uppercase tracking-[0.12em] text-white/45">played {plays}×</span>}
        </div>
        {phase === 'listening' && <KitButton tone="amber" solid disabled={plays === 0} onClick={() => { stop(); setPhase('talk'); onPhaseChange?.('talk'); }} className="!px-5 !py-2 !text-sm" icon={<MessageCircleQuestion className="h-4 w-4" />}>Talk about the gaps</KitButton>}
        {phase === 'talk' && <KitButton tone="emerald" solid onClick={openBox} className="!px-5 !py-2 !text-sm" icon={<Unlock className="h-4 w-4" />}>Open the box</KitButton>}
        {opened && <KitButton tone="amber" solid onClick={next} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < passages.length ? 'Next recording' : 'Finish'}</KitButton>}
      </div>
    </div>
  );
}
