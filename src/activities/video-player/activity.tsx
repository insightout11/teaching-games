'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ActivityProps } from '../types';
import type { VideoPlayerContent } from '../types';
import type { CheckpointQuestion } from '@/types/source-material';

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLIFrameElement,
        opts: { events: { onStateChange?: (e: { data: number }) => void; onReady?: () => void } },
      ) => {
        getCurrentTime(): number;
        getPlayerState(): number;
        pauseVideo(): void;
        playVideo(): void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface CheckpointState {
  pushed: boolean;
  votes: Record<string, string>;
  revealed: boolean;
}

const ANSWER_SECONDS = 30;

function fsRequest(el: HTMLElement) {
  if (el.requestFullscreen) return el.requestFullscreen();
  // @ts-expect-error webkit prefix
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
}

function fsExit() {
  if (document.exitFullscreen) return document.exitFullscreen();
  // @ts-expect-error webkit prefix
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
}

function fsElement() {
  return document.fullscreenElement
    // @ts-expect-error webkit prefix
    ?? document.webkitFullscreenElement
    ?? null;
}

export function VideoPlayerActivity({
  generatedContent,
  students,
  onRegisterRemoteVoteHandler,
  onSetInputSpec,
  onScore,
}: ActivityProps) {
  const content = generatedContent as VideoPlayerContent;
  const { videoUrl, videoTitle, checkpoints = [] } = content;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isTed = videoUrl.includes('ted.com');

  const youtubeId = isYouTube
    ? videoUrl.match(/(?:v=|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]
    : null;

  // fs=0 disables YouTube's own fullscreen button — we provide our own that wraps the overlay
  const embedUrl = (() => {
    if (isTed) return videoUrl;
    return youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1&fs=0&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`
      : null;
  })();

  const [checkpointStates, setCheckpointStates] = useState<CheckpointState[]>(
    () => checkpoints.map(() => ({ pushed: false, votes: {}, revealed: false })),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pausedForQuestion, setPausedForQuestion] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<InstanceType<Window['YT']['Player']> | null>(null);
  const scoredRef = useRef<Set<string>>(new Set());
  const firedRef = useRef<Set<number>>(new Set());

  // Track fullscreen state
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(fsElement() === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  function toggleFullscreen() {
    if (isFullscreen) {
      fsExit();
    } else if (containerRef.current) {
      void fsRequest(containerRef.current);
    }
  }

  // Countdown timer
  const isQuestionActive = activeIdx !== null;
  useEffect(() => {
    if (!isQuestionActive || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [isQuestionActive, timeLeft]);

  useEffect(() => {
    if (isQuestionActive && timeLeft === 0) {
      closeQuestion(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuestionActive, timeLeft]);

  const pushCheckpoint = useCallback(
    (idx: number) => {
      if (firedRef.current.has(idx)) return;
      firedRef.current.add(idx);
      const cp = checkpoints[idx];
      if (!cp) return;

      setActiveIdx(idx);
      setTimeLeft(ANSWER_SECONDS);
      setCheckpointStates((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], pushed: true };
        return next;
      });

      if (isYouTube) {
        playerRef.current?.pauseVideo();
        setPausedForQuestion(true);
      }

      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'video-player',
        options: cp.options,
        prompt: cp.question,
        timerSeconds: ANSWER_SECONDS,
        startedAt: Date.now(),
      });

      onRegisterRemoteVoteHandler?.((vote) => {
        const { clientId, displayName, choice } = vote;
        const choiceIdx = cp.options.indexOf(choice);
        const isCorrect = choiceIdx === cp.correctIndex;

        setCheckpointStates((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], votes: { ...next[idx].votes, [clientId]: choice } };
          return next;
        });

        if (!scoredRef.current.has(`${idx}:${clientId}`)) {
          scoredRef.current.add(`${idx}:${clientId}`);
          void onScore?.({
            studentId: null,
            clientId,
            displayName,
            promptIndex: idx + 1,
            points: isCorrect ? 5 : 1,
            isCorrect: null,
          });
        }
      });
    },
    [checkpoints, isYouTube, onSetInputSpec, onRegisterRemoteVoteHandler, onScore],
  );

  useEffect(() => {
    if (!isYouTube || !youtubeId) return;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function initPlayer() {
      if (!iframeRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            if (e.data === 0) {
              if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
              setVideoEnded(true);
              setPausedForQuestion(false);
              setActiveIdx(null);
              onSetInputSpec?.(null);
              onRegisterRemoteVoteHandler?.(null);
            } else if (e.data === 1) {
              setPausedForQuestion(false);
              if (!pollInterval) {
                pollInterval = setInterval(() => {
                  const t = playerRef.current?.getCurrentTime() ?? 0;
                  checkpoints.forEach((cp, idx) => {
                    if (!firedRef.current.has(idx) && t >= cp.timestamp) {
                      pushCheckpoint(idx);
                    }
                  });
                }, 800);
              }
            } else if (e.data !== 1 && pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [isYouTube, youtubeId, checkpoints, pushCheckpoint, onSetInputSpec, onRegisterRemoteVoteHandler]);

  function closeQuestion(resume: boolean) {
    setActiveIdx(null);
    setTimeLeft(0);
    onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
    if (resume && isYouTube) {
      playerRef.current?.playVideo();
      setPausedForQuestion(false);
    }
  }

  function resumeVideo() {
    playerRef.current?.playVideo();
    setPausedForQuestion(false);
  }

  function toggleReveal(idx: number) {
    setCheckpointStates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], revealed: !next[idx].revealed };
      return next;
    });
  }

  const activeCheckpoint = activeIdx !== null ? checkpoints[activeIdx] : null;
  const activeState = activeIdx !== null ? checkpointStates[activeIdx] : null;
  const voteCount = activeState ? Object.keys(activeState.votes).length : 0;
  const totalStudents = students.length;
  const pushedCount = checkpointStates.filter((s) => s.pushed).length;
  const pushedCheckpoints = checkpoints.filter((_, i) => checkpointStates[i].pushed);

  const timerPct = ANSWER_SECONDS > 0 ? (timeLeft / ANSWER_SECONDS) * 100 : 0;
  const timerColor = timerPct > 50 ? 'bg-lc-success' : timerPct > 25 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="space-y-4">
      {/* Title bar — hidden in fullscreen (fullscreen hides everything outside the container) */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎬</span>
        <h2 className="text-base font-semibold text-lc-text truncate">{videoTitle}</h2>
        {isYouTube && !videoEnded && !isQuestionActive && !pausedForQuestion && (
          <span className="text-xs text-lc-text3 bg-lc-bg border border-lc-border rounded-full px-2 py-0.5">
            Auto-fire enabled
          </span>
        )}
        {isYouTube && pausedForQuestion && !isQuestionActive && !videoEnded && (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
            ⏸ Video paused
          </span>
        )}
        {videoEnded && (
          <span className="text-xs text-lc-success bg-lc-success/10 border border-lc-success/30 rounded-full px-2 py-0.5">
            Video finished
          </span>
        )}
      </div>

      {/* ── Video container — this div is what goes fullscreen ── */}
      {embedUrl ? (
        <div
          ref={containerRef}
          className="relative w-full bg-black"
          style={isFullscreen ? { height: '100%' } : { paddingBottom: '56.25%' }}
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={videoTitle}
          />

          {/* ── Fullscreen: active question overlay ── */}
          {isFullscreen && activeCheckpoint && activeState && !videoEnded && (
            <div className="absolute inset-0 z-20 bg-black/65 flex items-center justify-center p-6">
              <div className="w-full max-w-xl bg-gray-900/95 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isYouTube && (
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">⏸ Paused</span>
                    )}
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Question Live</span>
                  </div>
                  <span className="text-sm text-white/50">{voteCount}/{totalStudents} answered</span>
                </div>

                {/* Question + countdown */}
                <div>
                  <p className="text-white font-semibold text-base leading-snug mb-3">{activeCheckpoint.question}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                        style={{ width: `${timerPct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-mono font-bold tabular-nums w-8 text-right ${timeLeft <= 5 ? 'text-red-400' : 'text-white/70'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Vote tally */}
                <div className="space-y-2">
                  {activeCheckpoint.options.map((opt, oi) => {
                    const count = Object.values(activeState.votes).filter((v) => v === opt).length;
                    const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
                    return (
                      <div key={oi} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-5 shrink-0 text-white/40">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/80">{opt}</span>
                            <span className="text-white/40 shrink-0 ml-2">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-lc-blue/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-white/30 italic">Answers revealed after video finishes.</p>

                <button
                  onClick={() => closeQuestion(isYouTube)}
                  className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  {isYouTube ? 'Dismiss & Resume Video ▶' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}

          {/* ── Fullscreen: resume overlay (after timer expires, teacher discusses then continues) ── */}
          {isFullscreen && pausedForQuestion && !isQuestionActive && !videoEnded && isYouTube && (
            <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-white/60 text-sm">Discuss the answer with your class</p>
                <button
                  onClick={resumeVideo}
                  className="px-8 py-3 rounded-xl bg-lc-blue text-white font-bold text-base hover:bg-lc-blue/80 transition-colors shadow-lg"
                >
                  ▶ Resume Video
                </button>
              </div>
            </div>
          )}

          {/* ── Fullscreen: checkpoint progress HUD (bottom-left) ── */}
          {isFullscreen && !videoEnded && checkpoints.length > 0 && !isQuestionActive && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1.5">
              {checkpoints.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${checkpointStates[i].pushed ? 'bg-lc-success' : 'bg-white/30'}`}
                />
              ))}
              <span className="text-xs text-white/60 ml-1 font-mono">{pushedCount}/{checkpoints.length}</span>
            </div>
          )}

          {/* ── Fullscreen toggle button (bottom-right) ── */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="absolute bottom-4 right-4 z-10 p-2 rounded-lg bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all"
          >
            {isFullscreen ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M4 8a1 1 0 001-1V5.414l2.293 2.293a1 1 0 001.414-1.414L6.414 4H8a1 1 0 000-2H4a1 1 0 00-1 1v4a1 1 0 001 1zm12 4a1 1 0 00-1 1v1.586l-2.293-2.293a1 1 0 00-1.414 1.414L13.586 16H12a1 1 0 000 2h4a1 1 0 001-1v-4a1 1 0 00-1-1zM4 12a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 000-2H6.414l2.293-2.293a1 1 0 00-1.414-1.414L5 14.586V13a1 1 0 00-1-1zm12-8a1 1 0 001-1V3a1 1 0 00-1-1h-4a1 1 0 000 2h1.586l-2.293 2.293a1 1 0 001.414 1.414L15 4.414V6a1 1 0 001 1z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 4a1 1 0 011-1h3a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm14 0a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L14.586 5H13a1 1 0 010-2h4zm-14 12a1 1 0 001-1v-1.586l2.293 2.293a1 1 0 001.414-1.414L5.414 12H8a1 1 0 000-2H4a1 1 0 00-1 1v4a1 1 0 001 1zm14-1a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 12.586V11a1 1 0 012 0v4z"/>
              </svg>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-xl border border-lc-border bg-lc-surface text-lc-text3 text-sm">
          Video unavailable
        </div>
      )}

      {/* ── Below-video UI (non-fullscreen only — browser hides this when fullscreen) ── */}

      {/* Active question panel */}
      {activeCheckpoint && activeState && !videoEnded && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isYouTube && (
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">⏸ Video Paused</span>
              )}
              <span className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">
                {isYouTube ? '·' : ''} Question Live
              </span>
            </div>
            <span className="text-xs text-lc-text3 shrink-0">{voteCount}/{totalStudents} answered</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-lc-text2">
              <span>{activeCheckpoint.question}</span>
              <span className={`font-mono font-bold shrink-0 ml-3 ${timeLeft <= 5 ? 'text-red-400' : 'text-lc-text2'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-lc-bg overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {activeCheckpoint.options.map((opt, oi) => {
              const count = Object.values(activeState.votes).filter((v) => v === opt).length;
              const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
              return (
                <div key={oi} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 shrink-0 text-lc-text3">{String.fromCharCode(65 + oi)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-lc-text2">{opt}</span>
                      <span className="text-lc-text3">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-lc-bg overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-lc-blue/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-lc-text3 italic">Answers will be revealed after the video finishes.</p>

          <button
            onClick={() => closeQuestion(isYouTube)}
            className="px-4 py-1.5 rounded-lg bg-lc-surface border border-lc-border text-xs font-semibold text-lc-text2 hover:text-lc-text transition-colors"
          >
            {isYouTube ? 'Dismiss & Resume Video ▶' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Resume video button */}
      {pausedForQuestion && !isQuestionActive && !videoEnded && isYouTube && (
        <button
          onClick={resumeVideo}
          className="w-full py-3 rounded-xl border-2 border-lc-blue bg-lc-blue/10 text-sm font-bold text-lc-blue hover:bg-lc-blue/20 transition-colors"
        >
          ▶ Resume Video
        </button>
      )}

      {/* TED manual end */}
      {isTed && !videoEnded && pushedCheckpoints.length > 0 && (
        <button
          onClick={() => { setVideoEnded(true); closeQuestion(false); }}
          className="w-full py-2 rounded-lg border border-lc-border bg-lc-surface text-xs font-semibold text-lc-text2 hover:text-lc-text transition-colors"
        >
          Mark Video as Finished — Review Answers
        </button>
      )}

      {/* Post-video review */}
      {videoEnded && pushedCheckpoints.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">Review Checkpoint Answers</p>
          {checkpoints.map((cp: CheckpointQuestion, idx: number) => {
            const state = checkpointStates[idx];
            if (!state.pushed) return null;
            const votes = state.votes;
            const total = Object.keys(votes).length;
            return (
              <div key={idx} className="rounded-xl border border-lc-border bg-lc-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-lc-text3 mb-1">{cp.timestampLabel}</p>
                    <p className="text-sm font-medium text-lc-text">{cp.question}</p>
                  </div>
                  <span className="text-xs text-lc-text3 shrink-0">{total} votes</span>
                </div>
                <div className="space-y-2">
                  {cp.options.map((opt, oi) => {
                    const count = Object.values(votes).filter((v) => v === opt).length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isCorrect = oi === cp.correctIndex;
                    const showCorrect = state.revealed && isCorrect;
                    return (
                      <div key={oi} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-5 shrink-0 ${showCorrect ? 'text-lc-success' : 'text-lc-text3'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className={showCorrect ? 'text-lc-success font-semibold' : 'text-lc-text2'}>{opt}</span>
                            <span className="text-lc-text3">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-lc-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${showCorrect ? 'bg-lc-success' : 'bg-lc-blue/60'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => toggleReveal(idx)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    state.revealed
                      ? 'bg-lc-surface border border-lc-border text-lc-text2 hover:text-lc-text'
                      : 'bg-lc-success/20 text-lc-success hover:bg-lc-success/30'
                  }`}
                >
                  {state.revealed ? 'Hide Answer' : 'Reveal Answer'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkpoint list */}
      {!videoEnded && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">
            Checkpoints
            {isTed && <span className="ml-2 font-normal text-lc-text3 normal-case">Push manually at the right moment</span>}
          </p>
          {checkpoints.map((cp: CheckpointQuestion, idx: number) => {
            const state = checkpointStates[idx];
            const isActive = activeIdx === idx;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all ${
                  isActive
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : state.pushed
                      ? 'border-lc-border/40 opacity-50'
                      : 'border-lc-border bg-lc-surface'
                }`}
              >
                <span className="text-xs font-mono text-lc-text3 shrink-0 w-8">{cp.timestampLabel}</span>
                <span className="text-xs text-lc-text flex-1 leading-snug">{cp.question}</span>
                {state.pushed ? (
                  <span className="text-xs text-lc-text3 shrink-0">{Object.keys(state.votes).length} votes</span>
                ) : (
                  isTed && !isActive && (
                    <button
                      onClick={() => pushCheckpoint(idx)}
                      className="shrink-0 px-2.5 py-1 rounded-md bg-lc-blue/15 text-lc-blue text-xs font-semibold hover:bg-lc-blue/25 transition-colors"
                    >
                      Push
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
