'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plane, Lock, ChevronRight, Users, AlertCircle, MessageSquare } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type {
  CabinMysteryContent,
  CabinMysteryPhase,
  CabinRole,
  CabinEvidence,
  CabinSuspect,
  CabinQuestionRecord,
  CabinFinalVotePayload,
} from './types';
import { switchedSuitcase } from './cases/switched-suitcase';

// ──────────────────────────────────────────────────────────────────────────────
// Role assignment helpers
// ──────────────────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRolePool(studentCount: number, content: CabinMysteryContent): CabinRole[] {
  const culprit = content.requiredRoles.find((r) => r.isCulprit);
  const otherRequired = content.requiredRoles.filter((r) => !r.isCulprit);
  const pool: CabinRole[] = culprit ? [culprit] : [];
  for (const role of otherRequired) {
    if (pool.length >= studentCount) break;
    pool.push(role);
  }
  for (const role of content.optionalRoles) {
    if (pool.length >= studentCount) break;
    pool.push(role);
  }
  return pool;
}

function buildRoleAssignments(
  students: Student[],
  content: CabinMysteryContent
): Record<string, CabinRole> {
  const pool = buildRolePool(students.length, content);
  const shuffled = shuffleArray(pool);
  const result: Record<string, CabinRole> = {};
  students.forEach((s, i) => {
    result[s.name] = shuffled[i % shuffled.length];
  });
  return result;
}

function buildActiveEvidenceCards(
  content: CabinMysteryContent,
  assignedRoleIds: Set<string>
): [CabinEvidence, CabinEvidence, CabinEvidence] {
  return content.evidenceCards.map((card) => {
    if (!card.includesFallbackClue) return card;
    const applicable = content.fallbackClues.filter(
      (f) =>
        f.appearsInCardNumber === card.cardNumber &&
        !assignedRoleIds.has(f.onlyIfRoleIdMissing)
    );
    if (applicable.length === 0) return card;
    return {
      ...card,
      content: card.content + ' ' + applicable.map((f) => f.clueText).join(' '),
    };
  }) as [CabinEvidence, CabinEvidence, CabinEvidence];
}

// ──────────────────────────────────────────────────────────────────────────────
// InputSpec builders
// ──────────────────────────────────────────────────────────────────────────────

function buildInvestigationSpec(
  content: CabinMysteryContent,
  assignments: Record<string, CabinRole>,
  revealedCardCount: number,
  currentRound: 1 | 2,
  currentQuestion: CabinQuestionRecord | null
): InputSpec {
  const playedByBySuspectId = Object.fromEntries(
    Object.entries(assignments).map(([studentName, role]) => [role.suspectId, studentName])
  );
  const suspectsWithPlayers = content.suspects.map((suspect) => ({
    ...suspect,
    playedBy: playedByBySuspectId[suspect.id] ?? null,
  }));
  const always = content.questionBank.alwaysAvailable;
  const evidenceSpecific = content.questionBank.evidenceSpecific
    .filter((g) => g.afterCardNumber <= revealedCardCount)
    .flatMap((g) => g.questions);

  const availableByTarget: Record<string, Array<{ id: string; text: string }>> = {};
  for (const suspect of content.suspects) {
    const charSpecific =
      content.questionBank.characterSpecific.find(
        (g) => g.targetSuspectId === suspect.id
      )?.questions ?? [];
    availableByTarget[suspect.id] = [
      ...always.map((q) => ({ id: q.id, text: q.text })),
      ...evidenceSpecific.map((q) => ({ id: q.id, text: q.text })),
      ...charSpecific.map((q) => ({ id: q.id, text: q.text })),
    ];
  }

  const perStudentData: Record<string, unknown> = {};
  for (const [studentName, role] of Object.entries(assignments)) {
    perStudentData[studentName] = {
      mySuspectId: role.suspectId,
      myRole: role,
      suspects: suspectsWithPlayers,
      availableByTarget,
      isCurrentTarget: currentQuestion
        ? role.suspectId === currentQuestion.targetSuspectId
        : false,
      currentQuestionText: currentQuestion?.questionText ?? null,
      currentQuestionAskerName: currentQuestion?.askerName ?? null,
      roundNumber: currentRound,
    };
  }

  return { type: 'cabin-question', gameKey: 'cabin-mystery', perStudentData };
}

