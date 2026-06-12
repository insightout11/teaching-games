'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, DraftingCompass, Lightbulb, Loader2, MapPin, Save, ThumbsUp, TriangleAlert } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';
import type {
  DesignStudioBrief,
  DesignStudioContent,
  DesignStudioPhase,
  DesignStudioRound,
  DesignStudioState,
  DesignStudioVote,
} from './types';
import {
  applyDesignStudioDecision,
  buildFallbackDesignStudioBrief,
  buildFallbackDesignStudioRound,
  resolveDesignStudioWinner,
} from '@/lib/design-studio';

function initialState(challenge: string): DesignStudioState {
  return { challenge, originalIdeas: [], designSummary: '', decisions: [] };
}

function groundBriefInMissionEvidence(
  brief: DesignStudioBrief,
  mission: WorldFlightDesignMissionContext | undefined,
): DesignStudioBrief {
  if (!mission) return brief;

  const groundedEvidence = mission.evidence.map((evidence) => (
    `${evidence.city}: ${evidence.designUse || evidence.keyIdea || evidence.tradeoff || evidence.focusTitle}`
  ));
  const additionalReasoning = brief.evidenceAndReasoning.filter((reason) => (
    !mission.evidence.some((evidence) => reason.toLowerCase().includes(evidence.city.toLowerCase()))
  ));

  return {
    ...brief,
    evidenceAndReasoning: [...groundedEvidence, ...additionalReasoning].slice(0, 6),
  };
}

