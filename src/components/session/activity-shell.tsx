'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
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
import { StudentPicker } from './student-picker';
import { Leaderboard } from './leaderboard';
import { ApprovalQueue } from './approval-queue';
import type { StudentSubmission } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

interface ActivityShellProps {
  activity: ActivityPlugin;
  generatedContent: ActivityGeneratedContent;
  timerSeconds: number;
}

export function ActivityShell({ activity, generatedContent, timerSeconds }: ActivityShellProps) {
  const { sessionId, students, currentStudentId, settings, setInputSpec, recordScore, addStudent } = useSessionStore();
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const remoteVoteHandlerRef = useRef<((vote: RemoteVote) => void) | null>(null);
  const supabase = createClient();

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

  // Clear input spec when activity unmounts
  useEffect(() => {
    return () => {
      setInputSpec(null);
    };
  }, [setInputSpec]);

  // Callback for activities to set input spec
  const handleSetInputSpec = useCallback((spec: InputSpec | null) => {
    setInputSpec(spec);
  }, [setInputSpec]);

  // Callback for activities to register submission handler
  const handleRegisterSubmissionHandler = useCallback((handler: SubmissionHandler | null) => {
    submissionHandlerRef.current = handler;
  }, []);

  // Callback for activities to register remote vote handler
  const handleRegisterRemoteVoteHandler = useCallback((handler: ((vote: RemoteVote) => void) | null) => {
    remoteVoteHandlerRef.current = handler;
  }, []);

  // Handle approved student submission
  const handleApprovedSubmission = useCallback(async (submission: StudentSubmission) => {
    if (!sessionId) return;

    let points = 5;
    let isCorrect = true;
    let feedback: string | undefined;

    if (submissionHandlerRef.current) {
      try {
        const result = await submissionHandlerRef.current.handleSubmission(
          submission.content,
          { activityKey: activity.key, submissionId: submission.id }
        );
        points = result.points;
        isCorrect = result.isCorrect;
        feedback = result.feedback;
      } catch (error) {
        console.error('Submission handler error:', error);
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
  }, [sessionId, students, supabase, recordScore, activity.key]);

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

  const handlePhaseChange = useCallback((phase: string) => {
    setCurrentPhase(phase);
  }, []);

  const customTopic = getEffectiveTopic(settings);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      {/* Main activity area */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{activity.name}</h2>
            {(() => {
              const catInfo = CATEGORY_INFO[activity.category];
              const Icon = activity.icon;
              return <Icon className={`w-5 h-5 ${catInfo.color}`} />;
            })()}
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full opacity-70">
              {activity.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50">Phase:</span>
            <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
              {currentPhase}
            </span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 min-h-[400px]">
          <ActivityComponent
            students={students}
            currentStudentId={currentStudentId}
            sessionSettings={{ ...settings, timerSeconds }}
            generatedContent={generatedContent}
            onContinue={handleContinue}
            onPhaseChange={handlePhaseChange}
            customTopic={customTopic}
            onSetInputSpec={handleSetInputSpec}
            onRegisterSubmissionHandler={handleRegisterSubmissionHandler}
            onRegisterRemoteVoteHandler={handleRegisterRemoteVoteHandler}
          />
        </div>

        {/* Activity info footer */}
        <div className="flex items-center justify-between text-xs opacity-50">
          <div className="flex gap-3">
            {activity.skills.map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-white/5 rounded">
                {skill}
              </span>
            ))}
          </div>
          <span>~{activity.estimatedMinutes} min</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <StudentPicker />
        {sessionId && (
          <ApprovalQueue
            sessionId={sessionId}
            onApprove={handleApprovedSubmission}
            hideContent
          />
        )}
        <Leaderboard />
      </div>
    </div>
  );
}
