'use client';

import { useCallback, useEffect } from 'react';
import { useSessionStore, calculateStreakBonus } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';
import type { GamePlugin, ScoreResult } from '@/games/types';
import type { GameGeneratedContent } from '@/activities/types';
import type { StudentSubmission } from '@/lib/supabase/types';
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
    pickStudent, recordScore, clearModifier, setActiveGame,
  } = useSessionStore();
  const supabase = createClient();

  const GameComponent = game.component;

  // Track active game for student submissions
  useEffect(() => {
    setActiveGame(game.key);
    return () => setActiveGame(null);
  }, [game.key, setActiveGame]);

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

  // Handle approved student submission - award points directly
  // Teacher approval = participation points (AI evaluation is optional/future enhancement)
  const handleApprovedSubmission = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;

    // Award participation points for approved submissions
    const basePoints = 5;

    // Insert score with team/client_id/display_name
    // Remote students don't have roster entries, so student_id is null
    const scoreData = {
      session_id: sessionId,
      student_id: null, // Remote students don't have roster entries
      points: basePoints,
      streak_count: 0,
      streak_bonus: 0,
      is_correct: true,
      response_data: {
        submission_id: submission.id,
        content: submission.content,
        type: 'remote_submission',
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
  }, [sessionId, supabase, recordScore]);

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
