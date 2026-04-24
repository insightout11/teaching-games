'use client';

import { useState, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { VideoPlayerContent } from '../types';
import type { CheckpointQuestion } from '@/types/source-material';

type VoteHandler = (vote: { clientId: string; studentId?: string | null; displayName: string; choice: string; gameKey: string; inputType: string }) => void;

interface CheckpointState {
  pushed: boolean;
  votes: Record<string, string>; // clientId → choice
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

  const [checkpointStates, setCheckpointStates] = useState<CheckpointState[]>(
    () => checkpoints.map(() => ({ pushed: false, votes: {} })),
  );
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState<number | null>(null);
  const scoredRef = useRef<Set<string>>(new Set());

  // Build embed URL — handles both YouTube and TED
  const embedUrl = (() => {
    if (videoUrl.includes('embed.ted.com')) return videoUrl;
    const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1` : null;
  })();

  const pushCheckpoint = useCallback(
    (idx: number) => {
      const cp = checkpoints[idx];
      if (!cp) return;

      setActiveCheckpointIdx(idx);
      setCheckpointStates((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], pushed: true };
        return next;
      });

      // Show MCQ on student devices
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'video-player',
        options: cp.options,
        prompt: cp.question,
      });

      // Register vote handler
      const handler: VoteHandler = (vote) => {
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
      };

      onRegisterRemoteVoteHandler?.(handler);
    },
    [checkpoints, onSetInputSpec, onRegisterRemoteVoteHandler, onScore],
  );

  const closeCheckpoint = useCallback(() => {
    setActiveCheckpointIdx(null);
    onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
  }, [onSetInputSpec, onRegisterRemoteVoteHandler]);

  const activeCheckpoint = activeCheckpointIdx !== null ? checkpoints[activeCheckpointIdx] : null;
  const activeState = activeCheckpointIdx !== null ? checkpointStates[activeCheckpointIdx] : null;
  const voteCount = activeState ? Object.keys(activeState.votes).length : 0;

  return (
    <div className="space-y-4">
      {/* Video title */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎬</span>
        <h2 className="text-base font-semibold text-lc-text truncate">{videoTitle}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video embed */}
        <div className="lg:col-span-2">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
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
        </div>

        {/* Checkpoints panel */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">
            Checkpoints
          </p>

          {checkpoints.length === 0 && (
            <p className="text-xs text-lc-text3">No checkpoints generated.</p>
          )}

          {checkpoints.map((cp: CheckpointQuestion, idx: number) => {
            const state = checkpointStates[idx];
            const isActive = activeCheckpointIdx === idx;

            return (
              <div
                key={idx}
                className={`rounded-lg border p-3 space-y-2 transition-all ${
                  isActive
                    ? 'border-lc-blue/60 bg-lc-blue/10'
                    : state.pushed
                    ? 'border-lc-border/50 bg-lc-surface opacity-60'
                    : 'border-lc-border bg-lc-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-lc-text3 mr-1">{cp.timestampLabel}</span>
                    <span className="text-xs text-lc-text leading-snug">{cp.question}</span>
                  </div>
                </div>

                {isActive && activeState ? (
                  <div className="space-y-1">
                    {/* Live tally */}
                    {cp.options.map((opt: string, oi: number) => {
                      const count = Object.values(activeState.votes).filter((v) => v === opt).length;
                      const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
                      const isCorrect = oi === cp.correctIndex;
                      return (
                        <div key={oi} className="flex items-center gap-2">
                          <span className={`text-xs w-4 font-semibold ${isCorrect ? 'text-lc-success' : 'text-lc-text3'}`}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-lc-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCorrect ? 'bg-lc-success' : 'bg-lc-blue/50'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-lc-text3 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-lc-text3">{voteCount}/{students.length} voted</span>
                      <button
                        onClick={closeCheckpoint}
                        className="text-xs text-lc-text3 hover:text-lc-text transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  !state.pushed && (
                    <button
                      onClick={() => pushCheckpoint(idx)}
                      className="w-full py-1 rounded-md bg-lc-blue/15 text-lc-blue text-xs font-semibold hover:bg-lc-blue/25 transition-colors"
                    >
                      Push Question →
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active question reminder for teacher */}
      {activeCheckpoint && (
        <div className="rounded-xl border border-lc-blue/40 bg-lc-blue/5 p-3">
          <p className="text-xs font-semibold text-lc-blue mb-1">Question sent to students:</p>
          <p className="text-sm text-lc-text">{activeCheckpoint.question}</p>
        </div>
      )}
    </div>
  );
}
