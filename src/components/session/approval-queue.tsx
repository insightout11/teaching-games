'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApprovalQueue } from '@/hooks/use-approval-queue';
import { Button } from '@/components/ui/button';
import type { StudentSubmission } from '@/lib/supabase/types';

interface ApprovalQueueProps {
  sessionId: string;
  gameKey?: string;
  onApprove: (submission: StudentSubmission) => Promise<void>;
  onSpotlight?: (submission: StudentSubmission) => Promise<void>;
  hideContent?: boolean;
  autoApprove?: boolean;
  showPanel?: boolean;
}

export function ApprovalQueue({
  sessionId,
  gameKey,
  onApprove,
  onSpotlight,
  hideContent,
  autoApprove,
  showPanel = true,
}: ApprovalQueueProps) {
  const { pending, approve, reject, setError, isLoading } = useApprovalQueue(sessionId);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const visiblePending = gameKey ? pending.filter((submission) => submission.game_key === gameKey) : pending;

  const handleApprove = useCallback(async (submission: StudentSubmission) => {
    setProcessingId(submission.id);
    try {
      await onApprove(submission);
      await approve(submission.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation failed';
      await setError(submission.id, message);
    } finally {
      setProcessingId(null);
    }
  }, [onApprove, approve, setError]);

  const handleApproveRef = useRef(handleApprove);
  handleApproveRef.current = handleApprove;

  // Auto-approve: process submissions without teacher action when the game opts in
  useEffect(() => {
    if (!autoApprove || visiblePending.length === 0 || processingId !== null) return;
    handleApproveRef.current(visiblePending[0]);
  }, [autoApprove, visiblePending, processingId]);

  const handleReject = async (submissionId: string) => {
    setProcessingId(submissionId);
    await reject(submissionId);
    setProcessingId(null);
  };

  const handleSpotlight = useCallback(async (submission: StudentSubmission) => {
    if (!onSpotlight) return;
    setProcessingId(submission.id);
    try {
      await onApprove(submission); // score the submission
      await onSpotlight(submission); // approve + write spotlight payload
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Spotlight failed';
      await setError(submission.id, message);
    } finally {
      setProcessingId(null);
    }
  }, [onApprove, onSpotlight, setError]);

  if (autoApprove || !showPanel) {
    // Silent processor: keep auto-approval side effects mounted without projecting the private review UI.
    return null;
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-lc-border rounded w-1/2" />
          <div className="h-16 bg-lc-border rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-lc-card/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Student Submissions</span>
          {visiblePending.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
              {visiblePending.length} pending
            </span>
          )}
        </div>
        <span className="text-lc-text3">{isCollapsed ? '+' : '-'}</span>
      </button>

      {/* Queue */}
      {!isCollapsed && (
        <div className="border-t border-lc-border">
          {visiblePending.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No pending submissions
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {visiblePending.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 border-b border-lc-border-subtle last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-medium text-sm">{submission.display_name}</span>
                      {submission.team && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          submission.team === 'red'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {submission.team}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-lc-text3">
                      {new Date(submission.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {hideContent && !revealedIds.has(submission.id) ? (
                    <button
                      onClick={() => setRevealedIds(prev => new Set(prev).add(submission.id))}
                      className="text-xs text-lc-text3 mb-3 hover:text-lc-text transition-colors"
                    >
                      Answer hidden — click to reveal
                    </button>
                  ) : (
                    <p className="text-sm text-lc-text mb-3 break-words">
                      {submission.content}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {onSpotlight && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSpotlight(submission)}
                        disabled={processingId === submission.id}
                        className="flex-1 text-xs py-1 hover:bg-amber-500/20 hover:text-amber-400 text-amber-400/70"
                      >
                        ✦ Spotlight
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(submission)}
                      disabled={processingId === submission.id}
                      className="flex-1 text-xs py-1"
                    >
                      {processingId === submission.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(submission.id)}
                      disabled={processingId === submission.id}
                      className="flex-1 text-xs py-1 hover:bg-red-500/20 hover:text-red-400"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
