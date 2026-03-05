'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type TeamSolution,
  type Adaptation,
  type ProblemSolversContent,
} from './types';

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

  const currentComplication = content.complications?.[currentComplicationIndex];

  // Inline-sync refs so handler closures always read current values
  const statusRef = useRef(status);
  statusRef.current = status;
  const currentComplicationIndexRef = useRef(currentComplicationIndex);
  currentComplicationIndexRef.current = currentComplicationIndex;

  // Register input spec for student controller
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
      });
    } else if (status === ActivityStatus.ADAPTING && currentComplication) {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'problem-solvers',
        prompt: `How will you adapt to: "${currentComplication.complication}" (max ${maxWords} words)${startersText}`,
        placeholder: 'Describe your adaptation...',
        maxLength: maxWords * 8,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, content?.problem, content?.sentenceStarters, content?.submissionMaxWords, currentComplication, onSetInputSpec]);

  // CORE FIX: register remote vote handler once; dispatch by statusRef
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (statusRef.current === ActivityStatus.BRAINSTORMING) {
        setSolutions((prev) => {
          if (prev.some((s) => s.clientId === vote.clientId)) return prev;
          return [
            ...prev,
            {
              id: `sol-${Date.now()}-${Math.random()}`,
              description: vote.choice,
              resourcesUsed: [],
              clientId: vote.clientId,
              studentName: vote.displayName,
            },
          ];
        });
        onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: 1,
          points: 1,
          isCorrect: null,
        });
      }

      if (statusRef.current === ActivityStatus.ADAPTING) {
        const promptIndex = 2 + currentComplicationIndexRef.current;
        setAdaptations((prev) => {
          if (prev.some((a) => a.clientId === vote.clientId)) return prev;
          return [
            ...prev,
            {
              text: vote.choice,
              studentName: vote.displayName,
              clientId: vote.clientId,
            },
          ];
        });
        onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex,
          points: 1,
          isCorrect: null,
        });
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore]);

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
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

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

      {/* PROBLEM State */}
      {status === ActivityStatus.PROBLEM && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-lime-500/30">
            <h4 className="text-xl font-bold text-lime-400 mb-2">{content.problem.title}</h4>
            <p className="text-lg">{content.problem.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Success Criteria</p>
              <ul className="text-sm space-y-1">
                {content.problem.successCriteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-lime-400">✓</span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {content.constraints && content.constraints.length > 0 && (
            <div className="glass p-4 rounded-xl border border-yellow-500/30">
              <p className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Constraints</p>
              <ul className="text-sm space-y-1 opacity-80">
                {content.constraints.map((constraint, i) => (
                  <li key={i}>• {constraint}</li>
                ))}
              </ul>
            </div>
          )}

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
          className="space-y-6"
        >
          {/* Problem reminder */}
          <div className="glass p-4 rounded-xl">
            <p className="font-semibold">{content.problem.title}</p>
          </div>

          {/* Sentence starters — shown on student devices, previewed here */}
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
                  className="glass p-3 rounded-xl border border-lime-500/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs text-lime-400/70 font-semibold mb-0.5">{solution.studentName}</p>
                      <p>{solution.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-40 text-sm">Waiting for student submissions...</p>
          )}

          <div className="flex justify-center">
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
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Team Solutions
            </p>
          </div>

          <div className="space-y-3">
            {solutions.map((solution, i) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="glass p-4 rounded-xl border-2 border-lime-500/30"
              >
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs text-lime-400/70 font-semibold mb-1">{solution.studentName}</p>
                    <p className="text-lg">{solution.description}</p>
                  </div>
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
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl border border-orange-500/30">
            <p className="text-sm text-orange-400">{currentComplication.complication}</p>
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
                  key={adaptation.clientId}
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
                      <p>{adaptation.text}</p>
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
          className="text-center py-8 space-y-6"
        >
          <p className="text-2xl font-game text-lime-400 mb-4">Problem Solved!</p>

          <div className="glass p-4 rounded-xl">
            <p className="text-4xl font-game mb-2">
              {solutions.length}
              <span className="text-lg opacity-50 ml-2">solutions</span>
            </p>
            <p className="text-sm opacity-70">
              Adapted through {currentComplicationIndex + 1} complication{currentComplicationIndex !== 0 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            SOLVE ANOTHER
          </button>
        </motion.div>
      )}
    </div>
  );
}
