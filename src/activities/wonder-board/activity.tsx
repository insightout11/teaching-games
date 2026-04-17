'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { isMockMode } from '@/lib/mock/auth';
import type { ActivityProps } from '../types';
import type { WonderBoardContent } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Question starters assigned round-robin to students
const STARTERS = ['Why', 'How', 'What', 'When', 'Where', 'Should', 'What if'];

// Color per starter for visual identity on the board
const STARTER_COLORS: Record<string, string> = {
  'Why':     'text-rose-400 border-rose-500/40',
  'How':     'text-sky-400 border-sky-500/40',
  'What':    'text-violet-400 border-violet-500/40',
  'When':    'text-amber-400 border-amber-500/40',
  'Where':   'text-emerald-400 border-emerald-500/40',
  'Should':  'text-orange-400 border-orange-500/40',
  'What if': 'text-pink-400 border-pink-500/40',
  'Follow-up': 'text-slate-400 border-slate-500/40',
};

type Phase = 'idle' | 'collecting' | 'done';

interface WonderQuestion {
  id: string;
  session_id: string;
  client_id: string;
  display_name: string;
  starter: string;
  content: string;
  parent_id: string | null;
  answer_text: string | null;
  answer_type: string | null;
  answered_at: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------

function StarterBadge({ starter }: { starter: string }) {
  const colors = STARTER_COLORS[starter] ?? 'text-slate-400 border-slate-500/40';
  const [textColor] = colors.split(' ');
  return (
    <span className={`text-xs font-bold uppercase tracking-widest ${textColor} opacity-80`}>
      {starter}
    </span>
  );
}

interface QuestionCardProps {
  question: WonderQuestion;
  followUps: WonderQuestion[];
  voteCount: number;
  sessionId: string;
}

function QuestionCard({
  question,
  followUps,
  voteCount,
  sessionId,
}: QuestionCardProps) {
  const [answerOpen, setAnswerOpen] = useState(false);
  const [manualAnswer, setManualAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [localAnswerText, setLocalAnswerText] = useState<string | null>(null);

  const isAnswered = !!(question.answer_text || localAnswerText);
  const displayAnswerText = question.answer_text ?? localAnswerText;
  const borderColor = STARTER_COLORS[question.starter]?.split(' ')[1] ?? 'border-white/10';

  const handleAnswer = useCallback(async (type: 'teacher' | 'ai') => {
    if (type === 'teacher' && !manualAnswer.trim()) return;
    setIsAnswering(true);
    setAnswerError(null);
    try {
      const res = await fetch('/api/wonder-board/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          answerType: type,
          answerText: type === 'teacher' ? manualAnswer.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setAnswerError((errData as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      const data = await res.json() as { answerText: string };
      setLocalAnswerText(data.answerText);
      setAnswerOpen(false);
      setManualAnswer('');
    } catch {
      setAnswerError('Network error — please try again');
    } finally {
      setIsAnswering(false);
    }
  }, [sessionId, question.id, manualAnswer]);

  // Render the answer text — split at double-newline for answer vs provocation
  function renderAnswer(text: string) {
    const parts = text.split('\n\n');
    if (parts.length >= 2) {
      return (
        <>
          <p className="text-sm opacity-90">{parts[0]}</p>
          <p className="text-sm opacity-60 italic mt-1">{parts.slice(1).join(' ')}</p>
        </>
      );
    }
    return <p className="text-sm opacity-90">{text}</p>;
  }

  return (
    <div
      className={`glass rounded-2xl border-2 ${borderColor} p-4 space-y-3 transition-all duration-200 ${focused ? 'ring-2 ring-white/20 scale-[1.02]' : ''}`}
      onClick={() => setFocused(!focused)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <StarterBadge starter={question.starter} />
        <div className="flex items-center gap-2 opacity-60 text-xs">
          <span>{question.display_name}</span>
          {voteCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              ↑ {voteCount}
            </span>
          )}
        </div>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium leading-snug">{question.content}</p>

      {/* Answer area */}
      {isAnswered && (
        <div className="bg-white/5 rounded-xl p-3 space-y-1 border border-white/10">
          {renderAnswer(displayAnswerText!)}
          {followUps.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
              {followUps.map((fu) => (
                <div key={fu.id} className="text-xs opacity-70">
                  <span className="opacity-50 mr-1">{fu.display_name}:</span>
                  {fu.content}
                  {fu.answer_text && (
                    <div className="mt-1 opacity-60 italic text-xs">{fu.answer_text}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {answerError && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1">{answerError}</p>
      )}

      {/* Action buttons — stop card click from triggering focus toggle */}
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {!isAnswered && !answerOpen && (
          <>
            <button
              onClick={() => setAnswerOpen(true)}
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
            >
              Answer
            </button>
            <button
              onClick={() => handleAnswer('ai')}
              disabled={isAnswering}
              className="px-3 py-1.5 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isAnswering ? 'Thinking...' : 'AI Answer'}
            </button>
          </>
        )}

        {!isAnswered && answerOpen && (
          <div className="w-full space-y-2">
            <textarea
              className="w-full bg-white/10 rounded-lg p-2 text-sm resize-none border border-white/20 focus:outline-none focus:border-white/40"
              rows={2}
              placeholder="Type your answer..."
              value={manualAnswer}
              onChange={(e) => setManualAnswer(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAnswer('teacher')}
                disabled={isAnswering || !manualAnswer.trim()}
                className="px-3 py-1.5 text-xs bg-lc-blue hover:bg-lc-blue/80 rounded-lg transition-colors font-medium text-white disabled:opacity-40"
              >
                {isAnswering ? 'Saving...' : 'Save Answer'}
              </button>
              <button
                onClick={() => handleAnswer('ai')}
                disabled={isAnswering}
                className="px-3 py-1.5 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                AI instead
              </button>
              <button
                onClick={() => { setAnswerOpen(false); setManualAnswer(''); }}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main activity
// -----------------------------------------------------------------------

export function WonderBoardActivity({
  sessionId,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
}: ActivityProps) {
  const content = generatedContent as WonderBoardContent;

  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<WonderQuestion[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [followUpMode, setFollowUpMode] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // Lazy-import Supabase browser client to avoid Edge Runtime bundling issues
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      setSupabase(createClient());
    });
  }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;


  // -----------------------------------------------------------------------
  // Load questions + votes from DB on mount and when phase becomes collecting
  // -----------------------------------------------------------------------
  const loadFromDB = useCallback(async (sid: string, client: SupabaseClient) => {
    if (isMockMode()) return;

    const { data: qs } = await client
      .from('wonder_questions')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });

    if (qs) setQuestions(qs as WonderQuestion[]);

    const { data: vs } = await client
      .from('wonder_votes')
      .select('question_id')
      .eq('session_id', sid);

    if (vs) {
      const counts: Record<string, number> = {};
      for (const v of vs) {
        counts[v.question_id] = (counts[v.question_id] ?? 0) + 1;
      }
      setVoteCounts(counts);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Realtime subscriptions — active during collecting phase
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'collecting' || isMockMode() || !sessionId || !supabase) return;

    const sid = sessionId;
    loadFromDB(sid, supabase);

    const questionsChannel = supabase
      .channel(`wonder-questions-${sid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wonder_questions', filter: `session_id=eq.${sid}` },
        (payload: { new: WonderQuestion }) => {
          setQuestions((prev) => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wonder_questions', filter: `session_id=eq.${sid}` },
        (payload: { new: WonderQuestion }) => {
          setQuestions((prev) =>
            prev.map((q) => (q.id === payload.new.id ? payload.new : q))
          );
        }
      )
      .subscribe();

    const votesChannel = supabase
      .channel(`wonder-votes-${sid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wonder_votes', filter: `session_id=eq.${sid}` },
        (payload: { new: { question_id: string } }) => {
          const qid = payload.new.question_id;
          setVoteCounts((prev) => ({ ...prev, [qid]: (prev[qid] ?? 0) + 1 }));
        }
      )
      .subscribe();

    // Polling fallback — catches questions if realtime publication isn't yet enabled
    const pollInterval = setInterval(() => loadFromDB(sid, supabase), 4000);

    return () => {
      supabase.removeChannel(questionsChannel);
      supabase.removeChannel(votesChannel);
      clearInterval(pollInterval);
    };
  }, [phase, sessionId, supabase, loadFromDB]);

  // -----------------------------------------------------------------------
  // Update InputSpec when phase or follow-up mode changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }

    if (followUpMode) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'wonder-board',
        prompt: 'Choose a question to follow up on:',
        placeholder: 'Ask your follow-up question...',
        maxLength: 200,
        allowMultiple: true,
        wonderFollowUpMode: true,
      });
      return;
    }

    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'wonder-board',
      prompt: 'Ask your question — start with your assigned word!',
      placeholder: 'Type your question here...',
      maxLength: 200,
      allowMultiple: true,
    });
  }, [phase, followUpMode, onSetInputSpec]);

  // -----------------------------------------------------------------------
  // Phase transitions
  // -----------------------------------------------------------------------
  const handleStart = useCallback(() => {
    setQuestions([]);
    setVoteCounts({});
    setFollowUpMode(false);
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('done');
    setFollowUpMode(false);
    onPhaseChange?.('finished');
    onSetInputSpec?.(null);
  }, [onPhaseChange, onSetInputSpec]);

  // -----------------------------------------------------------------------
  // Derived data — separate top-level questions from follow-ups
  // -----------------------------------------------------------------------
  const topLevelQuestions = questions.filter((q) => !q.parent_id);
  const unanswered = topLevelQuestions.filter((q) => !q.answer_text);
  const answered = topLevelQuestions.filter((q) => !!q.answer_text);

  const getFollowUps = (parentId: string) =>
    questions.filter((q) => q.parent_id === parentId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-violet-400">Wonder Board</h3>
        {phase === 'collecting' && (
          <span className="text-sm opacity-50">
            {topLevelQuestions.length} question{topLevelQuestions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-lg opacity-90">{content.framingPrompt}</p>
            <p className="text-sm opacity-50">Each student is assigned a question starter. Questions appear live on the board.</p>
          </div>

          {/* Starter legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            {STARTERS.map((s) => (
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-sm font-bold border ${STARTER_COLORS[s]}`}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              OPEN BOARD
            </button>
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="space-y-5">
          {followUpMode && (
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-2">
              Students can pick any answered question to follow up on.
              <button
                onClick={() => setFollowUpMode(false)}
                className="ml-2 underline opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          )}

          {topLevelQuestions.length === 0 && (
            <p className="text-center opacity-40 text-sm py-8">Waiting for questions...</p>
          )}

          {/* Unanswered questions */}
          {unanswered.length > 0 && (
            <div>
              <p className="text-xs opacity-40 uppercase tracking-widest mb-3">Unanswered</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {unanswered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    followUps={getFollowUps(q.id)}
                    voteCount={voteCounts[q.id] ?? 0}
                    sessionId={q.session_id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Answered questions */}
          {answered.length > 0 && (
            <div>
              <p className="text-xs opacity-40 uppercase tracking-widest mb-3">Answered</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {answered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    followUps={getFollowUps(q.id)}
                    voteCount={voteCounts[q.id] ?? 0}
                    sessionId={q.session_id}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {answered.length > 0 ? (
              <button
                onClick={() => setFollowUpMode((m) => !m)}
                className={`px-4 py-2 text-xs rounded-xl font-medium transition-all ${
                  followUpMode
                    ? 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {followUpMode ? 'Close Follow-ups' : 'Open for Follow-ups'}
              </button>
            ) : <div />}
            <button
              onClick={handleEnd}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-game text-sm transition-all"
            >
              END MODULE
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="space-y-4">
          <p className="text-center opacity-50 text-sm py-2">Board closed.</p>
          {topLevelQuestions.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {topLevelQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  followUps={getFollowUps(q.id)}
                  voteCount={voteCounts[q.id] ?? 0}
                  sessionId={q.session_id}
                />
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => { setPhase('idle'); onPhaseChange?.('idle'); }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-game text-sm transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
