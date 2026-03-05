'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type TeamSolution,
  type Adaptation,
  type ProblemSolversContent,
} from './types';

// --- Seeded deterministic shuffle (mulberry32) ---
function strToSeed(s: string): number {
  let h = 0x9dc5811c;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let s = strToSeed(seed);
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const MAX_DISPLAY = 5;
const BRAINSTORM_SECONDS = 45;
const ADAPT_SECONDS = 30;
const isDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_TOOLS === 'true';

interface Highlights {
  practical: string | null;
  creative: string | null;
  bestAdaptation: string | null;
}

export function ProblemSolversActivity({
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ProblemSolversContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [solutions, setSolutions] = useState<TeamSolution[]>([]);
  const [currentComplicationIndex, setCurrentComplicationIndex] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSuccessCriteria, setShowSuccessCriteria] = useState(false);
  const [highlights, setHighlights] = useState<Highlights>({ practical: null, creative: null, bestAdaptation: null });

  const currentComplication = content.complications?.[currentComplicationIndex];

  // Inline-sync refs
  const statusRef = useRef(status);
  statusRef.current = status;
  const currentComplicationIndexRef = useRef(currentComplicationIndex);
  currentComplicationIndexRef.current = currentComplicationIndex;

  // Scoring dedup refs (allow multiple submissions but score only first per phase/complication)
  const scoredBrainstormIds = useRef<Set<string>>(new Set());
  const scoredAdaptIds = useRef<Map<number, Set<string>>>(new Map());

  // --- Timer ---
  useEffect(() => {
    if (status !== ActivityStatus.BRAINSTORMING && status !== ActivityStatus.ADAPTING) {
      setTimeLeft(null);
      return;
    }
    const seconds = status === ActivityStatus.BRAINSTORMING ? BRAINSTORM_SECONDS : ADAPT_SECONDS;
    setTimeLeft(seconds);
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev === null || prev <= 1) ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // --- Input spec ---
  useEffect(() => {
    const maxWords = content?.submissionMaxWords ?? 60;
    const startersText =
      content?.sentenceStarters?.length
        ? ` Try: "${content.sentenceStarters.join('" / "')}"`
        : '';

    if (status === ActivityStatus.BRAINSTORMING && content?.problem) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'problem-solvers',
        prompt: `Solve: "${content.problem.title}" (max ${maxWords} words)${startersText}`,
        placeholder: 'Describe your solution...',
        maxLength: maxWords * 8,
        resources: content.problem.resources,
        allowMultiple: true,
      });
    } else if (status === ActivityStatus.ADAPTING && currentComplication) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'problem-solvers',
        prompt: `Adapt to: "${currentComplication.complication}" (max ${maxWords} words)${startersText}`,
        placeholder: 'Describe your adaptation...',
        maxLength: maxWords * 8,
        resources: content.problem.resources,
        allowMultiple: true,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, content?.problem, content?.sentenceStarters, content?.submissionMaxWords, currentComplication, onSetInputSpec]);

  // --- CORE: remote vote handler (registered once, dispatches by statusRef) ---
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (statusRef.current === ActivityStatus.BRAINSTORMING) {
        setSolutions((prev) => [
          ...prev,
          {
            id: `sol-${Date.now()}-${Math.random()}`,
            description: vote.choice,
            resourcesUsed: vote.resourcesUsed ?? [],
            clientId: vote.clientId,
            studentName: vote.displayName,
            pinned: false,
          },
        ]);
        // Score only the first submission per student
        if (!scoredBrainstormIds.current.has(vote.clientId)) {
          scoredBrainstormIds.current.add(vote.clientId);
          onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: 1,
            points: 1,
            isCorrect: null,
          });
        }
      }

      if (statusRef.current === ActivityStatus.ADAPTING) {
        const complicationIdx = currentComplicationIndexRef.current;
        const promptIndex = 2 + complicationIdx;
        setAdaptations((prev) => [
          ...prev,
          {
            text: vote.choice,
            studentName: vote.displayName,
            clientId: vote.clientId,
          },
        ]);
        // Score only the first adaptation per student per complication
        const scored = scoredAdaptIds.current.get(complicationIdx) ?? new Set<string>();
        if (!scored.has(vote.clientId)) {
          scored.add(vote.clientId);
          scoredAdaptIds.current.set(complicationIdx, scored);
          onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex,
            points: 1,
            isCorrect: null,
          });
        }
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

  // --- PRESENTING: derive displayed solutions (pinned first + seeded shuffle if >MAX_DISPLAY) ---
  const { displayedSolutions, selectionMethod } = useMemo(() => {
    const pinned = solutions.filter((s) => s.pinned);
    const unpinned = solutions.filter((s) => !s.pinned);

    if (solutions.length <= MAX_DISPLAY) {
      return {
        displayedSolutions: [...pinned, ...unpinned],
        selectionMethod: `Showing all ${solutions.length}`,
      };
    }

    const seed = (content.problem?.title ?? '') + (content.topicContext ?? '');
    const shuffled = seededShuffle(unpinned, seed);
    const slots = Math.max(0, MAX_DISPLAY - pinned.length);
    return {
      displayedSolutions: [...pinned, ...shuffled.slice(0, slots)],
      selectionMethod: `Showing ${pinned.length + Math.min(slots, unpinned.length)} of ${solutions.length} (pinned + seeded shuffle)`,
    };
  }, [solutions, content.problem?.title, content.topicContext]);

  // --- Dev simulator ---
  const simulateSubmissions = useCallback(() => {
    const names = ['Alice', 'Ben', 'Cara', 'Dan', 'Eva', 'Femi', 'Gia', 'Hiro', 'Ivy'];
    const starters = content.sentenceStarters?.length
      ? content.sentenceStarters
      : ['I would use', 'My idea is', 'We could'];
    const resources = content.problem?.resources ?? ['item A', 'item B', 'item C'];

    // 9 initial submissions (one per simulated student)
    names.forEach((name, i) => {
      const clientId = `sim-${i}`;
      const resource = resources[i % resources.length];
      const starter = starters[i % starters.length];
      setSolutions((prev) => [
        ...prev,
        {
          id: `sim-${i}-a-${Date.now()}`,
          description: `${starter} the ${resource} to help.`,
          resourcesUsed: [resource],
          clientId,
          studentName: name,
          pinned: false,
        },
      ]);
      if (!scoredBrainstormIds.current.has(clientId)) {
        scoredBrainstormIds.current.add(clientId);
        onScore?.({ clientId, studentId: null, displayName: name, promptIndex: 1, points: 1, isCorrect: null });
      }
    });

    // 3 extra submissions from first 3 students (tests "score only first" dedup)
    names.slice(0, 3).forEach((name, i) => {
      const clientId = `sim-${i}`;
      const resource = resources[(i + 2) % resources.length];
      setSolutions((prev) => [
        ...prev,
        {
          id: `sim-${i}-b-${Date.now()}`,
          description: `${name}'s second idea: use ${resource} differently.`,
          resourcesUsed: [resource],
          clientId,
          studentName: name,
          pinned: false,
        },
      ]);
      // Not scored — clientId already in scoredBrainstormIds
    });
  }, [content.sentenceStarters, content.problem?.resources, onScore]);

  const resetSimulated = useCallback(() => {
    setSolutions((prev) => prev.filter((s) => !s.clientId.startsWith('sim-')));
  }, []);

  // --- Toggle pin on a solution ---
  const togglePin = useCallback((id: string) => {
    setSolutions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }, []);

  // --- Phase transitions ---
  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.PROBLEM);
    onPhaseChange?.('problem');
  }, [onPhaseChange]);

  const startBrainstorming = useCallback(() => {
    setStatus(ActivityStatus.BRAINSTORMING);
    onPhaseChange?.('brainstorming');
  }, [onPhaseChange]);

  const presentSolutions = useCallback(() => {
    setStatus(ActivityStatus.PRESENTING);
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const introduceComplication = useCallback(() => {
    setShowHints(false);
    setAdaptations([]);
    setStatus(ActivityStatus.COMPLICATION);
    onPhaseChange?.('complication');
  }, [onPhaseChange]);

  const startAdapting = useCallback(() => {
    setStatus(ActivityStatus.ADAPTING);
    onPhaseChange?.('adapting');
  }, [onPhaseChange]);

  const nextComplication = useCallback(() => {
    if (currentComplicationIndex < (content.complications?.length || 0) - 1) {
      setCurrentComplicationIndex((prev) => prev + 1);
      setShowHints(false);
      setAdaptations([]);
      setStatus(ActivityStatus.COMPLICATION);
      onPhaseChange?.('complication');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [currentComplicationIndex, content.complications?.length, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setSolutions([]);
    setCurrentComplicationIndex(0);
    setShowHints(false);
    setAdaptations([]);
    setTimeLeft(null);
    setShowSuccessCriteria(false);
    setHighlights({ practical: null, creative: null, bestAdaptation: null });
    scoredBrainstormIds.current = new Set();
    scoredAdaptIds.current = new Map();
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  // --- Timer display helper ---
  const timerColor = timeLeft !== null
    ? timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-yellow-400' : 'text-lime-400'
    : 'text-lime-400';

  if (!content.problem) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No problem available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-lime-400">Problem Solvers</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="text-sm opacity-60">
          {solutions.length} solution{solutions.length !== 1 ? 's' : ''} proposed
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Solve the Challenge!</p>
          <p className="opacity-60 text-sm mb-8">
            Brainstorm solutions with limited resources. Adapt when complications arise.
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-lime-500 to-green-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            SEE THE PROBLEM
          </button>
        </motion.div>
      )}

      {/* PROBLEM State — trimmed for projection */}
      {status === ActivityStatus.PROBLEM && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Title + description */}
          <div className="glass p-6 rounded-2xl border-2 border-lime-500/30">
            <h4 className="text-xl font-bold text-lime-400 mb-2">{content.problem.title}</h4>
            <p className="text-lg">{content.problem.description}</p>
          </div>

          {/* Resources chips */}
          <div className="glass p-4 rounded-xl">
            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Available Resources</p>
            <div className="flex flex-wrap gap-2">
              {content.problem.resources.map((resource, i) => (
                <span key={i} className="px-3 py-1 bg-lime-500/20 text-lime-300 rounded-lg text-sm">
                  {resource}
                </span>
              ))}
            </div>
          </div>

          {/* Constraints (max 3 shown, always visible) */}
          {content.constraints && content.constraints.length > 0 && (
            <div className="glass p-4 rounded-xl border border-yellow-500/30">
              <p className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Constraints</p>
              <ul className="text-sm space-y-1 opacity-80">
                {content.constraints.slice(0, 3).map((constraint, i) => (
                  <li key={i}>• {constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success criteria — collapsed by default */}
          <div>
            <button
              onClick={() => setShowSuccessCriteria((v) => !v)}
              className="text-xs opacity-50 hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <span>{showSuccessCriteria ? '▼' : '▶'}</span>
              Success criteria
            </button>
            <AnimatePresence>
              {showSuccessCriteria && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 glass p-4 rounded-xl"
                >
                  <ul className="text-sm space-y-1">
                    {content.problem.successCriteria.map((criterion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-lime-400">✓</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startBrainstorming}
              className="px-8 py-4 bg-gradient-to-r from-lime-500 to-green-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START BRAINSTORMING
            </button>
          </div>
        </motion.div>
      )}

      {/* BRAINSTORMING State */}
      {status === ActivityStatus.BRAINSTORMING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Problem + timer row */}
          <div className="flex items-center gap-3">
            <div className="glass p-3 rounded-xl flex-1">
              <p className="font-semibold text-sm">{content.problem.title}</p>
            </div>
            {timeLeft !== null && (
              <div className="glass p-3 rounded-xl text-center min-w-[4rem]">
                <p className={`text-2xl font-game ${timerColor}`}>{timeLeft}</p>
                <p className="text-xs opacity-40">sec</p>
              </div>
            )}
          </div>

          {/* Sentence starters preview */}
          {(content.sentenceStarters?.length ?? 0) > 0 && (
            <div className="glass p-3 rounded-xl border border-lime-500/20">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Sentence starters (shown on devices)</p>
              <div className="flex flex-wrap gap-2">
                {content.sentenceStarters.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-lime-500/10 text-lime-300 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Live counter */}
          <div className="text-center">
            <p className="text-4xl font-game text-lime-400">{solutions.length}</p>
            <p className="text-sm opacity-50">solution{solutions.length !== 1 ? 's' : ''} received</p>
          </div>

          {/* Live solution cards */}
          {solutions.length > 0 ? (
            <div className="space-y-2">
              {solutions.map((solution, i) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass p-3 rounded-xl border ${solution.pinned ? 'border-amber-400/60' : 'border-lime-500/30'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-lime-400/70 font-semibold mb-0.5">{solution.studentName}</p>
                      <p className="text-sm">{solution.description}</p>
                      {solution.resourcesUsed.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {solution.resourcesUsed.map((r, j) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 bg-lime-500/10 text-lime-400 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => togglePin(solution.id)}
                      title={solution.pinned ? 'Unpin' : 'Pin to top'}
                      className={`shrink-0 text-lg transition-all ${solution.pinned ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}
                    >
                      ★
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-40 text-sm">Waiting for student submissions...</p>
          )}

          {/* Dev simulator */}
          {isDev && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={simulateSubmissions}
                className="text-xs px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all border border-purple-500/30"
              >
                [DEV] Simulate 9 students
              </button>
              {solutions.some((s) => s.clientId.startsWith('sim-')) && (
                <button
                  onClick={resetSimulated}
                  className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
                >
                  Reset simulated
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {timeLeft === 0 && (
              <p className="text-xs text-lime-400 self-center">Time&apos;s up! Teacher controls when to continue.</p>
            )}
            <button
              onClick={presentSolutions}
              disabled={solutions.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-lime-500 to-green-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              PRESENT SOLUTIONS
            </button>
          </div>
        </motion.div>
      )}

      {/* PRESENTING State */}
      {status === ActivityStatus.PRESENTING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm uppercase tracking-widest opacity-50">Team Solutions</p>
            <p className="text-xs opacity-40">{selectionMethod}</p>
          </div>

          <div className="space-y-3">
            {displayedSolutions.map((solution, i) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass p-4 rounded-xl border-2 ${solution.pinned ? 'border-amber-400/60' : 'border-lime-500/30'}`}
              >
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-lime-400/70 font-semibold mb-1">
                      {solution.studentName}
                      {solution.pinned && <span className="ml-1 text-amber-400">★</span>}
                    </p>
                    <p className="text-lg">{solution.description}</p>
                    {solution.resourcesUsed.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <span className="text-xs opacity-40">Using:</span>
                        {solution.resourcesUsed.map((r, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 bg-lime-500/20 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(solution.id)}
                    title={solution.pinned ? 'Unpin' : 'Pin to top'}
                    className={`shrink-0 text-xl transition-all ${solution.pinned ? 'text-amber-400' : 'opacity-20 hover:opacity-60'}`}
                  >
                    ★
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center">
            {content.complications && content.complications.length > 0 ? (
              <button
                onClick={introduceComplication}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                INTRODUCE COMPLICATION
              </button>
            ) : (
              <button
                onClick={() => { setStatus(ActivityStatus.FINISHED); onPhaseChange?.('finished'); }}
                className="px-8 py-4 bg-gradient-to-r from-lime-500 to-green-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                FINISH
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* COMPLICATION State */}
      {status === ActivityStatus.COMPLICATION && currentComplication && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest text-orange-400 mb-2">
              Complication #{currentComplicationIndex + 1}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border-2 border-orange-500/30"
          >
            <p className="text-xs opacity-50 mb-1">{currentComplication.trigger}</p>
            <p className="text-xl font-semibold text-orange-400">
              {currentComplication.complication}
            </p>
          </motion.div>

          <AnimatePresence>
            {showHints && currentComplication.hints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass p-4 rounded-xl border border-yellow-500/30"
              >
                <p className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Hints</p>
                <ul className="text-sm space-y-1 opacity-80">
                  {currentComplication.hints.map((hint, i) => (
                    <li key={i}>• {hint}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 justify-center">
            {!showHints && currentComplication.hints.length > 0 && (
              <button
                onClick={() => setShowHints(true)}
                className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-yellow-500/30 text-yellow-400"
              >
                SHOW HINTS
              </button>
            )}
            <button
              onClick={startAdapting}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              ADAPT SOLUTIONS
            </button>
          </div>
        </motion.div>
      )}

      {/* ADAPTING State */}
      {status === ActivityStatus.ADAPTING && currentComplication && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Complication reminder + timer */}
          <div className="flex items-center gap-3">
            <div className="glass p-3 rounded-xl border border-orange-500/30 flex-1">
              <p className="text-sm text-orange-400">{currentComplication.complication}</p>
            </div>
            {timeLeft !== null && (
              <div className="glass p-3 rounded-xl text-center min-w-[4rem]">
                <p className={`text-2xl font-game ${timerColor}`}>{timeLeft}</p>
                <p className="text-xs opacity-40">sec</p>
              </div>
            )}
          </div>

          {/* Live counter */}
          <div className="text-center">
            <p className="text-4xl font-game text-lime-400">{adaptations.length}</p>
            <p className="text-sm opacity-50">adaptation{adaptations.length !== 1 ? 's' : ''} received</p>
          </div>

          {/* Live adaptation cards */}
          {adaptations.length > 0 ? (
            <div className="space-y-2">
              {adaptations.map((adaptation, i) => (
                <motion.div
                  key={`${adaptation.clientId}-${i}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-3 rounded-xl border border-orange-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs text-orange-400/70 font-semibold mb-0.5">{adaptation.studentName}</p>
                      <p className="text-sm">{adaptation.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-40 text-sm">Waiting for student adaptations...</p>
          )}

          <div className="flex justify-center">
            <button
              onClick={nextComplication}
              disabled={adaptations.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-lime-500 to-green-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              {currentComplicationIndex < (content.complications?.length || 0) - 1
                ? 'NEXT COMPLICATION'
                : 'FINISH'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 py-4"
        >
          <p className="text-2xl font-game text-lime-400 text-center">Problem Solved!</p>

          <div className="glass p-4 rounded-xl text-center">
            <p className="text-4xl font-game mb-1">
              {solutions.length}
              <span className="text-lg opacity-50 ml-2">solutions</span>
            </p>
            <p className="text-sm opacity-70">
              Adapted through {currentComplicationIndex + 1} complication{currentComplicationIndex !== 0 ? 's' : ''}
            </p>
          </div>

          {/* Highlights — teacher picks */}
          <div className="glass p-4 rounded-xl space-y-4 border border-lime-500/20">
            <p className="text-xs uppercase tracking-widest text-lime-400 mb-2">Highlights (teacher picks)</p>

            {[
              { label: 'Most Practical', key: 'practical' as const, pool: solutions.map((s) => s.description) },
              { label: 'Most Creative', key: 'creative' as const, pool: solutions.map((s) => s.description) },
              { label: 'Best Adaptation', key: 'bestAdaptation' as const, pool: adaptations.map((a) => a.text) },
            ].map(({ label, key, pool }) => (
              <div key={key}>
                <p className="text-xs opacity-50 mb-1">{label}</p>
                {pool.length > 0 ? (
                  <select
                    value={highlights[key] ?? ''}
                    onChange={(e) => setHighlights((prev) => ({ ...prev, [key]: e.target.value || null }))}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">— skip —</option>
                    {pool.map((text, i) => (
                      <option key={i} value={text}>{text.slice(0, 80)}{text.length > 80 ? '…' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs opacity-30 italic">No submissions yet</p>
                )}
                {highlights[key] && (
                  <p className="mt-1 text-xs text-lime-400 font-medium">Selected: &ldquo;{highlights[key]}&rdquo;</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={restartActivity}
              className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
            >
              SOLVE ANOTHER
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
