'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Headphones, Play, Radio, RotateCcw, Snail, Volume2 } from 'lucide-react';
import type { ActivityProps, RadioCheckContent, RadioCheckSegment } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { speak, warmUpSpeech } from '@/lib/speech';

// Radio Check: the class hears a short segment (a clip of the source video, or a passage
// read by the voice), answers one question on their phones, then the answer is revealed with
// the line that holds it. Teacher-paced, no timer. Results are class counts, never names.

type Phase = 'idle' | 'segment' | 'reveal' | 'done';
type Ballot = { clientId: string; studentId: string | null; name: string; pick: number };
type YTPlayer = InstanceType<Window['YT']['Player']>;

const LETTERS = ['A', 'B', 'C', 'D'];

function useYouTubePlayer(youtubeId: string | undefined, iframe: HTMLIFrameElement | null) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  /** Wall-clock time the video last entered PLAYING (null while paused/buffering). */
  const playingSince = useRef<number | null>(null);
  useEffect(() => {
    if (!youtubeId || !iframe) return;
    const init = () => {
      playerRef.current = new window.YT.Player(iframe, {
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => { playingSince.current = e.data === 1 ? Date.now() : null; },
        },
      });
    };
    if (window.YT?.Player) init();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }, [youtubeId, iframe]);
  return { playerRef, ready, playingSince };
}

