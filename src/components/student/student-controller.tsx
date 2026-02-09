'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/lib/supabase/types';

interface StudentSession {
  clientId: string;
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
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('checking');

  // Poll for session status and active polls
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

  const handleSubmitText = async () => {
    if (!textInput.trim() || isSubmitting) return;

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
          content: textInput.trim(),
          team: studentSession.team,
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
        setTextInput('');
        // Reset status after 2 seconds
        setTimeout(() => setSubmitStatus('idle'), 2000);
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitText();
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

      {/* Text Submission */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-white mb-4">Submit Answer</h2>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          maxLength={1000}
          rows={4}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            {submitStatus === 'success' && (
              <span className="text-green-400">Submitted!</span>
            )}
            {submitStatus === 'error' && (
              <span className="text-red-400">Failed to submit</span>
            )}
            {submitStatus === 'rate_limited' && (
              <span className="text-yellow-400">Wait {waitSeconds}s...</span>
            )}
            <span className="text-gray-500 ml-2">{textInput.length}/1000</span>
          </div>
          <Button
            onClick={handleSubmitText}
            disabled={!textInput.trim() || isSubmitting || submitStatus === 'rate_limited'}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>Your answers will be reviewed by the teacher</p>
      </div>
    </div>
  );
}
