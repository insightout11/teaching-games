'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { NameEntry } from '@/components/student/name-entry';
import { StudentController } from '@/components/student/student-controller';
import type { Team } from '@/lib/supabase/types';

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
}

export default function JoinSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(true);

  // Check for existing session data in localStorage and verify session exists
  useEffect(() => {
    async function init() {
      // First verify the session exists
      try {
        const res = await fetch(`/api/student/session?sessionId=${sessionId}`);
        if (!res.ok) {
          setSessionExists(false);
          setIsLoading(false);
          return;
        }
      } catch {
        setSessionExists(false);
        setIsLoading(false);
        return;
      }

      // Check for saved student session
      const storageKey = `studentSession_${sessionId}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.clientId && parsed.displayName) {
            setStudentSession(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load saved session:', e);
      }
      setIsLoading(false);
    }

    init();
  }, [sessionId]);

  const handleJoin = (data: StudentSession) => {
    setStudentSession(data);
  };

  const handleLeave = () => {
    const storageKey = `studentSession_${sessionId}`;
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to clear session data:', e);
    }
    setStudentSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessionExists) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="glass rounded-3xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">?</div>
          <h1 className="text-xl font-bold text-white mb-2">Session Not Found</h1>
          <p className="text-gray-400">This session doesn&apos;t exist or has ended.</p>
        </div>
      </div>
    );
  }

  if (!studentSession) {
    return <NameEntry sessionId={sessionId} onJoin={handleJoin} />;
  }

  return (
    <StudentController
      sessionId={sessionId}
      studentSession={studentSession}
      onLeave={handleLeave}
    />
  );
}