export function RadioCheckActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as RadioCheckContent;
  const allSegments = content.segments ?? [];
  const segments = isMicroEvent ? allSegments.slice(0, 1) : allSegments;
  const video = content.mode === 'video' && !!content.youtubeId;

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [showPicture, setShowPicture] = useState(false);
  const [results, setResults] = useState<Array<{ caught: number; answered: number }>>([]);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const { playerRef, ready, playingSince } = useYouTubePlayer(video ? content.youtubeId : undefined, iframeEl);
  const stopTimer = useRef<number | null>(null);
  const playToken = useRef(0);
  const scoredRef = useRef<Set<number>>(new Set());

  const seg: RadioCheckSegment | undefined = segments[idx];

  useEffect(() => { warmUpSpeech(); }, []);

  // ─── Audio ───
  const stopAudio = useCallback(() => {
    playToken.current += 1;
    if (stopTimer.current) { window.clearInterval(stopTimer.current); stopTimer.current = null; }
    try { playerRef.current?.pauseVideo(); } catch { /* not ready */ }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, [playerRef]);

  const play = useCallback((s: RadioCheckSegment, slow = false) => {
    stopAudio();
    const token = ++playToken.current;
    setPlaying(true);
    setPlays((n) => n + 1);
    if (video && s.start != null) {
      const p = playerRef.current;
      if (!p) { setPlaying(false); return; }
      p.seekTo(s.start, true);
      p.playVideo();
      const end = s.end ?? s.start + 30;
      const length = (end - s.start) * 1000;
      let heard = 0;
      let last = Date.now();
      stopTimer.current = window.setInterval(() => {
        if (token !== playToken.current) return;
        // Count only time actually spent PLAYING (buffering doesn't eat the clip).
        const now = Date.now();
        if (playingSince.current != null) heard += now - last;
        last = now;
        let t = 0;
        try { t = p.getCurrentTime(); } catch { /* player busy */ }
        if (t >= end || heard >= length) stopAudio();
      }, 200);
    } else {
      speak(s.script ?? s.keyLine, slow ? 0.72 : 0.9, () => { if (token === playToken.current) setPlaying(false); });
    }
  }, [video, playerRef, playingSince, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  // ─── Phones ───
  useEffect(() => {
    if (phase === 'segment' && seg) onSetInputSpec?.({ type: 'choice', gameKey: 'radio-check', prompt: seg.question, options: seg.options });
    else onSetInputSpec?.(null);
  }, [phase, seg, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'segment' || !seg) return;
      const pick = seg.options.indexOf(vote.choice);
      if (pick < 0) return;
      setBallots((prev) => [...prev.filter((b) => b.clientId !== vote.clientId), { clientId: vote.clientId, studentId: vote.studentId ?? null, name: vote.displayName, pick }]);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, seg, onRegisterRemoteVoteHandler]);

  // ─── Flow ───
  const openSegment = (i: number) => {
    stopAudio();
    setIdx(i);
    setBallots([]);
    setPlays(0);
    setPhase('segment');
    onPhaseChange?.('segment');
  };

  const reveal = () => {
    if (!seg) return;
    stopAudio();
    const caught = ballots.filter((b) => b.pick === seg.correctIndex).length;
    if (!scoredRef.current.has(idx)) {
      scoredRef.current.add(idx);
      setResults((r) => { const n = [...r]; n[idx] = { caught, answered: ballots.length }; return n; });
      ballots.forEach((b) => {
        const ok = b.pick === seg.correctIndex;
        void onScore?.({ studentId: b.studentId, clientId: b.clientId, displayName: b.name, promptIndex: idx + 1, points: ok ? 3 : 1, isCorrect: ok });
      });
    }
    setPhase('reveal');
    onPhaseChange?.('reveal');
  };

  const next = () => {
    if (idx + 1 < segments.length) openSegment(idx + 1);
    else { stopAudio(); setPhase('done'); onPhaseChange?.('done'); }
  };

  // ─── Pieces ───
  const onAir = (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70">
      <div className="flex h-12 items-end gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.span key={i} className={`w-2.5 rounded-full ${playing ? 'bg-amber-300' : 'bg-white/20'}`} animate={playing ? { height: [10, 44, 18, 36, 12] } : { height: 10 }} transition={playing ? { duration: 0.9 + i * 0.07, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }} />
        ))}
      </div>
      <p className={`flex items-center gap-2 font-mono text-sm uppercase tracking-[0.25em] ${playing ? 'text-amber-300' : 'text-white/45'}`}><Radio className="h-4 w-4" />{playing ? 'On air' : 'Standing by'}</p>
    </div>
  );

  const player = video && (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
      <iframe
        ref={setIframeEl}
        src={`https://www.youtube.com/embed/${content.youtubeId}?enablejsapi=1&rel=0&modestbranding=1&controls=0&fs=0&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
        title={content.title}
        allow="autoplay; encrypted-media"
        className="h-full w-full"
      />
      {!showPicture && <div className="absolute inset-0">{onAir}</div>}
    </div>
  );

  // One player slot at the same position in every phase, so the YouTube iframe never remounts.
  const slot = (visible: boolean) => (
    <div className={visible ? 'mx-auto w-full max-w-3xl' : 'hidden'}>{video ? player : visible ? onAir : null}</div>
  );

  if (segments.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Radio className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Radio Check</p>
        <p className="text-white/60">No listening segments came through for this topic. Try launching it again.</p>
      </div>
    );
  }

  // ─── IDLE ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        {slot(false)}
        <Radio className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Radio Check</KitLabel>
          <p className="mt-2 font-display text-5xl">Can you catch it?</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">
          {segments.length} short {video ? 'clips from the video' : 'recordings'}. Read the question, listen, then answer on your phone. You can ask to hear it again!
        </p>
        <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.07] px-4 py-3 text-left">
          <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <p className="text-sm text-white/75">Sharing on Zoom? Tick <span className="text-white">&ldquo;Share sound&rdquo;</span> when you share your screen, or students won&apos;t hear anything. Test it first.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="cyan" onClick={() => speak('Radio check. Can you hear me?')} icon={<Headphones className="h-3.5 w-3.5" />}>Sound check</KitButton>
          <KitButton tone="amber" solid onClick={() => openSegment(0)} className="!px-8 !py-3 !text-base" icon={<Radio className="h-4 w-4" />}>Start</KitButton>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === 'done') {
    const caught = results.reduce((n, r) => n + (r?.caught ?? 0), 0);
    const answered = results.reduce((n, r) => n + (r?.answered ?? 0), 0);
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6 text-center text-white">
        {slot(false)}
        <KitLabel tone="amber">Radio Check · signal report</KitLabel>
        <p className="font-display text-5xl">{answered ? `The class caught ${caught} of ${answered}` : 'Transmission complete'}</p>
        {answered > 0 && <p className="text-xl text-white/65">{Math.round((caught / answered) * 100)}% of answers were right.</p>}
        <div className="mx-auto grid max-w-xl gap-2">
          {segments.map((s, i) => {
            const r = results[i];
            const pct = r?.answered ? r.caught / r.answered : 0;
            return (
              <div key={i} className="flex items-center gap-3 text-left">
                <span className="w-24 shrink-0 font-mono text-xs uppercase tracking-[0.12em] text-white/50">Clip {i + 1}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-amber-300" initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ delay: i * 0.15 }} /></div>
                <span className="w-16 shrink-0 text-right text-sm text-white/70">{r ? `${r.caught}/${r.answered}` : '-'}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SEGMENT / REVEAL ───
  if (!seg) return null;
  const revealed = phase === 'reveal';
  const caughtNow = ballots.filter((b) => b.pick === seg.correctIndex).length;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-white">
      {slot(true)}
      <div className="order-first flex items-center justify-between">
        <KitLabel tone="amber">Radio Check · clip {idx + 1} of {segments.length}</KitLabel>
        <KitReadout>{revealed ? `${caughtNow} of ${ballots.length} caught it` : `${ballots.length} answered`}</KitReadout>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-3">
        <p className="text-center font-display text-3xl leading-snug">{seg.question}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {seg.options.map((o, i) => {
            const right = revealed && i === seg.correctIndex;
            return (
              <div key={i} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${right ? 'border-emerald-300 bg-emerald-400/15' : revealed ? 'border-white/10 opacity-45' : 'border-white/15 bg-slate-950/45'}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm ${right ? 'bg-emerald-300 text-slate-950' : 'bg-white/10'}`}>{LETTERS[i]}</span>
                <span className="text-lg">{o}</span>
              </div>
            );
          })}
        </div>
        {revealed && seg.keyLine && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-3 text-center text-xl text-amber-50">
            &ldquo;{seg.keyLine}&rdquo;
          </motion.p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <KitButton tone="amber" solid={!revealed && plays === 0} disabled={video && !ready} onClick={() => (playing ? stopAudio() : play(seg))} icon={plays === 0 ? <Play className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}>
            {playing ? 'Stop' : plays === 0 ? 'Play' : revealed ? 'Hear it again' : 'Play again'}
          </KitButton>
          {!video && plays > 0 && <KitButton tone="plain" onClick={() => play(seg, true)} icon={<Snail className="h-3.5 w-3.5" />}>Slower</KitButton>}
          {video && <KitButton tone="plain" onClick={() => setShowPicture((v) => !v)} icon={showPicture ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}>{showPicture ? 'Radio mode' : 'Show picture'}</KitButton>}
          {plays > 0 && <span className="self-center font-mono text-xs uppercase tracking-[0.12em] text-white/45">played {plays}×</span>}
        </div>
        {revealed
          ? <KitButton tone="amber" solid onClick={next} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < segments.length ? 'Next clip' : 'Signal report'}</KitButton>
          : <KitButton tone="emerald" solid disabled={plays === 0} onClick={reveal} className="!px-5 !py-2 !text-sm" icon={<Eye className="h-4 w-4" />}>Reveal</KitButton>}
      </div>
    </div>
  );
}
