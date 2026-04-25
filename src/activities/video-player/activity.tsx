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

  const embedUrl = (() => {
    if (isTed) return videoUrl;
    return youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`
      : null;
  })();

  const [checkpointStates, setCheckpointStates] = useState<CheckpointState[]>(
    () => checkpoints.map(() => ({ pushed: false, votes: {}, revealed: false })),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pausedForQuestion, setPausedForQuestion] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const scoredRef = useRef<Set<string>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<InstanceType<Window['YT']['Player']> | null>(null);
  const firedRef = useRef<Set<number>>(new Set());

  // Countdown timer — runs while a question is active
  const isQuestionActive = activeIdx !== null;
  useEffect(() => {
    if (!isQuestionActive || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [isQuestionActive, timeLeft]);

  // Auto-close question when countdown expires
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
              // Video ended
              if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
              setVideoEnded(true);
              setPausedForQuestion(false);
              setActiveIdx(null);
              onSetInputSpec?.(null);
              onRegisterRemoteVoteHandler?.(null);
            } else if (e.data === 1) {
              // Video playing — clear paused state and start polling
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

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
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
  const pushedCheckpoints = checkpoints.filter((_, i) => checkpointStates[i].pushed);

  const timerPct = ANSWER_SECONDS > 0 ? (timeLeft / ANSWER_SECONDS) * 100 : 0;
  const timerColor = timerPct > 50 ? 'bg-lc-success' : timerPct > 25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
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

      {/* Video */}
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-xl border border-lc-border"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={videoTitle}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-xl border border-lc-border bg-lc-surface text-lc-text3 text-sm">
          Video unavailable
        </div>
      )}

      {/* Active question — prominent pause/countdown banner */}
      {activeCheckpoint && activeState && !videoEnded && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4 space-y-3">
          {/* Banner header */}
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

          {/* Countdown bar */}
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

          {/* Vote tally bars */}
          <div className="space-y-2">
            {activeCheckpoint.options.map((opt, oi) => {
              const count = Object.values(activeState.votes).filter((v) => v === opt).length;
              const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
              return (
                <div key={oi} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 shrink-0 text-lc-text3">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-lc-text2">{opt}</span>
                      <span className="text-lc-text3">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-lc-bg overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-lc-blue/60"
                        style={{ width: `${pct}%` }}
                      />
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

      {/* Resume video button — shown after countdown expires, teacher clicks to continue */}
      {pausedForQuestion && !isQuestionActive && !videoEnded && isYouTube && (
        <button
          onClick={resumeVideo}
          className="w-full py-3 rounded-xl border-2 border-lc-blue bg-lc-blue/10 text-sm font-bold text-lc-blue hover:bg-lc-blue/20 transition-colors"
        >
          ▶ Resume Video
        </button>
      )}

      {/* TED manual end button */}
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

      {/* Checkpoint list — manual push for TED, status summary for YouTube */}
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
                  isActive ? 'border-amber-500/50 bg-amber-500/10' : state.pushed ? 'border-lc-border/40 opacity-50' : 'border-lc-border bg-lc-surface'
                }`}
              >
                <span className="text-xs font-mono text-lc-text3 shrink-0 w-8">{cp.timestampLabel}</span>
                <span className="text-xs text-lc-text flex-1 leading-snug">{cp.question}</span>
                {state.pushed ? (
                  <span className="text-xs text-lc-text3 shrink-0">
                    {Object.keys(state.votes).length} votes
                  </span>
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
