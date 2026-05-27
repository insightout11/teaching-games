'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { runScoreEngine } from '@/lib/score-engine';
import type { ScoreOutcome } from '@/lib/score-engine';
import type { ActivityPlugin } from '@/activities/types';
import { CATEGORY_INFO } from '@/activities/registry';
import type {
  ActivityGeneratedContent,
  ActivityContinueRequest,
  ActivityContinueResponse,
  RemoteVote,
} from '@/activities/types';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import type { Score } from '@/lib/supabase/types';
import { Leaderboard } from './leaderboard';
import { DealCardsPanel } from './deal-cards-panel';
import { ApprovalQueue } from './approval-queue';
import { MissionControlSummary } from './mission-control-summary';
import type { StudentSubmission } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

interface ActivityShellProps {
  activity: ActivityPlugin;
  generatedContent: ActivityGeneratedContent;
  timerSeconds: number;
  onPhaseChange?: (phase: string) => void;
  onContentRegenerate?: (updatedContent: Record<string, ActivityGeneratedContent>) => void;
}

export function ActivityShell({ activity, generatedContent, timerSeconds, onPhaseChange: externalPhaseChange, onContentRegenerate }: ActivityShellProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes (inputSpec, scores, etc.)
  const sessionId = useSessionStore((s) => s.sessionId);
  const students = useSessionStore((s) => s.students);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const settings = useSessionStore((s) => s.settings);
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const recordScore = useSessionStore((s) => s.recordScore);
  const addStudent = useSessionStore((s) => s.addStudent);
  const studentMissions = useSessionStore((s) => s.studentMissions);
  const classMission = useSessionStore((s) => s.classMission);
  const openingStances = useSessionStore((s) => s.openingStances);
  const characterAssignments = useSessionStore((s) => s.characterAssignments);
  const landingAnswers = useSessionStore((s) => s.landingAnswers);
  const addLandingAnswer = useSessionStore((s) => s.addLandingAnswer);
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const [showMissionSummary, setShowMissionSummary] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const remoteVoteHandlerRef = useRef<((vote: RemoteVote) => void) | null>(null);
  const supabase = createClient();

  // Build display names map lazily — only needed when MissionControlSummary is shown
  const displayNames = useMemo(() => {
    if (!showMissionSummary) return {};
    const names: Record<string, string> = {};
    students.forEach((s) => { names[s.id] = s.name; });
    const { scores } = useSessionStore.getState();
    scores.forEach((s) => {
      if (s.client_id && s.display_name) names[s.client_id] = s.display_name;
    });
    return names;
  }, [students, showMissionSummary]);

  const ActivityComponent = activity.component;

  // Subscribe to scores for remote votes AND new students joining
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to scores to capture remote votes
    const scoresChannel = supabase
      .channel(`activity-scores-${sessionId}`)
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
          // Check if this is a remote vote
          const responseData = score.response_data as Record<string, unknown> | null;
          if (responseData?.type === 'remote_vote' && responseData?.gameKey === activity.key) {
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
                resourcesUsed: responseData.resourcesUsed as string[] | undefined,
              });
            }
          }
          // Also record the score in the store
          recordScore(score);
        }
      )
      .subscribe();

    // Subscribe to new students joining
    const studentsChannel = supabase
      .channel(`activity-students-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
        },
        (payload: { new: { id: string; name: string; class_id: string; avatar_seed?: string; created_at?: string } }) => {
          const student = payload.new;
          // Add to store (the store will handle deduplication)
          addStudent({
            id: student.id,
            name: student.name,
            class_id: student.class_id,
            avatar_seed: student.avatar_seed ?? String(Math.floor(Math.random() * 1000)),
            created_at: student.created_at ?? new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoresChannel);
      supabase.removeChannel(studentsChannel);
    };
  }, [sessionId, activity.key, supabase, recordScore, addStudent]);

  // Score writing for activities — routes through score engine
  const handleScore = useCallback(async (request: {
    studentId: string | null;
    clientId: string | null;
    displayName: string;
    promptIndex: number;
    points: number;
    isCorrect: boolean | null;
    outcome?: ScoreOutcome;
    isEmpty?: boolean;
  }) => {
    if (!sessionId) return;
    const engineResult = runScoreEngine({
      explicitOutcome: request.outcome,
      isCorrect: request.isCorrect,
      isEmpty: request.isEmpty,
      profile: activity.scoringProfile,
    });
    const res = await fetch('/api/session/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        student_id: request.studentId,
        client_id: request.clientId,
        display_name: request.displayName,
        points: engineResult.points,
        is_correct: engineResult.isCorrect,
        outcome: engineResult.outcome,
        accuracy_status: engineResult.accuracyStatus,
        counts_for_accuracy: engineResult.countsForAccuracy,
        counts_for_leaderboard: true,
        scoring_version: engineResult.scoringVersion,
        prompt_index: request.promptIndex,
        streak_count: 0,
        streak_bonus: 0,
        response_data: { type: 'activity_participation', activityKey: activity.key },
      }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      console.error('Failed to insert activity score:', err.error);
      return;
    }
    const { data } = await res.json() as { data: Score };
    if (data) recordScore(data);
  }, [sessionId, recordScore, activity.key, activity.scoringProfile]);

  // Callback for activities to set input spec
  const handleSetInputSpec = useCallback((spec: InputSpec | null) => {
    setInputSpec(spec);
  }, [setInputSpec]);

  // Callback for activities to register submission handler
  const handleRegisterSubmissionHandler = useCallback((handler: SubmissionHandler | null) => {
    submissionHandlerRef.current = handler;
    setAutoApprove(handler?.autoApprove ?? false);
  }, []);

  // Callback for activities to register remote vote handler
  const handleRegisterRemoteVoteHandler = useCallback((handler: ((vote: RemoteVote) => void) | null) => {
    remoteVoteHandlerRef.current = handler;
  }, []);

  // Handle approved student submission — routes through score engine
  const handleApprovedSubmission = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;

    let handlerIsCorrect: boolean | null = null;
    let handlerOutcome: ScoreOutcome | undefined;
    let handlerIsEmpty: boolean | undefined;
    let feedback: string | undefined;

    if (submissionHandlerRef.current) {
      try {
        const result = await submissionHandlerRef.current.handleSubmission(
          submission.content,
          {
            activityKey: activity.key,
            submissionId: submission.id,
            clientId: submission.client_id,
            displayName: submission.display_name,
            team: submission.team,
          }
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
      profile: activity.scoringProfile,
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
      response_data: {
        submission_id: submission.id,
        content: submission.content,
        type: 'remote_submission',
        activityKey: activity.key,
        feedback,
      },
      team: submission.team,
      client_id: submission.client_id,
      display_name: submission.display_name,
    };

    const res = await fetch('/api/session/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      console.error('Failed to insert score:', err.error);
      throw new Error(err.error ?? 'Score insert failed');
    }
    const { data } = await res.json() as { data: Score };
    if (data) recordScore(data);
  }, [sessionId, students, recordScore, activity.key, activity.scoringProfile]);

  const handleSpotlight = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;
    await fetch('/api/session/spotlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        submissionId: submission.id,
        studentName: submission.display_name,
        text: submission.content,
      }),
    });
  }, [sessionId]);

  // Handler for dynamic follow-ups during the activity
  const handleContinue = useCallback(async (request: Omit<ActivityContinueRequest, 'sessionId'>): Promise<ActivityContinueResponse> => {
    try {
      const response = await fetch('/api/activity/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          sessionId: useSessionStore.getState().sessionId || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get continue response');
      }

      return await response.json();
    } catch (error) {
      console.error('Activity continue error:', error);
      // Return graceful fallback
      return {
        nextQuestion: 'Tell us more about your thinking.',
        teacherNote: 'Consider asking follow-up questions.',
      };
    }
  }, []);

  const handleLandingAnswer = useCallback((clientId: string, answer: string) => {
    addLandingAnswer(clientId, answer);
  }, [addLandingAnswer]);

  const handlePhaseChange = useCallback((phase: string) => {
    setCurrentPhase(phase);
    externalPhaseChange?.(phase);
    if (phase === 'finished' && activity.pppStage === 'landing') {
      const missions = useSessionStore.getState().studentMissions;
      if (Object.keys(missions).length > 0) {
        setShowMissionSummary(true);
      }
    }
  }, [activity.pppStage, externalPhaseChange]);

  const customTopic = getEffectiveTopic(settings);
  const sessionSettings = useMemo(
    () => ({ ...settings, timerSeconds }),
    [settings, timerSeconds],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      {/* Main activity area */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass rounded-2xl min-h-[480px] max-h-[680px] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{activity.name}</h2>
              {(() => {
                const catInfo = CATEGORY_INFO[activity.category];
                const Icon = activity.icon;
                return <Icon className={`w-5 h-5 ${catInfo.color}`} />;
              })()}
              <span className="text-xs px-2 py-0.5 bg-lc-border text-lc-text3 rounded-full">
                {activity.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-50">Phase:</span>
              <span className="text-xs px-2 py-0.5 bg-lc-blue/15 text-lc-blue rounded-full">
                {currentPhase}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <ActivityComponent
              sessionId={sessionId}
              students={students}
              currentStudentId={currentStudentId}
              sessionSettings={sessionSettings}
              generatedContent={generatedContent}
              onContinue={handleContinue}
              onPhaseChange={handlePhaseChange}
              customTopic={customTopic}
              onSetInputSpec={handleSetInputSpec}
              onRegisterSubmissionHandler={handleRegisterSubmissionHandler}
              onRegisterRemoteVoteHandler={handleRegisterRemoteVoteHandler}
              onScore={handleScore}
              studentMissions={studentMissions}
              classMission={classMission}
              openingStances={openingStances}
              characterAssignments={characterAssignments}
              onLandingAnswer={handleLandingAnswer}
              onContentRegenerate={onContentRegenerate}
            />
          </div>
        </div>

        {/* Activity info footer */}
        <div className="flex items-center justify-between text-xs opacity-50">
          <div className="flex gap-3">
            {activity.skills.map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-lc-border text-lc-text3 rounded">
                {skill}
              </span>
            ))}
          </div>
          <span>~{activity.estimatedMinutes} min</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Leaderboard displayMode={activity.scoringProfile?.displayMode ?? 'class'} />
        {sessionId && <DealCardsPanel sessionId={sessionId} moduleKey={activity.key} />}
        {sessionId && (
          <ApprovalQueue
            sessionId={sessionId}
            gameKey={activity.key}
            onApprove={handleApprovedSubmission}
            onSpotlight={handleSpotlight}
            hideContent
            autoApprove={autoApprove}
          />
        )}
      </div>

      {/* Mission Control Summary — shown after Landing activity finishes in a mission lesson */}
      {showMissionSummary && (
        <MissionControlSummary
          studentMissions={studentMissions}
          landingAnswers={landingAnswers}
          displayNames={displayNames}
          onClose={() => setShowMissionSummary(false)}
        />
      )}
    </div>
  );
}
