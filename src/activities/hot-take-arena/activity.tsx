'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type Side,
  type SideSelection,
  type Argument,
  type DevilsAdvocateChallenge,
  type HotTakeArenaContent,
} from './types';

export function HotTakeArenaActivity({
  students,
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: ActivityProps) {
  const content = generatedContent as HotTakeArenaContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [sideSelections, setSideSelections] = useState<SideSelection[]>([]);
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<DevilsAdvocateChallenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState({ pro: 0, con: 0 });
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [newArgumentText, setNewArgumentText] = useState('');
  const [selectedStudentForArg, setSelectedStudentForArg] = useState<string | null>(null);

  // Register input spec for student controller
  useEffect(() => {
    if (status === ActivityStatus.SIDE_SELECTION && content?.statement) {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'hot-take-arena',
        prompt: `"${content.statement}" - Do you agree or disagree?`,
        optionLabels: ['AGREE (PRO)', 'DISAGREE (CON)'],
      });
    } else if (status === ActivityStatus.DEBATE) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'hot-take-arena',
        prompt: 'Make your argument! Type what your team believes.',
        placeholder: 'Type your argument...',
        maxLength: 300,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, content?.statement, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices
  useEffect(() => {
    if (status !== ActivityStatus.SIDE_SELECTION) return;

    onRegisterRemoteVoteHandler?.((vote) => {
      const side: 'pro' | 'con' = vote.choice === 'AGREE (PRO)' ? 'pro' : 'con';
      setSideSelections((prev) => {
        const filtered = prev.filter((s) => s.studentId !== vote.clientId);
        return [...filtered, { studentId: vote.clientId, studentName: vote.displayName, side }];
      });
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, onRegisterRemoteVoteHandler]);

  // Group students by side
  const teams = useMemo(() => {
    const pro = sideSelections.filter((s) => s.side === 'pro');
    const con = sideSelections.filter((s) => s.side === 'con');
    return { pro, con };
  }, [sideSelections]);

  // Count arguments per side
  const argumentStats = useMemo(() => {
    const proArgs = arguments_.filter((a) => a.side === 'pro');
    const conArgs = arguments_.filter((a) => a.side === 'con');
    return {
      proCount: proArgs.length,
      conCount: conArgs.length,
      proArgs,
      conArgs,
    };
  }, [arguments_]);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.PRESENTING);
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const startSideSelection = useCallback(() => {
    setStatus(ActivityStatus.SIDE_SELECTION);
    setSideSelections([]);
    onPhaseChange?.('side-selection');
  }, [onPhaseChange]);

  const selectSide = useCallback((studentId: string, side: Side) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setSideSelections((prev) => {
      const filtered = prev.filter((s) => s.studentId !== studentId);
      return [...filtered, { studentId, studentName: student.name, side }];
    });
  }, [students]);

  const startDebate = useCallback(() => {
    setStatus(ActivityStatus.DEBATE);
    onPhaseChange?.('debate');
  }, [onPhaseChange]);

  const addArgument = useCallback((studentId: string, argumentContent: string) => {
    const student = students.find((s) => s.id === studentId);
    const selection = sideSelections.find((s) => s.studentId === studentId);
    if (!student || !selection) return;

    const newArg: Argument = {
      id: `arg-${Date.now()}`,
      studentId,
      studentName: student.name,
      side: selection.side,
      content: argumentContent,
      timestamp: Date.now(),
    };

    setArguments((prev) => [...prev, newArg]);
    setNewArgumentText('');
    setSelectedStudentForArg(null);
  }, [students, sideSelections]);

  // Register remote vote handler for DEBATE phase — receives text arguments from student devices
  useEffect(() => {
    if (status !== ActivityStatus.DEBATE) return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const studentId = vote.clientId;
      const argumentText = vote.choice?.trim();
      if (!argumentText) return;
      const selection = sideSelections.find((s) => s.studentId === studentId);
      if (!selection) return; // student didn't pick a side — silently ignore
      addArgument(studentId, argumentText);
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, sideSelections, addArgument, onRegisterRemoteVoteHandler]);

  const triggerDevilsAdvocate = useCallback(async (targetSide: Side) => {
    setIsLoadingChallenge(true);
    setStatus(ActivityStatus.DEVILS_ADVOCATE);
    onPhaseChange?.('devils-advocate');

    try {
      // Try pre-generated challenges first
      const challenges = targetSide === 'pro'
        ? content.devilsAdvocate.proChallenges
        : content.devilsAdvocate.conChallenges;

      const index = targetSide === 'pro' ? challengeIndex.pro : challengeIndex.con;

      if (challenges && challenges[index]) {
        setCurrentChallenge({
          targetSide,
          challenge: challenges[index],
          isAnswered: false,
        });
        setChallengeIndex((prev) => ({
          ...prev,
          [targetSide]: prev[targetSide] + 1,
        }));
      } else {
        // Generate dynamic challenge based on arguments made
        const sideArgs = arguments_.filter((a) => a.side === targetSide);
        const response = await onContinue({
          sessionId: '',
          activityKey: 'hot-take-arena',
          topicContext: content.topicContext,
          previousExchanges: sideArgs.map((a) => ({
            role: 'student' as const,
            content: `${a.studentName} (${a.side}): ${a.content}`,
            timestamp: a.timestamp,
          })),
          studentResponse: `The ${targetSide} side has made ${sideArgs.length} arguments`,
          requestType: 'challenge',
        });

        setCurrentChallenge({
          targetSide,
          challenge: response.challenge || `Can you defend your position against this: What if the opposite were true?`,
          isAnswered: false,
        });
      }
    } catch (error) {
      console.error('Failed to get challenge:', error);
      setCurrentChallenge({
        targetSide,
        challenge: 'Can you think of any weaknesses in your argument?',
        isAnswered: false,
      });
    } finally {
      setIsLoadingChallenge(false);
    }
  }, [content, arguments_, challengeIndex, onContinue, onPhaseChange]);

  const answerChallenge = useCallback(() => {
    if (currentChallenge) {
      setCurrentChallenge({ ...currentChallenge, isAnswered: true });
    }
    setStatus(ActivityStatus.REBUTTAL);
    onPhaseChange?.('rebuttal');
  }, [currentChallenge, onPhaseChange]);

  const backToDebate = useCallback(() => {
    setCurrentChallenge(null);
    setStatus(ActivityStatus.DEBATE);
    onPhaseChange?.('debate');
  }, [onPhaseChange]);

  const showSummary = useCallback(() => {
    setStatus(ActivityStatus.SUMMARY);
    onPhaseChange?.('summary');
  }, [onPhaseChange]);

  const finishActivity = useCallback(() => {
    setStatus(ActivityStatus.FINISHED);
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const restartActivity = useCallback(() => {
    setSideSelections([]);
    setArguments([]);
    setCurrentChallenge(null);
    setChallengeIndex({ pro: 0, con: 0 });
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-orange-400">Hot Take Arena</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="flex gap-2">
          {status !== ActivityStatus.IDLE && status !== ActivityStatus.FINISHED && (
            <>
              <span className="text-green-400 text-sm">PRO: {argumentStats.proCount}</span>
              <span className="opacity-50">|</span>
              <span className="text-red-400 text-sm">CON: {argumentStats.conCount}</span>
            </>
          )}
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Time to debate!</p>
          <p className="opacity-60 text-sm mb-8">
            Students pick sides and defend their position
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START DEBATE
          </button>
        </motion.div>
      )}

      {/* PRESENTING State - Show the hot take */}
      {status === ActivityStatus.PRESENTING && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-8 rounded-2xl border-2 border-orange-500/30 text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-4">Today&apos;s Hot Take</p>
            <p className="text-2xl font-bold leading-tight">&ldquo;{content.statement}&rdquo;</p>
          </div>

          {/* Vocabulary preview */}
          {content.vocabularyHighlights.length > 0 && (
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Key Vocabulary</p>
              <div className="flex flex-wrap gap-2">
                {content.vocabularyHighlights.map((word, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={startSideSelection}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              PICK SIDES
            </button>
          </div>
        </motion.div>
      )}

      {/* SIDE_SELECTION State */}
      {status === ActivityStatus.SIDE_SELECTION && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-lg font-semibold">&ldquo;{content.statement}&rdquo;</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* PRO side */}
            <div className="glass p-4 rounded-2xl border-2 border-green-500/30">
              <p className="text-green-400 font-bold text-center mb-3">AGREE (PRO)</p>
              <div className="space-y-2 min-h-[100px]">
                {teams.pro.map((s) => (
                  <div key={s.studentId} className="bg-green-500/20 px-3 py-1 rounded-lg text-sm">
                    {s.studentName}
                  </div>
                ))}
              </div>
            </div>

            {/* CON side */}
            <div className="glass p-4 rounded-2xl border-2 border-red-500/30">
              <p className="text-red-400 font-bold text-center mb-3">DISAGREE (CON)</p>
              <div className="space-y-2 min-h-[100px]">
                {teams.con.map((s) => (
                  <div key={s.studentId} className="bg-red-500/20 px-3 py-1 rounded-lg text-sm">
                    {s.studentName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student assignment */}
          <div className="glass p-4 rounded-xl">
            <p className="text-sm font-bold mb-3 opacity-70">Assign students to sides:</p>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => {
                const selection = sideSelections.find((s) => s.studentId === student.id);
                return (
                  <div key={student.id} className="flex items-center gap-1">
                    <span className="text-xs opacity-70 mr-1">{student.name}:</span>
                    <button
                      onClick={() => selectSide(student.id, 'pro')}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        selection?.side === 'pro'
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 hover:bg-green-500/30'
                      }`}
                    >
                      PRO
                    </button>
                    <button
                      onClick={() => selectSide(student.id, 'con')}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        selection?.side === 'con'
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 hover:bg-red-500/30'
                      }`}
                    >
                      CON
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startDebate}
              disabled={teams.pro.length === 0 || teams.con.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              START DEBATE
            </button>
          </div>
        </motion.div>
      )}

      {/* DEBATE State */}
      {status === ActivityStatus.DEBATE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Statement reminder */}
          <div className="glass p-3 rounded-xl text-center text-sm opacity-80">
            &ldquo;{content.statement}&rdquo;
          </div>

          {/* Arguments display */}
          <div className="grid grid-cols-2 gap-4">
            {/* PRO arguments */}
            <div className="glass p-4 rounded-2xl border-2 border-green-500/30">
              <p className="text-green-400 font-bold text-center mb-3">PRO ARGUMENTS</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {argumentStats.proArgs.map((arg) => (
                  <div key={arg.id} className="bg-green-500/10 p-2 rounded-lg text-sm">
                    <span className="text-green-400 font-bold">{arg.studentName}:</span>{' '}
                    {arg.content}
                  </div>
                ))}
                {argumentStats.proArgs.length === 0 && (
                  <p className="text-xs opacity-50 text-center">No arguments yet</p>
                )}
              </div>
            </div>

            {/* CON arguments */}
            <div className="glass p-4 rounded-2xl border-2 border-red-500/30">
              <p className="text-red-400 font-bold text-center mb-3">CON ARGUMENTS</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {argumentStats.conArgs.map((arg) => (
                  <div key={arg.id} className="bg-red-500/10 p-2 rounded-lg text-sm">
                    <span className="text-red-400 font-bold">{arg.studentName}:</span>{' '}
                    {arg.content}
                  </div>
                ))}
                {argumentStats.conArgs.length === 0 && (
                  <p className="text-xs opacity-50 text-center">No arguments yet</p>
                )}
              </div>
            </div>
          </div>

          {/* AI argument starters — collapsible teacher hints */}
          {(content.proArguments?.length > 0 || content.conArguments?.length > 0) && (
            <details className="glass p-4 rounded-xl border border-white/5">
              <summary className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-pointer select-none">
                Argument Starters (teacher prompts) ▾
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-green-400 text-xs font-bold mb-2">PRO ideas</p>
                  {content.proArguments?.map((a: string, i: number) => (
                    <p key={i} className="text-xs text-slate-400 mb-1">• {a}</p>
                  ))}
                </div>
                <div>
                  <p className="text-red-400 text-xs font-bold mb-2">CON ideas</p>
                  {content.conArguments?.map((a: string, i: number) => (
                    <p key={i} className="text-xs text-slate-400 mb-1">• {a}</p>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* Add argument form */}
          <div className="glass p-4 rounded-xl space-y-3">
            <p className="text-sm font-bold opacity-70">Teacher override (or type for student):</p>
            <div className="flex gap-2">
              <select
                value={selectedStudentForArg || ''}
                onChange={(e) => setSelectedStudentForArg(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select student...</option>
                {sideSelections.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.studentName} ({s.side.toUpperCase()})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newArgumentText}
                onChange={(e) => setNewArgumentText(e.target.value)}
                placeholder="Type their argument..."
                className="flex-grow bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedStudentForArg && newArgumentText.trim()) {
                    addArgument(selectedStudentForArg, newArgumentText.trim());
                  }
                }}
              />
              <button
                onClick={() => {
                  if (selectedStudentForArg && newArgumentText.trim()) {
                    addArgument(selectedStudentForArg, newArgumentText.trim());
                  }
                }}
                disabled={!selectedStudentForArg || !newArgumentText.trim()}
                className="px-4 py-2 bg-cyan-500 rounded-lg text-sm font-bold disabled:opacity-30"
              >
                ADD
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => triggerDevilsAdvocate('pro')}
              className="px-4 py-2 glass hover:bg-green-500/20 rounded-lg text-sm border border-green-500/30"
            >
              Challenge PRO
            </button>
            <button
              onClick={() => triggerDevilsAdvocate('con')}
              className="px-4 py-2 glass hover:bg-red-500/20 rounded-lg text-sm border border-red-500/30"
            >
              Challenge CON
            </button>
            <button
              onClick={showSummary}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-sm font-bold shadow-lg"
            >
              END DEBATE
            </button>
          </div>
        </motion.div>
      )}

      {/* DEVILS_ADVOCATE State */}
      {status === ActivityStatus.DEVILS_ADVOCATE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {isLoadingChallenge ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="w-12 h-12 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
                <p className="font-game text-lg text-orange-400 animate-pulse">
                  Devil&apos;s Advocate is thinking...
                </p>
              </motion.div>
            ) : currentChallenge && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`glass p-6 rounded-2xl border-2 ${
                  currentChallenge.targetSide === 'pro' ? 'border-green-500/30' : 'border-red-500/30'
                }`}>
                  <p className="text-sm uppercase tracking-widest opacity-50 mb-2">
                    Challenge to {currentChallenge.targetSide.toUpperCase()} team
                  </p>
                  <p className="text-xl font-semibold">{currentChallenge.challenge}</p>
                </div>

                <div className="text-center text-sm opacity-70">
                  Let the {currentChallenge.targetSide.toUpperCase()} team respond...
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={answerChallenge}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
                  >
                    CHALLENGE ANSWERED
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* REBUTTAL State */}
      {status === ActivityStatus.REBUTTAL && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-cyan-500/30 text-center">
            <p className="text-lg">The {currentChallenge?.targetSide.toUpperCase()} team has responded!</p>
            <p className="text-sm opacity-70 mt-2">Continue the debate or challenge the other side.</p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={backToDebate}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
            >
              CONTINUE DEBATE
            </button>
            <button
              onClick={() => triggerDevilsAdvocate(currentChallenge?.targetSide === 'pro' ? 'con' : 'pro')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-sm shadow-lg"
            >
              CHALLENGE OTHER SIDE
            </button>
          </div>
        </motion.div>
      )}

      {/* SUMMARY State */}
      {status === ActivityStatus.SUMMARY && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-2xl font-game text-orange-400 mb-2">Debate Summary</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl border-2 border-green-500/30">
              <p className="text-green-400 font-bold text-center mb-2">PRO TEAM</p>
              <p className="text-3xl font-game text-center mb-2">{argumentStats.proCount}</p>
              <p className="text-xs text-center opacity-60">arguments made</p>
              <div className="mt-3 text-xs">
                <p className="opacity-70">Team: {teams.pro.map((t) => t.studentName).join(', ')}</p>
              </div>
              {argumentStats.proArgs.length > 0 && (
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                  {argumentStats.proArgs.map((a) => (
                    <p key={a.id} className="text-xs text-slate-400">
                      <span className="font-bold">{a.studentName}:</span> {a.content}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="glass p-4 rounded-2xl border-2 border-red-500/30">
              <p className="text-red-400 font-bold text-center mb-2">CON TEAM</p>
              <p className="text-3xl font-game text-center mb-2">{argumentStats.conCount}</p>
              <p className="text-xs text-center opacity-60">arguments made</p>
              <div className="mt-3 text-xs">
                <p className="opacity-70">Team: {teams.con.map((t) => t.studentName).join(', ')}</p>
              </div>
              {argumentStats.conArgs.length > 0 && (
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                  {argumentStats.conArgs.map((a) => (
                    <p key={a.id} className="text-xs text-slate-400">
                      <span className="font-bold">{a.studentName}:</span> {a.content}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={finishActivity}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              FINISH
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-orange-400 mb-4">Great Debate!</p>
          <p className="opacity-70 mb-8">
            {argumentStats.proCount + argumentStats.conCount} total arguments made
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            START NEW DEBATE
          </button>
        </motion.div>
      )}
    </div>
  );
}
