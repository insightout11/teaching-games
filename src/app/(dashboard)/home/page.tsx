export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { Compass, Plane, Clock, ChevronRight } from 'lucide-react';

interface RecentSession {
  id: string;
  topic: string;
  custom_topic: string | null;
  started_at: string;
  status: string;
  class_name: string;
}

async function getRecentSessions(userId: string): Promise<RecentSession[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('sessions')
    .select('id, topic, custom_topic, started_at, status, classes!inner(name, teacher_id)')
    .eq('classes.teacher_id', userId)
    .order('started_at', { ascending: false })
    .limit(5);

  if (!data) return [];

  return data.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    topic: s.topic as string,
    custom_topic: s.custom_topic as string | null,
    started_at: s.started_at as string,
    status: s.status as string,
    class_name: (s.classes as { name: string }).name,
  }));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const recentSessions = await getRecentSessions(user.id);
  const isFirstVisit = recentSessions.length === 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-lc-text">Dashboard</h1>
        <p className="text-lc-text3 text-sm mt-1">What would you like to do today?</p>
      </div>

      {/* First-visit welcome */}
      {isFirstVisit && (
        <div className="bg-lc-amber/10 border border-lc-amber/30 rounded-2xl p-6">
          <p className="text-sm font-semibold text-lc-amber uppercase tracking-wide mb-1">Getting started</p>
          <h2 className="text-xl font-bold text-lc-text mb-2">Welcome to LessonCaptain</h2>
          <p className="text-lc-text2 text-sm mb-5">
            Build a structured lesson plan in minutes, then run it live with your class. Start by planning your first lesson below.
          </p>
          <Link
            href="/lesson-planner"
            className="inline-flex items-center gap-2 bg-lc-amber text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-lc-amber/90 transition-colors"
          >
            <Plane className="w-4 h-4" />
            Plan your first lesson
          </Link>
        </div>
      )}

      {/* Primary action cards */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/explore"
          className="group relative bg-lc-card border border-lc-border rounded-2xl p-6 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center mb-4">
            <Compass className="w-5 h-5 text-sky-500" />
          </div>
          <h2 className="text-base font-bold text-lc-text mb-1">Launch a Game</h2>
          <p className="text-sm text-lc-text3 leading-snug">
            Pick any game or activity and run it live right now — no lesson plan needed.
          </p>
          <ChevronRight className="absolute top-6 right-6 w-4 h-4 text-lc-text3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/lesson-planner"
          className="group relative bg-lc-card border border-lc-border rounded-2xl p-6 hover:border-lc-amber/50 hover:bg-lc-amber/5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-lc-amber/15 flex items-center justify-center mb-4">
            <Plane className="w-5 h-5 text-lc-amber" />
          </div>
          <h2 className="text-base font-bold text-lc-text mb-1">Plan a Lesson</h2>
          <p className="text-sm text-lc-text3 leading-snug">
            Build a structured lesson from a preset or your own content in a few steps.
          </p>
          <ChevronRight className="absolute top-6 right-6 w-4 h-4 text-lc-text3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-lc-text2 uppercase tracking-wide mb-3">Recent lessons</h2>
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const displayTopic = s.custom_topic || s.topic;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-lc-card border border-lc-border rounded-xl px-5 py-3.5 hover:border-lc-border-subtle transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-lc-text3 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-lc-text truncate">{displayTopic}</p>
                      <p className="text-xs text-lc-text3">{s.class_name} · {formatDate(s.started_at)}</p>
                    </div>
                  </div>
                  <Link
                    href="/lesson-planner"
                    className="ml-4 shrink-0 text-xs font-semibold text-lc-amber hover:text-lc-amber/80 border border-lc-amber/30 hover:border-lc-amber/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Run again
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