function buildVotingSpec(
  content: CabinMysteryContent,
  assignments: Record<string, CabinRole>,
  activeCards: [CabinEvidence, CabinEvidence, CabinEvidence],
  revealedCardCount: number
): InputSpec {
  const revealedCards = activeCards.slice(0, revealedCardCount).map((c) => ({
    cardNumber: c.cardNumber,
    label: c.label,
  }));
  const sharedData = { suspects: content.suspects, revealedCards };
  const perStudentData: Record<string, unknown> = {};
  for (const studentName of Object.keys(assignments)) {
    perStudentData[studentName] = sharedData;
  }
  return { type: 'cabin-vote', gameKey: 'cabin-mystery', perStudentData };
}

function buildCulpritSideSpec(
  content: CabinMysteryContent,
  assignments: Record<string, CabinRole>
): InputSpec {
  const culpritSuspect = content.suspects.find(
    (s) => s.id === content.solution.culpritSuspectId
  );
  const characterName = culpritSuspect?.name ?? 'The Culprit';
  const culpritStudentName =
    Object.entries(assignments).find(([, r]) => r.isCulprit)?.[0] ?? null;

  const perStudentData: Record<string, unknown> = {};
  for (const studentName of Object.keys(assignments)) {
    if (studentName === culpritStudentName) {
      perStudentData[studentName] = {
        isCulprit: true,
        characterName,
        culpritSidePrompt: content.solution.culpritSidePrompt,
        sentenceStems: content.solution.culpritSideSentenceStems,
      };
    } else {
      perStudentData[studentName] = { isCulprit: false, characterName };
    }
  }
  return { type: 'cabin-culprit', gameKey: 'cabin-mystery', perStudentData };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main activity component
// ──────────────────────────────────────────────────────────────────────────────

type FinalVote = CabinFinalVotePayload & { displayName: string };

export function CabinMysteryActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content: CabinMysteryContent =
    (generatedContent as CabinMysteryContent)?.caseId
      ? (generatedContent as CabinMysteryContent)
      : switchedSuitcase;

  const [phase, setPhase] = useState<CabinMysteryPhase>('idle');
  const [assignments, setAssignments] = useState<Record<string, CabinRole>>({});
  const [activeCards, setActiveCards] = useState<[CabinEvidence, CabinEvidence, CabinEvidence]>(
    content.evidenceCards
  );
  const [confirmedClientIds, setConfirmedClientIds] = useState<Set<string>>(new Set());
  const [revealedCardCount, setRevealedCardCount] = useState<0 | 1 | 2 | 3>(0);

  // Question round state
  const [questionRoundOpen, setQuestionRoundOpen] = useState(false);
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [questionLog, setQuestionLog] = useState<CabinQuestionRecord[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CabinQuestionRecord | null>(null);

  // Voting state
  const [votes, setVotes] = useState<FinalVote[]>([]);

  // Refs for vote handler (avoids stale closures)
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const confirmedClientIdsRef = useRef(confirmedClientIds);
  confirmedClientIdsRef.current = confirmedClientIds;
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;
  const questionRoundOpenRef = useRef(questionRoundOpen);
  questionRoundOpenRef.current = questionRoundOpen;
  const currentRoundRef = useRef(currentRound);
  currentRoundRef.current = currentRound;
  const askedThisRoundRef = useRef(new Set<string>());
  const votedClientIdsRef = useRef(new Set<string>());

  const enoughStudents = students.length >= 4;

  // ── InputSpec (unified across all phases) ─────────────────────────────────
  useEffect(() => {
    if (phase === 'briefing') {
      const perStudentData: Record<string, unknown> = {};
      Object.entries(assignments).forEach(([name, role]) => {
        perStudentData[name] = role;
      });
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'cabin-mystery',
        prompt: 'Read your role card carefully before the investigation begins.',
        buttonLabel: "I've read my card",
        perStudentData,
      });
    } else if (phase === 'investigation' && questionRoundOpen) {
      onSetInputSpec?.(
        buildInvestigationSpec(content, assignments, revealedCardCount, currentRound, currentQuestion)
      );
    } else if (phase === 'voting') {
      onSetInputSpec?.(buildVotingSpec(content, assignments, activeCards, revealedCardCount));
    } else if (phase === 'culprit-side') {
      onSetInputSpec?.(buildCulpritSideSpec(content, assignments));
    } else {
      onSetInputSpec?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, questionRoundOpen, revealedCardCount, currentQuestion]);

  // ── Remote vote handler ────────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'briefing') {
        if (confirmedClientIdsRef.current.has(vote.clientId)) return;
        setConfirmedClientIds((prev) => new Set(Array.from(prev).concat([vote.clientId])));

      } else if (phaseRef.current === 'investigation' && questionRoundOpenRef.current) {
        if (askedThisRoundRef.current.has(vote.clientId)) return;
        try {
          const payload = JSON.parse(vote.choice) as {
            targetSuspectId: string;
            questionId: string;
            questionText: string;
          };
          const targetStudentName =
            Object.entries(assignmentsRef.current).find(
              ([, r]) => r.suspectId === payload.targetSuspectId
            )?.[0] ?? null;
          const record: CabinQuestionRecord = {
            roundNumber: currentRoundRef.current,
            askerClientId: vote.clientId,
            askerName: vote.displayName,
            questionId: payload.questionId,
            questionText: payload.questionText,
            targetSuspectId: payload.targetSuspectId,
            targetStudentName,
            askedAt: Date.now(),
          };
          setQuestionLog((prev) => [...prev, record]);
          askedThisRoundRef.current = new Set(
            Array.from(askedThisRoundRef.current).concat([vote.clientId])
          );
        } catch {
          // not a valid question payload — ignore
        }

      } else if (phaseRef.current === 'voting') {
        if (votedClientIdsRef.current.has(vote.clientId)) return;
        try {
          const payload = JSON.parse(vote.choice) as CabinFinalVotePayload;
          if (!payload.suspectId || typeof payload.motive !== 'string') return;
          setVotes((prev) => [...prev, { ...payload, displayName: vote.displayName }]);
          votedClientIdsRef.current = new Set(
            Array.from(votedClientIdsRef.current).concat([vote.clientId])
          );
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: 1,
            points: 0,
            isCorrect: null,
            outcome: 'on-task',
          });
        } catch {
          // not a valid vote payload — ignore
        }
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  // ── Phase transition handlers ──────────────────────────────────────────────
  const handleAssignRoles = useCallback(() => {
    const newAssignments = buildRoleAssignments(students, content);
    const assignedRoleIds = new Set(Object.values(newAssignments).map((r) => r.id));
    const newActiveCards = buildActiveEvidenceCards(content, assignedRoleIds);
    setAssignments(newAssignments);
    setActiveCards(newActiveCards);
    setConfirmedClientIds(new Set());
    setRevealedCardCount(0);
    setCurrentRound(1);
    setQuestionLog([]);
    setCurrentQuestion(null);
    setQuestionRoundOpen(false);
    setVotes([]);
    votedClientIdsRef.current = new Set();
    askedThisRoundRef.current = new Set();
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [students, content, onPhaseChange]);

  const handleStartInvestigation = useCallback(() => {
    setPhase('investigation');
    onPhaseChange?.('investigation');
  }, [onPhaseChange]);

  const handleRevealNextCard = useCallback(() => {
    setRevealedCardCount((prev) => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3);
  }, []);

  const handleOpenVoting = useCallback(() => {
    votedClientIdsRef.current = new Set();
    setVotes([]);
    setPhase('voting');
    onPhaseChange?.('voting');
  }, [onPhaseChange]);

  const handleRevealCulpritSide = useCallback(() => {
    setPhase('culprit-side');
    onPhaseChange?.('culprit-side');
  }, [onPhaseChange]);

  const handleShowFullReveal = useCallback(() => {
    setPhase('reveal');
    onPhaseChange?.('reveal');
  }, [onPhaseChange]);

  const handleDone = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('done');
  }, [onPhaseChange]);

  // ── Question round handlers ────────────────────────────────────────────────
  const handleOpenQuestionRound = useCallback(() => {
    const round: 1 | 2 = revealedCardCount >= 2 ? 2 : 1;
    setCurrentRound(round);
    setCurrentQuestion(null);
    askedThisRoundRef.current = new Set();
    setQuestionRoundOpen(true);
  }, [revealedCardCount]);

  const handleCloseQuestionRound = useCallback(() => {
    setQuestionRoundOpen(false);
    setCurrentQuestion(null);
  }, []);

  const handleCallQuestion = useCallback((record: CabinQuestionRecord) => {
    setCurrentQuestion(record);
  }, []);

  const handleClearCurrentQuestion = useCallback(() => {
    setCurrentQuestion(null);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const culpritSuspect = content.suspects.find(
    (s) => s.id === content.solution.culpritSuspectId
  ) ?? content.suspects[0];
  const culpritStudentName =
    Object.entries(assignments).find(([, r]) => r.isCulprit)?.[0] ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Case board: briefing / investigation / voting / culprit-side */}
      {phase !== 'idle' && phase !== 'reveal' && phase !== 'done' && (
        <CabinCaseBoard
          content={content}
          phase={phase}
          assignments={assignments}
          activeCards={activeCards}
          revealedCardCount={revealedCardCount}
          confirmedCount={confirmedClientIds.size}
          totalStudents={students.length}
          currentQuestion={currentQuestion}
          voteCount={phase === 'voting' ? votes.length : undefined}
        />
      )}

      {/* Reveal panel: replaces case board */}
      {phase === 'reveal' && <RevealPanel content={content} />}

      {/* Investigation question queue */}
      {phase === 'investigation' && questionRoundOpen && (
        <QuestionQueuePanel
          questionLog={questionLog}
          currentRound={currentRound}
          currentQuestion={currentQuestion}
          suspects={content.suspects}
          students={students}
          onCallQuestion={handleCallQuestion}
          onClearCurrentQuestion={handleClearCurrentQuestion}
        />
      )}

      {/* Voting tally */}
      {phase === 'voting' && (
        <VotingTallyPanel
          votes={votes}
          suspects={content.suspects}
          totalStudents={students.length}
        />
      )}

      {/* Culprit side banner */}
      {phase === 'culprit-side' && (
        <CulpritSideBanner
          culpritSuspect={culpritSuspect}
          culpritStudentName={culpritStudentName}
        />
      )}

      {/* Done: full-center layout */}
      {phase === 'done' && (
        <div className="flex-1 flex items-center justify-center">
          <DoneControls onRestart={handleAssignRoles} />
        </div>
      )}

      {/* Bottom controls (all phases except done) */}
      {phase !== 'done' && (
        <div className="flex items-end justify-center p-6 pb-8">
          {phase === 'idle' && (
            <IdleScreen
              content={content}
              students={students}
              enoughStudents={enoughStudents}
              onStart={handleAssignRoles}
            />
          )}

          {phase === 'briefing' && (
            <BriefingControls
              confirmedCount={confirmedClientIds.size}
              totalStudents={students.length}
              onStartInvestigation={handleStartInvestigation}
            />
          )}

          {phase === 'investigation' && (
            <InvestigationControls
              revealedCardCount={revealedCardCount}
              questionRoundOpen={questionRoundOpen}
              onRevealNext={handleRevealNextCard}
              onOpenQuestionRound={handleOpenQuestionRound}
              onCloseQuestionRound={handleCloseQuestionRound}
              onOpenVoting={handleOpenVoting}
            />
          )}

          {phase === 'voting' && (
            <VotingControls
              votes={votes}
              totalStudents={students.length}
              onRevealCulpritSide={handleRevealCulpritSide}
            />
          )}

          {phase === 'culprit-side' && (
            <CulpritSideControls onShowFullReveal={handleShowFullReveal} />
          )}

          {phase === 'reveal' && (
            <RevealControls onDone={handleDone} />
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function IdleScreen({
  content,
  students,
  enoughStudents,
  onStart,
}: {
  content: CabinMysteryContent;
  students: Student[];
  enoughStudents: boolean;
  onStart: () => void;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center">
          <Plane className="w-8 h-8 text-indigo-300" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-slate-400 text-sm">{content.setting}</p>
      </div>

      <div className="w-full bg-indigo-950/40 border border-indigo-800/30 rounded-xl p-5">
        <p className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">The Incident</p>
        <p className="text-slate-200 leading-relaxed">{content.incident}</p>
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        <Users className="w-4 h-4" />
        <span className="text-sm">
          {students.length} student{students.length !== 1 ? 's' : ''} in session
        </span>
      </div>

      {!enoughStudents && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Cabin Mystery works best with 4 or more students. You can still assign roles, but some role cards may repeat.
        </div>
      )}

      <button
        onClick={onStart}
        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-lg transition-colors"
      >
        Assign Roles + Brief Students
      </button>
    </div>
  );
}

function CabinCaseBoard({
  content,
  phase,
  assignments,
  activeCards,
  revealedCardCount,
  confirmedCount,
  totalStudents,
  currentQuestion,
  voteCount,
}: {
  content: CabinMysteryContent;
  phase: CabinMysteryPhase;
  assignments: Record<string, CabinRole>;
  activeCards: [CabinEvidence, CabinEvidence, CabinEvidence];
  revealedCardCount: 0 | 1 | 2 | 3;
  confirmedCount: number;
  totalStudents: number;
  currentQuestion: CabinQuestionRecord | null;
  voteCount?: number;
}) {
  const currentTargetName = currentQuestion
    ? content.suspects.find((s) => s.id === currentQuestion.targetSuspectId)?.name
    : null;
  const playedByBySuspectId = Object.fromEntries(
    Object.entries(assignments).map(([studentName, role]) => [role.suspectId, studentName])
  );

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-indigo-400" />
          <span className="text-slate-400 text-sm font-mono">{content.setting}</span>
        </div>
        <PhaseTag phase={phase} />
      </div>

      <div className="bg-indigo-950/40 border border-indigo-800/30 rounded-xl p-5">
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed">{content.incident}</p>
        {phase === 'briefing' && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-slate-400">Cards confirmed:</span>
            <span className={confirmedCount >= totalStudents ? 'text-green-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {confirmedCount} / {totalStudents}
            </span>
          </div>
        )}
        {phase === 'voting' && voteCount !== undefined && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-slate-400">Theories received:</span>
            <span className="text-rose-400 font-semibold">{voteCount} / {totalStudents}</span>
          </div>
        )}
      </div>

      {/* Current question banner */}
      {currentQuestion && currentTargetName && (
        <div className="bg-indigo-900/60 border border-indigo-500/50 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold mb-1">
            Current Question — Round {currentQuestion.roundNumber}
          </p>
          <p className="text-xs text-slate-400 mb-1">
            <span className="text-slate-200 font-semibold">{currentQuestion.askerName}</span>
            {' asks '}
            <span className="text-indigo-300 font-semibold">{currentTargetName}</span>
            {currentQuestion.targetStudentName && (
              <span className="text-slate-400"> ({currentQuestion.targetStudentName})</span>
            )}
            :
          </p>
          <p className="text-base text-white font-medium">&ldquo;{currentQuestion.questionText}&rdquo;</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Passenger Manifest
          </p>
          <ul className="space-y-2">
            {content.suspects.map((suspect) => {
              const isCurrentTarget = currentQuestion?.targetSuspectId === suspect.id;
              const playedBy = playedByBySuspectId[suspect.id];
              return (
                <li key={suspect.id} className={`flex items-center gap-2 text-sm ${isCurrentTarget ? 'text-indigo-300' : ''}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrentTarget ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                  <span className={isCurrentTarget ? 'font-semibold' : 'text-slate-200'}>{suspect.name}</span>
                  {playedBy && (
                    <span className="text-cyan-300/80 text-xs">
                      played by {playedBy}
                    </span>
                  )}
                  <span className="text-slate-500 text-xs ml-auto">{suspect.seatOrRole}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Evidence Board
          </p>
          <div className="space-y-3">
            {activeCards.map((card, i) => (
              <EvidenceSlot key={card.cardNumber} card={card} revealed={i < revealedCardCount} />
            ))}
          </div>
        </div>
      </div>

      <RoleAssignmentPanel assignments={assignments} suspects={content.suspects} />
    </div>
  );
}

function PhaseTag({ phase }: { phase: CabinMysteryPhase }) {
  const labels: Record<CabinMysteryPhase, string> = {
    idle: 'Idle',
    briefing: 'Briefing',
    investigation: 'Investigation',
    voting: 'Final Theory',
    'culprit-side': "Culprit's Side",
    reveal: 'Reveal',
    done: 'Done',
  };
  const colors: Partial<Record<CabinMysteryPhase, string>> = {
    briefing: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/40',
    investigation: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
    voting: 'bg-rose-900/60 text-rose-300 border-rose-700/40',
    'culprit-side': 'bg-purple-900/60 text-purple-300 border-purple-700/40',
    reveal: 'bg-green-900/60 text-green-300 border-green-700/40',
    done: 'bg-slate-800 text-slate-300 border-slate-700/40',
  };
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
        colors[phase] ?? 'bg-slate-800 text-slate-400 border-slate-700/40'
      }`}
    >
      {labels[phase]}
    </span>
  );
}

function EvidenceSlot({ card, revealed }: { card: CabinEvidence; revealed: boolean }) {
  if (!revealed) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
        <Lock className="w-4 h-4 text-slate-600 shrink-0" />
        <span className="text-xs text-slate-600">Evidence Card {card.cardNumber}</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-amber-950/40 border border-amber-700/40 p-3">
      <p className="text-xs font-semibold text-amber-400 mb-1">{card.label}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{card.content}</p>
      <p className="text-xs text-amber-300/70 italic mt-2">{card.implication}</p>
    </div>
  );
}

function RoleAssignmentPanel({
  assignments,
  suspects,
}: {
  assignments: Record<string, CabinRole>;
  suspects: CabinSuspect[];
}) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(assignments);
  if (entries.length === 0) return null;
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>
          ROLE ASSIGNMENTS{' '}
          <span className="text-amber-500 font-normal">— keep collapsed when screen-sharing</span>
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {entries.map(([studentName, role]) => (
            <div
              key={studentName}
              className={`text-xs px-3 py-2 rounded-lg border ${
                role.isCulprit
                  ? 'bg-rose-950/40 border-rose-700/40 text-rose-300'
                  : 'bg-slate-800/50 border-slate-700/30 text-slate-300'
              }`}
            >
              <span className="font-semibold">{studentName}</span>
              <span className="text-slate-500 ml-2">→</span>
              <span className="ml-2">
                {suspects.find((s) => s.id === role.suspectId)?.name ?? role.publicIdentity}
              </span>
              {role.isCulprit && <span className="ml-2 text-rose-400 font-bold">★</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BriefingControls({
  confirmedCount,
  totalStudents,
  onStartInvestigation,
}: {
  confirmedCount: number;
  totalStudents: number;
  onStartInvestigation: () => void;
}) {
  const allConfirmed = confirmedCount >= totalStudents;
  return (
    <div className="flex flex-col items-center gap-3">
      {!allConfirmed && (
        <p className="text-sm text-slate-400">
          Waiting for students to confirm their role cards ({confirmedCount} / {totalStudents})
        </p>
      )}
      {allConfirmed && (
        <p className="text-sm text-green-400 font-semibold">All students have read their cards.</p>
      )}
      <button
        onClick={onStartInvestigation}
        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors"
      >
        Start Investigation →
      </button>
    </div>
  );
}

function InvestigationControls({
  revealedCardCount,
  questionRoundOpen,
  onRevealNext,
  onOpenQuestionRound,
  onCloseQuestionRound,
  onOpenVoting,
}: {
  revealedCardCount: 0 | 1 | 2 | 3;
  questionRoundOpen: boolean;
  onRevealNext: () => void;
  onOpenQuestionRound: () => void;
  onCloseQuestionRound: () => void;
  onOpenVoting: () => void;
}) {
  if (revealedCardCount === 3 && !questionRoundOpen) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-slate-400">
          All evidence revealed. Let students react briefly, then open voting.
        </p>
        <button
          onClick={onOpenVoting}
          className="px-6 py-3 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors"
        >
          Open Final Theory →
        </button>
      </div>
    );
  }

  if (questionRoundOpen) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
          Question Round Open — Students are submitting questions
        </p>
        <button
          onClick={onCloseQuestionRound}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
        >
          Close Question Round
        </button>
      </div>
    );
  }

  const canOpenQuestions = revealedCardCount === 1 || revealedCardCount === 2;
  const canRevealNext = revealedCardCount < 3;
  const nextCard = (revealedCardCount + 1) as 1 | 2 | 3;
  const revealLabels: Record<1 | 2 | 3, string> = {
    1: 'Reveal Evidence Card 1',
    2: 'Reveal Evidence Card 2',
    3: 'Reveal Evidence Card 3',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {canOpenQuestions && (
        <p className="text-sm text-slate-400">
          Discuss the evidence, then open questions or reveal the next card.
        </p>
      )}
      <div className="flex gap-3 flex-wrap justify-center">
        {canOpenQuestions && (
          <button
            onClick={onOpenQuestionRound}
            className="px-6 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
          >
            Open Question Round {revealedCardCount === 1 ? 1 : 2}
          </button>
        )}
        {canRevealNext && (
          <button
            onClick={onRevealNext}
            className={`px-6 py-3 font-semibold rounded-xl transition-colors ${
              revealedCardCount === 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {revealLabels[nextCard]}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionQueuePanel({
  questionLog,
  currentRound,
  currentQuestion,
  suspects,
  students,
  onCallQuestion,
  onClearCurrentQuestion,
}: {
  questionLog: CabinQuestionRecord[];
  currentRound: 1 | 2;
  currentQuestion: CabinQuestionRecord | null;
  suspects: CabinSuspect[];
  students: Student[];
  onCallQuestion: (record: CabinQuestionRecord) => void;
  onClearCurrentQuestion: () => void;
}) {
  const roundLog = questionLog.filter((q) => q.roundNumber === currentRound);
  const askedNames = new Set(roundLog.map((q) => q.askerName));
  const notYetAsked = students.filter((s) => !askedNames.has(s.name));

  const suspectCounts: Record<string, number> = {};
  for (const q of roundLog) {
    suspectCounts[q.targetSuspectId] = (suspectCounts[q.targetSuspectId] ?? 0) + 1;
  }

  return (
    <div className="mx-6 mb-2 rounded-xl border border-indigo-700/30 bg-indigo-950/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-700/20">
        <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm font-semibold text-indigo-300">
          Question Round {currentRound}
        </span>
        <span className="text-xs text-slate-500 ml-1">({roundLog.length} submitted)</span>
      </div>

      <div className="p-4 space-y-3">
        {roundLog.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suspects.map((s) => {
              const count = suspectCounts[s.id] ?? 0;
              if (count === 0) return null;
              return (
                <span key={s.id} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                  {s.name} ×{count}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {askedNames.size > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Asked:</span>
              {Array.from(askedNames).map((name) => (
                <span key={name} className="text-xs px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          )}
          {notYetAsked.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Waiting:</span>
              {notYetAsked.map((s) => (
                <span key={s.id} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {roundLog.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-2">
            Waiting for students to submit questions…
          </p>
        ) : (
          <div className="space-y-2">
            {roundLog.map((record) => {
              const targetName =
                suspects.find((s) => s.id === record.targetSuspectId)?.name ??
                record.targetSuspectId;
              const isCurrent =
                currentQuestion?.questionId === record.questionId &&
                currentQuestion?.askerClientId === record.askerClientId;
              return (
                <div
                  key={`${record.askerClientId}-${record.questionId}-${record.askedAt}`}
                  className={`rounded-xl p-3 border ${
                    isCurrent
                      ? 'bg-indigo-900/60 border-indigo-500/50'
                      : 'bg-slate-900/50 border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-1">
                        <span className="text-slate-200 font-semibold">{record.askerName}</span>
                        {' → '}
                        <span className="text-indigo-300 font-semibold">{targetName}</span>
                        {record.targetStudentName && (
                          <span className="text-slate-500 ml-1">
                            (played by {record.targetStudentName})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-200">&ldquo;{record.questionText}&rdquo;</p>
                    </div>
                    <div className="shrink-0">
                      {isCurrent ? (
                        <button
                          onClick={onClearCurrentQuestion}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={() => onCallQuestion(record)}
                          className="px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VotingTallyPanel({
  votes,
  suspects,
  totalStudents,
}: {
  votes: FinalVote[];
  suspects: CabinSuspect[];
  totalStudents: number;
}) {
  const tally: Record<string, number> = {};
  for (const v of votes) {
    tally[v.suspectId] = (tally[v.suspectId] ?? 0) + 1;
  }
  const sortedSuspects = [...suspects].sort(
    (a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0)
  );

  return (
    <div className="mx-6 mb-2 rounded-xl border border-rose-700/30 bg-rose-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-rose-300">Final Theories</span>
        <span className="text-xs text-slate-500">
          {votes.length} / {totalStudents} submitted
        </span>
      </div>
      {votes.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Waiting for theories…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedSuspects.map((s) => {
            const count = tally[s.id] ?? 0;
            if (count === 0) return null;
            return (
              <span
                key={s.id}
                className="text-xs px-3 py-1.5 bg-rose-900/40 text-rose-300 rounded-full border border-rose-700/40"
              >
                {s.name} ×{count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VotingControls({
  votes,
  totalStudents,
  onRevealCulpritSide,
}: {
  votes: FinalVote[];
  totalStudents: number;
  onRevealCulpritSide: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {votes.length < totalStudents ? (
        <p className="text-sm text-slate-400">
          {votes.length} / {totalStudents} theories received — proceed when ready.
        </p>
      ) : (
        <p className="text-sm text-green-400 font-semibold">All theories submitted.</p>
      )}
      <button
        onClick={onRevealCulpritSide}
        className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors"
      >
        Reveal Culprit&apos;s Side →
      </button>
    </div>
  );
}

function CulpritSideBanner({
  culpritSuspect,
  culpritStudentName,
}: {
  culpritSuspect: CabinSuspect;
  culpritStudentName: string | null;
}) {
  return (
    <div className="mx-6 mb-2 rounded-xl border border-purple-600/40 bg-purple-950/30 p-4 space-y-1">
      <p className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
        Now hear from the culprit
      </p>
      <p className="text-xl font-bold text-white">{culpritSuspect.name}</p>
      <p className="text-sm text-slate-400">{culpritSuspect.seatOrRole}</p>
      {culpritStudentName && (
        <p className="text-xs text-slate-500 mt-1">
          Played by <span className="text-slate-300">{culpritStudentName}</span>
        </p>
      )}
      <p className="text-xs text-slate-500 italic mt-1">
        Listen carefully to their side of the story.
      </p>
    </div>
  );
}

function CulpritSideControls({ onShowFullReveal }: { onShowFullReveal: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-slate-400">
        After the culprit has spoken, reveal the full solution.
      </p>
      <button
        onClick={onShowFullReveal}
        className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
      >
        Show Full Reveal →
      </button>
    </div>
  );
}

function RevealPanel({ content }: { content: CabinMysteryContent }) {
  const sol = content.solution;
  const culpritSuspect = content.suspects.find((s) => s.id === sol.culpritSuspectId);

  return (
    <div className="flex-1 p-6 flex flex-col gap-5 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-green-400" />
          <span className="text-slate-400 text-sm font-mono">{content.setting}</span>
        </div>
        <PhaseTag phase="reveal" />
      </div>

      <h2 className="text-2xl font-bold text-white">Case Solved — The Truth</h2>

      {/* Culprit + explanation */}
      <div className="bg-rose-950/50 border border-rose-600/40 rounded-xl p-5">
        <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-2">The Culprit</p>
        <p className="text-2xl font-bold text-white mb-1">{culpritSuspect?.name}</p>
        <p className="text-xs text-slate-400 mb-3">{culpritSuspect?.seatOrRole}</p>
        <p className="text-sm text-slate-200 leading-relaxed">{sol.explanation}</p>
      </div>

      {/* Clue chain */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Clue Chain</p>
        <div className="space-y-3">
          {sol.clueChain.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-900/60 border border-amber-700/40 text-amber-300 text-xs font-bold flex items-center justify-center mt-0.5">
                {step.cardNumber}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">{step.insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline</p>
        <div className="space-y-3">
          {sol.timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 text-xs text-slate-500 font-mono pt-0.5 min-w-[96px]">
                {event.time}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">{event.event}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Red herring */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          The Red Herring
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{sol.redHerringExplanation}</p>
      </div>

      {/* Teacher read-aloud script */}
      <div className="bg-indigo-950/40 border border-indigo-800/30 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
          Read Aloud (Teacher)
        </p>
        <p className="text-sm text-indigo-200 leading-relaxed italic">{sol.finalRevealScript}</p>
      </div>
    </div>
  );
}

function RevealControls({ onDone }: { onDone: () => void }) {
  return (
    <button
      onClick={onDone}
      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
    >
      Done — End Mystery
    </button>
  );
}

function DoneControls({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-5xl">🛬</div>
      <p className="text-2xl font-bold text-white">Case Closed!</p>
      <p className="text-sm text-slate-400">
        Mystery solved. Great investigation, detectives.
      </p>
      <button
        onClick={onRestart}
        className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
      >
        Start New Case
      </button>
    </div>
  );
}
