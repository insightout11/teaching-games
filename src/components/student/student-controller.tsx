'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import { DynamicInput } from './dynamic-input';
import { VALIDATION } from '@/lib/config/rate-limits';
import { DIFFICULTIES } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';

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

// ---------------------------------------------------------------------------
// English Spotlight tips — shown while waiting for an activity to start
// minLevel = minimum difficulty at which this tip is shown
// ---------------------------------------------------------------------------
const WAITING_TIPS: { category: string; color: string; text: string; minLevel: string }[] = [
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Use 'a' before consonant sounds and 'an' before vowel sounds — it's about the sound, not the letter. 'An hour' is correct because 'hour' starts with a vowel sound." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "English borrows words from over 350 languages. 'Café' comes from French, 'yoga' from Sanskrit, 'robot' from Czech, and 'ketchup' from Malay." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Break a leg' means 'good luck'. It comes from theatre tradition — wishing someone bad luck was thought to bring good luck instead." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Three useful prefixes: 'un-' means not (unhappy), 're-' means again (rewrite), 'pre-' means before (preview). Spot them and you can guess thousands of new words." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "'I' vs 'me': remove the other person to test it. 'She gave it to I' sounds wrong — so say 'She gave it to me'. 'I' is for subjects; 'me' is for objects." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "The word 'nice' originally meant 'foolish' or 'ignorant' in the 14th century. Word meanings shift dramatically over hundreds of years — this is called semantic change." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Hit the nail on the head' means to be exactly right. 'Cost an arm and a leg' means something is very expensive. Idioms say one thing but mean another." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "The suffix '-tion' turns verbs into nouns: communicate → communication, educate → education, inform → information. It's one of the most common noun endings in English." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "Commas join two sentences when paired with 'and', 'but', or 'so'. Without a conjunction, use a semicolon or a full stop instead of a comma alone." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "Shakespeare invented over 1,700 words still used today — including 'bedroom', 'lonely', 'generous', and 'obscene'. He simply made them up when he needed them." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Under the weather' means feeling unwell. 'Once in a blue moon' means very rarely. Learning idioms helps you sound natural in everyday English." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Adjectives describe nouns; adverbs modify verbs, adjectives, or other adverbs. Many adverbs end in '-ly': quickly, carefully, honestly — but not always (fast, hard, well)." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "'There', 'their', and 'they're' sound identical but mean different things. There = place, Their = belonging to them, They're = they are. Context is the key." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The longest word in a standard English dictionary is 'pneumonoultramicroscopicsilicovolcanoconiosis' — a lung disease. The most commonly used word is 'the'." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Spill the beans' means to accidentally reveal a secret. 'Let the cat out of the bag' means the same thing — idioms often have quirky origin stories." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Synonyms add variety to your writing. Instead of always using 'said', try: whispered, announced, argued, replied, admitted. Word choice shapes the reader's feeling." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "Active voice is usually clearer than passive. 'The dog bit the man' (active) is more direct than 'The man was bitten by the dog' (passive)." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "English has around 170,000 words in current use, with another 47,000 obsolete words. A well-educated adult uses about 20,000–35,000 words in daily life." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Bite the bullet' means to endure a painful situation with courage. 'Bite off more than you can chew' means to take on more than you can handle." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Collocations are words that naturally go together. We say 'make a mistake' (not 'do a mistake'), 'do homework' (not 'make homework'). Learning them sounds more natural." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Questions with 'who', 'what', 'where', 'when', 'why', and 'how' need full answers. Yes/no questions only need 'yes' or 'no' — but a full answer is always better." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Easy', text: "'Goodbye' is a contraction of 'God be with ye', shortened over centuries. 'Hello' only became a standard greeting after the telephone was invented in the 1870s." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'The ball is in your court' means it's your turn to take action. 'Get the ball rolling' means to start something. Many English idioms come from sport." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Antonyms are opposites: hot/cold, love/hate, succeed/fail. Using contrast in writing creates emphasis and helps readers feel the difference between two ideas." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "First conditional: 'If it rains, I will stay inside.' Second conditional: 'If I were rich, I would travel.' The tense shift signals whether something is real or hypothetical." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The sentence 'The quick brown fox jumps over the lazy dog' contains every letter of the alphabet. This kind of sentence is called a pangram." },
  { category: 'Idiom', color: 'amber', minLevel: 'Advanced', text: "'Burn the midnight oil' means to work late into the night. It comes from the days when people used oil lamps — and staying up late literally meant burning oil." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Abstract nouns name ideas or feelings you can't touch: freedom, justice, happiness, courage. Concrete nouns name physical things: table, rain, book, city." },
];

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
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * WAITING_TIPS.length));
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);
  const [sessionDifficulty, setSessionDifficulty] = useState<string>('Intermediate');
  const [topicTips, setTopicTips] = useState<{ category: string; color: string; text: string }[]>([]);
  const [topicTipsLoaded, setTopicTipsLoaded] = useState(false);

  // Ask a Question section state
  const [questionText, setQuestionText] = useState('');
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<'idle' | 'sent' | 'error' | 'rate_limited'>('idle');
  const [questionWait, setQuestionWait] = useState(0);

  // Poll hide tracking (voted or dismissed)
  const [hiddenPollIds, setHiddenPollIds] = useState<Set<string>>(new Set());

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
      if (data.topic) setSessionTopic(data.topic);
      if (data.difficulty) setSessionDifficulty(data.difficulty);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Cycle through English spotlight tips while waiting for an activity
  const difficultyRank = DIFFICULTIES.indexOf(sessionDifficulty as Difficulty);
  const filteredStaticTips = WAITING_TIPS.filter(
    (t) => DIFFICULTIES.indexOf(t.minLevel as Difficulty) <= difficultyRank
  );
  const allTips = [...topicTips, ...filteredStaticTips];
  useEffect(() => {
    if (inputSpec) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % allTips.length);
    }, 10000);
    return () => clearInterval(interval);
  // allTips.length changes when topicTips load — restarting the interval is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputSpec, allTips.length]);

  // Fetch topic-aware tips once when topic becomes available
  useEffect(() => {
    if (!sessionTopic || topicTipsLoaded) return;
    setTopicTipsLoaded(true);
    fetch('/api/waiting-tips/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data: { tips?: { category: string; text: string }[] }) => {
        if (data.tips && data.tips.length > 0) {
          const mapped = data.tips.map((t) => ({
            ...t,
            color: t.category.toLowerCase().includes('vocab') ? 'teal'
              : t.category === 'Did you know?' ? 'purple'
              : t.category === 'Grammar Tip' ? 'blue'
              : 'amber',
          }));
          setTopicTips(mapped);
          setTipIndex(0); // start from first topic tip
        }
      })
      .catch(() => {}); // silent fail — static tips remain
  }, [sessionTopic, topicTipsLoaded, sessionId]);

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
        // Re-poll quickly so per-student state (e.g. found words, lives) updates without waiting the full 5s interval
        setTimeout(checkSession, 1500);
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, studentSession, inputSpec, isSubmitting, checkSession]);

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

      if (res.ok) {
        setHiddenPollIds(prev => new Set(prev).add(activePoll.pollId));
      } else {
        const data = await res.json();
        if (res.status !== 429) {
          setSelectedChoice(null);
        } else {
          console.log(`Vote rate limited, wait ${data.waitSeconds}s`);
          setHiddenPollIds(prev => new Set(prev).add(activePoll.pollId));
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
      <div className="relative glass rounded-2xl p-4 mb-4">
        <img src="/lessoncaptain-mark-on-dark.svg" alt="LessonCaptain" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 pointer-events-none" />
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
          <div className="flex items-center gap-3">
<button
              onClick={onLeave}
              className="text-gray-400 hover:text-white text-sm"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll && !hiddenPollIds.has(activePoll.pollId) && (
        <div className="glass rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-white">Poll</h2>
            <button
              onClick={() => setHiddenPollIds(prev => new Set(prev).add(activePoll.pollId))}
              className="text-gray-400 hover:text-white text-xl leading-none"
              aria-label="Dismiss poll"
            >
              ×
            </button>
          </div>
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
                displayName={studentSession.displayName}
              />
            </>
          )
        ) : (
          <div className="space-y-4">
            {/* Topic + difficulty context label */}
            {sessionTopic && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Topic</span>
                <span className="text-[10px] font-bold text-gray-300">{sessionTopic}</span>
                <span className="text-gray-700">·</span>
                <span className="text-[10px] text-gray-400">{sessionDifficulty}</span>
              </div>
            )}
            {/* English Spotlight tip card */}
            {(() => {
              const tip = allTips[tipIndex % allTips.length];
              return (
                <div
                  key={tipIndex}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  style={{ animation: 'lc-fade-in 0.5s ease-out' }}
                >
                  {/* Category badge */}
                  <span className={`inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${
                    tip.color === 'blue'   ? 'bg-blue-500/20 text-blue-300' :
                    tip.color === 'teal'   ? 'bg-teal-500/20 text-teal-300' :
                    tip.color === 'amber'  ? 'bg-amber-500/20 text-amber-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {tip.category}
                  </span>
                  <p className="text-gray-200 text-sm leading-relaxed">{tip.text}</p>
                  {/* Progress dots */}
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    {allTips.map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block rounded-full transition-all duration-300 ${
                          i === tipIndex % allTips.length ? 'w-3 h-1.5 bg-white/60' : 'w-1.5 h-1.5 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Waiting label */}
            <div className="text-center py-2">
              <p className="text-gray-500 text-xs uppercase tracking-widest">Waiting for your teacher…</p>
            </div>
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
