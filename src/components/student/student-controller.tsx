'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import { DynamicInput } from './dynamic-input';
import { VALIDATION } from '@/lib/config/rate-limits';

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
  avatarSeed?: string;
}

interface ActivePoll {
  pollId: string;
  question: string;
  options: string[];
}

interface PublishedQuestion {
  id: string;
  content: string;
  publishedAt: string;
  voteCount: number;
}

interface StudentControllerProps {
  sessionId: string;
  studentSession: StudentSession;
  onLeave: () => void;
}

// ---------------------------------------------------------------------------
// localStorage helpers for persisting voted question IDs across page reloads
// ---------------------------------------------------------------------------
const VOTED_KEY = 'lc-voted-questions';

function loadVotedIds(sessionId: string): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Set<string>(parsed[sessionId] ?? []);
  } catch {
    return new Set<string>();
  }
}

function persistVotedIds(sessionId: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[sessionId] = ids;
    localStorage.setItem(VOTED_KEY, JSON.stringify(parsed));
  } catch { /* ignore */ }
}

export function StudentController({ sessionId, studentSession, onLeave }: StudentControllerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [inputSpec, setInputSpec] = useState<InputSpec | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [publishedQuestions, setPublishedQuestions] = useState<PublishedQuestion[]>([]);
  const [personalMission, setPersonalMission] = useState<string | null>(null);

  // Ask a Question section state
  const [questionText, setQuestionText] = useState('');
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<'idle' | 'sent' | 'error' | 'rate_limited'>('idle');
  const [questionWait, setQuestionWait] = useState(0);

  // Optimistic voting state
  const [localVoteCounts, setLocalVoteCounts] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Load voted IDs from localStorage on mount
  useEffect(() => {
    setVotedIds(loadVotedIds(sessionId));
  }, [sessionId]);

  // Poll for session status, active polls, and input spec
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/session?sessionId=${sessionId}&clientId=${studentSession.clientId}`);
      if (!res.ok) {
        setSessionActive(false);
        setConnectionStatus('disconnected');
        return;
      }

      const data = await res.json();
      setSessionActive(data.isActive);
      setActivePoll(data.activePoll);
      setInputSpec(data.inputSpec);
      setFrozen(data.frozen ?? false);
      setPublishedQuestions(data.publishedQuestions ?? []);
      if (data.personalMission) setPersonalMission(data.personalMission);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [sessionId]);

  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [checkSession]);

  // Countdown timer for game submission rate limiting
  useEffect(() => {
    if (waitSeconds > 0) {
      const timer = setTimeout(() => setWaitSeconds(waitSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (submitStatus === 'rate_limited') {
      setSubmitStatus('idle');
    }
  }, [waitSeconds, submitStatus]);

  // Countdown timer for question rate limiting
  useEffect(() => {
    if (questionWait > 0) {
      const timer = setTimeout(() => setQuestionWait(questionWait - 1), 1000);
      return () => clearTimeout(timer);
    } else if (questionStatus === 'rate_limited') {
      setQuestionStatus('idle');
    }
  }, [questionWait, questionStatus]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || isSubmitting) return;

    // Optimistic Mission Brief: show immediately before DB confirms
    if (inputSpec?.gameKey === 'mission-selector') {
      setPersonalMission(content.trim());
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content: content.trim(),
          team: studentSession.team,
          gameKey: inputSpec?.gameKey,
          inputType: inputSpec?.type,
          studentId: studentSession.studentId,
          allowMultiple: inputSpec?.allowMultiple,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setSubmitStatus('rate_limited');
        setWaitSeconds(data.waitSeconds || 15);
      } else if (!res.ok) {
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setTimeout(() => setSubmitStatus('idle'), 2000);
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, studentSession, inputSpec, isSubmitting]);

  const handleVote = async (choice: string) => {
    if (!activePoll || isVoting) return;

    setIsVoting(true);
    setSelectedChoice(choice);

    try {
      const res = await fetch('/api/student/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: activePoll.pollId,
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          choice,
          team: studentSession.team,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status !== 429) {
          setSelectedChoice(null);
        } else {
          console.log(`Vote rate limited, wait ${data.waitSeconds}s`);
        }
      }
    } catch {
      setSelectedChoice(null);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAskQuestion = async () => {
    const trimmed = questionText.trim();
    if (!trimmed || isAskingQuestion) return;
    if (trimmed.length > VALIDATION.QUESTION_MAX) return;

    setIsAskingQuestion(true);
    setQuestionStatus('idle');

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content: trimmed,
          team: studentSession.team,
          gameKey: null,
          inputType: 'textarea',
          studentId: studentSession.studentId,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setQuestionStatus('rate_limited');
        setQuestionWait(data.waitSeconds || 15);
      } else if (!res.ok) {
        setQuestionStatus('error');
      } else {
        setQuestionStatus('sent');
        setQuestionText('');
        setQuestionOpen(false);
        setTimeout(() => setQuestionStatus('idle'), 3000);
      }
    } catch {
      setQuestionStatus('error');
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleUpvote = async (question: PublishedQuestion) => {
    if (votedIds.has(question.id)) return;

    // Optimistic update
    const newVotedIds = new Set(votedIds).add(question.id);
    setVotedIds(newVotedIds);
    setLocalVoteCounts((prev) => ({
      ...prev,
      [question.id]: Math.max(prev[question.id] ?? 0, question.voteCount) + 1,
    }));
    persistVotedIds(sessionId, Array.from(newVotedIds));

    // Fire-and-forget
    try {
      await fetch('/api/class-questions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          clientId: studentSession.clientId,
        }),
      });
    } catch { /* optimistic update stays */ }
  };

  if (!sessionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="glass rounded-3xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">!</div>
          <h1 className="text-xl font-bold text-white mb-2">Session Ended</h1>
          <p className="text-gray-400 mb-6">This session is no longer active.</p>
          <Button onClick={onLeave} variant="ghost">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <div>
              <p className="font-semibold text-white">{studentSession.displayName}</p>
              {studentSession.team && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  studentSession.team === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {studentSession.team === 'red' ? 'Red Team' : 'Blue Team'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onLeave}
            className="text-gray-400 hover:text-white text-sm"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-1">Poll</h2>
          <p className="text-lg text-cyan-400 mb-4">{activePoll.question}</p>
          <div className="space-y-2">
            {activePoll.options.map((option) => (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={isVoting}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedChoice === option
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                } disabled:opacity-50`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mission Brief — persists throughout the lesson once set */}
      {personalMission && (
        <div className="glass rounded-2xl px-5 py-3 mb-4 border border-violet-500/30">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-1">Your Mission</p>
          <p className="text-sm text-white leading-snug">{personalMission}</p>
        </div>
      )}

      {/* Dynamic Input based on game/activity */}
      <div className="glass rounded-2xl p-6 mb-4">
        {inputSpec ? (
          frozen ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="font-bold text-white mb-2">Input Paused</h2>
              <p className="text-gray-400 text-sm">
                Your teacher has temporarily paused submissions.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-bold text-white">Submit Answer</h2>
                <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                  {inputSpec.gameKey}
                </span>
              </div>
              <DynamicInput
                spec={inputSpec}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitStatus={submitStatus}
                waitSeconds={waitSeconds}
                clientId={studentSession.clientId}
              />
            </>
          )
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 opacity-50">⏳</div>
            <h2 className="font-bold text-white mb-2">Waiting for Activity</h2>
            <p className="text-gray-400 text-sm">
              The input will appear when the teacher starts a game or activity
            </p>
          </div>
        )}
      </div>

      {/* Class Questions — visible only when there are published questions */}
      {publishedQuestions.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-3">Class Questions</h2>
          <div className="space-y-3">
            {publishedQuestions.map((q) => {
              const displayCount = Math.max(localVoteCounts[q.id] ?? 0, q.voteCount);
              const hasVoted = votedIds.has(q.id);
              return (
                <div key={q.id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <button
                    onClick={() => handleUpvote(q)}
                    disabled={hasVoted}
                    className={`flex-shrink-0 flex flex-col items-center gap-0.5 transition-colors ${
                      hasVoted ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'
                    } disabled:cursor-default`}
                  >
                    <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-xs font-bold">{displayCount}</span>
                  </button>
                  <p className="text-gray-200 text-sm leading-relaxed">{q.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ask a Question — always visible, collapsible */}
      <div className="glass rounded-2xl mb-4">
        <button
          onClick={() => setQuestionOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-bold text-white text-sm">Ask a Question</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${questionOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {questionOpen && (
          <div className="px-4 pb-4 space-y-3">
            {questionStatus === 'sent' ? (
              <p className="text-green-400 text-sm text-center py-2">
                Question sent! The teacher will review it.
              </p>
            ) : (
              <>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value.slice(0, VALIDATION.QUESTION_MAX))}
                  placeholder="Type your question for the teacher…"
                  rows={3}
                  className="w-full bg-white/10 text-white rounded-xl p-3 text-sm resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {questionText.length}/{VALIDATION.QUESTION_MAX}
                  </span>
                  {questionStatus === 'error' && (
                    <span className="text-xs text-red-400">Something went wrong, try again.</span>
                  )}
                  {questionStatus === 'rate_limited' && (
                    <span className="text-xs text-yellow-400">Wait {questionWait}s before asking again.</span>
                  )}
                </div>
                <button
                  onClick={handleAskQuestion}
                  disabled={!questionText.trim() || isAskingQuestion || questionStatus === 'rate_limited'}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAskingQuestion ? 'Sending…' : 'Send Question'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>Your answers will be reviewed by the teacher</p>
      </div>
    </div>
  );
}
