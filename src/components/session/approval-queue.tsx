'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApprovalQueue } from '@/hooks/use-approval-queue';
import { Button } from '@/components/ui/button';
import type { StudentSubmission } from '@/lib/supabase/types';

interface ApprovalQueueProps {
  sessionId: string;
  onApprove: (submission: StudentSubmission) => Promise<void>;
  hideContent?: boolean;
  autoApprove?: boolean;
}

export function ApprovalQueue({ sessionId, onApprove, hideContent, autoApprove }: ApprovalQueueProps) {
  const { pending, approve, reject, setError, isLoading } = useApprovalQueue(sessionId);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

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
    if (!autoApprove || pending.length === 0 || processingId !== null) return;
    handleApproveRef.current(pending[0]);
  }, [autoApprove, pending, processingId]);

  const handleReject = async (submissionId: string) => {
    setProcessingId(submissionId);
    await reject(submissionId);
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Student Submissions</span>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
        <span className="text-gray-400">{isCollapsed ? '+' : '-'}</span>
      </button>

      {/* Queue */}
      {!isCollapsed && (
        <div className="border-t border-white/10">
          {pending.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No pending submissions
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {pending.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 border-b border-white/5 last:border-b-0"
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
                    <span className="text-xs text-gray-500">
                      {new Date(submission.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {hideContent && !revealedIds.has(submission.id) ? (
                    <button
                      onClick={() => setRevealedIds(prev => new Set(prev).add(submission.id))}
                      className="text-xs text-gray-500 mb-3 hover:text-gray-300 transition-colors"
                    >
                      Answer hidden — click to reveal
                    </button>
                  ) : (
                    <p className="text-sm text-gray-300 mb-3 break-words">
                      {submission.content}
                    </p>
                  )}

                  <div className="flex gap-2">
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
