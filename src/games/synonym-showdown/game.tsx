'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus } from './types';
import type { Challenge, SynonymValidation } from './types';
import { useSessionStore, getEffectiveTopic, getDisplayTopic } from '@/stores/session-store';
import { useSyncedTimer } from '@/hooks/use-synced-timer';
import { GenerationLoader } from '@/components/ui/generation-loader';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { ArrowRight, Clock, Mic, RefreshCw, Star } from 'lucide-react';
import type { SynonymMine, SynonymRoom } from '@/components/student/synonym-panel';

const UNIQUE_BONUS = 2;
interface Entry { clientId: string; studentId: string; name: string; word: string; status: 'checking' | 'ok' | 'bad'; score: number; quality: string; feedback: string }

const EMPTY_SEEN: string[] = [];

interface RemoteSynonym {
  clientId: string;
  displayName: string;
  word: string;
  score: number;
  quality: string;
  isValid: boolean;
}

export function SynonymShowdownGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler, prefsMap, isMicroEvent }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [submittedSynonyms, setSubmittedSynonyms] = useState<string[]>([]);
  const [validSynonyms, setValidSynonyms] = useState<Array<{ word: string; score: number; quality: string }>>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remote player submissions (simultaneous mode)
  const isSimultaneous = students.length >= 2;
  const [remoteSynonyms, setRemoteSynonyms] = useState<RemoteSynonym[]>([]);
  // Race mode: every student's own words (duplicates across students are fine).
  const [entries, setEntries] = useState<Entry[]>([]);
  const entriesRef = useRef<Entry[]>([]);
  entriesRef.current = entries;
  // Each distinct word is checked once, however many students type it.
  const evalCacheRef = useRef<Map<string, Promise<SynonymValidation>>>(new Map());
  const [speaker, setSpeaker] = useState<{ name: string; word: string } | null>(null);
  const bonusGivenRef = useRef(false);

  const currentStudent = students.find((s) => s.id === currentStudentId);

  // Repetition tracking — read from store but keep refs to avoid stale closures in callbacks
  const addSeenItems = useSessionStore((s) => s.addSeenItems);
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const storeSeenItems = useSessionStore((s) => s.seenItemsByGame['synonym-showdown']) ?? EMPTY_SEEN;
  const storeSeenCacheIds = useSessionStore((s) => s.seenCacheIds);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const seenItemsRef = useRef<string[]>([]);
  const seenCacheIdsRef = useRef<string[]>([]);
  const accumulatedValidSynonymsRef = useRef<string[]>([]);
  useEffect(() => { seenItemsRef.current = storeSeenItems; }, [storeSeenItems]);
  useEffect(() => { seenCacheIdsRef.current = storeSeenCacheIds; }, [storeSeenCacheIds]);

  // Keep refs for handlers
  const challengeRef = useRef<Challenge | null>(null);
  challengeRef.current = challenge;
  const submittedSynonymsRef = useRef<string[]>([]);
  submittedSynonymsRef.current = submittedSynonyms;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const difficultyRef = useRef(sessionSettings.difficulty);
  const isSimultaneousRef = useRef(isSimultaneous);
  isSimultaneousRef.current = isSimultaneous;
  const challengeStartedAtRef = useRef(0);
  difficultyRef.current = sessionSettings.difficulty;

  // Register input spec for student controller
  useEffect(() => {
    if (status === GameStatus.PLAYING && challenge && isSimultaneous) {
      if (!challengeStartedAtRef.current) challengeStartedAtRef.current = Date.now();
      const data: Record<string, unknown> = { __room: { target: challenge.targetWord, sentence: challenge.contextSentence } satisfies SynonymRoom };
      entries.forEach((e) => {
        const mine = (data[e.clientId] as SynonymMine | undefined) ?? { words: [] };
        mine.words.push({ w: e.word, status: e.status, pts: e.score, feedback: e.feedback });
        data[e.clientId] = mine;
      });
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'synonym-showdown',
        prompt: `Find synonyms for: "${challenge.targetWord}"`,
        allowMultiple: true,
        stableInput: true,
        perStudentData: data,
        timerSeconds: sessionSettings.timerSeconds,
        startedAt: challengeStartedAtRef.current,
      });
    } else if (status === GameStatus.PLAYING && challenge) {
      if (!challengeStartedAtRef.current) challengeStartedAtRef.current = Date.now();
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'synonym-showdown',
        prompt: `Find synonyms for: "${challenge.targetWord}"`,
        placeholder: 'Type a synonym...',
        maxLength: 50,
        timerSeconds: sessionSettings.timerSeconds,
        startedAt: challengeStartedAtRef.current,
      });
    } else {
      challengeStartedAtRef.current = 0;
      onSetInputSpec?.(null);
    }
  }, [status, challenge, entries, isSimultaneous, onSetInputSpec, sessionSettings.timerSeconds]);

  // Register remote vote handler for direct real-time submissions
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
      if (statusRef.current !== GameStatus.PLAYING) return;

      const ch = challengeRef.current;
      if (!ch) return;

      const synonym = vote.choice?.trim().toLowerCase();
      if (!synonym) return;

      if (isSimultaneousRef.current) {
        // Per-student dedupe only: several students may find the same word.
        if (entriesRef.current.some((e) => e.clientId === vote.clientId && e.word === synonym)) return;
        const sid = vote.studentId || vote.clientId;
        setEntries((prev) => [...prev, { clientId: vote.clientId, studentId: sid, name: vote.displayName, word: synonym, status: 'checking', score: 0, quality: 'basic', feedback: '' }]);
        let check = evalCacheRef.current.get(synonym);
        if (!check) {
          check = fetch('/api/synonym-showdown/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetWord: ch.targetWord, contextSentence: ch.contextSentence, synonym, difficulty: difficultyRef.current }),
          }).then((r) => r.json() as Promise<SynonymValidation>);
          evalCacheRef.current.set(synonym, check);
          check.catch(() => evalCacheRef.current.delete(synonym));
        }
        check.then((result) => {
          setEntries((prev) => prev.map((e) => (e.clientId === vote.clientId && e.word === synonym ? { ...e, status: result.isValid ? 'ok' : 'bad', score: result.isValid ? result.score : 0, quality: result.quality, feedback: result.feedback } : e)));
          onScore(sid, { isCorrect: result.isValid, points: result.isValid ? result.score : 0, responseData: { clientId: vote.clientId, synonym, quality: result.quality } });
        }).catch(() => {
          setEntries((prev) => prev.filter((e) => !(e.clientId === vote.clientId && e.word === synonym)));
        });
        return;
      }

      // Check duplicates
      if (submittedSynonymsRef.current.includes(synonym)) return;

      const studentId = vote.studentId || vote.clientId;
      if (!studentId) return;

      // Add to submitted list
      setSubmittedSynonyms(prev => [...prev, synonym]);

      // Evaluate asynchronously
      fetch('/api/synonym-showdown/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: ch.targetWord,
          contextSentence: ch.contextSentence,
          synonym,
          difficulty: difficultyRef.current,
        }),
      })
        .then(res => res.json())
        .then((result: SynonymValidation) => {
          if (result.isValid) {
            setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
            setTotalScore(prev => prev + result.score);
          }

          // Score the remote student
          onScore(studentId, {
            isCorrect: result.isValid,
            points: result.score,
            responseData: { clientId: vote.clientId, synonym, quality: result.quality },
          });

          // Track remote submission for display
          setRemoteSynonyms(prev => [...prev, {
            clientId: vote.clientId,
            displayName: vote.displayName,
            word: synonym,
            score: result.score,
            quality: result.quality,
            isValid: result.isValid,
          }]);
        })
        .catch(() => {});
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Register submission handler (fallback for approval-based flow)
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      autoApprove: true,
      handleSubmission: async (content: string) => {
        const ch = challengeRef.current;
        if (!ch) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        const synonym = content.trim().toLowerCase();
        if (submittedSynonymsRef.current.includes(synonym)) {
          return { isCorrect: false, points: 0, feedback: 'Already submitted!' };
        }

        try {
          const response = await fetch('/api/synonym-showdown/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetWord: ch.targetWord,
              contextSentence: ch.contextSentence,
              synonym,
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: SynonymValidation = await response.json();

          setSubmittedSynonyms(prev => [...prev, synonym]);
          if (result.isValid) {
            setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
          }

          return {
            isCorrect: result.isValid,
            points: result.score,
            feedback: result.feedback,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [sessionSettings.difficulty, onRegisterSubmissionHandler]);

  const finishGame = useCallback(() => {
    if (!isSimultaneous && !currentStudentId) return;

    setStatus(GameStatus.FINISHED);

    // Race: words only one student found earn a bonus (rewards rarer vocabulary).
    if (isSimultaneous && !bonusGivenRef.current) {
      bonusGivenRef.current = true;
      const ok = entriesRef.current.filter((e) => e.status === 'ok');
      ok.forEach((e) => {
        if (ok.filter((x) => x.word === e.word).length === 1) {
          onScore(e.studentId, { isCorrect: true, points: UNIQUE_BONUS, responseData: { clientId: e.clientId, bonus: 'unique', synonym: e.word } });
        }
      });
    }

    // Only score the current student in turn-based mode
    if (!isSimultaneous && currentStudentId) {
      const avgScore = validSynonyms.length > 0
        ? Math.round(validSynonyms.reduce((sum, s) => sum + s.score, 0) / validSynonyms.length)
        : 0;

      onScore(currentStudentId, {
        isCorrect: validSynonyms.length >= 3,
        points: Math.min(10, Math.round(totalScore / 10)),
        responseData: {
          targetWord: challenge?.targetWord,
          validSynonyms: validSynonyms.map(s => s.word),
          totalSynonyms: validSynonyms.length,
          averageQuality: avgScore,
          totalScore
        }
      });
    }
  }, [isSimultaneous, currentStudentId, validSynonyms, totalScore, challenge, onScore]);

  // Countdown synced to the server-stamped round clock so the teacher screen matches
  // student devices within a tick. Ends the round when the shared deadline is reached.
  const { timeLeft: timeRemaining } = useSyncedTimer(sessionSettings.timerSeconds, status === GameStatus.PLAYING);
  const timeExpired = status === GameStatus.PLAYING && timeRemaining <= 0;
  useEffect(() => {
    if (timeExpired) finishGame();
  }, [timeExpired, finishGame]);

  const handleGenerate = async () => {
    if (!isSimultaneous && !currentStudentId) {
      onPickStudent();
      return;
    }

    // Accumulate valid synonyms from this round before resetting, so the next word avoids this cluster
    if (validSynonyms.length > 0) {
      accumulatedValidSynonymsRef.current = [
        ...accumulatedValidSynonymsRef.current,
        ...validSynonyms.map(v => v.word),
      ];
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setSubmittedSynonyms([]);
    setValidSynonyms([]);
    setCurrentStreak(0);
    setTotalScore(0);
    setLastFeedback(null);
    setCurrentInput('');
    setRemoteSynonyms([]);
    setEntries([]);
    setSpeaker(null);
    evalCacheRef.current = new Map();
    bonusGivenRef.current = false;

    try {
      const response = await fetch('/api/synonym-showdown/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: getEffectiveTopic(sessionSettings),
          difficulty: sessionSettings.difficulty,
          seenItems: seenItemsRef.current,
          excludeCacheIds: seenCacheIdsRef.current,
          seenSynonyms: accumulatedValidSynonymsRef.current,
          ...(sourceMaterial ? { sourceMaterial } : {}),
        }),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Failed to generate challenge');

      const data = await response.json();

      // Track what we've seen to avoid repetition
      if (data.targetWord) addSeenItems('synonym-showdown', [data.targetWord]);
      if (data.cacheId) addSeenCacheId(data.cacheId);

      setChallenge(data);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to generate challenge. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSubmitSynonym = async () => {
    if (!currentInput.trim() || !challenge || isEvaluating || status !== GameStatus.PLAYING) return;

    const synonym = currentInput.trim().toLowerCase();

    if (submittedSynonyms.includes(synonym)) {
      setLastFeedback('Already submitted!');
      setCurrentInput('');
      return;
    }

    setIsEvaluating(true);
    setSubmittedSynonyms(prev => [...prev, synonym]);
    setCurrentInput('');

    try {
      const response = await fetch('/api/synonym-showdown/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: challenge.targetWord,
          contextSentence: challenge.contextSentence,
          synonym,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: SynonymValidation = await response.json();
      setLastFeedback(result.feedback);

      if (result.isValid) {
        setValidSynonyms(prev => [...prev, { word: synonym, score: result.score, quality: result.quality }]);
        setCurrentStreak(prev => prev + 1);
        setTotalScore(prev => prev + result.score);
      } else {
        setCurrentStreak(0);
      }
    } catch (err) {
      console.error(err);
      setLastFeedback('Error evaluating. Try again!');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitSynonym();
    }
  };

  const handleSameChallenge = () => {
    setSubmittedSynonyms([]);
    setValidSynonyms([]);
    setCurrentStreak(0);
    setTotalScore(0);
    setLastFeedback(null);
    setCurrentInput('');
    setRemoteSynonyms([]);
    setEntries([]);
    setSpeaker(null);
    bonusGivenRef.current = false;
    setStatus(GameStatus.PLAYING);
    if (!isSimultaneous) onPickStudent();
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'from-yellow-400 to-amber-500';
      case 'good': return 'from-emerald-400 to-emerald-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  // ============ RACE (2+ students) ============
  if (isSimultaneous && (status === GameStatus.PLAYING || status === GameStatus.FINISHED) && challenge) {
    const ok = entries.filter((e) => e.status === 'ok');
    const byWord = new Map<string, { word: string; finders: string[]; score: number; quality: string }>();
    ok.forEach((e) => {
      const w = byWord.get(e.word) ?? { word: e.word, finders: [], score: e.score, quality: e.quality };
      w.finders.push(e.name);
      byWord.set(e.word, w);
    });
    const wall = Array.from(byWord.values()).sort((a, b) => b.score - a.score || a.finders.length - b.finders.length);
    const perStudent = students.map((st) => ({ name: st.name, n: new Set(ok.filter((e) => e.name === st.name).map((e) => e.word)).size }));
    const total = sessionSettings.timerSeconds || 1;
    const highlight = (sentence: string, word: string) => {
      const i = sentence.toLowerCase().indexOf(word.toLowerCase());
      if (i < 0) return <>{sentence}</>;
      return <>{sentence.slice(0, i)}<span className="rounded-md bg-amber-300/15 px-1 text-amber-200 underline decoration-amber-300 underline-offset-4">{sentence.slice(i, i + word.length)}</span>{sentence.slice(i + word.length)}</>;
    };
    const pickSpeaker = () => {
      const best = wall.filter((w) => w.quality === 'excellent' || w.finders.length === 1);
      const pool = best.length ? best : wall;
      const w = pool[Math.floor(Math.random() * pool.length)];
      if (w) setSpeaker({ name: w.finders[Math.floor(Math.random() * w.finders.length)], word: w.word });
    };
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="cyan">Synonym Showdown · {getDisplayTopic(sessionSettings, sourceMaterial)}</KitLabel>
          {status === GameStatus.PLAYING && <KitButton onClick={handleGenerate} icon={<RefreshCw className="h-3.5 w-3.5" />}>Skip word</KitButton>}
        </div>
        <div className="rounded-[1.75rem] border border-white/12 bg-slate-950/45 px-6 py-7 text-center">
          <KitLabel>Other words for</KitLabel>
          <p className="mt-1 font-display text-6xl">{challenge.targetWord}</p>
          <p className="mt-3 text-xl italic text-white/75">&ldquo;{highlight(challenge.contextSentence, challenge.targetWord)}&rdquo;</p>
          {status === GameStatus.PLAYING && challenge.hint && <p className="mt-2 text-sm text-white/45">Hint: {challenge.hint}</p>}
        </div>

        {status === GameStatus.PLAYING ? (
          <>
            <div className="flex items-center gap-4">
              <Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className={`h-full ${timeRemaining <= 10 ? 'bg-rose-400' : 'bg-cyan-400'}`} animate={{ width: `${Math.max(0, Math.min(100, (timeRemaining / total) * 100))}%` }} transition={{ ease: 'linear', duration: 1 }} /></div>
              <span className={`w-14 text-right font-mono text-2xl ${timeRemaining <= 10 ? 'text-rose-300' : ''}`}>{timeRemaining}s</span>
            </div>
            {/* Counts only while racing (the wall appears at the end) */}
            <div className="flex flex-wrap gap-2">
              {perStudent.map((p) => <span key={p.name} className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-sm">{p.name} <span className="font-mono text-xs text-cyan-300">{p.n}</span></span>)}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl">{byWord.size}<span className="text-lg text-white/50"> different words so far</span></p>
              <KitButton onClick={finishGame}>End round</KitButton>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <KitLabel tone="emerald">The class found</KitLabel>
              <p className="font-display text-5xl">{byWord.size} word{byWord.size === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {wall.map((w, i) => (
                <motion.span key={w.word} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.04 }} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-display ${w.quality === 'excellent' ? 'border-amber-300/50 bg-amber-300/10 text-3xl text-amber-50' : w.quality === 'good' ? 'border-emerald-300/40 bg-emerald-400/10 text-2xl' : 'border-white/12 bg-white/[0.04] text-xl'}`} title={w.finders.join(', ')}>
                  {w.finders.length === 1 && <Star className="h-4 w-4 fill-amber-300 text-amber-300" />}{w.word}
                  <span className="font-mono text-xs text-white/50">{w.finders.length === 1 ? w.finders[0] : `×${w.finders.length}`}</span>
                </motion.span>
              ))}
              {wall.length === 0 && <p className="text-white/55">No synonyms this time. What could we have said?</p>}
            </div>
            {wall.some((w) => w.finders.length === 1) && <p className="text-center text-sm text-white/55"><Star className="mr-1 inline h-3.5 w-3.5 fill-amber-300 text-amber-300" />Only one person found it: +{UNIQUE_BONUS} bonus</p>}
            {speaker && (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
                <p className="font-display text-3xl">{speaker.name}</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-lg text-amber-100"><Mic className="h-5 w-5" />Say a sentence with &ldquo;{speaker.word}&rdquo;</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <KitButton tone="amber" disabled={wall.length === 0} onClick={pickSpeaker} icon={<Mic className="h-3.5 w-3.5" />}>{speaker ? 'Someone else' : 'Use it in a sentence'}</KitButton>
              {isMicroEvent ? <KitReadout>Round complete · advance the flight to continue</KitReadout> : (
                <>
                  <KitButton onClick={handleSameChallenge}>Same word again</KitButton>
                  <KitButton tone="cyan" solid onClick={handleGenerate} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>New word</KitButton>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {isSimultaneous ? (
            <p className="text-lg font-semibold text-cyan-400">
              Everyone plays! ({students.length} students)
            </p>
          ) : currentStudent ? (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          ) : (
            <p className="opacity-70 text-sm">Pick a student to start</p>
          )}
        </div>
        <div className="text-xs opacity-40">
          {sessionSettings.difficulty} / {getDisplayTopic(sessionSettings, sourceMaterial)}
        </div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">How to Play</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {isSimultaneous
                ? 'All students type synonyms on their devices before time runs out! Each valid synonym earns points.'
                : 'List as many synonyms as you can before time runs out! Each valid synonym earns points.'
              }
            </p>
          </div>

          {!isSimultaneous && !currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START GAME
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-12"
        >
          <GenerationLoader label="challenge" />
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* PLAYING State */}
      {status === GameStatus.PLAYING && challenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Timer & Score Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl font-game text-2xl ${timeRemaining <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                {timeRemaining}s
              </div>
              {!isSimultaneous && currentStreak > 1 && (
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">
                  {currentStreak}x Streak!
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase">
                {isSimultaneous ? 'Submissions' : 'Score'}
              </p>
              <p className="text-2xl font-bold text-white">
                {isSimultaneous ? remoteSynonyms.length : totalScore}
              </p>
            </div>
          </div>

          {/* Challenge Card */}
          <div className="glass p-6 rounded-2xl border-2 border-orange-500/30">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Find synonyms for:</p>
              <button
                onClick={handleGenerate}
                disabled={isEvaluating}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <h2 className="text-4xl font-black text-white mb-4">{challenge.targetWord}</h2>
            <p className="text-slate-400 italic mb-2">&quot;{challenge.contextSentence}&quot;</p>
            <p className="text-xs text-slate-500">Hint: {challenge.hint}</p>
          </div>

          {/* Teacher input (still available for teacher to type on behalf of in-person students) */}
          {!isSimultaneous && (
            <div className="flex gap-3">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a synonym..."
                disabled={isEvaluating}
                autoFocus
                className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-lg disabled:opacity-50"
              />
              <button
                onClick={handleSubmitSynonym}
                disabled={!currentInput.trim() || isEvaluating}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white disabled:opacity-30"
              >
                {isEvaluating ? '...' : 'GO'}
              </button>
            </div>
          )}

          {/* Feedback (turn-based) */}
          {!isSimultaneous && lastFeedback && (
            <motion.p
              key={lastFeedback}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-slate-300"
            >
              {lastFeedback}
            </motion.p>
          )}

          {/* Remote submissions feed — sealed during play to prevent copying */}
          {isSimultaneous && remoteSynonyms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {remoteSynonyms.length} of {students.length} submitted
              </p>
              <AnimatePresence>
                {Array.from(new Map(remoteSynonyms.map(s => [s.displayName, s])).values()).map((syn, i) => (
                  <motion.div
                    key={`${syn.displayName}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {prefsMap?.get(syn.clientId)?.score_visible === false ? 'Anonymous pilot' : syn.displayName}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {isSimultaneous && remoteSynonyms.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">Waiting for students to submit synonyms on their devices...</p>
            </div>
          )}

          {/* Valid Synonyms (turn-based) */}
          {!isSimultaneous && validSynonyms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {validSynonyms.map((syn, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                >
                  {syn.word} +{syn.score}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === GameStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Time&apos;s Up!</h3>
            {isSimultaneous ? (
              <>
                <p className="text-4xl font-black text-emerald-400 mb-4">{remoteSynonyms.filter(s => s.isValid).length}</p>
                <p className="text-slate-400">
                  valid synonyms found by the class
                </p>
              </>
            ) : (
              <>
                <p className="text-6xl font-black text-emerald-400 mb-4">{totalScore}</p>
                <p className="text-slate-400">
                  {validSynonyms.length} valid synonym{validSynonyms.length !== 1 ? 's' : ''} found
                </p>
              </>
            )}

            {/* Show all valid synonyms */}
            {(isSimultaneous ? remoteSynonyms.filter(s => s.isValid) : validSynonyms).length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {isSimultaneous
                  ? remoteSynonyms.filter(s => s.isValid).map((syn, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                      >
                        {syn.word} +{syn.score}
                      </span>
                    ))
                  : validSynonyms.map((syn, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getQualityColor(syn.quality)}`}
                      >
                        {syn.word} +{syn.score}
                      </span>
                    ))
                }
              </div>
            )}
            {(isSimultaneous ? remoteSynonyms.filter(s => s.isValid) : validSynonyms).length > 0 && (
              <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" /> excellent</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" /> good</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-slate-400 to-slate-500" /> basic</span>
              </div>
            )}
          </div>

          {isMicroEvent ? (
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-sm text-emerald-400 font-bold">Round complete</p>
              <p className="text-xs opacity-50 mt-1">Advance the flight to continue.</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
              >
                NEW WORD
              </button>
              <button
                onClick={handleSameChallenge}
                className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
              >
                {isSimultaneous ? 'SAME WORD, AGAIN' : 'SAME WORD, NEW STUDENT'}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
