'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';

// Class Questions widget — teacher-side moderation UI.
// Pending section: auto-opens when questions arrive; inline ✓/✗ per row + Publish all.
// Published section: shows questions visible to students, with vote counts, AI draft, and remove.

interface ClassQuestionsContentProps {
  sessionId: string;
  topic: string;
  difficulty: string;
  onShowAnswer: (question: string, answer: string) => void;
}

interface PublishedQuestion extends StudentSubmission {
  voteCount: number;
}

interface DraftResult {
  answer: string;
  example?: string;
  teacherTip?: string;
}

const MAX_PUBLISHED = 5;

export function ClassQuestionsContent({ sessionId, topic, difficulty, onShowAnswer }: ClassQuestionsContentProps) {
  const [pending, setPending] = useState<StudentSubmission[]>([]);
  const [published, setPublished] = useState<PublishedQuestion[]>([]);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [answerOpen, setAnswerOpen] = useState<Record<string, boolean>>({});
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  // Load initial data
  const loadQuestions = useCallback(async () => {
    if (isMockMode()) return;

    const { data: pendingData } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .eq('published_to_class', false)
      .is('game_key', null)
      .order('created_at', { ascending: true });

    if (pendingData) setPending(pendingData as StudentSubmission[]);

    const { data: publishedData } = await supabase
      .from('student_submissions')
      .select(`id, session_id, client_id, display_name, team, submission_type, content, status, error_message, game_key, created_at, published_to_class, published_at, answered_at, question_votes(count)`)
      .eq('session_id', sessionId)
      .eq('published_to_class', true)
      .order('published_at', { ascending: false });

    if (publishedData) {
      const mapped = (publishedData as Array<StudentSubmission & { question_votes: { count: number }[] }>)
        .map((q) => ({
          ...q,
          voteCount: q.question_votes?.[0]?.count ?? 0,
        }))
        .sort((a, b) => b.voteCount - a.voteCount || (b.published_at ?? '').localeCompare(a.published_at ?? ''));
      setPublished(mapped);
    }
  }, [sessionId, supabase]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Auto-open pending section when questions arrive
  useEffect(() => {
    if (pending.length > 0) setPendingOpen(true);
  }, [pending.length]);

  // Realtime subscription
  useEffect(() => {
    if (isMockMode()) return;

    const channel = supabase
      .channel(`class-questions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const sub = payload.new as StudentSubmission;
          if (sub.game_key === null && sub.status === 'pending' && !sub.published_to_class) {
            setPending((prev) => [...prev, sub]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadQuestions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'question_votes',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase, loadQuestions]);

  const handlePublishOne = async (id: string) => {
    if (published.length >= MAX_PUBLISHED) return;
    setPublishingIds((prev) => new Set(prev).add(id));
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: true, published_at: now })
      .eq('id', id);
    setPublishingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    loadQuestions();
  };

  const handlePublishAll = async () => {
    const slots = MAX_PUBLISHED - published.length;
    if (slots <= 0) return;
    const toPublish = pending.slice(0, slots).map((s) => s.id);
    if (toPublish.length === 0) return;
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: true, published_at: now })
      .in('id', toPublish);
    loadQuestions();
  };

  const handleReject = async (id: string) => {
    await supabase
      .from('student_submissions')
      .update({ status: 'rejected' })
      .eq('id', id);

    setPending((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMarkAnswered = async (id: string) => {
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: false, answered_at: now, status: 'answered' })
      .eq('id', id);

    setPublished((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAll = async () => {
    if (published.length === 0) return;
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: false, answered_at: now, status: 'answered' })
      .eq('session_id', sessionId)
      .eq('published_to_class', true);

    setPublished([]);
  };

  const getAIDraft = async (questionId: string, question: string) => {
    setDraftLoading((l) => ({ ...l, [questionId]: true }));
    try {
      const res = await fetch('/api/class-questions/draft-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, topic, difficulty }),
      });
      const draft: DraftResult = await res.json();
      const filled = [draft.answer, draft.example].filter(Boolean).join('\n\n');
      setAnswerText((t) => ({ ...t, [questionId]: filled }));
    } finally {
      setDraftLoading((l) => ({ ...l, [questionId]: false }));
    }
  };

  const atLimit = published.length >= MAX_PUBLISHED;

  return (
    <div className="p-3 space-y-3 text-sm">

      {/* ── PENDING SECTION ── */}
      <div>
        <div className="flex items-center justify-between py-1">
          <button
            onClick={() => setPendingOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-lc-text2 uppercase tracking-wider hover:text-lc-text transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${pendingOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span>Pending ({pending.length})</span>
          </button>

          {pending.length > 1 && !atLimit && (
            <button
              onClick={handlePublishAll}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/10 px-2 py-0.5 rounded transition-colors"
            >
              Publish all
            </button>
          )}
        </div>

        {pendingOpen && (
          <div className="mt-2 space-y-2">
            {pending.length === 0 ? (
              <p className="text-lc-text3 text-xs py-2 text-center">No pending questions</p>
            ) : (
              pending.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-2 p-2 rounded-lg border bg-lc-surface border-lc-border"
                >
                  <span className="flex-1 text-lc-text leading-snug break-words">{sub.content}</span>
                  <div className="flex-shrink-0 flex gap-1">
                    {/* Approve */}
                    <button
                      onClick={() => handlePublishOne(sub.id)}
                      disabled={atLimit || publishingIds.has(sub.id)}
                      title="Publish"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-400/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    {/* Reject */}
                    <button
                      onClick={() => handleReject(sub.id)}
                      title="Reject"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border text-red-400 border-red-500/30 hover:bg-red-500/15 hover:border-red-400/50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── PUBLISHED SECTION ── */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-lc-text2 uppercase tracking-wider py-1">
          <span>Published ({published.length})</span>
          {published.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-lc-text3 hover:text-red-400 transition-colors normal-case font-normal"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-2 space-y-3">
          {published.length === 0 ? (
            <p className="text-lc-text3 text-xs py-2 text-center">No published questions</p>
          ) : (
            published.map((q) => (
              <div key={q.id} className="bg-lc-surface border border-lc-border rounded-lg p-2 space-y-2">
                <div className="flex items-start gap-2">
                  {/* Vote count */}
                  <div className="flex-shrink-0 flex flex-col items-center text-cyan-400 min-w-[2rem]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold">{q.voteCount}</span>
                  </div>

                  {/* Question text */}
                  <span className="flex-1 text-lc-text leading-snug break-words">{q.content}</span>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => setAnswerOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}
                      className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                        answerOpen[q.id]
                          ? 'text-purple-300 border-purple-400/40 bg-purple-500/20'
                          : 'text-purple-400 border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-500/10'
                      }`}
                    >
                      Answer
                    </button>
                    <button
                      onClick={() => handleMarkAnswered(q.id)}
                      className="text-xs px-1.5 py-0.5 rounded border text-lc-text2 border-lc-border hover:border-lc-text3 hover:bg-lc-card/50 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Inline answer panel */}
                {answerOpen[q.id] && (
                  <div className="ml-8 space-y-2">
                    <textarea
                      value={answerText[q.id] ?? ''}
                      onChange={(e) => setAnswerText((t) => ({ ...t, [q.id]: e.target.value }))}
                      placeholder="Type an answer or use smart draft…"
                      rows={3}
                      className="w-full bg-lc-surface border border-lc-border rounded-lg px-2 py-1.5 text-xs text-lc-text placeholder:text-lc-text3 resize-none focus:outline-none focus:border-lc-text3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => getAIDraft(q.id, q.content)}
                        disabled={draftLoading[q.id]}
                        className="text-xs px-2 py-1 rounded border text-purple-400 border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                      >
                        {draftLoading[q.id] ? 'Getting draft…' : 'Get smart draft'}
                      </button>
                      <button
                        onClick={() => {
                          onShowAnswer(q.content, answerText[q.id] ?? '');
                          setAnswerOpen((o) => ({ ...o, [q.id]: false }));
                        }}
                        disabled={!answerText[q.id]?.trim()}
                        className="text-xs px-2 py-1 rounded border text-emerald-400 border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      >
                        Show on screen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
