'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import { DynamicInput } from './dynamic-input';

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
}

interface ActivePoll {
  pollId: string;
  question: string;
  options: string[];
}

interface StudentControllerProps {
  sessionId: string;
  studentSession: StudentSession;
  onLeave: () => void;
}

export function StudentController({ sessionId, studentSession, onLeave }: StudentControllerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');
  const [inputSpec, setInputSpec] = useState<InputSpec | null>(null);

  // Poll for session status, active polls, and input spec
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/session?sessionId=${sessionId}`);
      if (!res.ok) {
        setSessionActive(false);
        setConnectionStatus('disconnected');
        return;
      }

      const data = await res.json();
      setSessionActive(data.isActive);
      setActivePoll(data.activePoll);
      setInputSpec(data.inputSpec);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [sessionId]);

  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [checkSession]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (waitSeconds > 0) {
      const timer = setTimeout(() => setWaitSeconds(waitSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (submitStatus === 'rate_limited') {
      setSubmitStatus('idle');
    }
  }, [waitSeconds, submitStatus]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          content: content.trim(),
          team: studentSession.team,
          gameKey: inputSpec?.gameKey,
          inputType: inputSpec?.type,
          studentId: studentSession.studentId,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setSubmitStatus('rate_limited');
        setWaitSeconds(data.waitSeconds || 15);
      } else if (!res.ok) {
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        // Reset status after 2 seconds
        setTimeout(() => setSubmitStatus('idle'), 2000);
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, studentSession, inputSpec, isSubmitting]);

  const handleVote = async (choice: string) => {
    if (!activePoll || isVoting) return;

    setIsVoting(true);
    setSelectedChoice(choice);

    try {
      const res = await fetch('/api/student/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: activePoll.pollId,
          sessionId,
          clientId: studentSession.clientId,
          displayName: studentSession.displayName,
          choice,
          team: studentSession.team,
        }),
      });

      if (!res.ok) {
        // If rate limited, still show the selection but don't update
        const data = await res.json();
        if (res.status !== 429) {
          setSelectedChoice(null);
        } else {
          console.log(`Vote rate limited, wait ${data.waitSeconds}s`);
        }
      }
    } catch {
      setSelectedChoice(null);
    } finally {
      setIsVoting(false);
    }
  };

  if (!sessionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="glass rounded-3xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">!</div>
          <h1 className="text-xl font-bold text-white mb-2">Session Ended</h1>
          <p className="text-gray-400 mb-6">This session is no longer active.</p>
          <Button onClick={onLeave} variant="ghost">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <div>
              <p className="font-semibold text-white">{studentSession.displayName}</p>
              {studentSession.team && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  studentSession.team === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {studentSession.team === 'red' ? 'Red Team' : 'Blue Team'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onLeave}
            className="text-gray-400 hover:text-white text-sm"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll && (
        <div className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-white mb-1">Poll</h2>
          <p className="text-lg text-cyan-400 mb-4">{activePoll.question}</p>
          <div className="space-y-2">
            {activePoll.options.map((option) => (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={isVoting}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedChoice === option
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                } disabled:opacity-50`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Input based on game/activity */}
      <div className="glass rounded-2xl p-6">
        {inputSpec ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-white">Submit Answer</h2>
              <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                {inputSpec.gameKey}
              </span>
            </div>
            <DynamicInput
              spec={inputSpec}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitStatus={submitStatus}
              waitSeconds={waitSeconds}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 opacity-50">⏳</div>
            <h2 className="font-bold text-white mb-2">Waiting for Activity</h2>
            <p className="text-gray-400 text-sm">
              The input will appear when the teacher starts a game or activity
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>Your answers will be reviewed by the teacher</p>
      </div>
    </div>
  );
}
