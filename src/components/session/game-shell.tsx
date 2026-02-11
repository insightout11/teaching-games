'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSessionStore, calculateStreakBonus } from '@/stores/session-store';
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
}

export function GameShell({ game, config, preGeneratedContent }: GameShellProps) {
  const {
    sessionId, students, currentStudentId, settings, streaks,
    turnModifier, needsSpin,
    pickStudent, recordScore, clearModifier, setActiveGame, setInputSpec,
  } = useSessionStore();
  const supabase = createClient();
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const remoteVoteHandlerRef = useRef<((vote: GameRemoteVote) => void) | null>(null);

  const GameComponent = game.component;

  // Track active game for student submissions
  useEffect(() => {
    setActiveGame(game.key);
    return () => {
      setActiveGame(null);
      // Clear input spec when game unmounts
      setInputSpec(null);
    };
  }, [game.key, setActiveGame, setInputSpec]);

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
  }, []);

  // Callback for games to register remote vote handler
  const handleRegisterRemoteVoteHandler = useCallback((handler: ((vote: GameRemoteVote) => void) | null) => {
    remoteVoteHandlerRef.current = handler;
  }, []);

  const handleScore = useCallback(async (studentId: string, result: ScoreResult) => {
    if (!sessionId) return;

    // Apply spin wheel modifier
    const basePoints = result.points;
    let modifiedPoints = basePoints;

    if (turnModifier) {
      modifiedPoints = basePoints * turnModifier.multiplier + turnModifier.bonus;
    }

    // Shield: if wrong but has shield, don't break streak
    const shieldActive = turnModifier?.shield && !result.isCorrect;
    const effectiveIsCorrect = result.isCorrect || shieldActive;

    const currentStreak = effectiveIsCorrect ? (streaks[studentId] ?? 0) + 1 : 0;
    const streakBonus = effectiveIsCorrect ? calculateStreakBonus(currentStreak) : 0;

    const scoreData = {
      session_id: sessionId,
      student_id: studentId,
      points: modifiedPoints,
      streak_count: currentStreak,
      streak_bonus: streakBonus,
      is_correct: result.isCorrect,
      response_data: {
        ...result.responseData,
        basePoints,
        modifier: turnModifier,
        shieldUsed: shieldActive,
      },
    };

    const { data } = await supabase.from('scores').insert(scoreData).select().single();

    if (data) {
      recordScore(data);
    }

    // Clear modifier after scoring
    clearModifier();
  }, [sessionId, streaks, supabase, recordScore, turnModifier, clearModifier]);

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
                config={{ ...config, preGeneratedContent }}
                sessionSettings={settings}
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
          {sessionId && (
            <ApprovalQueue
              sessionId={sessionId}
              onApprove={handleApprovedSubmission}
            />
          )}
          <TeamTotals />
          <Leaderboard />
        </div>
      </div>
    </>
  );
}
