'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import type { ActivityPlugin } from '@/activities/types';
import type {
  ActivityGeneratedContent,
  ActivityContinueRequest,
  ActivityContinueResponse,
} from '@/activities/types';
import type { InputSpec, SubmissionHandler } from '@/lib/input-spec';
import { StudentPicker } from './student-picker';
import { Leaderboard } from './leaderboard';
import { ApprovalQueue } from './approval-queue';
import type { StudentSubmission } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

interface ActivityShellProps {
  activity: ActivityPlugin;
  generatedContent: ActivityGeneratedContent;
}

export function ActivityShell({ activity, generatedContent }: ActivityShellProps) {
  const { sessionId, students, currentStudentId, settings, setInputSpec, recordScore } = useSessionStore();
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const submissionHandlerRef = useRef<SubmissionHandler | null>(null);
  const supabase = createClient();

  const ActivityComponent = activity.component;

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

    const scoreData = {
      session_id: sessionId,
      student_id: null,
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
  }, [sessionId, supabase, recordScore, activity.key]);

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
            {activity.icon && <span className="text-xl">{activity.icon}</span>}
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
            sessionSettings={settings}
            generatedContent={generatedContent}
            onContinue={handleContinue}
            onPhaseChange={handlePhaseChange}
            customTopic={customTopic}
            onSetInputSpec={handleSetInputSpec}
            onRegisterSubmissionHandler={handleRegisterSubmissionHandler}
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
          />
        )}
        <Leaderboard />
      </div>
    </div>
  );
}