export function DesignStudioActivity({
  sessionId,
  generatedContent,
  customTopic,
  sessionSettings,
  onContinue,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as DesignStudioContent;
  const challenge = content.challenge || customTopic || 'Design something that improves everyday life.';
  const maxDecisions = content.maxDecisions || 6;
  const worldFlightMission = content.worldFlightMission;
  const [phase, setPhase] = useState<DesignStudioPhase>('idle');
  const [ideas, setIdeas] = useState<Array<{ clientId: string; displayName: string; text: string }>>([]);
  const [state, setState] = useState<DesignStudioState>(() => initialState(challenge));
  const [round, setRound] = useState<DesignStudioRound | null>(null);
  const [votes, setVotes] = useState<DesignStudioVote[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B' | 'C' | null>(null);
  const [brief, setBrief] = useState<DesignStudioBrief | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [missionSaveStatus, setMissionSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const phaseRef = useRef(phase);
  const stateRef = useRef(state);
  const roundRef = useRef(round);
  const votesRef = useRef(votes);
  const ideasRef = useRef(ideas);
  const scoredParticipationRef = useRef(new Set<string>());
  const completedMissionRef = useRef(false);
  phaseRef.current = phase;
  stateRef.current = state;
  roundRef.current = round;
  votesRef.current = votes;
  ideasRef.current = ideas;

  const changePhase = useCallback((next: DesignStudioPhase) => {
    setPhase(next);
    onPhaseChange?.(next === 'complete' ? 'finished' : next);
  }, [onPhaseChange]);

  useEffect(() => {
    if (phase === 'idea-collect') {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'design-studio',
        instruction: 'Starting idea',
        prompt: content.openingPrompt || 'What should the class design?',
        placeholder: 'Share one short design idea...',
        maxLength: 160,
        startedAt: Date.now(),
      });
    } else if (phase === 'voting' && round) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'design-studio',
        instruction: `Design decision ${state.decisions.length + 1} of ${maxDecisions}`,
        prompt: round.question,
        options: round.options.map((option) => option.id),
        optionLabels: round.options.map((option) => `${option.title}: ${option.description}`),
        startedAt: Date.now(),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, round, state.decisions.length, maxDecisions, content.openingPrompt, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (vote.gameKey !== 'design-studio') return;
      if (phaseRef.current === 'idea-collect') {
        setIdeas((previous) => {
          const idea = { clientId: vote.clientId, displayName: vote.displayName, text: vote.choice };
          const index = previous.findIndex((entry) => entry.clientId === vote.clientId);
          if (index < 0) return [...previous, idea];
          const next = [...previous];
          next[index] = idea;
          return next;
        });
        const scoreKey = `idea:${vote.clientId}`;
        if (!scoredParticipationRef.current.has(scoreKey)) {
          scoredParticipationRef.current.add(scoreKey);
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: 1,
            points: 1,
            isCorrect: null,
          });
        }
      } else if (phaseRef.current === 'voting') {
        const hasVoted = votesRef.current.some((entry) => entry.clientId === vote.clientId);
        if (!hasVoted) {
          const nextVote = {
            clientId: vote.clientId,
            studentId: vote.studentId ?? null,
            displayName: vote.displayName,
            choice: vote.choice,
          };
          votesRef.current = [...votesRef.current, nextVote];
          setVotes(votesRef.current);
          const scoreKey = `vote:${stateRef.current.decisions.length}:${vote.clientId}`;
          if (!scoredParticipationRef.current.has(scoreKey)) {
            scoredParticipationRef.current.add(scoreKey);
            void onScore?.({
              studentId: vote.studentId ?? null,
              clientId: vote.clientId,
              displayName: vote.displayName,
              promptIndex: stateRef.current.decisions.length + 2,
              points: 1,
              isCorrect: null,
            });
          }
        }
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  const voteCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    for (const vote of votes) {
      const id = vote.choice.trim().charAt(0).toUpperCase();
      if (id === 'A' || id === 'B' || id === 'C') counts[id] += 1;
    }
    return counts;
  }, [votes]);

  const start = useCallback(() => {
    setIdeas([]);
    scoredParticipationRef.current.clear();
    setState(initialState(challenge));
    setNotice(null);
    setMissionSaveStatus('idle');
    completedMissionRef.current = false;
    changePhase('idea-collect');
  }, [challenge, changePhase]);

  const finishWithBrief = useCallback(async (nextBrief: DesignStudioBrief, currentState: DesignStudioState) => {
    const groundedBrief = groundBriefInMissionEvidence(nextBrief, worldFlightMission);
    setBrief(groundedBrief);

    if (!worldFlightMission || !sessionId || completedMissionRef.current) {
      changePhase('complete');
      return;
    }

    setMissionSaveStatus('saving');
    try {
      const response = await fetch('/api/world-flight/design-mission/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          designState: currentState,
          brief: groundedBrief,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || 'Could not save the completed design mission.');
      }
      completedMissionRef.current = true;
      setMissionSaveStatus('saved');
    } catch (error) {
      console.error('[design-studio] mission completion save failed:', error);
      setMissionSaveStatus('error');
      setNotice('The design brief is complete, but its World Flight mission status could not be saved.');
    }
    changePhase('complete');
  }, [changePhase, sessionId, worldFlightMission]);

  const generateStart = useCallback(async () => {
    changePhase('generating');
    setNotice(null);
    const originalIdeas = ideasRef.current.length
      ? ideasRef.current.map((idea) => idea.text)
      : [customTopic || challenge];
    const nextState = { ...initialState(challenge), originalIdeas };
    setState(nextState);
    try {
      const response = await onContinue({
        sessionId: '',
        activityKey: 'design-studio',
        topicContext: challenge,
        requestType: 'design-studio-start',
        studentResponse: JSON.stringify({
          challenge,
          originalIdeas,
          difficulty: sessionSettings.difficulty,
          successCriteria: content.successCriteria,
          worldFlightMission,
        }),
        previousExchanges: [],
      });
      const nextRound = response.designStudioRound ?? buildFallbackDesignStudioRound(nextState);
      setState({ ...nextState, designSummary: nextRound.designSummary });
      setRound(nextRound);
    } catch {
      const fallback = buildFallbackDesignStudioRound(nextState);
      setState({ ...nextState, designSummary: fallback.designSummary });
      setRound(fallback);
      setNotice('AI suggestions were unavailable, so a reliable fallback round was loaded.');
    }
    setVotes([]);
    setSelectedOptionId(null);
    changePhase('question');
  }, [challenge, changePhase, content.successCriteria, customTopic, onContinue, sessionSettings.difficulty, worldFlightMission]);

  const closeVote = useCallback(() => {
    if (!roundRef.current) return;
    const winner = resolveDesignStudioWinner(roundRef.current.options, votesRef.current);
    setState(applyDesignStudioDecision(stateRef.current, roundRef.current, winner));
    setSelectedOptionId(winner.id);
    changePhase('decision');
  }, [changePhase]);

  const continueDesign = useCallback(async () => {
    const currentState = stateRef.current;
    setNotice(null);
    if (currentState.decisions.length >= maxDecisions) {
      changePhase('finalizing');
      try {
        const response = await onContinue({
          sessionId: '',
          activityKey: 'design-studio',
          topicContext: challenge,
          requestType: 'design-studio-finalize',
          studentResponse: JSON.stringify({
            state: currentState,
            difficulty: sessionSettings.difficulty,
            successCriteria: content.successCriteria,
            worldFlightMission,
          }),
          previousExchanges: [],
        });
        await finishWithBrief(response.designStudioBrief ?? buildFallbackDesignStudioBrief(currentState), currentState);
      } catch {
        setNotice('The final brief was assembled directly from the class decisions.');
        await finishWithBrief(buildFallbackDesignStudioBrief(currentState), currentState);
      }
      return;
    }

    changePhase('generating');
    try {
      const response = await onContinue({
        sessionId: '',
        activityKey: 'design-studio',
        topicContext: challenge,
        requestType: 'design-studio-next',
        studentResponse: JSON.stringify({
          state: currentState,
          difficulty: sessionSettings.difficulty,
          successCriteria: content.successCriteria,
          maxDecisions,
          worldFlightMission,
        }),
        previousExchanges: [],
      });
      const nextRound = response.designStudioRound ?? buildFallbackDesignStudioRound(currentState);
      setState((previous) => ({ ...previous, designSummary: nextRound.designSummary }));
      setRound(nextRound);
    } catch {
      setRound(buildFallbackDesignStudioRound(currentState));
      setNotice('AI suggestions were unavailable, so a reliable fallback round was loaded.');
    }
    setVotes([]);
    setSelectedOptionId(null);
    changePhase('question');
  }, [challenge, changePhase, content.successCriteria, finishWithBrief, maxDecisions, onContinue, sessionSettings.difficulty, worldFlightMission]);

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8 text-center">
        <DraftingCompass className="mx-auto h-12 w-12 text-cyan-300" strokeWidth={1.5} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
            {worldFlightMission ? `${worldFlightMission.investigationTitle} mission` : 'Design Studio'}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-lc-text">{challenge}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-lc-text2">
            Start with one idea. Every class vote changes the shared design and shapes the next question.
          </p>
        </div>
        <div className="grid gap-3 text-left md:grid-cols-3">
          {content.successCriteria?.map((criterion) => (
            <div key={criterion} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-lc-text2">
              <Check className="mb-2 h-4 w-4 text-emerald-300" aria-hidden />
              {criterion}
            </div>
          ))}
        </div>
        {worldFlightMission && <MissionEvidence mission={worldFlightMission} />}
        <button onClick={start} className="mx-auto flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          <Lightbulb className="h-4 w-4" aria-hidden />
          Start With An Idea
        </button>
      </div>
    );
  }

  if (phase === 'idea-collect') {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <StudioHeader state={state} maxDecisions={maxDecisions} />
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">Starting ideas</p>
          <h2 className="mt-2 text-2xl font-bold text-lc-text">{content.openingPrompt || 'What should the class design?'}</h2>
          <p className="mt-2 text-sm text-lc-text3">This is the only substantial writing stage.</p>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {ideas.map((idea) => (
              <div key={idea.clientId} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs font-semibold text-cyan-200/70">{idea.displayName}</p>
                <p className="mt-1 text-sm text-lc-text">{idea.text}</p>
              </div>
            ))}
          </div>
          {ideas.length === 0 && <p className="mt-5 text-sm text-lc-text3">Waiting for ideas from student devices...</p>}
        </div>
        <button onClick={() => void generateStart()} className="ml-auto block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          Build Starting Choices
        </button>
      </div>
    );
  }

  if (phase === 'generating' || phase === 'finalizing') {
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" aria-hidden />
        <h2 className="text-2xl font-bold text-lc-text">
          {phase === 'finalizing' ? 'Building the class design brief...' : 'Shaping the next design question...'}
        </h2>
        <p className="max-w-lg text-sm text-lc-text3">The AI is reviewing the full design and every decision already made.</p>
      </div>
    );
  }

  if (phase === 'complete' && brief) {
    return (
      <DesignBriefView
        brief={brief}
        decisions={state.decisions.length}
        notice={notice}
        missionSaveStatus={worldFlightMission ? missionSaveStatus : 'idle'}
        onRetryMissionSave={worldFlightMission && missionSaveStatus === 'error'
          ? () => void finishWithBrief(brief, stateRef.current)
          : undefined}
      />
    );
  }

  const selectedOption = round?.options.find((option) => option.id === selectedOptionId) ?? null;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <StudioHeader state={state} maxDecisions={maxDecisions} />
      {notice && <Notice message={notice} />}
      {phase === 'decision' && selectedOption ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/70">Class decision</p>
          <h2 className="mt-2 text-3xl font-bold text-lc-text">{selectedOption.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-lc-text2">{selectedOption.designChange}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <DecisionDetail icon={<ThumbsUp className="h-4 w-4" />} label="Benefit" value={selectedOption.benefit} />
            <DecisionDetail icon={<TriangleAlert className="h-4 w-4" />} label="Tradeoff accepted" value={selectedOption.tradeoff} />
          </div>
          <button onClick={() => void continueDesign()} className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
            {state.decisions.length >= maxDecisions ? 'Build Final Design Brief' : 'Ask The Next Question'}
          </button>
        </motion.div>
      ) : round ? (
        <>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">{round.stage}</p>
              <span className="text-xs text-lc-text3">{votes.length} votes</span>
            </div>
            <h2 className="mt-2 text-3xl font-bold text-lc-text">{round.question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-lc-text3">{round.whyItMatters}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {round.options.map((option) => (
              <div key={option.id} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300/10 font-bold text-cyan-200">{option.id}</span>
                  {phase === 'voting' && <span className="text-sm font-semibold text-cyan-200/70">{voteCounts[option.id]} votes</span>}
                </div>
                <h3 className="mt-4 text-lg font-bold text-lc-text">{option.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-lc-text2">{option.description}</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs leading-relaxed">
                  <p className="text-emerald-200/80"><strong>Benefit:</strong> {option.benefit}</p>
                  <p className="text-amber-200/75"><strong>Tradeoff:</strong> {option.tradeoff}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={phase === 'voting' ? closeVote : () => { setVotes([]); changePhase('voting'); }}
            className="ml-auto block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            {phase === 'voting' ? 'Close Vote And Apply Decision' : 'Open Class Vote'}
          </button>
        </>
      ) : null}
    </div>
  );
}

