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
      ) => { getCurrentTime(): number; getPlayerState(): number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface CheckpointState {
  pushed: boolean;
  votes: Record<string, string>;
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

  // Extract YouTube embed ID
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
    () => checkpoints.map(() => ({ pushed: false, votes: {} })),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const scoredRef = useRef<Set<string>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<{ getCurrentTime(): number; getPlayerState(): number } | null>(null);
  const firedRef = useRef<Set<number>>(new Set());

  // ── YouTube auto-fire via iframe API ────────────────────────────────────────
  const pushCheckpoint = useCallback(
    (idx: number) => {
      if (firedRef.current.has(idx)) return;
      firedRef.current.add(idx);
      const cp = checkpoints[idx];
      if (!cp) return;

      setActiveIdx(idx);
      setRevealed(false);
      setCheckpointStates((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], pushed: true };
        return next;
      });

      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'video-player',
        options: cp.options,
        prompt: cp.question,
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
    [checkpoints, onSetInputSpec, onRegisterRemoteVoteHandler, onScore],
  );

  useEffect(() => {
    if (!isYouTube || !youtubeId) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function initPlayer() {
      if (!iframeRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            // 1 = playing
            if (e.data === 1 && !pollInterval) {
              pollInterval = setInterval(() => {
                const t = playerRef.current?.getCurrentTime() ?? 0;
                checkpoints.forEach((cp, idx) => {
                  if (!firedRef.current.has(idx) && t >= cp.timestamp) {
                    pushCheckpoint(idx);
                  }
                });
              }, 800);
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
  }, [isYouTube, youtubeId, checkpoints, pushCheckpoint]);

  function closeQuestion() {
    setActiveIdx(null);
    setRevealed(false);
    onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
  }

  const activeCheckpoint = activeIdx !== null ? checkpoints[activeIdx] : null;
  const activeState = activeIdx !== null ? checkpointStates[activeIdx] : null;
  const voteCount = activeState ? Object.keys(activeState.votes).length : 0;
  const totalStudents = students.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎬</span>
        <h2 className="text-base font-semibold text-lc-text truncate">{videoTitle}</h2>
        {isYouTube && (
          <span className="text-xs text-lc-text3 bg-lc-bg border border-lc-border rounded-full px-2 py-0.5">
            Auto-fire enabled
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

      {/* Active question — full-width results panel */}
      {activeCheckpoint && activeState && (
        <div className="rounded-xl border border-lc-blue/50 bg-lc-blue/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide mb-1">Live Question</p>
              <p className="text-sm font-medium text-lc-text">{activeCheckpoint.question}</p>
            </div>
            <span className="text-xs text-lc-text3 shrink-0">{voteCount}/{totalStudents} answered</span>
          </div>

          {/* Tally bars */}
          <div className="space-y-2">
            {activeCheckpoint.options.map((opt, oi) => {
              const count = Object.values(activeState.votes).filter((v) => v === opt).length;
              const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
              const isCorrect = oi === activeCheckpoint.correctIndex;
              const showCorrect = revealed && isCorrect;
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

          <div className="flex gap-2 pt-1">
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="px-4 py-1.5 rounded-lg bg-lc-success/20 text-lc-success text-xs font-semibold hover:bg-lc-success/30 transition-colors"
              >
                Reveal Answer
              </button>
            )}
            <button
              onClick={closeQuestion}
              className="px-4 py-1.5 rounded-lg bg-lc-surface border border-lc-border text-xs font-semibold text-lc-text2 hover:text-lc-text transition-colors"
            >
              Close Question
            </button>
          </div>
        </div>
      )}

      {/* Checkpoint list — manual push for TED / already-fired summary for YouTube */}
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
                isActive ? 'border-lc-blue/50 bg-lc-blue/10' : state.pushed ? 'border-lc-border/40 opacity-50' : 'border-lc-border bg-lc-surface'
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
    </div>
  );
}
