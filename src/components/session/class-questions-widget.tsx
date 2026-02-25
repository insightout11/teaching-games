'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';

// Class Questions widget — teacher-side moderation UI.
// Pending section: shows questions awaiting review (collapsed by default for screen-share safety).
// Published section: shows questions visible to students, with vote counts, AI draft, and remove.

interface ClassQuestionsContentProps {
  sessionId: string;
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

export function ClassQuestionsContent({ sessionId }: ClassQuestionsContentProps) {
  const [pending, setPending] = useState<StudentSubmission[]>([]);
  const [published, setPublished] = useState<PublishedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingOpen, setPendingOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DraftResult>>({});
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({});
  const [draftError, setDraftError] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
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
          // Re-fetch on any update to keep lists in sync
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

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_PUBLISHED - published.length) {
        next.add(id);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0 || isPublishing) return;

    // Server-side guard is also present, but check client-side too
    if (published.length + selected.size > MAX_PUBLISHED) return;

    setIsPublishing(true);
    const ids = Array.from(selected);
    const now = new Date().toISOString();

    await supabase
      .from('student_submissions')
      .update({ published_to_class: true, published_at: now })
      .in('id', ids);

    setSelected(new Set());
    setIsPublishing(false);
    loadQuestions();
  };

  const handleReject = async (id: string) => {
    await supabase
      .from('student_submissions')
      .update({ status: 'rejected' })
      .eq('id', id);

    setPending((prev) => prev.filter((s) => s.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleMarkAnswered = async (id: string) => {
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: false, answered_at: now })
      .eq('id', id);

    setPublished((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAll = async () => {
    if (published.length === 0) return;
    const now = new Date().toISOString();
    await supabase
      .from('student_submissions')
      .update({ published_to_class: false, answered_at: now })
      .eq('session_id', sessionId)
      .eq('published_to_class', true);

    setPublished([]);
  };

  const handleAiDraft = async (question: PublishedQuestion) => {
    setDraftLoading((prev) => ({ ...prev, [question.id]: true }));
    setDraftError((prev) => ({ ...prev, [question.id]: '' }));

    try {
      const res = await fetch('/api/class-questions/draft-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.content,
          topic: 'General',
          difficulty: 'Intermediate',
        }),
      });

      if (!res.ok) throw new Error('Failed');
      const data: DraftResult = await res.json();
      setDrafts((prev) => ({ ...prev, [question.id]: data }));
    } catch {
      setDraftError((prev) => ({ ...prev, [question.id]: 'Draft unavailable — try again.' }));
    } finally {
      setDraftLoading((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 1500);
    } catch { /* ignore */ }
  };

  const canSelectMore = selected.size < MAX_PUBLISHED - published.length;

  return (
    <div className="p-3 space-y-3 text-sm">

      {/* ── PENDING SECTION ── */}
      <div>
        <button
          onClick={() => setPendingOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 hover:text-white transition-colors"
        >
          <span>Pending ({pending.length})</span>
          <svg className={`w-3 h-3 transition-transform ${pendingOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {pendingOpen && (
          <div className="mt-2 space-y-2">
            {pending.length === 0 ? (
              <p className="text-slate-500 text-xs py-2 text-center">No pending questions</p>
            ) : (
              <>
                {pending.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                      selected.has(sub.id)
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(sub.id)}
                      onChange={() => handleToggleSelect(sub.id)}
                      disabled={!selected.has(sub.id) && !canSelectMore}
                      className="mt-0.5 accent-cyan-500 flex-shrink-0"
                    />
                    <span className="flex-1 text-slate-200 leading-snug break-words">{sub.content}</span>
                    <button
                      onClick={() => handleReject(sub.id)}
                      className="flex-shrink-0 text-xs text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded border border-red-500/20 hover:border-red-400/40"
                    >
                      Reject
                    </button>
                  </div>
                ))}

                <button
                  onClick={handlePublish}
                  disabled={selected.size === 0 || isPublishing}
                  className="w-full py-2 rounded-lg text-xs font-semibold transition-all border disabled:opacity-40 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'Publishing…' : `Publish selected (${selected.size})`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── PUBLISHED SECTION ── */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
          <span>Published ({published.length})</span>
          {published.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-slate-500 hover:text-red-400 transition-colors normal-case font-normal"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-2 space-y-3">
          {published.length === 0 ? (
            <p className="text-slate-500 text-xs py-2 text-center">No published questions</p>
          ) : (
            published.map((q) => (
              <div key={q.id} className="bg-white/5 border border-white/10 rounded-lg p-2 space-y-2">
                <div className="flex items-start gap-2">
                  {/* Vote count */}
                  <div className="flex-shrink-0 flex flex-col items-center text-cyan-400 min-w-[2rem]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold">{q.voteCount}</span>
                  </div>

                  {/* Question text */}
                  <span className="flex-1 text-slate-200 leading-snug break-words">{q.content}</span>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-1">
                    <button
                      onClick={() => handleAiDraft(q)}
                      disabled={draftLoading[q.id]}
                      className="text-xs px-1.5 py-0.5 rounded border text-purple-400 border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    >
                      {draftLoading[q.id] ? '…' : 'AI Draft'}
                    </button>
                    <button
                      onClick={() => handleMarkAnswered(q.id)}
                      className="text-xs px-1.5 py-0.5 rounded border text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Draft error */}
                {draftError[q.id] && (
                  <p className="text-xs text-red-400 pl-8">{draftError[q.id]}</p>
                )}

                {/* AI Draft result */}
                {drafts[q.id] && (
                  <div className="ml-8 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 space-y-1.5">
                    <p className="text-slate-200 text-xs leading-relaxed">{drafts[q.id].answer}</p>
                    {drafts[q.id].example && (
                      <p className="text-slate-400 text-xs italic">e.g. {drafts[q.id].example}</p>
                    )}
                    {drafts[q.id].teacherTip && (
                      <p className="text-cyan-400 text-xs">Tip: {drafts[q.id].teacherTip}</p>
                    )}
                    <button
                      onClick={() => {
                        const draft = drafts[q.id];
                        const text = [draft.answer, draft.example ? `e.g. ${draft.example}` : ''].filter(Boolean).join('\n');
                        handleCopy(q.id, text);
                      }}
                      className="text-xs px-2 py-0.5 rounded border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {copied[q.id] ? 'Copied!' : 'Copy'}
                    </button>
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
