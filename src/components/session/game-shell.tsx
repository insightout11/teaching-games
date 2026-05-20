'use client';

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { runScoreEngine } from '@/lib/score-engine';
import { createClient } from '@/lib/supabase/client';
import type { GamePlugin, ScoreResult, GameRemoteVote, TopSubmission } from '@/games/types';
import type { GameGeneratedContent } from '@/activities/types';
import type { StudentSubmission, Score } from '@/lib/supabase/types';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import { useStudentPrefs } from '@/hooks/use-student-prefs';
import { Leaderboard } from './leaderboard';
import { SpinWheel, ModifierBadge } from './spin-wheel';
import { ApprovalQueue } from './approval-queue';
import { TeamTotals } from './team-totals';

interface GameShellProps {
  game: GamePlugin;
  config: Record<string, unknown>;
  preGeneratedContent?: GameGeneratedContent | null;
  timerSeconds: number;
  onRevealTopSubmissions?: (submissions: TopSubmission[]) => void;
}

export function GameShell({ game, config, preGeneratedContent, timerSeconds, onRevealTopSubmissions }: GameShellProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes (inputSpec, scores, etc.)
  const sessionId = useSessionStore((s) => s.sessionId);
  const students = useSessionStore((s) => s.students);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const settings = useSessionStore((s) => s.settings);
  const streaks = useSessionStore((s) => s.streaks);
  const turnModifier = useSessionStore((s) => s.turnModifier);
  const needsSpin = useSessionStore((s) => s.needsSpin);
  const pickStudent = useSessionStore((s) => s.pickStudent);
  const setCurrentStudent = useSessionStore((s) => s.setCurrentStudent);
  const recordScore = useSessionStore((s) => s.recordScore);
  const clearModifier = useSessionStore((s) => s.clearModifier);
  const setActiveGame = useSessionStore((s) => s.setActiveGame);
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const supabase = createClient();
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const remoteVoteHandlerRef = useRef<((vote: GameRemoteVote) => void) | null>(null);
  // Buffer for votes that arrive while handler is null (e.g. during useCallback re-registration)
  const pendingVotesRef = useRef<GameRemoteVote[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);
  // Tracks which teacher-initiated round produced each score.
  // Increments after every handleScore call so each score row gets a unique, sequential index.
  // max(prompt_index) per session = total scoring events; used by Control Room participation grid.
  const promptIndexRef = useRef(1);

  // Refs for values used in handleScore — keeps the callback identity stable
  // so games that list onScore in effect deps don't re-run on every score.
  const streaksRef = useRef(streaks);
  streaksRef.current = streaks;
  const turnModifierRef = useRef(turnModifier);
  turnModifierRef.current = turnModifier;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const studentsRef = useRef(students);
  studentsRef.current = students;
  // Maps clientId → displayName for remote (non-roster) students in simultaneous mode
  const clientInfoRef = useRef(new Map<string, string>());
  // Maps clientId → studentId — populated from the initial score INSERT (written by submit API)
  // which always has both client_id and student_id. Used in handleScore to resolve student identity
  // reliably instead of depending on fragile display-name matching.
  const clientToStudentRef = useRef(new Map<string, string>());
  // Student prefs (score_visible, scoring_mode) — used in handleApprovedSubmission
  const prefsMap = useStudentPrefs(sessionId);
  const prefsMapRef = useRef(prefsMap);
  prefsMapRef.current = prefsMap;
  // Stable ref for onRevealTopSubmissions prop
  const onRevealTopSubmissionsRef = useRef(onRevealTopSubmissions);
  onRevealTopSubmissionsRef.current = onRevealTopSubmissions;

  const GameComponent = game.component;
  const sessionSettings = useMemo(
    () => ({ ...settings, timerSeconds }),
    [settings, timerSeconds],
  );
  const gameConfig = useMemo(
    () => ({ ...config, preGeneratedContent }),
    [config, preGeneratedContent],
  );

  // Track active game for student submissions
  useEffect(() => {
    setActiveGame(game.key);
    return () => {
      setActiveGame(null);
    };
  }, [game.key, setActiveGame]);

  // Subscribe to scores for remote votes
  useEffect(() => {
    if (!sessionId) return;

    const scoresChannel = supabase
      .channel(`game-scores-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: Score }) => {
          const score = payload.new;
          // Check if this is a remote vote for this game
          const responseData = score.response_data as Record<string, unknown> | null;
          // Cache display name for non-roster (remote) students so handleScore can use it
          if (score.client_id && score.display_name) {
            clientInfoRef.current.set(score.client_id, score.display_name);
          }
          // Cache clientId → studentId from the initial submit-API score (which has both set)
          if (score.client_id && score.student_id) {
            clientToStudentRef.current.set(score.client_id, score.student_id);
          }
          if (responseData?.type === 'remote_vote' && responseData?.gameKey === game.key) {
            const vote: GameRemoteVote = {
              clientId: score.client_id || '',
              studentId: score.student_id || null,
              displayName: score.display_name || 'Anonymous',
              choice: responseData.choice as string,
              team: score.team as 'red' | 'blue' | null,
              gameKey: responseData.gameKey as string,
              inputType: responseData.inputType as string,
            };
            if (remoteVoteHandlerRef.current) {
              remoteVoteHandlerRef.current(vote);
            } else {
              // Handler is temporarily null (game re-registering between renders) — buffer and retry
              pendingVotesRef.current.push(vote);
              setTimeout(() => {
                const idx = pendingVotesRef.current.indexOf(vote);
                if (idx !== -1) {
                  pendingVotesRef.current.splice(idx, 1);
                  remoteVoteHandlerRef.current?.(vote);
                }
              }, 500);
            }
          }
          // Also record the score in the store
          recordScore(score);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoresChannel);
    };
  }, [sessionId, game.key, supabase, recordScore]);

  // Callback for games to set input spec
  const handleSetInputSpec = useCallback((spec: InputSpec | null) => {
    setInputSpec(spec);
  }, [setInputSpec]);

  // Callback for games to register submission handler
  const handleRegisterSubmissionHandler = useCallback((handler: SubmissionHandler | null) => {
    submissionHandlerRef.current = handler;
    setAutoApprove(handler?.autoApprove ?? false);
  }, []);

  // Callback for games to register remote vote handler
  const handleRegisterRemoteVoteHandler = useCallback((handler: ((vote: GameRemoteVote) => void) | null) => {
    remoteVoteHandlerRef.current = handler;
    // Flush any votes that arrived while the handler was null (re-registration gap)
    if (handler && pendingVotesRef.current.length > 0) {
      const pending = pendingVotesRef.current.splice(0);
      pending.forEach((v) => handler(v));
    }
  }, []);

  const handleScore = useCallback(async (studentId: string, result: ScoreResult) => {
    if (!sessionId) return;

    // Resolve identity: roster student (student UUID) vs remote student (clientId).
    // Race-mode games store clientId in responseData so feedback can reach the student device.
    const isRoster = studentsRef.current.some((s) => s.id === studentId);
    const responseClientId = typeof (result.responseData as Record<string, unknown> | null)?.clientId === 'string'
      ? (result.responseData as Record<string, unknown>).clientId as string
      : null;
    let studentIdField: string | null;
    let clientIdField: string | null;
    let displayNameField: string | null;
    if (isRoster) {
      studentIdField = studentId;
      clientIdField = responseClientId;
      displayNameField = null;
    } else {
      const resolvedStudentId = clientToStudentRef.current.get(studentId);
      if (resolvedStudentId && studentsRef.current.some((s) => s.id === resolvedStudentId)) {
        studentIdField = resolvedStudentId;
        clientIdField = null;
        displayNameField = null;
      } else {
        const displayName = clientInfoRef.current.get(studentId) ?? null;
        const rosterMatch = displayName
          ? studentsRef.current.find((s) => s.name === displayName) ?? null
          : null;
        if (rosterMatch) {
          studentIdField = rosterMatch.id;
          clientIdField = null;
          displayNameField = null;
        } else {
          studentIdField = null;
          clientIdField = studentId;
          displayNameField = displayName;
        }
      }
    }

    const engineResult = runScoreEngine({
      explicitOutcome: result.outcome,
      isCorrect: result.isCorrect,
      isEmpty: result.isEmpty,
      profile: game.scoringProfile,
    });

    // Streak: advance on correct (accuracy games), hold on participation (accuracy=not_applicable)
    const streakLookupKey = studentIdField ?? clientIdField ?? studentId;
    const currentStreak = engineResult.isCorrect
      ? (streaksRef.current[streakLookupKey] ?? 0) + 1
      : 0;

    const teamFromResult = typeof (result.responseData as Record<string, unknown> | null)?.team === 'string'
      ? (result.responseData as Record<string, unknown>).team as string
      : null;

    const scoreData = {
      session_id: sessionId,
      student_id: studentIdField,
      client_id: clientIdField,
      display_name: displayNameField,
      points: engineResult.points,
      streak_count: currentStreak,
      streak_bonus: 0,
      is_correct: engineResult.isCorrect,
      outcome: engineResult.outcome,
      accuracy_status: engineResult.accuracyStatus,
      counts_for_accuracy: engineResult.countsForAccuracy,
      counts_for_leaderboard: true,
      scoring_version: engineResult.scoringVersion,
      prompt_index: promptIndexRef.current,
      response_data: result.responseData ?? null,
      team: teamFromResult,
    };

    promptIndexRef.current++;
    const { data, error } = await supabase.from('scores').insert(scoreData).select().single();
    if (error) console.error('[handleScore] FAILED code=' + error.code + ' msg=' + error.message + ' hint=' + error.hint + ' data=' + JSON.stringify(scoreData));
    if (data) recordScore(data);
    clearModifier();
  }, [sessionId, supabase, recordScore, clearModifier, game]);

  const handlePickStudent = useCallback(() => {
    pickStudent();
  }, [pickStudent]);

  const handlePickSpecificStudent = useCallback((studentId: string) => {
    setCurrentStudent(studentId);
  }, [setCurrentStudent]);

  // Handle approved student submission — routes through score engine
  const handleApprovedSubmission = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;

    let handlerIsCorrect: boolean | null = null;
    let handlerOutcome: import('@/lib/score-engine').ScoreOutcome | undefined;
    let handlerIsEmpty: boolean | undefined;
    let feedback: string | undefined;

    if (submissionHandlerRef.current) {
      try {
        const result = await submissionHandlerRef.current.handleSubmission(
          submission.content,
          { gameKey: game.key, submissionId: submission.id }
        );
        handlerIsCorrect = result.isCorrect;
        handlerOutcome = result.outcome;
        handlerIsEmpty = result.isEmpty;
        feedback = result.feedback;
      } catch (error) {
        console.error('Submission handler error:', error);
      }
    }

    const engineResult = runScoreEngine({
      explicitOutcome: handlerOutcome,
      isCorrect: handlerIsCorrect,
      isEmpty: handlerIsEmpty,
      profile: game.scoringProfile,
    });

    const matchedStudent = students.find((s) => s.name === submission.display_name);

    const scoreData = {
      session_id: sessionId,
      student_id: matchedStudent?.id || null,
      points: engineResult.points,
      streak_count: 0,
      streak_bonus: 0,
      is_correct: engineResult.isCorrect,
      outcome: engineResult.outcome,
      accuracy_status: engineResult.accuracyStatus,
      counts_for_accuracy: engineResult.countsForAccuracy,
      counts_for_leaderboard: true,
      scoring_version: engineResult.scoringVersion,
      prompt_index: promptIndexRef.current,
      response_data: {
        submission_id: submission.id,
        content: submission.content,
        type: 'remote_submission',
        feedback,
      },
      team: submission.team,
      client_id: submission.client_id,
      display_name: submission.display_name,
    };

    const { data, error } = await supabase.from('scores').insert(scoreData).select().single();

    if (error) {
      console.error('Failed to insert score:', error);
      throw new Error(error.message);
    }

    if (data) recordScore(data);

    if (feedback) {
      supabase
        .from('student_submissions')
        .update({ ai_feedback: feedback, ai_score: engineResult.points })
        .eq('id', submission.id)
        .then(() => {});
    }
  }, [sessionId, students, supabase, recordScore, game]);

  const handleRevealTop3 = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('session_id', sessionId)
      .eq('prompt_index', promptIndexRef.current)
      .filter('response_data->>type', 'eq', 'remote_submission')
      .order('points', { ascending: false })
      .limit(3);

    if (data?.length) {
      const submissions: TopSubmission[] = data.map((s: Score) => ({
        content: (s.response_data as Record<string, unknown>)?.content as string ?? '',
        feedback: (s.response_data as Record<string, unknown>)?.feedback as string ?? '',
        points: s.points,
        clientId: s.client_id ?? s.student_id ?? '',
        displayName: s.display_name ?? studentsRef.current.find((st) => st.id === s.student_id)?.name ?? 'Unknown',
      }));
      onRevealTopSubmissionsRef.current?.(submissions);
      // Advance prompt index so the next round's submissions are tracked separately
      promptIndexRef.current++;
    }
  }, [sessionId, supabase]);

  return (
    <>
      {/* Spin Wheel Modal */}
      <SpinWheel />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Main game area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass rounded-2xl min-h-[480px] max-h-[680px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">{game.name}</h2>
                <ModifierBadge />
              </div>
              {autoApprove && (
                <button
                  onClick={handleRevealTop3}
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
                >
                  Reveal Top 3
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Block game if spin needed */}
              {needsSpin ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <p className="text-xl font-game text-cyan-400 mb-2">Spin Required!</p>
                  <p className="opacity-60 text-sm">Click the SPIN button to get your modifier</p>
                </div>
              ) : (
                <GameComponent
                  students={students}
                  currentStudentId={currentStudentId}
                  onScore={handleScore}
                  onPickStudent={handlePickStudent}
                  onPickSpecificStudent={handlePickSpecificStudent}
                  config={gameConfig}
                  sessionSettings={sessionSettings}
                  onSetInputSpec={handleSetInputSpec}
                  onRegisterSubmissionHandler={handleRegisterSubmissionHandler}
                  onRegisterRemoteVoteHandler={handleRegisterRemoteVoteHandler}
                  prefsMap={prefsMap}
                  onRevealTopSubmissions={onRevealTopSubmissionsRef.current}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Leaderboard displayMode={game.scoringProfile?.displayMode ?? 'competitive'} />
          <TeamTotals />
          {sessionId && (
            <ApprovalQueue
              sessionId={sessionId}
              onApprove={handleApprovedSubmission}
              hideContent
              autoApprove={autoApprove}
            />
          )}
        </div>
      </div>
    </>
  );
}
