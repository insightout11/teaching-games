'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { DecisionCouncilContent } from '../types';
import type { CouncilPhase, Proposal, ChallengePoint, VoteRecord } from './types';
import { useApprovalQueue } from '@/hooks/use-approval-queue';

const LABELS = ['A', 'B', 'C', 'D'];

export function DecisionCouncilActivity({
  sessionId,
  students,
  generatedContent,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onPhaseChange,
  onScore,
}: ActivityProps) {
  const content = generatedContent as DecisionCouncilContent;

  // Phase
  const [phase, setPhase] = useState<CouncilPhase>('idle');
  const phaseRef = useRef<CouncilPhase>('idle');
  phaseRef.current = phase;

  // Data
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [challengePoints, setChallengePoints] = useState<ChallengePoint[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);

  // UI state
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [startersOpen, setStartersOpen] = useState(false);

  // Dedup refs
  const capturedProposalIds = useRef(new Set<string>());
  const capturedChallengeIds = useRef(new Set<string>());
  const capturedVoteClientIds = useRef(new Set<string>());
  const promptIndexRef = useRef(1);

  // Subscribe to pending submissions — used for proposal and challenge phases
  const { pending, approve } = useApprovalQueue(sessionId);

  // Capture incoming submissions into local state
  useEffect(() => {
    for (const sub of pending) {
      if (sub.game_key !== 'decision-council') continue;
      const currentPhase = phaseRef.current;

      if (currentPhase === 'proposal-collect' && !capturedProposalIds.current.has(sub.id)) {
        capturedProposalIds.current.add(sub.id);
        setProposals((prev) => [
          ...prev,
          {
            id: `prop-${sub.id}`,
            submissionId: sub.id,
            clientId: sub.client_id,
            displayName: sub.display_name,
            text: sub.content,
            selected: false,
          },
        ]);
        void approve(sub.id);
        void onScore?.({
          studentId: null,
          clientId: sub.client_id,
          displayName: sub.display_name,
          promptIndex: promptIndexRef.current++,
          points: 5,
          isCorrect: null,
        });
      } else if (currentPhase === 'challenge' && !capturedChallengeIds.current.has(sub.id)) {
        capturedChallengeIds.current.add(sub.id);
        setChallengePoints((prev) => [
          ...prev,
          {
            id: `ch-${sub.id}`,
            submissionId: sub.id,
            clientId: sub.client_id,
            displayName: sub.display_name,
            text: sub.content,
            spotlit: false,
          },
        ]);
        void approve(sub.id);
        void onScore?.({
          studentId: null,
          clientId: sub.client_id,
          displayName: sub.display_name,
          promptIndex: promptIndexRef.current++,
          points: 3,
          isCorrect: null,
        });
      }
    }
  }, [pending, approve, onScore]);

  // Derived
  const selectedProposals = useMemo(() => proposals.filter((p) => p.selected), [proposals]);

  const voteStats = useMemo(
    () =>
      selectedProposals.map((p, i) => {
        const label = LABELS[i] ?? String.fromCharCode(65 + i);
        const choiceKey = `${label}: ${p.displayName}`;
        const count = votes.filter((v) => v.choice === choiceKey).length;
        return { proposal: p, label, choiceKey, count };
      }),
    [selectedProposals, votes]
  );

  const totalVotes = votes.length;

  const winner = useMemo(() => {
    if (voteStats.length === 0 || totalVotes === 0) return null;
    return voteStats.reduce((best, curr) => (curr.count > best.count ? curr : best));
  }, [voteStats, totalVotes]);

  // InputSpec — broadcasts to student devices based on phase
  useEffect(() => {
    if (phase === 'proposal-collect') {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'decision-council',
        prompt: content.councilQuestion,
        placeholder: 'Share your position and one reason...',
        maxLength: 250,
        reviewMode: 'approval',
        instruction: 'Propose your solution',
      });
    } else if (phase === 'challenge') {
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'decision-council',
        prompt: 'Submit a challenge or support point for any proposal',
        placeholder: 'I challenge... / I support...',
        maxLength: 150,
        reviewMode: 'approval',
        instruction: 'Challenge or support',
      });
    } else if (phase === 'voting' && selectedProposals.length > 0) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'decision-council',
        prompt: 'Vote for the strongest proposal',
        options: selectedProposals.map(
          (p, i) => `${LABELS[i] ?? String.fromCharCode(65 + i)}: ${p.displayName}`
        ),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, content.councilQuestion, selectedProposals, onSetInputSpec]);

  // Remote vote handler — voting phase only
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'voting') return;
      if (capturedVoteClientIds.current.has(vote.clientId)) return;
      capturedVoteClientIds.current.add(vote.clientId);
      setVotes((prev) => [
        ...prev,
        { clientId: vote.clientId, displayName: vote.displayName, choice: vote.choice },
      ]);
      void onScore?.({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: promptIndexRef.current++,
        points: 2,
        isCorrect: null,
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  // Phase transitions
  const advanceTo = useCallback(
    (next: CouncilPhase) => {
      setPhase(next);
      phaseRef.current = next;
      onPhaseChange?.(next);
    },
    [onPhaseChange]
  );

  const startBriefing = useCallback(() => advanceTo('briefing'), [advanceTo]);
  const startProposalCollect = useCallback(() => advanceTo('proposal-collect'), [advanceTo]);
  const openCouncilSelect = useCallback(() => advanceTo('council-select'), [advanceTo]);
  const presentCouncil = useCallback(() => advanceTo('presenting'), [advanceTo]);
  const openChallenges = useCallback(() => advanceTo('challenge'), [advanceTo]);
  const startVote = useCallback(() => advanceTo('voting'), [advanceTo]);
  const endVote = useCallback(() => advanceTo('results'), [advanceTo]);
  const finish = useCallback(() => { onPhaseChange?.('finished'); }, [onPhaseChange]);

  // Toggle proposal selection (max 4)
  const toggleProposal = useCallback((id: string) => {
    setProposals((prev) => {
      const selectedCount = prev.filter((p) => p.selected).length;
      return prev.map((p) => {
        if (p.id !== id) return p;
        if (!p.selected && selectedCount >= 4) return p;
        return { ...p, selected: !p.selected };
      });
    });
  }, []);

  // Toggle spotlit state + call spotlight API
  const handleSpotlight = useCallback(
    async (submissionId?: string, displayName?: string, text?: string) => {
      if (!sessionId || !submissionId) return;
      await fetch('/api/session/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, submissionId, studentName: displayName, text }),
      });
    },
    [sessionId]
  );

  const handleChallengeSpotlight = useCallback(
    (id: string, submissionId?: string, displayName?: string, text?: string) => {
      setChallengePoints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, spotlit: !c.spotlit } : c))
      );
      void handleSpotlight(submissionId, displayName, text);
    },
    [handleSpotlight]
  );

  // Shared UI elements
  const usefulPhrasesSection = content.usefulPhrases && content.usefulPhrases.length > 0 && (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setPhrasesOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors"
      >
        <span className="font-medium opacity-60">Useful Phrases</span>
        <span className="opacity-40 text-lg leading-none">{phrasesOpen ? '−' : '+'}</span>
      </button>
      {phrasesOpen && (
        <div className="border-t border-lc-border px-4 pb-3 pt-2 space-y-1.5">
          {content.usefulPhrases.map((p, i) => (
            <p key={i} className="text-sm text-indigo-300/90">• {p}</p>
          ))}
        </div>
      )}
    </div>
  );

  const challengeStartersSection = content.challengeStarters && content.challengeStarters.length > 0 && (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setStartersOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors"
      >
        <span className="font-medium opacity-60">Challenge Starters</span>
        <span className="opacity-40 text-lg leading-none">{startersOpen ? '−' : '+'}</span>
      </button>
      {startersOpen && (
        <div className="border-t border-lc-border px-4 pb-3 pt-2 space-y-1.5">
          {content.challengeStarters.map((s, i) => (
            <p key={i} className="text-sm text-violet-300/90">• {s}</p>
          ))}
        </div>
      )}
    </div>
  );

  // ─── IDLE ────────────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <div className="glass p-6 rounded-2xl border border-indigo-500/20 space-y-3">
          <p className="text-xs uppercase tracking-widest opacity-40">Council Question</p>
          <p className="text-2xl font-bold leading-snug">{content.councilQuestion}</p>
          <p className="text-sm opacity-60 leading-relaxed">{content.contextBrief}</p>
        </div>
        {content.stanceOptions && content.stanceOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.stanceOptions.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-indigo-500/15 text-indigo-300 rounded-full text-sm border border-indigo-500/20"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {usefulPhrasesSection}
        <div className="text-center">
          <button
            onClick={startBriefing}
            className="px-12 py-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full font-game text-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            BEGIN BRIEFING
          </button>
        </div>
      </div>
    );
  }

  // ─── BRIEFING ────────────────────────────────────────────────────────────────

  if (phase === 'briefing') {
    return (
      <div className="space-y-5">
        <div className="glass p-6 rounded-2xl border-2 border-indigo-500/30 space-y-4">
          <p className="text-xs uppercase tracking-widest opacity-40">Council Question</p>
          <p className="text-3xl font-bold leading-tight">{content.councilQuestion}</p>
          <p className="text-base opacity-75 leading-relaxed">{content.contextBrief}</p>
          {content.stanceOptions && content.stanceOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {content.stanceOptions.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-500/15 text-indigo-300 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {content.sourceDetails && content.sourceDetails.length > 0 && (
          <div className="glass p-4 rounded-xl border border-sky-500/20 space-y-2">
            <p className="text-xs uppercase tracking-widest opacity-40">Key Details</p>
            {content.sourceDetails.map((d, i) => (
              <p key={i} className="text-sm opacity-80">• {d}</p>
            ))}
          </div>
        )}
        {usefulPhrasesSection}
        <div className="flex justify-end">
          <button
            onClick={startProposalCollect}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            COLLECT PROPOSALS →
          </button>
        </div>
      </div>
    );
  }

  // ─── PROPOSAL COLLECT ────────────────────────────────────────────────────────

  if (phase === 'proposal-collect') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm opacity-50 truncate">{content.councilQuestion}</p>
          <span className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full">
            {proposals.length} submitted
          </span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {proposals.length === 0 ? (
            <p className="text-center opacity-40 text-sm py-10">Waiting for proposals...</p>
          ) : (
            proposals.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-3 rounded-xl border border-indigo-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-400/70 font-semibold mb-0.5">{p.displayName}</p>
                    <p className="text-sm leading-relaxed">{p.text}</p>
                  </div>
                  <button
                    onClick={() => void handleSpotlight(p.submissionId, p.displayName, p.text)}
                    className="shrink-0 text-amber-400/40 hover:text-amber-400 transition-colors text-base"
                    title="Spotlight"
                  >
                    ✦
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={openCouncilSelect}
            disabled={proposals.length < 2}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            OPEN COUNCIL ({proposals.length} proposals)
          </button>
        </div>
      </div>
    );
  }

  // ─── COUNCIL SELECT ───────────────────────────────────────────────────────────

  if (phase === 'council-select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-70 font-medium">Select 2–4 proposals to bring forward</p>
          <span className="text-xs opacity-50">{selectedProposals.length} / 4</span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {proposals.map((p) => (
            <div
              key={p.id}
              className={`glass p-4 rounded-xl border-2 transition-colors ${
                p.selected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleProposal(p.id)}
                  className="shrink-0 mt-0.5"
                  aria-label={p.selected ? 'Deselect' : 'Select'}
                >
                  {p.selected ? (
                    <CheckCircle className="text-indigo-400 w-5 h-5" />
                  ) : (
                    <Circle
                      className={`w-5 h-5 ${
                        !p.selected && selectedProposals.length >= 4
                          ? 'opacity-20'
                          : 'opacity-40 hover:opacity-70'
                      } transition-opacity`}
                    />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-400/70 font-semibold mb-0.5">{p.displayName}</p>
                  <p className="text-sm leading-relaxed">{p.text}</p>
                </div>
                <button
                  onClick={() => void handleSpotlight(p.submissionId, p.displayName, p.text)}
                  className="shrink-0 text-amber-400/40 hover:text-amber-400 transition-colors text-base"
                  title="Spotlight"
                >
                  ✦
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={presentCouncil}
            disabled={selectedProposals.length < 2}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            PRESENT COUNCIL ({selectedProposals.length} selected)
          </button>
        </div>
      </div>
    );
  }

  // ─── PRESENTING ──────────────────────────────────────────────────────────────

  if (phase === 'presenting') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-40 mb-1">Council Question</p>
          <p className="text-xl font-bold leading-snug">{content.councilQuestion}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {selectedProposals.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="glass p-5 rounded-2xl border-2 border-indigo-400/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {LABELS[i] ?? String.fromCharCode(65 + i)}
                </span>
                <p className="text-xs opacity-60 font-medium">{p.displayName}</p>
              </div>
              <p className="text-base leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={openChallenges}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            OPEN CHALLENGES →
          </button>
        </div>
      </div>
    );
  }

  // ─── CHALLENGE ───────────────────────────────────────────────────────────────

  if (phase === 'challenge') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {selectedProposals.map((p, i) => (
            <div key={p.id} className="glass p-2.5 rounded-lg border border-indigo-400/15">
              <span className="text-indigo-400 font-bold text-xs">
                {LABELS[i] ?? String.fromCharCode(65 + i)}:{' '}
              </span>
              <span className="opacity-70 text-xs">
                {p.text.length > 60 ? `${p.text.slice(0, 60)}…` : p.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-70 uppercase tracking-wide text-xs">
            Challenges &amp; Support
          </p>
          <span className="px-2.5 py-1 text-xs font-semibold bg-violet-500/20 text-violet-300 rounded-full">
            {challengePoints.length} received
          </span>
        </div>
        {challengeStartersSection}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {challengePoints.length === 0 ? (
            <p className="text-center opacity-40 text-sm py-8">Waiting for challenges...</p>
          ) : (
            challengePoints.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass p-3 rounded-xl border transition-colors ${
                  c.spotlit ? 'border-amber-400/60 bg-amber-400/5' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-violet-400/70 font-semibold mb-0.5">{c.displayName}</p>
                    <p className="text-sm leading-relaxed">{c.text}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleChallengeSpotlight(c.id, c.submissionId, c.displayName, c.text)
                    }
                    className={`shrink-0 text-base transition-colors ${
                      c.spotlit ? 'text-amber-400' : 'text-amber-400/40 hover:text-amber-400'
                    }`}
                    title="Spotlight"
                  >
                    ✦
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={startVote}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            START VOTE →
          </button>
        </div>
      </div>
    );
  }

  // ─── VOTING ──────────────────────────────────────────────────────────────────

  if (phase === 'voting') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-40 mb-1">Students are voting</p>
          <p className="text-sm opacity-60 line-clamp-2">{content.councilQuestion}</p>
        </div>
        <div className="space-y-3">
          {voteStats.map(({ proposal, label, count }) => {
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={label} className="glass p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {label}
                    </span>
                    <p className="text-xs opacity-60 truncate">{proposal.text}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {count}{' '}
                    <span className="opacity-40 font-normal text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs opacity-40">
          {totalVotes} of {students.length} voted
        </p>
        <div className="flex justify-end">
          <button
            onClick={endVote}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            END VOTE
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────

  if (phase === 'results') {
    const winnerPct =
      winner && totalVotes > 0 ? Math.round((winner.count / totalVotes) * 100) : 0;
    const spotlitChallenges = challengePoints.filter((c) => c.spotlit);

    return (
      <div className="space-y-5">
        {winner ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-2xl border-2 border-indigo-400 text-center space-y-2"
          >
            <p className="text-xs uppercase tracking-widest opacity-40">Winning Proposal</p>
            <div className="flex items-center justify-center gap-3">
              <span className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center">
                {winner.label}
              </span>
              <p className="text-lg font-semibold text-indigo-300">{winner.proposal.displayName}</p>
            </div>
            <p className="text-xl font-bold leading-snug">{winner.proposal.text}</p>
            <p className="text-sm opacity-50">
              {winner.count} of {totalVotes} votes · {winnerPct}%
            </p>
          </motion.div>
        ) : (
          <div className="glass p-6 rounded-2xl text-center opacity-60">
            <p className="text-sm">No votes recorded</p>
          </div>
        )}

        <div className="space-y-2">
          {voteStats.map(({ label, count }) => {
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isWinner = winner?.label === label;
            return (
              <div
                key={label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-opacity ${
                  isWinner ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                    isWinner ? 'bg-indigo-500' : 'bg-white/20'
                  }`}
                >
                  {label}
                </span>
                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isWinner ? 'bg-indigo-500' : 'bg-white/30'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm w-6 text-right shrink-0">{count}</span>
                <span className="text-xs opacity-50 w-8 shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>

        {spotlitChallenges.length > 0 && (
          <div className="glass p-4 rounded-xl border border-amber-400/30 space-y-2">
            <p className="text-xs uppercase tracking-widest opacity-40">✦ Spotlit Challenge</p>
            {spotlitChallenges.slice(0, 2).map((c) => (
              <div key={c.id} className="space-y-0.5">
                <p className="text-xs opacity-50">{c.displayName}</p>
                <p className="text-sm">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={finish}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            FINISH
          </button>
        </div>
      </div>
    );
  }

  return null;
}
