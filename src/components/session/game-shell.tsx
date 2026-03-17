'use client';

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useSessionStore, PARTICIPATION_POINTS } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';
import type { GamePlugin, ScoreResult, GameRemoteVote } from '@/games/types';
import type { GameGeneratedContent } from '@/activities/types';
import type { StudentSubmission, Score } from '@/lib/supabase/types';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import { StudentPicker } from './student-picker';
import { StreakIndicator } from './streak-indicator';
import { Leaderboard } from './leaderboard';
import { SpinWheel, ModifierBadge } from './spin-wheel';
import { ApprovalQueue } from './approval-queue';
import { TeamTotals } from './team-totals';

interface GameShellProps {
  game: GamePlugin;
  config: Record<string, unknown>;
  preGeneratedContent?: GameGeneratedContent | null;
  timerSeconds: number;
}

export function GameShell({ game, config, preGeneratedContent, timerSeconds }: GameShellProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes (inputSpec, scores, etc.)
  const sessionId = useSessionStore((s) => s.sessionId);
  const students = useSessionStore((s) => s.students);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const settings = useSessionStore((s) => s.settings);
  const streaks = useSessionStore((s) => s.streaks);
  const turnModifier = useSessionStore((s) => s.turnModifier);
  const needsSpin = useSessionStore((s) => s.needsSpin);
  const pickStudent = useSessionStore((s) => s.pickStudent);
  const recordScore = useSessionStore((s) => s.recordScore);
  const clearModifier = useSessionStore((s) => s.clearModifier);
  const setActiveGame = useSessionStore((s) => s.setActiveGame);
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const supabase = createClient();
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const remoteVoteHandlerRef = useRef<((vote: GameRemoteVote) => void) | null>(null);
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
          if (responseData?.type === 'remote_vote' && responseData?.gameKey === game.key) {
            // Call the registered vote handler
            if (remoteVoteHandlerRef.current) {
              remoteVoteHandlerRef.current({
                clientId: score.client_id || '',
                studentId: score.student_id || null,
                displayName: score.display_name || 'Anonymous',
                choice: responseData.choice as string,
                team: score.team as 'red' | 'blue' | null,
                gameKey: responseData.gameKey as string,
                inputType: responseData.inputType as string,
              });
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
  }, []);

  const handleScore = useCallback(async (studentId: string, result: ScoreResult) => {
    if (!sessionId) return;

    const scoringMode = settingsRef.current.scoringMode;

    // Participation mode: flat points, no streaks
    if (scoringMode === 'participation') {
      const { data } = await supabase.from('scores').insert({
        session_id: sessionId,
        student_id: studentId,
        points: PARTICIPATION_POINTS,
        streak_count: 0,
        streak_bonus: 0,
        is_correct: result.isCorrect,
        prompt_index: promptIndexRef.current,
        response_data: { ...result.responseData, scoringMode: 'participation' },
      }).select().single();
      promptIndexRef.current++;
      if (data) recordScore(data);
      clearModifier();
      return;
    }

    // Accuracy mode: correctness-based points, no streaks
    if (scoringMode === 'accuracy') {
      const { data } = await supabase.from('scores').insert({
        session_id: sessionId,
        student_id: studentId,
        points: result.points,
        streak_count: 0,
        streak_bonus: 0,
        is_correct: result.isCorrect,
        prompt_index: promptIndexRef.current,
        response_data: { ...result.responseData, scoringMode: 'accuracy' },
      }).select().single();
      promptIndexRef.current++;
      if (data) recordScore(data);
      clearModifier();
      return;
    }

    // Competitive mode: turn modifier, streak counter (cosmetic), streak_bonus always 0
    const currentModifier = turnModifierRef.current;
    const currentStreaks = streaksRef.current;

    const basePoints = result.points;
    let modifiedPoints = basePoints;
    if (currentModifier) {
      modifiedPoints = basePoints * currentModifier.multiplier + currentModifier.bonus;
    }

    // Shield: if wrong but has shield, don't break streak
    const shieldActive = currentModifier?.shield && !result.isCorrect;
    const effectiveIsCorrect = result.isCorrect || shieldActive;
    const currentStreak = effectiveIsCorrect ? (currentStreaks[studentId] ?? 0) + 1 : 0;

    const scoreData = {
      session_id: sessionId,
      student_id: studentId,
      points: modifiedPoints,
      streak_count: currentStreak,
      streak_bonus: 0,
      is_correct: result.isCorrect,
      prompt_index: promptIndexRef.current,
      response_data: {
        ...result.responseData,
        basePoints,
        modifier: currentModifier,
        shieldUsed: shieldActive,
      },
    };

    promptIndexRef.current++;
    const { data } = await supabase.from('scores').insert(scoreData).select().single();
    if (data) recordScore(data);
    clearModifier();
  }, [sessionId, supabase, recordScore, clearModifier]);

  const handlePickStudent = useCallback(() => {
    pickStudent();
  }, [pickStudent]);

  // Handle approved student submission
  // If game has registered a submission handler, use it for evaluation
  // Otherwise fall back to fixed participation points
  const handleApprovedSubmission = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;

    let points = 5; // Default participation points
    let isCorrect = true;
    let feedback: string | undefined;

    // If game has a submission handler, use it to evaluate
    if (submissionHandlerRef.current) {
      try {
        const result = await submissionHandlerRef.current.handleSubmission(
          submission.content,
          { gameKey: game.key, submissionId: submission.id }
        );
        points = result.points;
        isCorrect = result.isCorrect;
        feedback = result.feedback;
      } catch (error) {
        console.error('Submission handler error:', error);
        // Fall back to participation points on error
      }
    }

    // Look up matching student from store by display_name
    const matchedStudent = students.find(
      (s) => s.name === submission.display_name
    );

    const scoreData = {
      session_id: sessionId,
      student_id: matchedStudent?.id || null,
      points,
      streak_count: 0,
      streak_bonus: 0,
      is_correct: isCorrect,
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

    if (data) {
      recordScore(data);
    }
  }, [sessionId, students, supabase, recordScore, game.key]);

  return (
    <>
      {/* Spin Wheel Modal */}
      <SpinWheel />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Main game area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{game.name}</h2>
              <ModifierBadge />
            </div>
            <StreakIndicator studentId={currentStudentId} />
          </div>
          <div className="glass rounded-2xl p-6 min-h-[400px]">
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
                config={gameConfig}
                sessionSettings={sessionSettings}
                onSetInputSpec={handleSetInputSpec}
                onRegisterSubmissionHandler={handleRegisterSubmissionHandler}
                onRegisterRemoteVoteHandler={handleRegisterRemoteVoteHandler}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <StudentPicker />
          <Leaderboard />
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
