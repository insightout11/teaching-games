'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, Play, RotateCcw, TrendingUp, Captions, Volume2, Radio } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { useYouTubePlayer } from '../shared/use-youtube-player';
import { caughtGist, type GistQuestion } from '@/lib/listening-pack';
import { saveFlightResult } from '@/lib/flight-result';
import { speak } from '@/lib/speech';

// Listening Flight takeoff + landing ("How much did you catch?"). The class hears the clip's
// listening window once, then answers the GIST questions on phones (the big picture, not the
// details Radio Check teaches). First Listen = the before; Final Listen = the same questions + one
// harder, the reveal (class counts only), the logbook save, then one more play WITH the transcript.

export interface ListenContent {
  activityKey: 'first-listen' | 'final-listen';
  topicContext: string;
  title: string;
  youtubeId: string;
  start: number;
  end: number;
  questions: GistQuestion[];
  harder?: GistQuestion;
  transcript: string[];
}

type Phase = 'idle' | 'listen' | 'questions' | 'reveal' | 'transcript' | 'done';

export function ListenCheckActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const c = generatedContent as unknown as ListenContent;
  const final = c.activityKey === 'final-listen';
  const baseQuestions = useMemo(() => c?.questions ?? [], [c]);
  // Memoised: a new array each render would re-send the phone screen every render.
  const questions = useMemo(() => (final && c?.harder ? [...baseQuestions, c.harder] : baseQuestions), [final, c, baseQuestions]);
  const missing = !c?.youtubeId || baseQuestions.length === 0;
  const recordListenAnswer = useSessionStore((s) => s.recordListenAnswer);
  const listen = useSessionStore((s) => s.lessonThread.listenCheck);
  const sessionId = useSessionStore((s) => s.sessionId);
  const mine = (final ? listen?.after : listen?.before) ?? {};
  const answered = Object.keys(mine).length;

  const [phase, setPhase] = useState<Phase>('idle');
  const [playing, setPlaying] = useState(false);
  const [showPicture, setShowPicture] = useState(false);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const { playerRef, ready } = useYouTubePlayer(c.youtubeId, iframeEl);
  const stopTimer = useRef<number | null>(null);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const scored = useRef<Set<string>>(new Set());

  const stop = useCallback(() => {
    if (stopTimer.current) { window.clearInterval(stopTimer.current); stopTimer.current = null; }
    try { playerRef.current?.pauseVideo(); } catch { /* not ready */ }
    setPlaying(false);
  }, [playerRef]);

  const playWindow = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    stop();
    p.seekTo(c.start, true);
    p.playVideo();
    setPlaying(true);
    stopTimer.current = window.setInterval(() => {
      let t = 0;
      try { t = p.getCurrentTime(); } catch { /* busy */ }
      if (t >= c.end) stop();
    }, 250);
  }, [playerRef, c.start, c.end, stop]);
  useEffect(() => () => stop(), [stop]);

  // Phones: all gist questions on one screen (tap an answer for each, changeable).
  useEffect(() => {
    if (phase !== 'questions') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: c.activityKey,
      prompt: final ? 'Final listen: what did you catch?' : 'First listen: what did you catch?',
      perStudentData: { __mission: questions.map((g) => ({ q: g.q, options: g.options })) },
      stableInput: true,
    });
  }, [phase, final, questions, c.activityKey, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'questions') return;
      try {
        const { i, a } = JSON.parse(vote.choice) as { i: number; a: number };
        if (typeof i !== 'number' || typeof a !== 'number') return;
        recordListenAnswer(final ? 'after' : 'before', vote.clientId, i, a);
        if (!scored.current.has(vote.clientId)) {
          scored.current.add(vote.clientId);
          void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 1, points: 1, isCorrect: null });
        }
      } catch { /* not a gist answer */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [final, recordListenAnswer, onRegisterRemoteVoteHandler, onScore]);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p === 'done' ? 'finished' : p); };

  // The before → after (3 gist questions both times; the harder one is extra).
  const before = caughtGist(listen?.before ?? {}, baseQuestions, baseQuestions.length);
  const after = caughtGist(listen?.after ?? {}, baseQuestions, baseQuestions.length);
  const harderRight = c?.harder ? Object.keys(listen?.after ?? {}).filter((id) => listen!.after[id][baseQuestions.length] === c.harder!.correctIndex).length : 0;

  const reveal = () => {
    stop();
    go('reveal');
    if (after.of > 0) {
      saveFlightResult(sessionId, {
        preset: 'listening-60', flight: 'Listening', topic: c.topicContext || c.title, focus: c.title,
        measures: [
          { label: 'Caught the gist', before: before.of ? { count: before.caught, of: before.of } : null, after: { count: after.caught, of: after.of } },
          ...(c.harder ? [{ label: 'Got the hard one', before: null, after: { count: harderRight, of: after.of } }] : []),
        ],
      });
    }
  };

  const player = (
    <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-3xl">
      <iframe
        ref={setIframeEl}
        src={`https://www.youtube.com/embed/${c.youtubeId}?enablejsapi=1&rel=0&modestbranding=1&controls=0&fs=0&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
        title={c.title}
        allow="autoplay; encrypted-media"
        className="h-full w-full"
      />
      {!showPicture && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
          <Radio className={`h-12 w-12 ${playing ? 'text-cyan-300' : 'text-white/30'}`} />
          <p className={`font-mono text-sm uppercase tracking-[0.25em] ${playing ? 'text-cyan-300' : 'text-white/45'}`}>{playing ? 'Listening' : 'Standing by'}</p>
        </div>
      )}
    </div>
  );
  if (missing) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-10 text-center text-white">
        <Headphones className="mx-auto h-12 w-12 text-white/40" />
        <p className="font-display text-3xl">Pick a listening clip</p>
        <p className="text-white/60">This stage needs a library clip with a listening pack. Choose one in the Listening flight plan.</p>
      </div>
    );
  }
  const showPlayer = phase === 'listen' || phase === 'transcript';
  const minutes = Math.max(1, Math.round((c.end - c.start) / 60));

  return (
    <div className="space-y-5 text-white">
      {/* One player slot in every phase, so the iframe never remounts. */}
      <div className={showPlayer ? '' : 'hidden'}>{player}</div>

      {phase === 'idle' && (
        <div className="mx-auto max-w-2xl space-y-5 py-4 text-center">
          <Headphones className="mx-auto h-12 w-12 text-cyan-300" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">{final ? 'Final listen' : 'First listen'}</p>
          <h3 className="text-4xl font-game">{final ? 'Listen again: how much do you catch now?' : 'How much can you catch?'}</h3>
          <p className="text-sm text-white/70">About {minutes} minute{minutes > 1 ? 's' : ''} of “{c.title}”. Just listen, then answer {questions.length} questions on your phone. {final ? 'Same questions as the start, plus one harder one.' : 'No stress: we’ll hear it again at the end.'}</p>
          <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.07] px-4 py-3 text-left">
            <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <p className="text-sm text-white/75">Sharing on Zoom? Tick “Share sound” when you share your screen, or students won’t hear anything.</p>
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={() => speak('Sound check. Can you hear me?')} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10">Sound check</button>
            <button onClick={() => go('listen')} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-10 py-3 font-game text-lg shadow-xl transition hover:scale-105">START</button>
          </div>
        </div>
      )}

      {phase === 'listen' && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button disabled={!ready} onClick={() => (playing ? stop() : playWindow())} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-3 font-game text-sm disabled:opacity-40">
              {playing ? 'Stop' : <><Play className="h-4 w-4" />Play</>}
            </button>
            <button onClick={() => setShowPicture((v) => !v)} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">{showPicture ? 'Hide picture' : 'Show picture'}</button>
          </div>
          <button onClick={() => { stop(); go('questions'); }} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">QUESTIONS</button>
        </div>
      )}

      {phase === 'questions' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">{final ? 'Final listen' : 'First listen'} · on your phones</p>
            <span className="text-sm text-white/60">{answered} answering</span>
          </div>
          <ol className="space-y-2">
            {questions.map((g, i) => (
              <li key={g.q} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-lg">{i + 1}. {g.q}{final && i === baseQuestions.length ? <span className="ml-2 text-xs uppercase tracking-wider text-amber-300">harder</span> : null}</li>
            ))}
          </ol>
          <div className="flex justify-end">
            {final
              ? <button onClick={reveal} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm"><TrendingUp className="h-4 w-4" />HOW MUCH DID WE CATCH?</button>
              : <button onClick={() => go('done')} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm">DONE</button>}
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="space-y-5 text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300/80"><TrendingUp className="h-4 w-4" />How much did we catch?</p>
          <div className="flex items-center justify-center gap-6">
            {before.of > 0 && <div><p className="text-xs uppercase tracking-[0.15em] text-white/45">first listen</p><p className="font-display text-5xl text-white/55">{before.caught}<span className="text-2xl"> of {before.of}</span></p></div>}
            {before.of > 0 && <span className="text-3xl text-emerald-300">→</span>}
            <div><p className="text-xs uppercase tracking-[0.15em] text-emerald-200">final listen</p><p className="font-display text-7xl text-emerald-200">{after.caught}<span className="text-3xl"> of {after.of}</span></p></div>
          </div>
          <p className="text-white/70">caught the big picture (2 of 3 or more){c.harder ? ` · ${harderRight} got the harder one` : ''}</p>
          <div className="mx-auto max-w-xl space-y-1 text-left text-sm text-white/70">
            {questions.map((g) => <p key={g.q}>{g.q} <span className="text-emerald-200">{g.options[g.correctIndex]}</span></p>)}
          </div>
          <button onClick={() => { go('transcript'); playWindow(); }} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm"><Captions className="h-4 w-4" />PLAY IT WITH THE WORDS</button>
        </div>
      )}

      {phase === 'transcript' && (
        <div className="space-y-4">
          <div className="max-h-[260px] space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-lg leading-relaxed text-white/90">
            {c.transcript.length ? c.transcript.map((l, i) => <p key={i}>{l}</p>) : <p className="text-white/50">No transcript for this clip.</p>}
          </div>
          <div className="flex justify-between">
            <button disabled={!ready} onClick={() => (playing ? stop() : playWindow())} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">{playing ? 'Stop' : <><RotateCcw className="h-4 w-4" />Play again</>}</button>
            <button onClick={() => { stop(); go('done'); }} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">FINISH</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
          <Headphones className="h-12 w-12 text-cyan-300" />
          <h3 className="text-2xl font-game">{final ? 'From first listen to final listen' : 'First listen done'}</h3>
          <p className="max-w-md text-sm text-white/70">{final ? `Caught the big picture: ${before.of ? `${before.caught} → ` : ''}${after.caught} of ${after.of}.` : 'We’ll hear it again at the end and see how much more you catch.'}</p>
        </div>
      )}
    </div>
  );
}
