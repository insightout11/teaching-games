'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Stamp, Plus } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import type { DecisionCouncilContent } from '../types';
import type {
  CouncilPhase,
  Proposal,
  ProposalSupport,
  CouncilSupportTab,
  ChallengePoint,
  VoteRecord,
} from './types';

const LABELS = ['A', 'B', 'C', 'D'];

export function DecisionCouncilActivity({
  sessionId,
  students,
  sessionSettings,
  generatedContent,
  onSetInputSpec,
  onRegisterSubmissionHandler,
  onRegisterRemoteVoteHandler,
  onPhaseChange,
  onScore,
}: ActivityProps) {
  const content = generatedContent as DecisionCouncilContent;
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);

  // How much writing to ask of students, auto-selected by lesson difficulty:
  //  · stance   → beginners pick a ready-made position (no typing); needs stanceOptions
  //  · assisted → mid levels type, with tap-to-insert phrase chips to build a sentence
  //  · free     → advanced levels write freely (phrases shown read-only)
  const stanceOptions = useMemo(() => content.stanceOptions ?? [], [content.stanceOptions]);
  const difficulty = sessionSettings?.difficulty ?? 'Intermediate';
  const proposalMode: 'stance' | 'assisted' | 'free' =
    (difficulty === 'Beginner' || difficulty === 'Easy') && stanceOptions.length >= 2
      ? 'stance'
      : difficulty === 'Advanced' || difficulty === 'Expert'
        ? 'free'
        : 'assisted';

  // Phase
  const [phase, setPhase] = useState<CouncilPhase>('idle');
  const phaseRef = useRef<CouncilPhase>('idle');
  phaseRef.current = phase;

  // Data
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [challengePoints, setChallengePoints] = useState<ChallengePoint[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [signals, setSignals] = useState<Record<string, string>>({});

  // UI state
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  // Teacher-scribed proposal (captures ideas said aloud), optionally credited to a roster student.
  const [scribeText, setScribeText] = useState('');
  const [scribeStudentId, setScribeStudentId] = useState('');
  const [proposalSupports, setProposalSupports] = useState<Record<string, ProposalSupport>>({});
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [openSupport, setOpenSupport] = useState<Record<string, CouncilSupportTab | null>>({});

  // Dedup refs
  const capturedProposalIds = useRef(new Set<string>());
  const capturedChallengeIds = useRef(new Set<string>());
  const capturedVoteClientIds = useRef(new Set<string>());
  const capturedSignalClientIds = useRef(new Set<string>());
  const supportRequestKeyRef = useRef<string | null>(null);
  const promptIndexRef = useRef(1);

  // Capture proposal and challenge submissions through the shell approval pipeline.
  useEffect(() => {
    onRegisterSubmissionHandler?.({
      autoApprove: true,
      handleSubmission: async (submissionContent, metadata = {}) => {
        const currentPhase = phaseRef.current;
        const text = submissionContent.trim();
        const submissionId =
          typeof metadata.submissionId === 'string'
            ? metadata.submissionId
            : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const clientId = typeof metadata.clientId === 'string' ? metadata.clientId : submissionId;
        const displayName =
          typeof metadata.displayName === 'string' && metadata.displayName.trim().length > 0
            ? metadata.displayName
            : 'Student';

        if (currentPhase === 'proposal-collect') {
          if (!capturedProposalIds.current.has(submissionId)) {
            capturedProposalIds.current.add(submissionId);
            const nextProposal: Proposal = {
              id: `prop-${submissionId}`,
              submissionId,
              clientId,
              displayName,
              text,
              selected: false,
            };
            setProposals((prev) => {
              const existingIndex = prev.findIndex((p) => p.clientId === clientId);
              if (existingIndex === -1) return [...prev, nextProposal];
              const next = [...prev];
              next[existingIndex] = {
                ...nextProposal,
                selected: next[existingIndex].selected,
              };
              return next;
            });
          }
          return { isCorrect: null, points: 5, outcome: 'standout' as const };
        }

        if (currentPhase === 'challenge') {
          if (!capturedChallengeIds.current.has(submissionId)) {
            capturedChallengeIds.current.add(submissionId);
            setChallengePoints((prev) => [
              ...prev,
              {
                id: `ch-${submissionId}`,
                submissionId,
                clientId,
                displayName,
                text,
                spotlit: false,
              },
            ]);
          }
          return { isCorrect: null, points: 3, outcome: 'on-task' as const };
        }

        return {
          isCorrect: null,
          points: 0,
          outcome: 'invalid' as const,
          feedback: 'No active council prompt',
        };
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [onRegisterSubmissionHandler]);

  // Derived
  const selectedProposals = useMemo(() => proposals.filter((p) => p.selected), [proposals]);

  const selectedProposalCards = useMemo(
    () =>
      selectedProposals.map((proposal, i) => {
        const originalIndex = proposals.findIndex((p) => p.id === proposal.id);
        const labelIndex = originalIndex >= 0 ? originalIndex : i;
        return {
          proposal,
          label: LABELS[labelIndex] ?? String.fromCharCode(65 + labelIndex),
        };
      }),
    [proposals, selectedProposals]
  );

  const selectedSupportRequestKey = useMemo(
    () =>
      selectedProposalCards
        .map(({ proposal, label }) => `${proposal.id}:${label}:${proposal.text}`)
        .join('|'),
    [selectedProposalCards]
  );

  const signalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(signals).forEach((label) => {
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return counts;
  }, [signals]);

  const proposalLabelMap = useMemo(
    () => Object.fromEntries(proposals.map((p, i) => [p.id, LABELS[i] ?? String.fromCharCode(65 + i)])),
    [proposals]
  );

  const sortedProposals = useMemo(
    () =>
      [...proposals].sort((a, b) => {
        const lA = proposalLabelMap[a.id] ?? '';
        const lB = proposalLabelMap[b.id] ?? '';
        return (signalCounts[lB] ?? 0) - (signalCounts[lA] ?? 0);
      }),
    [proposals, proposalLabelMap, signalCounts]
  );

  const voteStats = useMemo(
    () =>
      selectedProposalCards.map(({ proposal: p, label }) => {
        const choiceKey = `${label}: ${p.text}`;
        const count = votes.filter((v) => v.choice === choiceKey).length;
        return { proposal: p, label, choiceKey, count };
      }),
    [selectedProposalCards, votes]
  );

  const totalVotes = votes.length;

  const challengeStats = useMemo(
    () =>
      selectedProposalCards.map(({ proposal: p, label }) => {
        const support = challengePoints.filter(
          (c) => c.targetLabel === label && c.kind === 'support'
        ).length;
        const challenge = challengePoints.filter(
          (c) => c.targetLabel === label && c.kind === 'challenge'
        ).length;
        const evidence = challengePoints.filter(
          (c) => c.targetLabel === label && c.kind === 'evidence'
        ).length;
        return { proposal: p, label, support, challenge, evidence };
      }),
    [selectedProposalCards, challengePoints]
  );

  const winner = useMemo(() => {
    if (voteStats.length === 0 || totalVotes === 0) return null;
    return voteStats.reduce((best, curr) => (curr.count > best.count ? curr : best));
  }, [voteStats, totalVotes]);

  // Flight log (Captain's Flight): record the verdict so the Final Word can ask the class to stand
  // by it. addFlightLogEntry self-guards to Captain's, so this no-ops in other presets (e.g. Debate).
  const flightLogWrittenRef = useRef(false);
  useEffect(() => {
    if (phase !== 'results' || flightLogWrittenRef.current || !winner || totalVotes === 0) return;
    flightLogWrittenRef.current = true;
    const winnerPct = Math.round((winner.count / totalVotes) * 100);
    const shortText = winner.proposal.text.length > 80
      ? `${winner.proposal.text.slice(0, 77)}…`
      : winner.proposal.text;
    addFlightLogEntry({
      beat: 'council',
      text: `Council carried Proposal ${winner.label} (${winnerPct}%): "${shortText}".`,
      callback: `The council voted ${winnerPct}% for "${shortText}" — do you stand by it?`,
    });
  }, [phase, winner, totalVotes, addFlightLogEntry]);

  // InputSpec — broadcasts to student devices based on phase
  useEffect(() => {
    if (phase === 'proposal-collect') {
      const phrases = content.usefulPhrases ?? [];
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'decision-council',
        prompt: content.councilQuestion,
        placeholder: 'Share your position and one reason...',
        maxLength: 250,
        reviewMode: 'approval',
        instruction: 'Propose your solution',
        ...(phrases.length > 0 ? { keywords: phrases } : {}),
        ...(proposalMode === 'assisted' ? { chipInsert: true } : {}),
      });
    } else if (phase === 'signal-pass' && proposals.length > 0) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'decision-council',
        prompt: proposalMode === 'stance' ? 'Which position do you support?' : 'Which proposal should we discuss?',
        options: proposals.map((p, i) => `${LABELS[i] ?? String.fromCharCode(65 + i)}: ${p.text}`),
      });
    } else if (phase === 'challenge') {
      const options = selectedProposalCards.flatMap(({ label }) => {
        return [`support:${label}`, `challenge:${label}`, `evidence:${label}`];
      });
      const optionLabels = selectedProposalCards.flatMap(({ label }) => {
        return [`Support ${label}`, `Challenge ${label}`, `Need evidence ${label}`];
      });
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'decision-council',
        prompt: 'Tap where the discussion should go next',
        options,
        optionLabels,
        instruction: 'Choose one discussion signal',
      });
    } else if (phase === 'voting' && selectedProposals.length > 0) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'decision-council',
        prompt: 'Vote for the strongest proposal',
        options: selectedProposalCards.map(({ proposal, label }) => `${label}: ${proposal.text}`),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, content.councilQuestion, content.usefulPhrases, proposalMode, proposals, selectedProposals, selectedProposalCards, onSetInputSpec]);

  // Remote vote handler — voting phase only
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (vote.gameKey !== 'decision-council') return;
      const currentPhase = phaseRef.current;
      const isTextSubmission = vote.inputType === 'text' || vote.inputType === 'textarea';

      if (currentPhase === 'proposal-collect' && isTextSubmission) {
        const fallbackId = `direct-prop-${vote.clientId}`;
        setProposals((prev) => {
          const nextProposal: Proposal = {
            id: fallbackId,
            clientId: vote.clientId,
            displayName: vote.displayName,
            text: vote.choice,
            selected: false,
          };
          const existingIndex = prev.findIndex((p) => p.clientId === vote.clientId);
          if (existingIndex === -1) return [...prev, nextProposal];
          const next = [...prev];
          next[existingIndex] = {
            ...nextProposal,
            selected: next[existingIndex].selected,
          };
          return next;
        });
        return;
      }

      if (currentPhase === 'challenge' && isTextSubmission) {
        const fallbackId = `direct-ch-${vote.clientId}-${Date.now()}`;
        setChallengePoints((prev) => [
          ...prev,
          {
            id: fallbackId,
            clientId: vote.clientId,
            displayName: vote.displayName,
            text: vote.choice,
            spotlit: false,
          },
        ]);
        return;
      }

      if (currentPhase === 'challenge') {
        const challengeId = `tap-ch-${vote.clientId}`;
        if (capturedChallengeIds.current.has(challengeId)) return;
        capturedChallengeIds.current.add(challengeId);

        const [kindRaw, labelRaw] = vote.choice.split(':');
        const kind =
          kindRaw === 'challenge' || kindRaw === 'evidence'
            ? kindRaw
            : 'support';
        const targetLabel = (labelRaw || '').trim();
        const text =
          kind === 'evidence'
            ? `Need evidence for Proposal ${targetLabel}`
            : `${kind === 'challenge' ? 'Challenge' : 'Support'} for Proposal ${targetLabel}`;

        setChallengePoints((prev) => [
          ...prev,
          {
            id: challengeId,
            clientId: vote.clientId,
            displayName: vote.displayName,
            text,
            kind,
            targetLabel,
            spotlit: false,
          },
        ]);
        void onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: promptIndexRef.current++,
          points: 1,
          isCorrect: null,
        });
        return;
      }

      if (currentPhase === 'signal-pass') {
        if (capturedSignalClientIds.current.has(vote.clientId)) return;
        capturedSignalClientIds.current.add(vote.clientId);
        const label = vote.choice.split(':')[0].trim();
        setSignals((prev) => ({ ...prev, [vote.clientId]: label }));
        void onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: promptIndexRef.current++,
          points: 1,
          isCorrect: null,
        });
        return;
      }

      if (currentPhase !== 'voting') return;
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
  const startSignalPass = useCallback(() => advanceTo('signal-pass'), [advanceTo]);

  // Beginner/Easy path: skip free-text proposing entirely. Seed the council with the ready-made
  // stance options and send students straight to backing one (the signal pass), so nobody types.
  const startStanceCouncil = useCallback(() => {
    const seeded: Proposal[] = stanceOptions.slice(0, 4).map((text, i) => ({
      id: `stance-${i}`,
      clientId: `stance-${i}`,
      displayName: 'Council',
      text,
      selected: false,
    }));
    setProposals(seeded);
    advanceTo('signal-pass');
  }, [stanceOptions, advanceTo]);

  // Teacher scribe: capture a spoken proposal onto the board, optionally credited to a student.
  const addTeacherProposal = useCallback(() => {
    const text = scribeText.trim();
    if (!text) return;
    const student = students.find((s) => s.id === scribeStudentId);
    const id = `teacher-${Date.now()}`;
    setProposals((prev) => [
      ...prev,
      {
        id,
        clientId: id,
        displayName: student?.name ?? 'From the floor',
        text,
        selected: false,
      },
    ]);
    setScribeText('');
    setScribeStudentId('');
  }, [scribeText, scribeStudentId, students]);
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

  const fallbackSupportFor = useCallback(
    (proposal: Proposal, label: string): ProposalSupport => {
      const evidence =
        content.sourceDetails && content.sourceDetails.length > 0
          ? content.sourceDetails.slice(0, 2)
          : [
              content.contextBrief ||
                `Use one lesson detail to test whether Proposal ${label} is realistic.`,
            ];

      return {
        proposalId: proposal.id,
        proposalLabel: label,
        forPoints: [
          'This proposal gives the class a clear action to evaluate.',
          'It directly answers the council question and can be explained quickly.',
        ],
        againstPoints: [
          'It may need a more realistic plan or clearer limits.',
          'It may not work equally well for every person or situation.',
        ],
        evidence,
        speakerPrompt: `Explain why Proposal ${label} is practical, then respond to one concern.`,
      };
    },
    [content.contextBrief, content.sourceDetails]
  );

  useEffect(() => {
    if ((phase !== 'presenting' && phase !== 'challenge') || selectedProposalCards.length === 0) return;
    if (supportRequestKeyRef.current === selectedSupportRequestKey) return;

    supportRequestKeyRef.current = selectedSupportRequestKey;

    const fallbackMap = Object.fromEntries(
      selectedProposalCards.map(({ proposal, label }) => [
        proposal.id,
        fallbackSupportFor(proposal, label),
      ])
    );

    async function loadSupports() {
      setSupportLoading(true);
      setSupportError(null);

      // Opinion Pulse steer (Stage 8): the warm-up split, captured in the flight log by the earlier
      // Opinion Pulse beat, so the council's discussion notes press on whether that leaning holds.
      // Read non-reactively — it's already written by the time the council runs.
      const classPulse = useSessionStore.getState().flightLog.find((e) => e.beat === 'opinion-pulse')?.text;

      try {
        const response = await fetch('/api/decision-council/supports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            topic: content.topicContext ?? content.councilQuestion,
            councilQuestion: content.councilQuestion,
            contextBrief: content.contextBrief,
            sourceDetails: content.sourceDetails ?? [],
            usefulPhrases: content.usefulPhrases ?? [],
            ...(classPulse ? { classPulse } : {}),
            proposals: selectedProposalCards.map(({ proposal, label }) => ({
              id: proposal.id,
              label,
              text: proposal.text,
            })),
          }),
        });

        if (!response.ok) throw new Error(`Support request failed: ${response.status}`);

        const data = (await response.json()) as {
          supports?: ProposalSupport[];
          fallback?: boolean;
        };
        const supportsById = Object.fromEntries(
          (data.supports ?? []).map((support) => [support.proposalId, support])
        );

        if (supportRequestKeyRef.current === selectedSupportRequestKey) {
          setProposalSupports((prev) => ({
            ...prev,
            ...fallbackMap,
            ...supportsById,
          }));
          setSupportError(data.fallback ? 'Using basic discussion notes.' : null);
        }
      } catch (error) {
        console.warn('[DecisionCouncil] support generation failed:', error);
        if (supportRequestKeyRef.current === selectedSupportRequestKey) {
          setProposalSupports((prev) => ({ ...prev, ...fallbackMap }));
          setSupportError('Using basic discussion notes.');
        }
      } finally {
        if (supportRequestKeyRef.current === selectedSupportRequestKey) setSupportLoading(false);
      }
    }

    void loadSupports();
  }, [
    phase,
    selectedProposalCards,
    selectedSupportRequestKey,
    sessionId,
    content.topicContext,
    content.councilQuestion,
    content.contextBrief,
    content.sourceDetails,
    content.usefulPhrases,
    fallbackSupportFor,
  ]);

  const toggleSupportPanel = useCallback((proposalId: string, tab: CouncilSupportTab) => {
    setOpenSupport((prev) => ({
      ...prev,
      [proposalId]: prev[proposalId] === tab ? null : tab,
    }));
  }, []);

  const getSupportItems = (support: ProposalSupport, tab: CouncilSupportTab) => {
    if (tab === 'for') return support.forPoints;
    if (tab === 'against') return support.againstPoints;
    if (tab === 'evidence') return support.evidence;
    return support.speakerPrompt ? [support.speakerPrompt] : [];
  };

  const supportTabs: Array<{ id: CouncilSupportTab; label: string; className: string }> = [
    { id: 'for', label: 'For', className: 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10' },
    { id: 'against', label: 'Against', className: 'border-amber-400/30 text-amber-200 bg-amber-500/10' },
    { id: 'evidence', label: 'Evidence', className: 'border-sky-400/30 text-sky-200 bg-sky-500/10' },
    { id: 'prompt', label: 'Prompt', className: 'border-violet-400/30 text-violet-200 bg-violet-500/10' },
  ];

  const renderSupportControls = (proposal: Proposal, label: string) => {
    const support = proposalSupports[proposal.id] ?? fallbackSupportFor(proposal, label);
    const activeTab = openSupport[proposal.id];
    const items = activeTab ? getSupportItems(support, activeTab) : [];
    const activeConfig = supportTabs.find((tab) => tab.id === activeTab);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {supportTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => toggleSupportPanel(proposal.id, tab.id)}
                className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? tab.className
                    : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {supportLoading && !proposalSupports[proposal.id] && (
          <p className="text-xs text-sky-300/70">Preparing council notes...</p>
        )}

        {activeTab && (
          <div className={`rounded-xl border p-3 ${activeConfig?.className ?? 'border-white/10 bg-white/5'}`}>
            <p className="text-xs uppercase tracking-widest opacity-55 mb-2">
              Proposal {label} {activeConfig?.label}
            </p>
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-white/85">
                  {activeTab === 'prompt' ? item : `- ${item}`}
                </p>
              ))}
            </div>
          </div>
        )}

        {supportError && !supportLoading && (
          <p className="text-xs text-amber-300/70">{supportError}</p>
        )}
      </div>
    );
  };

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
            onClick={proposalMode === 'stance' ? startStanceCouncil : startProposalCollect}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            {proposalMode === 'stance' ? 'PICK POSITIONS →' : 'COLLECT PROPOSALS →'}
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
            proposals.map((p, idx) => {
              const label = LABELS[idx] ?? String.fromCharCode(65 + idx);
              return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-3 rounded-xl border border-indigo-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-400/70 font-semibold mb-0.5">
                      Proposal {label}
                    </p>
                    <p className="text-sm leading-relaxed">{p.text}</p>
                  </div>
                  <button
                    onClick={() => void handleSpotlight(p.submissionId, `Proposal ${label}`, p.text)}
                    className="shrink-0 text-amber-400/40 hover:text-amber-400 transition-colors text-base"
                    title="Spotlight"
                  >
                    ✦
                  </button>
                </div>
              </motion.div>
              );
            })
          )}
        </div>

        {/* Teacher scribe — capture a proposal a student said aloud, optionally crediting them. */}
        <div className="glass p-3 rounded-xl border border-white/10 space-y-2">
          <p className="text-xs uppercase tracking-widest opacity-40">Add a spoken proposal</p>
          <div className="flex items-center gap-2">
            <input
              value={scribeText}
              onChange={(e) => setScribeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTeacherProposal();
                }
              }}
              placeholder="Type what a student proposed…"
              className="flex-1 min-w-0 px-3 py-2 bg-lc-surface border border-lc-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {students.length > 0 && (
              <select
                value={scribeStudentId}
                onChange={(e) => setScribeStudentId(e.target.value)}
                className="shrink-0 px-2 py-2 bg-lc-surface border border-lc-border rounded-lg text-sm max-w-[9rem]"
              >
                <option value="">From the floor</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={addTeacherProposal}
              disabled={!scribeText.trim()}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-500/80 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {proposals.length >= 2 && (
            <button
              onClick={openCouncilSelect}
              className="text-xs opacity-40 hover:opacity-70 transition-opacity"
            >
              Skip signals →
            </button>
          )}
          <button
            onClick={proposals.length >= 2 ? startSignalPass : openCouncilSelect}
            disabled={proposals.length < 1}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {proposals.length >= 2
              ? `START CLASS SIGNALS (${proposals.length})`
              : proposals.length === 1
              ? 'OPEN COUNCIL (1 proposal)'
              : 'OPEN COUNCIL'}
          </button>
        </div>
      </div>
    );
  }

  // ─── SIGNAL PASS ─────────────────────────────────────────────────────────────

  if (phase === 'signal-pass') {
    const totalSignals = Object.keys(signals).length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm opacity-50 truncate">{content.councilQuestion}</p>
          <span className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-sky-500/20 text-sky-300 rounded-full">
            {totalSignals} signals
          </span>
        </div>
        <div className="space-y-2">
          {proposals.map((p, idx) => {
            const label = LABELS[idx] ?? String.fromCharCode(65 + idx);
            const count = signalCounts[label] ?? 0;
            const pct = totalSignals > 0 ? Math.round((count / totalSignals) * 100) : 0;
            return (
              <div key={p.id} className="glass p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-full bg-sky-500/80 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {label}
                    </span>
                    <p className="text-sm leading-relaxed truncate">{p.text}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {count} <span className="opacity-40 font-normal text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button
            onClick={openCouncilSelect}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            OPEN SELECTION →
          </button>
        </div>
      </div>
    );
  }

  // ─── COUNCIL SELECT ───────────────────────────────────────────────────────────

  if (phase === 'council-select') {
    const totalSignalsForHint = Object.keys(signals).length;
    const minSelected = proposals.length <= 1 ? 1 : 2;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-70 font-medium">
            {proposals.length <= 1 ? 'Select the proposal to bring forward' : 'Select 2-4 proposals to bring forward'}
          </p>
          <span className="text-xs opacity-50">{selectedProposals.length} / 4</span>
        </div>
        {totalSignalsForHint > 0 && (
          <p className="text-xs opacity-40 italic">Signals guide selection; teacher chooses final council.</p>
        )}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedProposals.map((p) => {
            const label = proposalLabelMap[p.id] ?? '';
            const sigCount = signalCounts[label] ?? 0;
            return (
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs text-indigo-400/70 font-semibold">Proposal {label}</p>
                    {sigCount > 0 && (
                      <span className="text-xs text-sky-400/80 font-medium">▲ {sigCount}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{p.text}</p>
                </div>
                <button
                  onClick={() => void handleSpotlight(p.submissionId, `Proposal ${label}`, p.text)}
                  className="shrink-0 text-amber-400/40 hover:text-amber-400 transition-colors text-base"
                  title="Spotlight"
                >
                  ✦
                </button>
              </div>
            </div>
          );
          })}
        </div>
        <div className="flex justify-end">
          <button
            onClick={presentCouncil}
            disabled={selectedProposals.length < minSelected}
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
          {selectedProposalCards.map(({ proposal: p, label }, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="glass p-5 rounded-2xl border-2 border-indigo-400/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {label}
                </span>
                <p className="text-xs opacity-60 font-medium">Proposal {label}</p>
              </div>
              <p className="text-base leading-relaxed">{p.text}</p>
              {renderSupportControls(p, label)}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={openChallenges}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            OPEN DISCUSSION CHECK -&gt;
          </button>
        </div>
      </div>
    );
  }

  // ─── CHALLENGE ───────────────────────────────────────────────────────────────

  if (phase === 'challenge') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-70 uppercase tracking-wide text-xs">
            Discussion Check
          </p>
          <span className="px-2.5 py-1 text-xs font-semibold bg-violet-500/20 text-violet-300 rounded-full">
            {challengePoints.length} taps
          </span>
        </div>
        <p className="text-sm opacity-55">
          Students tap support, challenge, or need evidence. Use the split to guide the spoken discussion.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {challengeStats.map((stat) => (
            <div key={stat.proposal.id} className="glass p-4 rounded-xl border border-indigo-400/15 space-y-3">
              <div>
                <span className="text-indigo-400 font-bold text-xs">
                  Proposal {stat.label}
                </span>
                <p className="mt-1 opacity-75 text-sm leading-relaxed">
                  {stat.proposal.text.length > 100
                    ? `${stat.proposal.text.slice(0, 100)}...`
                    : stat.proposal.text}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-300/60">Support</p>
                  <p className="text-lg font-bold text-emerald-300">{stat.support}</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-amber-300/60">Challenge</p>
                  <p className="text-lg font-bold text-amber-300">{stat.challenge}</p>
                </div>
                <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-sky-300/60">Evidence</p>
                  <p className="text-lg font-bold text-sky-300">{stat.evidence}</p>
                </div>
              </div>
              {renderSupportControls(stat.proposal, stat.label)}
            </div>
          ))}
        </div>
        {challengePoints.some((c) => !c.kind) && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {challengePoints.filter((c) => !c.kind).map((c) => (
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
            ))}
          </div>
        )}
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
            className="relative overflow-hidden glass p-6 rounded-2xl border-2 border-indigo-400 text-center space-y-2"
          >
            {/* Verdict stamp — the ceremonial "carried" beat that closes the council */}
            <motion.div
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -14 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 14 }}
              className="pointer-events-none absolute top-4 right-3 flex items-center gap-1.5 rounded-lg border-2 border-emerald-400/70 px-3 py-1 text-emerald-300"
            >
              <Stamp className="h-4 w-4" />
              <span className="font-game text-sm tracking-widest">CARRIED</span>
            </motion.div>

            <p className="text-xs uppercase tracking-widest opacity-40">The Verdict</p>
            <div className="flex items-center justify-center gap-3">
              <span className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center">
                {winner.label}
              </span>
              <p className="text-lg font-semibold text-indigo-300">Proposal {winner.label}</p>
            </div>
            <p className="text-xl font-bold leading-snug">{winner.proposal.text}</p>
            <p className="text-xs opacity-60">Proposed by {winner.proposal.displayName}</p>
            <p className="text-sm opacity-50">
              {winner.count} of {totalVotes} votes · {winnerPct}%
            </p>
            {totalVotes - winner.count > 0 && (
              <p className="text-xs text-amber-300/70">
                Not unanimous — {totalVotes - winner.count} dissented
              </p>
            )}
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