function MissionEvidence({ mission }: { mission: WorldFlightDesignMissionContext }) {
  return (
    <section className="space-y-3 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">Evidence collected across the journey</p>
        <p className="mt-1 text-sm text-lc-text3">The class design must connect ideas from these three completed city lessons.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {mission.evidence.map((evidence) => (
          <article key={evidence.requirementId} className="border-l-2 border-cyan-300/35 bg-white/[0.035] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200/75">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {evidence.city}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-lc-text">{evidence.requirementLabel}</h3>
            <p className="mt-1 text-xs leading-relaxed text-lc-text3">{evidence.focusTitle}</p>
            {(evidence.designUse || evidence.keyIdea) && (
              <p className="mt-3 text-sm leading-relaxed text-lc-text2">{evidence.designUse || evidence.keyIdea}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function StudioHeader({ state, maxDecisions }: { state: DesignStudioState; maxDecisions: number }) {
  return (
    <div className="rounded-xl border border-cyan-300/15 bg-[#081522]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/65">Current class design</p>
          <p className="mt-2 text-base leading-relaxed text-lc-text2">{state.designSummary || 'The class is deciding its starting direction.'}</p>
        </div>
        <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-lc-text2">
          {state.decisions.length}/{maxDecisions} decisions
        </span>
      </div>
      {state.decisions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {state.decisions.map((decision) => (
            <span key={decision.roundNumber} className="rounded-md border border-emerald-300/15 bg-emerald-300/[0.05] px-2.5 py-1 text-xs text-emerald-100/75">
              {decision.roundNumber}. {decision.selectedOption.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DecisionDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lc-text3">{icon}{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-lc-text2">{value}</p>
    </div>
  );
}

function Notice({ message }: { message: string }) {
  return <div className="rounded-lg border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/80">{message}</div>;
}

function DesignBriefView({
  brief,
  decisions,
  notice,
  missionSaveStatus,
  onRetryMissionSave,
}: {
  brief: DesignStudioBrief;
  decisions: number;
  notice: string | null;
  missionSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetryMissionSave?: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {notice && <Notice message={notice} />}
      {missionSaveStatus !== 'idle' && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          missionSaveStatus === 'saved'
            ? 'border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-100/80'
            : missionSaveStatus === 'error'
              ? 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100/80'
              : 'border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100/80'
        }`}>
          {missionSaveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {missionSaveStatus === 'saved' && 'Design mission saved to the class journey.'}
          {missionSaveStatus === 'saving' && 'Saving design mission to the class journey...'}
          {missionSaveStatus === 'error' && 'Design mission status was not saved. The final brief remains available in this session.'}
          {missionSaveStatus === 'error' && onRetryMissionSave && (
            <button
              type="button"
              onClick={onRetryMissionSave}
              className="ml-auto shrink-0 rounded-md border border-amber-200/25 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/10"
            >
              Retry Save
            </button>
          )}
        </div>
      )}
      <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">Final class design - {decisions} decisions</p>
        <h2 className="mt-2 text-4xl font-bold text-lc-text">{brief.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-lc-text2">{brief.summary}</p>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">Class pitch</p>
          <p className="mt-2 text-xl font-semibold leading-relaxed text-cyan-100">{brief.pitch}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <BriefList title="Who It Serves" items={brief.intendedUsers} />
        <BriefList title="Core Features" items={brief.coreFeatures} />
        <BriefList title="Evidence And Reasoning" items={brief.evidenceAndReasoning} />
        <BriefList title="Remaining Tradeoffs" items={brief.remainingTradeoffs} />
      </div>
    </div>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-lc-text2">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm leading-relaxed text-lc-text2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
