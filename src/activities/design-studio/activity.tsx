'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, DraftingCompass, Loader2, MapPin, MessagesSquare, Save, ThumbsUp, TriangleAlert } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';
import { GenerationLoader } from '@/components/ui/generation-loader';
import type {
  DesignStudioBrief,
  DesignStudioContent,
  DesignStudioPhase,
  DesignStudioRound,
  DesignStudioState,
  DesignStudioVote,
} from './types';
import { DesignBlueprint } from '@/components/world-flight/design-blueprint';
import {
  DESIGN_STUDIO_DEFAULT_MAX_DECISIONS,
  argueStarters,
  assignArgueSides,
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
  students,
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
  // Always four: Direction, People, Main Feature, The Hard Choice (each argued, then voted).
  const maxDecisions = DESIGN_STUDIO_DEFAULT_MAX_DECISIONS;
  const worldFlightMission = content.worldFlightMission;
  const [phase, setPhase] = useState<DesignStudioPhase>('idle');
  // Ideas the class said out loud, typed by the teacher (optional). Students never type here: every choice is a tap.
  const [spokenIdeas, setSpokenIdeas] = useState('');
  const [state, setState] = useState<DesignStudioState>(() => initialState(challenge));
  const [round, setRound] = useState<DesignStudioRound | null>(null);
  const [votes, setVotes] = useState<DesignStudioVote[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B' | 'C' | null>(null);
  const [brief, setBrief] = useState<DesignStudioBrief | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [missionSaveStatus, setMissionSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Convince your partner: who argues for which option this round, and the one-minute clock.
  const pairings = useMemo(
    () => assignArgueSides(students ?? [], state.decisions.length),
    [students, state.decisions.length],
  );
  const [argueLeft, setArgueLeft] = useState(ARGUE_SECONDS);
  useEffect(() => {
    if (phase !== 'argue') return;
    setArgueLeft(ARGUE_SECONDS);
    const timer = setInterval(() => setArgueLeft((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase, state.decisions.length]);

  const phaseRef = useRef(phase);
  const stateRef = useRef(state);
  const roundRef = useRef(round);
  const votesRef = useRef(votes);
  const scoredParticipationRef = useRef(new Set<string>());
  const completedMissionRef = useRef(false);
  phaseRef.current = phase;
  stateRef.current = state;
  roundRef.current = round;
  votesRef.current = votes;

  const changePhase = useCallback((next: DesignStudioPhase) => {
    setPhase(next);
    onPhaseChange?.(next === 'complete' ? 'finished' : next);
  }, [onPhaseChange]);

  useEffect(() => {
    if (phase === 'argue' && round) {
      const starters = argueStarters(sessionSettings.difficulty, state.decisions.length);
      const cards: Record<string, { option: string; title: string; starters: string[] }> = {};
      for (const pairing of pairings) {
        pairing.members.forEach((student, index) => {
          const option = round.options.find((candidate) => candidate.id === pairing.options[index]);
          if (!option) return;
          const card = { option: option.id, title: option.title, starters };
          cards[student.id] = card;
          cards[student.name] = card;
        });
      }
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'design-studio',
        instruction: 'Convince your partner',
        prompt: round.question,
        perStudentData: cards,
      });
    } else if (phase === 'voting' && round) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'design-studio',
        instruction: `Design decision ${state.decisions.length + 1} of ${maxDecisions}`,
        prompt: round.question,
        options: round.options.map((option) => option.id),
        // Short labels: the full options are on the class screen, where the talking happens.
        optionLabels: round.options.map((option) => option.title),
        startedAt: Date.now(),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, round, state.decisions.length, maxDecisions, onSetInputSpec, pairings, sessionSettings.difficulty]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (vote.gameKey !== 'design-studio') return;
      if (phaseRef.current === 'voting') {
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
      setNotice('The design brief is complete, but its Design Mission status could not be saved.');
    }
    changePhase('complete');
  }, [changePhase, sessionId, worldFlightMission]);

  const generateStart = useCallback(async () => {
    scoredParticipationRef.current.clear();
    setMissionSaveStatus('idle');
    completedMissionRef.current = false;
    changePhase('generating');
    setNotice(null);
    const said = spokenIdeas.split(/[\n;]+/).map((idea) => idea.trim()).filter(Boolean).slice(0, 12);
    const originalIdeas = said.length ? said : [customTopic || challenge];
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
  }, [challenge, changePhase, content.successCriteria, customTopic, onContinue, sessionSettings.difficulty, spokenIdeas, worldFlightMission]);

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

  const cities = worldFlightMission?.evidence.map((evidence) => evidence.city) ?? [];

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-5xl space-y-6 py-6">
        <div className="text-center">
          <p className={LABEL}>
            <DraftingCompass className="mr-2 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
            {worldFlightMission ? `${worldFlightMission.investigationTitle} · design mission` : 'Design Studio'}
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">{challenge}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-white/60">
            Talk first, then choose together. Every choice is a tap on the phones, and each one changes the design.
          </p>
        </div>
        {worldFlightMission && <MissionEvidence mission={worldFlightMission} />}
        {/* A mission's criteria are its three city tasks, already shown on the city cards above. */}
        {!worldFlightMission && !!content.successCriteria?.length && (
          <div className={`${PANEL} p-5`}>
            <p className={LABEL}>The design must</p>
            <ul className="mt-3 grid gap-2 md:grid-cols-3">
              {content.successCriteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={`${PANEL} p-5`}>
          <p className={LABEL}>
            <MessagesSquare className="mr-2 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
            Say it first
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{content.openingPrompt || 'What should the class design?'}</p>
          <label htmlFor="design-spoken-ideas" className="mt-3 block text-xs text-white/45">Ideas the class says out loud (optional, one per line). They shape the three starting directions.</label>
          <textarea
            id="design-spoken-ideas"
            value={spokenIdeas}
            onChange={(event) => setSpokenIdeas(event.target.value.slice(0, 800))}
            rows={2}
            placeholder="e.g. free buses for students"
            className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-300/50 focus:outline-none"
          />
        </div>
        <button onClick={() => void generateStart()} className={`${PRIMARY} mx-auto flex items-center gap-2`}>
          <DraftingCompass className="h-4 w-4" aria-hidden />
          Show three starting directions
        </button>
      </div>
    );
  }

  if (phase === 'generating' || phase === 'finalizing') {
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center gap-4 text-center">
        <GenerationLoader label={phase === 'finalizing' ? 'design brief' : 'design question'} />
        <p className="max-w-lg text-sm text-white/50">Looking at the whole design and every decision the class has made so far.</p>
      </div>
    );
  }

  if (phase === 'complete' && brief) {
    return (
      <DesignBriefView
        brief={brief}
        state={state}
        mission={worldFlightMission}
        designers={scoredDesigners(scoredParticipationRef.current)}
        notice={notice}
        missionSaveStatus={worldFlightMission ? missionSaveStatus : 'idle'}
        onRetryMissionSave={worldFlightMission && missionSaveStatus === 'error'
          ? () => void finishWithBrief(brief, stateRef.current)
          : undefined}
      />
    );
  }

  const selectedOption = round?.options.find((option) => option.id === selectedOptionId) ?? null;
  const backedBy = (city?: string) => cities.find((name) => !!city && name.toLowerCase() === city.toLowerCase()) ?? null;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <StudioHeader state={state} maxDecisions={maxDecisions} cities={cities} />
      {notice && <Notice message={notice} />}
      {phase === 'decision' && selectedOption ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.06] p-7">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
            The class decided{votes.length > 0 ? ` · ${voteCounts[selectedOption.id]} of ${votes.length} votes` : ''}
          </p>
          <h2 className="mt-2 font-display text-4xl text-white">{selectedOption.title}</h2>
          {backedBy(selectedOption.city) && <CityTag city={backedBy(selectedOption.city)!} />}
          <p className="mt-3 text-lg leading-relaxed text-white/75">{selectedOption.designChange}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <DecisionDetail icon={<ThumbsUp className="h-4 w-4" />} label="What we gain" value={selectedOption.benefit} />
            <DecisionDetail icon={<TriangleAlert className="h-4 w-4" />} label="What we give up" value={selectedOption.tradeoff} />
            <DecisionDetail icon={<MessagesSquare className="h-4 w-4" />} label="Say it" value={`"We chose ${selectedOption.id} because…" One student says it for the class.`} />
          </div>
          <button onClick={() => void continueDesign()} className={`${PRIMARY} mt-6`}>
            {state.decisions.length >= maxDecisions ? 'Build our blueprint' : 'Next decision'}
          </button>
        </motion.div>
      ) : round ? (
        <>
          <div className={`${PANEL} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <p className={LABEL}>{round.stage}</p>
              {phase === 'voting' && <span className="font-mono text-xs text-white/50">{votes.length} {votes.length === 1 ? 'vote' : 'votes'}</span>}
              {phase === 'argue' && (
                <span className={`font-mono text-2xl font-bold tabular-nums ${argueLeft === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {Math.floor(argueLeft / 60)}:{String(argueLeft % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            <h2 className="mt-2 font-display text-3xl leading-tight text-white sm:text-4xl">{round.question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{round.whyItMatters}</p>
            {phase === 'argue' && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-amber-300 transition-[width] duration-1000 ease-linear" style={{ width: `${(argueLeft / ARGUE_SECONDS) * 100}%` }} />
              </div>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {round.options.map((option) => (
              <div key={option.id} className={`${PANEL} flex flex-col p-5`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/15 font-mono text-lg font-bold text-amber-200">{option.id}</span>
                  {phase === 'voting' && <span className="font-mono text-sm font-semibold text-amber-200/80">{voteCounts[option.id]}</span>}
                </div>
                <h3 className="mt-4 text-xl font-bold leading-tight text-white">{option.title}</h3>
                {backedBy(option.city) && <CityTag city={backedBy(option.city)!} />}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{option.description}</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm leading-relaxed">
                  <p className="text-emerald-200/85"><strong>Gain:</strong> {option.benefit}</p>
                  <p className="text-amber-200/80"><strong>Give up:</strong> {option.tradeoff}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Who argues for what: helps the teacher run the room. No answers or scores here. */}
          {phase === 'argue' && pairings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pairings.map((pairing) => (
                <span key={pairing.members.map((student) => student.id).join('-')} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-white/70">
                  {pairing.members.map((student, index) => (
                    <span key={student.id}>
                      {index > 0 && <span className="mx-1.5 text-white/30">·</span>}
                      {student.name} <b className="font-mono text-amber-300">{pairing.options[index]}</b>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/50">
              {phase === 'voting'
                ? 'Phones show A, B and C. Vote for the one you really want.'
                : phase === 'argue'
                  ? 'Each phone has one option to argue for. Partners have different ones.'
                  : pairings.length > 0
                    ? 'First, one minute to convince a partner. Then the vote.'
                    : 'Talk first: which would you choose, and why?'}
            </p>
            <button
              onClick={phase === 'voting'
                ? closeVote
                : phase === 'question' && pairings.length > 0
                  ? () => changePhase('argue')
                  : () => { setVotes([]); changePhase('voting'); }}
              className={PRIMARY}
            >
              {phase === 'voting' ? 'Close the vote' : phase === 'question' && pairings.length > 0 ? 'Convince your partner (1 min)' : 'Open the class vote'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// The app's current look: night panels, amber mono labels, serif display headings, cyan primary buttons.
const ARGUE_SECONDS = 60;
const PANEL = 'rounded-2xl border border-white/[0.07] bg-[#0a121e]/85';
const LABEL = 'font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80';
const PRIMARY = 'rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300';

/** The city whose lesson an option (or decision) draws on. */
function CityTag({ city }: { city: string }) {
  return (
    <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-100">
      <MapPin className="h-3 w-3" aria-hidden />
      From {city}
    </span>
  );
}

function MissionEvidence({ mission }: { mission: WorldFlightDesignMissionContext }) {
  return (
    <section className="space-y-3">
      <p className={LABEL}>What the class found in three cities</p>
      <div className="grid gap-3 md:grid-cols-3">
        {mission.evidence.map((evidence) => (
          <article key={evidence.requirementId} className={`${PANEL} p-4`}>
            <p className="flex items-center gap-1.5 font-display text-xl text-white">
              <MapPin className="h-4 w-4 text-cyan-300" aria-hidden />
              {evidence.city}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{evidence.requirementLabel}</p>
            {(evidence.designUse || evidence.keyIdea) && (
              <p className="mt-3 text-sm leading-relaxed text-white/75">{evidence.designUse || evidence.keyIdea}</p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-white/40">{evidence.focusTitle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudioHeader({ state, maxDecisions, cities }: { state: DesignStudioState; maxDecisions: number; cities: string[] }) {
  return (
    <div className={`${PANEL} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={LABEL}>Our design so far</p>
          <p className="mt-2 text-base leading-relaxed text-white/80">{state.designSummary || 'The class is choosing its starting direction.'}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs font-semibold text-white/70">
          {state.decisions.length}/{maxDecisions}
        </span>
      </div>
      {(state.decisions.length > 0 || cities.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          {state.decisions.map((decision) => (
            <span key={decision.roundNumber} className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-2.5 py-1 text-xs text-emerald-100/85">
              {decision.roundNumber}. {decision.selectedOption.title}
            </span>
          ))}
          {/* The three cities stay in view: the design is meant to use what the class found there. */}
          {cities.length > 0 && (
            <span className="ml-auto flex flex-wrap items-center gap-1.5 text-xs text-white/45">
              <MapPin className="h-3 w-3" aria-hidden />
              {cities.join(' · ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DecisionDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">{icon}{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{value}</p>
    </div>
  );
}

function Notice({ message }: { message: string }) {
  return <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/85">{message}</div>;
}

/** How many different students voted at least once (the "designers" on the blueprint). */
function scoredDesigners(keys: Set<string>): number {
  return new Set(Array.from(keys).map((key) => key.split(':').slice(-1)[0])).size;
}

function DesignBriefView({
  brief,
  state,
  mission,
  designers,
  notice,
  missionSaveStatus,
  onRetryMissionSave,
}: {
  brief: DesignStudioBrief;
  state: DesignStudioState;
  mission?: WorldFlightDesignMissionContext;
  designers: number;
  notice: string | null;
  missionSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetryMissionSave?: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      {notice && <Notice message={notice} />}
      <DesignBlueprint
        brief={brief}
        decisions={state.decisions}
        cities={mission?.evidence.map((evidence) => ({ city: evidence.city, found: evidence.designUse || evidence.keyIdea })) ?? []}
        missionTitle={mission?.investigationTitle}
        designers={designers}
        completedAt={new Date().toISOString()}
        animate
      />
      {missionSaveStatus !== 'idle' && (
        <div className={`mx-auto flex max-w-4xl items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          missionSaveStatus === 'saved'
            ? 'border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-100/85'
            : missionSaveStatus === 'error'
              ? 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100/85'
              : 'border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100/85'
        }`}>
          {missionSaveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {missionSaveStatus === 'saved' && 'Saved to the class journey. Open it again from World Flight.'}
          {missionSaveStatus === 'saving' && 'Saving to the class journey...'}
          {missionSaveStatus === 'error' && 'This blueprint was not saved to the class journey yet. It is still here on screen.'}
          {missionSaveStatus === 'error' && onRetryMissionSave && (
            <button
              type="button"
              onClick={onRetryMissionSave}
              className="ml-auto shrink-0 rounded-lg border border-amber-200/25 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/10"
            >
              Try again
            </button>
          )}
        </div>
      )}
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        <BriefList title="Who it is for" items={brief.intendedUsers} />
        <BriefList title="What we gave up" items={brief.remainingTradeoffs} />
      </div>
    </div>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={`${PANEL} p-5`}>
      <h3 className={LABEL}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
