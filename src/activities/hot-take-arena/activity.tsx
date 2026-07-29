'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type Side,
  type SideSelection,
  type SpokeEntry,
  type MindChangeVote,
  type DevilsAdvocateChallenge,
  type HotTakeArenaContent,
} from './types';
import { VocabPill } from '@/components/ui/vocab-pill';

interface RaisedHand {
  claimTag: string;
  timestamp: number;
  clientId: string;
  displayName: string;
}

export function HotTakeArenaActivity({
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as HotTakeArenaContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [sideSelections, setSideSelections] = useState<SideSelection[]>([]);
  const [raisedHands, setRaisedHands] = useState<Map<string, RaisedHand>>(new Map());
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [spokeLog, setSpokeLog] = useState<SpokeEntry[]>([]);
  const [mindChangeVotes, setMindChangeVotes] = useState<MindChangeVote[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<DevilsAdvocateChallenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState({ pro: 0, con: 0 });
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const promptIndexRef = useRef(1);
  const resultsPointsAwarded = useRef(false);

  // Input spec
  useEffect(() => {
    if (status === ActivityStatus.SIDE_SELECTION) {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'hot-take-arena',
        prompt: `"${content.statement}" — Pick a side!`,
        optionLabels: ['AGREE (PRO)', 'DISAGREE (CON)'],
      });
    } else if (status === ActivityStatus.DEBATE) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'hot-take-arena',
        prompt: 'Type your point (a few words) then tap Submit to raise your hand.',
        placeholder: 'Your claim...',
        maxLength: 60,
      });
    } else if (status === ActivityStatus.MIND_CHANGE_VOTE) {
      onSetInputSpec?.({
        type: 'binary',
        gameKey: 'hot-take-arena',
        prompt: 'Did the other side change your mind at all?',
        optionLabels: ['Yes, a bit!', 'No, I stand my ground'],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, content?.statement, onSetInputSpec]);

  // Side selection vote handler
  useEffect(() => {
    if (status !== ActivityStatus.SIDE_SELECTION) return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const side: Side = vote.choice === 'AGREE (PRO)' ? 'pro' : 'con';
      setSideSelections((prev) => {
        const filtered = prev.filter((s) => s.studentId !== vote.clientId);
        return [...filtered, { studentId: vote.clientId, studentName: vote.displayName, side }];
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, onRegisterRemoteVoteHandler]);

  // Raised-hand (claim tag) submission handler
  useEffect(() => {
    if (status !== ActivityStatus.DEBATE) return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const claimTag = vote.choice?.trim();
      if (!claimTag) return;
      const selection = sideSelections.find((s) => s.studentId === vote.clientId);
      if (!selection) return;
      setRaisedHands((prev) => {
        const next = new Map(prev);
        next.set(vote.clientId, {
          claimTag,
          timestamp: Date.now(),
          clientId: vote.clientId,
          displayName: vote.displayName,
        });
        return next;
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, sideSelections, onRegisterRemoteVoteHandler]);

  // Mind-change vote handler
  useEffect(() => {
    if (status !== ActivityStatus.MIND_CHANGE_VOTE) return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const selection = sideSelections.find((s) => s.studentId === vote.clientId);
      if (!selection) return;
      const wasConvinced = vote.choice.startsWith('Yes');
      setMindChangeVotes((prev) => {
        const filtered = prev.filter((v) => v.studentId !== vote.clientId);
        return [...filtered, { studentId: vote.clientId, displayName: vote.displayName, side: selection.side, wasConvinced }];
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, sideSelections, onRegisterRemoteVoteHandler]);

  const teams = useMemo(() => ({
    pro: sideSelections.filter((s) => s.side === 'pro'),
    con: sideSelections.filter((s) => s.side === 'con'),
  }), [sideSelections]);

  const raisedHandsByTeam = useMemo(() => {
    const hands = Array.from(raisedHands.values());
    const pro = hands
      .filter((h) => sideSelections.find((s) => s.studentId === h.clientId)?.side === 'pro')
      .sort((a, b) => a.timestamp - b.timestamp);
    const con = hands
      .filter((h) => sideSelections.find((s) => s.studentId === h.clientId)?.side === 'con')
      .sort((a, b) => a.timestamp - b.timestamp);
    return { pro, con };
  }, [raisedHands, sideSelections]);

  const mindChangeResults = useMemo(() => {
    // PRO's success = CON students PRO convinced (CON voters who said yes)
    const proMindChanges = mindChangeVotes.filter((v) => v.side === 'con' && v.wasConvinced).length;
    // CON's success = PRO students CON convinced (PRO voters who said yes)
    const conMindChanges = mindChangeVotes.filter((v) => v.side === 'pro' && v.wasConvinced).length;
    const proRate = teams.con.length > 0 ? proMindChanges / teams.con.length : 0;
    const conRate = teams.pro.length > 0 ? conMindChanges / teams.pro.length : 0;
    const winner: Side | null = proRate > conRate ? 'pro' : conRate > proRate ? 'con' : null;
    return { proMindChanges, conMindChanges, proRate, conRate, winner };
  }, [mindChangeVotes, teams]);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.PRESENTING);
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const startSideSelection = useCallback(() => {
    setStatus(ActivityStatus.SIDE_SELECTION);
    setSideSelections([]);
    onPhaseChange?.('side-selection');
  }, [onPhaseChange]);

  const startDebate = useCallback(() => {
    setStatus(ActivityStatus.DEBATE);
    onPhaseChange?.('debate');
  }, [onPhaseChange]);

  const callOnStudent = useCallback((clientId: string) => {
    setCurrentSpeaker(clientId);
  }, []);

  const markDone = useCallback((clientId: string, starred: boolean) => {
    const hand = raisedHands.get(clientId);
    if (!hand) return;
    const selection = sideSelections.find((s) => s.studentId === clientId);
    if (!selection) return;

    setSpokeLog((prev) => [
      ...prev,
      {
        id: `spoke-${Date.now()}`,
        studentId: clientId,
        studentName: hand.displayName,
        side: selection.side,
        claimTag: hand.claimTag,
        timestamp: Date.now(),
        isStarred: starred,
      },
    ]);
    setRaisedHands((prev) => {
      const next = new Map(prev);
      next.delete(clientId);
      return next;
    });
    setCurrentSpeaker(null);

    void onScore?.({
      studentId: null,
      clientId,
      displayName: hand.displayName,
      promptIndex: promptIndexRef.current++,
      points: starred ? 10 : 5,
      isCorrect: null,
    });
  }, [raisedHands, sideSelections, onScore]);

  const triggerDevilsAdvocate = useCallback(async (targetSide: Side) => {
    setIsLoadingChallenge(true);
    setCurrentChallenge(null);
    try {
      const challenges = targetSide === 'pro'
        ? content.devilsAdvocate?.proChallenges
        : content.devilsAdvocate?.conChallenges;
      const index = targetSide === 'pro' ? challengeIndex.pro : challengeIndex.con;

      if (challenges?.[index]) {
        setCurrentChallenge({ targetSide, challenge: challenges[index] });
        setChallengeIndex((prev) => ({ ...prev, [targetSide]: prev[targetSide] + 1 }));
      } else {
        const sideEntries = spokeLog.filter((e) => e.side === targetSide);
        const response = await onContinue({
          sessionId: '',
          activityKey: 'hot-take-arena',
          topicContext: content.topicContext,
          previousExchanges: sideEntries.map((e) => ({
            role: 'student' as const,
            content: `${e.studentName} (${e.side}): ${e.claimTag}`,
            timestamp: e.timestamp,
          })),
          studentResponse: `The ${targetSide} side has spoken ${sideEntries.length} times`,
          requestType: 'challenge',
        });
        setCurrentChallenge({
          targetSide,
          challenge: response.challenge || 'Can you think of a weakness in your argument?',
        });
      }
    } catch {
      setCurrentChallenge({
        targetSide,
        challenge: 'Can you think of a weakness in your argument?',
      });
    } finally {
      setIsLoadingChallenge(false);
    }
  }, [content, spokeLog, challengeIndex, onContinue]);

  const dismissChallenge = useCallback(() => setCurrentChallenge(null), []);

  const startMindChangeVote = useCallback(() => {
    setCurrentChallenge(null);
    setCurrentSpeaker(null);
    setStatus(ActivityStatus.MIND_CHANGE_VOTE);
    onPhaseChange?.('mind-change-vote');
  }, [onPhaseChange]);

  const showResults = useCallback(() => {
    if (resultsPointsAwarded.current) return;
    resultsPointsAwarded.current = true;
    setStatus(ActivityStatus.RESULTS);
    onPhaseChange?.('results');

    // Participation points for voting
    mindChangeVotes.forEach((vote) => {
      void onScore?.({
        studentId: null,
        clientId: vote.studentId,
        displayName: vote.displayName,
        promptIndex: promptIndexRef.current++,
        points: 2,
        isCorrect: null,
      });
    });

    // Win bonus for winning side
    const { winner } = mindChangeResults;
    if (winner) {
      sideSelections
        .filter((s) => s.side === winner)
        .forEach((s) => {
          void onScore?.({
            studentId: null,
            clientId: s.studentId,
            displayName: s.studentName,
            promptIndex: promptIndexRef.current++,
            points: 15,
            isCorrect: null,
          });
        });
    }
  }, [mindChangeVotes, mindChangeResults, sideSelections, onPhaseChange, onScore]);

  const finishActivity = useCallback(() => {
    setStatus(ActivityStatus.FINISHED);
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const restartActivity = useCallback(() => {
    setSideSelections([]);
    setRaisedHands(new Map());
    setCurrentSpeaker(null);
    setSpokeLog([]);
    setMindChangeVotes([]);
    setCurrentChallenge(null);
    setChallengeIndex({ pro: 0, con: 0 });
    setIsLoadingChallenge(false);
    promptIndexRef.current = 1;
    resultsPointsAwarded.current = false;
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  const currentSpeakerHand = currentSpeaker ? raisedHands.get(currentSpeaker) : null;
  const currentSpeakerSide = currentSpeaker
    ? sideSelections.find((s) => s.studentId === currentSpeaker)?.side
    : null;
  const starredEntries = spokeLog.filter((e) => e.isStarred);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-orange-400">Hot Take Arena</h3>
          {customTopic && customTopic !== 'General' && <p className="text-xs opacity-60">Topic: {customTopic}</p>}
        </div>
        {status === ActivityStatus.DEBATE && (
          <div className="flex gap-3 text-sm">
            <span className="text-green-400">PRO ({raisedHandsByTeam.pro.length} waiting)</span>
            <span className="opacity-30">|</span>
            <span className="text-red-400">CON ({raisedHandsByTeam.con.length} waiting)</span>
          </div>
        )}
        {(status === ActivityStatus.RESULTS || status === ActivityStatus.FINISHED) && (
          <div className="flex gap-3 text-sm">
            <span className="text-green-400">PRO {teams.pro.length}</span>
            <span className="opacity-30">|</span>
            <span className="text-red-400">CON {teams.con.length}</span>
          </div>
        )}
      </div>

      {/* IDLE */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Time to debate!</p>
          <p className="opacity-60 text-sm mb-8">
            Students pick sides and defend their position — out loud
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            START DEBATE
          </button>
        </motion.div>
      )}

      {/* PRESENTING */}
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

          {(content.vocabularyHighlights?.length ?? 0) > 0 && (
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Key Vocabulary</p>
              <div className="flex flex-wrap gap-2">
                {content.vocabularyHighlights.map((word, i) => (
                  <VocabPill key={i} word={word} className="px-3 py-1 bg-white/10 rounded-full text-sm" />
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

      {/* SIDE_SELECTION */}
      {status === ActivityStatus.SIDE_SELECTION && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-lg font-semibold">&ldquo;{content.statement}&rdquo;</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

      {/* DEBATE */}
      {status === ActivityStatus.DEBATE && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Statement reminder */}
          <div className="glass p-3 rounded-xl text-center text-sm opacity-80">
            &ldquo;{content.statement}&rdquo;
          </div>

          {/* Challenge banner */}
          {(isLoadingChallenge || currentChallenge) && (
            <div className={`glass p-4 rounded-2xl border-2 ${
              currentChallenge?.targetSide === 'pro'
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-red-500/40 bg-red-500/5'
            }`}>
              {isLoadingChallenge ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shrink-0" />
                  <span className="text-sm text-orange-400 animate-pulse">Generating challenge…</span>
                </div>
              ) : currentChallenge && (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                      currentChallenge.targetSide === 'pro' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      Challenge to {currentChallenge.targetSide.toUpperCase()} team
                    </p>
                    <p className="text-base font-semibold">{currentChallenge.challenge}</p>
                  </div>
                  <button
                    onClick={dismissChallenge}
                    className="shrink-0 px-3 py-1.5 text-xs glass rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Current speaker */}
          {currentSpeaker && currentSpeakerHand && (
            <div className={`glass p-5 rounded-2xl border-2 ${
              currentSpeakerSide === 'pro' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
            }`}>
              <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Speaking now</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-xl font-bold ${currentSpeakerSide === 'pro' ? 'text-green-300' : 'text-red-300'}`}>
                    {currentSpeakerHand.displayName}
                  </p>
                  <p className="text-sm opacity-70 mt-0.5">&ldquo;{currentSpeakerHand.claimTag}&rdquo;</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => markDone(currentSpeaker, true)}
                    className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-sm font-bold text-yellow-300 hover:bg-yellow-500/30 transition-colors"
                  >
                    ★ Strong Point
                  </button>
                  <button
                    onClick={() => markDone(currentSpeaker, false)}
                    className="px-4 py-2 glass border border-white/20 rounded-xl text-sm hover:bg-white/10 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Raised-hand queues */}
          <div className="grid grid-cols-2 gap-4">
            {/* PRO queue */}
            <div className="glass p-4 rounded-2xl border-2 border-green-500/30">
              <p className="text-green-400 font-bold text-center mb-3 text-sm">
                PRO TEAM
                <span className="ml-2 opacity-50 text-xs font-normal">
                  {teams.pro.map((s) => s.studentName).join(', ')}
                </span>
              </p>
              <div className="space-y-2 min-h-[80px]">
                {raisedHandsByTeam.pro.length === 0 ? (
                  <p className="text-xs opacity-40 text-center pt-4">Waiting for raised hands…</p>
                ) : (
                  raisedHandsByTeam.pro.map((hand) => (
                    <div
                      key={hand.clientId}
                      className={`flex items-center justify-between gap-2 bg-green-500/10 px-3 py-2 rounded-lg ${
                        currentSpeaker === hand.clientId ? 'ring-1 ring-green-400/60' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-green-300">{hand.displayName}</p>
                        <p className="text-xs opacity-70 truncate">{hand.claimTag}</p>
                      </div>
                      {currentSpeaker === hand.clientId ? (
                        <span className="text-xs text-green-400 shrink-0 font-bold">▶</span>
                      ) : (
                        <button
                          onClick={() => callOnStudent(hand.clientId)}
                          disabled={!!currentSpeaker}
                          className="shrink-0 px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/40 border border-green-500/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Call on
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CON queue */}
            <div className="glass p-4 rounded-2xl border-2 border-red-500/30">
              <p className="text-red-400 font-bold text-center mb-3 text-sm">
                CON TEAM
                <span className="ml-2 opacity-50 text-xs font-normal">
                  {teams.con.map((s) => s.studentName).join(', ')}
                </span>
              </p>
              <div className="space-y-2 min-h-[80px]">
                {raisedHandsByTeam.con.length === 0 ? (
                  <p className="text-xs opacity-40 text-center pt-4">Waiting for raised hands…</p>
                ) : (
                  raisedHandsByTeam.con.map((hand) => (
                    <div
                      key={hand.clientId}
                      className={`flex items-center justify-between gap-2 bg-red-500/10 px-3 py-2 rounded-lg ${
                        currentSpeaker === hand.clientId ? 'ring-1 ring-red-400/60' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-red-300">{hand.displayName}</p>
                        <p className="text-xs opacity-70 truncate">{hand.claimTag}</p>
                      </div>
                      {currentSpeaker === hand.clientId ? (
                        <span className="text-xs text-red-400 shrink-0 font-bold">▶</span>
                      ) : (
                        <button
                          onClick={() => callOnStudent(hand.clientId)}
                          disabled={!!currentSpeaker}
                          className="shrink-0 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Call on
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Argument starters — teacher reference */}
          {(content.proArguments?.length > 0 || content.conArguments?.length > 0) && (
            <details className="glass p-4 rounded-xl border border-white/5">
              <summary className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-pointer select-none">
                Argument starters (teacher prompts) ▾
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

          {/* Spoke log */}
          {spokeLog.length > 0 && (
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-3">
                Spoken arguments ({spokeLog.length})
              </p>
              <div className="space-y-1.5">
                {spokeLog.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-sm">
                    <span className={`text-xs font-bold shrink-0 ${entry.side === 'pro' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.side.toUpperCase()}
                    </span>
                    <span className="font-medium">{entry.studentName}:</span>
                    <span className="opacity-70 truncate">{entry.claimTag}</span>
                    {entry.isStarred && <span className="text-yellow-400 shrink-0 font-bold">★</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-between items-center flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => triggerDevilsAdvocate('pro')}
                disabled={isLoadingChallenge}
                className="px-3 py-2 glass hover:bg-green-500/20 rounded-lg text-xs border border-green-500/30 disabled:opacity-30 transition-colors"
              >
                Challenge PRO
              </button>
              <button
                onClick={() => triggerDevilsAdvocate('con')}
                disabled={isLoadingChallenge}
                className="px-3 py-2 glass hover:bg-red-500/20 rounded-lg text-xs border border-red-500/30 disabled:opacity-30 transition-colors"
              >
                Challenge CON
              </button>
            </div>
            <button
              onClick={startMindChangeVote}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              END DEBATE →
            </button>
          </div>
        </motion.div>
      )}

      {/* MIND_CHANGE_VOTE */}
      {status === ActivityStatus.MIND_CHANGE_VOTE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-orange-500/30 text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-3">The Verdict</p>
            <p className="text-lg font-semibold">&ldquo;{content.statement}&rdquo;</p>
            <p className="text-sm opacity-60 mt-3">
              Students: did the other side change your mind at all?
            </p>
          </div>

          <div className="glass p-5 rounded-2xl text-center">
            <p className="text-4xl font-game mb-2">{mindChangeVotes.length}</p>
            <p className="text-sm opacity-60">
              of {sideSelections.length} students voted
            </p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className="text-green-400">
                {mindChangeVotes.filter((v) => v.wasConvinced).length} said yes
              </span>
              <span className="text-white/40">|</span>
              <span className="opacity-60">
                {mindChangeVotes.filter((v) => !v.wasConvinced).length} stood firm
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={showResults}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              SEE RESULTS
            </button>
          </div>
        </motion.div>
      )}

      {/* RESULTS */}
      {status === ActivityStatus.RESULTS && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-2xl font-game text-orange-400 mb-1">The Results</p>
            <p className="text-xs opacity-50">Who changed more minds?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* PRO result */}
            <div className={`glass p-5 rounded-2xl border-2 transition-all ${
              mindChangeResults.winner === 'pro'
                ? 'border-green-400/60 bg-green-500/10'
                : 'border-green-500/20'
            }`}>
              <p className="text-green-400 font-bold text-center mb-3">PRO TEAM</p>
              <p className="text-3xl font-game text-center">
                {mindChangeResults.proMindChanges}
                <span className="text-base opacity-50"> / {teams.con.length}</span>
              </p>
              <p className="text-xs text-center opacity-60 mt-1">CON students convinced</p>
              <p className="text-center mt-2 text-lg font-bold text-green-300">
                {Math.round(mindChangeResults.proRate * 100)}%
              </p>
              {mindChangeResults.winner === 'pro' && (
                <p className="text-center text-xs font-bold text-yellow-400 mt-2 uppercase tracking-widest">Winner</p>
              )}
              <p className="text-xs opacity-50 text-center mt-3">
                {teams.pro.map((s) => s.studentName).join(', ')}
              </p>
            </div>

            {/* CON result */}
            <div className={`glass p-5 rounded-2xl border-2 transition-all ${
              mindChangeResults.winner === 'con'
                ? 'border-red-400/60 bg-red-500/10'
                : 'border-red-500/20'
            }`}>
              <p className="text-red-400 font-bold text-center mb-3">CON TEAM</p>
              <p className="text-3xl font-game text-center">
                {mindChangeResults.conMindChanges}
                <span className="text-base opacity-50"> / {teams.pro.length}</span>
              </p>
              <p className="text-xs text-center opacity-60 mt-1">PRO students convinced</p>
              <p className="text-center mt-2 text-lg font-bold text-red-300">
                {Math.round(mindChangeResults.conRate * 100)}%
              </p>
              {mindChangeResults.winner === 'con' && (
                <p className="text-center text-xs font-bold text-yellow-400 mt-2 uppercase tracking-widest">Winner</p>
              )}
              <p className="text-xs opacity-50 text-center mt-3">
                {teams.con.map((s) => s.studentName).join(', ')}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className="glass p-4 rounded-2xl text-center border border-white/10">
            {mindChangeResults.winner === null ? (
              <p className="text-lg font-semibold opacity-80">Too close to call — both sides were convincing!</p>
            ) : (
              <p className="text-lg font-semibold">
                <span className={mindChangeResults.winner === 'pro' ? 'text-green-400' : 'text-red-400'}>
                  {mindChangeResults.winner.toUpperCase()} TEAM WINS
                </span>
                {' '}— they changed more minds!
              </p>
            )}
          </div>

          {/* Starred highlights */}
          {starredEntries.length > 0 && (
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-3">★ Standout moments</p>
              <div className="space-y-2">
                {starredEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span className={`text-xs font-bold shrink-0 ${entry.side === 'pro' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.side.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{entry.studentName}:</span>
                    <span className="text-sm opacity-70">{entry.claimTag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* FINISHED */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-orange-400 mb-4">Great Debate!</p>
          <p className="opacity-70 mb-2">{spokeLog.length} spoken arguments</p>
          {starredEntries.length > 0 && (
            <p className="opacity-50 text-sm mb-8">{starredEntries.length} standout moment{starredEntries.length !== 1 ? 's' : ''}</p>
          )}
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
