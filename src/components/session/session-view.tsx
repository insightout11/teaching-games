'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import { useRealtimeLeaderboard } from '@/hooks/use-realtime-leaderboard';
import { useLessonSession } from '@/hooks/use-lesson-session';
import { GameShell } from './game-shell';
import { ActivityShell } from './activity-shell';
import { ModuleErrorBoundary } from './module-error-boundary';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { EndSessionSummary } from './end-session-summary';
import { SessionSettingsBar } from './session-settings-bar';
import { WidgetShell } from './widget-shell';
import { WidgetLauncher } from './widget-launcher';
import { WIDGET_REGISTRY } from './widget-registry';
import { getAllGames, getGamesGrouped, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, getActivitiesGrouped, CATEGORY_INFO } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildRuntimeFlightPlanSteps, getFlightPlanActiveIndex } from '@/lib/flight-plan-helpers';
import { Button } from '@/components/ui/button';
import type { Session, Class, Student, Score } from '@/lib/supabase/types';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin, ActivityGeneratedContent, GameGeneratedContent } from '@/activities/types';

const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// Load students from localStorage in mock mode
function getLocalStorageStudents(classId: string, fallback: Student[]): Student[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(`mock-students-${classId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load mock students:', e);
  }
  return fallback;
}

type ViewMode = 'selection' | 'game' | 'activity';

interface SessionViewProps {
  session: Session;
  cls: Class;
  students: Student[];
  existingScores: Score[];
}

const EMPTY_CONFIG: Record<string, unknown> = {};

export function SessionView({ session, cls, students: serverStudents, existingScores }: SessionViewProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes (inputSpec, scores, etc.)
  const initSession = useSessionStore((s) => s.initSession);
  const settings = useSessionStore((s) => s.settings);
  const addStudent = useSessionStore((s) => s.addStudent);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedGame, setSelectedGame] = useState<GamePlugin | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityPlugin | null>(null);
  const [activityContent, setActivityContent] = useState<ActivityGeneratedContent | null>(null);
  const [gameContent, setGameContent] = useState<GameGeneratedContent | null>(null);
  const [ended, setEnded] = useState(session.status === 'ended');
  const [students, setStudents] = useState(serverStudents);
  const [timerOverrides, setTimerOverrides] = useState<Record<string, number>>({});
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [screenAnswer, setScreenAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [pppFilter, setPppFilter] = useState<'all' | 'presentation' | 'practice' | 'production'>('all');
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const supabase = createClient();
  const games = getAllGames();
  const activities = getAllActivities();

  // ─── Lesson session controller ─────────────────────────────────────────
  const lesson = useLessonSession(session.id, settings, students.length);

  // Tracks which activity key is being resolved — prevents stale async results
  const activeActivityKeyRef = useRef<string | null>(null);

  // Auto-start the current slot when it changes (driven by the hook)
  const lastAutoStartedSlotRef = useRef<number>(-1);
  useEffect(() => {
    if (lesson.phase === 'idle' || lesson.phase === 'lobby' || lesson.phase === 'ended') return;
    if (lesson.currentSlot === null) return;
    if (lastAutoStartedSlotRef.current === lesson.currentSlotIndex) return;

    lastAutoStartedSlotRef.current = lesson.currentSlotIndex;
    const slot = lesson.currentSlot;

    if (slot.type === 'activity') {
      const activity = activities.find((a) => a.key === slot.key);
      if (activity) {
        handleSelectActivity(activity);
      }
    } else if (slot.type === 'game') {
      const game = games.find((g) => g.key === slot.key);
      if (game) {
        handleSelectGame(game);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.currentSlotIndex, lesson.phase, lesson.currentSlot]);

  // When lesson ends, return to selection grid
  useEffect(() => {
    if (lesson.phase === 'ended') {
      handleBackToSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.phase]);

  // In mock mode, load students from localStorage
  useEffect(() => {
    if (isMockMode()) {
      const localStudents = getLocalStorageStudents(cls.id, serverStudents);
      setStudents(localStudents);
    }
  }, [cls.id, serverStudents]);

  // Initialize session store once (session/class identity only)
  const initDone = useRef(false);
  useEffect(() => {
    if (!initDone.current) {
      initSession(session.id, cls.id, students);
      existingScores.forEach((s) => useSessionStore.getState().addRealtimeScore(s));
      initDone.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, cls.id]);

  // Sync new students into the store without resetting state
  useEffect(() => {
    if (!initDone.current) return;
    students.forEach((s) => addStudent(s));
  }, [students, addStudent]);

  // Realtime subscription for leaderboard
  useRealtimeLeaderboard(session.id);

  // Poll for new students joining (realtime was unreliable with service-role INSERTs)
  useEffect(() => {
    if (isMockMode()) return;

    let cancelled = false;
    const poll = async () => {
      const sb = createClient();
      const { data } = await sb
        .from('students')
        .select('*')
        .eq('class_id', cls.id)
        .order('name') as { data: Student[] | null };
      if (cancelled || !data) return;
      setStudents((prev) => {
        if (data.length === prev.length && data.every((s: Student, i: number) => s.id === prev[i].id)) return prev;
        return data;
      });
      data.forEach((s: Student) => addStudent(s));
    };

    const interval = setInterval(poll, 3000);
    // Also poll immediately on mount
    poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cls.id, addStudent]);

  const handleEndSession = async () => {
    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    sessionStorage.removeItem('lessonPlanContent');
    setEnded(true);
  };

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${session.id}`;
    navigator.clipboard.writeText(joinUrl);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 2000);
  };

  const handleSelectGame = (game: GamePlugin) => {
    activeActivityKeyRef.current = null;
    setSelectedGame(game);
    setSelectedActivity(null);
    setActivityContent(null);

    const resolved = lesson.selectGame(game);
    setGameContent(resolved);
    setViewMode('game');
  };

  const handleSelectActivity = async (activity: ActivityPlugin) => {
    activeActivityKeyRef.current = activity.key;
    setSelectedActivity(activity);
    setSelectedGame(null);
    setActivityContent(null);
    setGameContent(null);
    setViewMode('activity');

    const resolved = await lesson.selectActivity(activity);
    // Only apply if this activity is still the active one (guards against rapid slot advances)
    if (activeActivityKeyRef.current === activity.key) {
      setActivityContent(resolved);
    }
  };

  const getTimerForPlugin = useCallback((key: string, defaultTimer: number) => {
    return timerOverrides[key] ?? defaultTimer;
  }, [timerOverrides]);

  const handleTimerOverride = useCallback((key: string, seconds: number) => {
    setTimerOverrides((prev) => ({ ...prev, [key]: seconds }));
  }, []);

  const handleBackToSelection = () => {
    setViewMode('selection');
    setSelectedGame(null);
    setSelectedActivity(null);
    setActivityContent(null);
    setGameContent(null);
  };

  const handleNextSlot = () => {
    lesson.advanceSlot();
  };

  const handleExitLessonMode = () => {
    lesson.exitLesson();
    handleBackToSelection();
  };

  // Close settings popover on click outside
  useEffect(() => {
    if (!showSettingsPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(e.target as Node)) {
        setShowSettingsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsPopover]);

  if (ended) {
    return <EndSessionSummary classId={cls.id} className={cls.name} sessionId={session.id} />;
  }

  // Prevent SSR/hydration mismatch: render a loading shell until client mounts
  if (!mounted) {
    return (
      <div className="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <div className="flex items-center justify-center pt-24">
          <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ─── LOBBY VIEW ──────────────────────────────────────────────────────────
  if (lesson.phase === 'lobby') {
    const joinUrl = `${window.location.origin}/join/${session.id}`;
    const joinCode = session.id.slice(0, 6).toUpperCase();

    return (
      <div className="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <div className="max-w-3xl mx-auto space-y-6 pt-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Launch Lobby</h1>
            <p className="text-sm opacity-70">
              {lesson.customTopic}
              {lesson.isMissionBased && <span className="ml-2 text-amber-400">Mission Lesson</span>}
            </p>
          </div>

          {/* Join Info */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="text-center space-y-3">
              <p className="text-xs opacity-50 uppercase tracking-wider font-semibold">Join Link</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-cyan-400 text-sm bg-black/30 px-4 py-2 rounded-lg font-mono break-all">
                  {joinUrl}
                </code>
                <button
                  onClick={handleCopyJoinLink}
                  className="px-3 py-2 rounded-lg glass border border-white/10 text-xs hover:bg-white/10 transition-colors"
                >
                  {joinLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div>
                <p className="text-xs opacity-50 uppercase tracking-wider font-semibold mb-1">Join Code</p>
                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-cyan-400">{joinCode}</span>
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold opacity-70 uppercase tracking-wider">
                Students Joined
              </h2>
              <span className="text-2xl font-bold text-cyan-400">{students.length}</span>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm opacity-50">Waiting for students to join...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {students.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 bg-white/10 rounded-full text-sm font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Flight Plan Summary */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-3">
              Flight Plan
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {lesson.lessonSlots.map((slot, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-3 py-2 bg-white/5 rounded-lg text-xs text-center min-w-[80px]"
                >
                  <p className="opacity-50 uppercase tracking-wider mb-0.5">{i + 1}</p>
                  <p className="font-medium truncate">{slot.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Selector Status */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              {lesson.missionSelectorReady ? (
                <>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                  <span className="text-sm text-emerald-300">Mission Selector ready</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-cyan-300">Preparing Mission Selector...</span>
                </>
              )}
            </div>
          </div>

          {/* Begin Lesson */}
          <button
            onClick={lesson.beginLesson}
            disabled={!lesson.missionSelectorReady}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Begin Lesson
          </button>

          {/* End Session (escape hatch) */}
          <div className="text-center">
            <button
              onClick={handleEndSession}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN SESSION VIEW ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
      <div className="space-y-4">
        {/* Session header */}
        <div className="flex items-center justify-between hud-header-bar">
          <div>
            <h1 className="text-xl font-bold">{cls.name} — Live Session</h1>
            <p className="text-sm opacity-70">
              {students.length} students
              {lesson.isMissionBased && (
                <span className="ml-2 text-amber-400">Mission Lesson</span>
              )}
              {lesson.lessonPlanContent && !lesson.isMissionBased && (
                <span className="ml-2 text-cyan-400">Lesson Plan Loaded</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Gear icon for settings during gameplay */}
            {viewMode !== 'selection' && (
              <div className="relative" ref={settingsPopoverRef}>
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Session settings"
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettingsPopover && (
                  <div className="absolute right-0 top-full mt-2 z-50 glass rounded-xl p-3 shadow-xl border border-white/10 min-w-[320px]">
                    <SessionSettingsBar />
                  </div>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJoinLink}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {joinLinkCopied ? 'Copied!' : 'Copy Join Link'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>

        {/* Selection / Game / Activity View */}
        {viewMode === 'selection' ? (
          <div className="space-y-8">
            {/* Settings on selection screen */}
            <div className="hud-settings-panel p-2 shadow-lg">
              <SessionSettingsBar />
            </div>

            {/* PPP Stage Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-lc-text3 uppercase tracking-wider font-semibold mr-1">Stage:</span>
              {(['all', 'presentation', 'practice', 'production'] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setPppFilter(stage)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    pppFilter === stage
                      ? stage === 'presentation' ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : stage === 'practice' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : stage === 'production' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  {stage === 'all' ? 'All' : stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))}
            </div>

            {/* Activities Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Discussion Activities
                {lesson.lessonPlanContent && (
                  <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                    Content Ready
                  </span>
                )}
              </h2>
              {(Object.entries(getActivitiesGrouped()) as [string, typeof activities][]).map(([category, categoryActivities]) => {
                const filtered = pppFilter === 'all' ? categoryActivities : categoryActivities.filter((a) => a.pppStage === pppFilter);
                if (filtered.length === 0) return null;
                const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                const IconComponent = info.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                      <div className="hud-rule" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((activity) => {
                        const hasContent = lesson.lessonPlanContent?.generatedContent[activity.key];
                        const ActivityIcon = activity.icon;
                        const stageBadge = activity.pppStage === 'presentation' ? { label: 'Present', cls: 'bg-violet-500/15 text-violet-300' }
                          : activity.pppStage === 'practice' ? { label: 'Practice', cls: 'bg-sky-500/15 text-sky-300' }
                          : activity.pppStage === 'production' ? { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-300' }
                          : null;
                        return (
                          <button
                            key={activity.key}
                            onClick={() => handleSelectActivity(activity)}
                            className={`panel-card p-6 text-left transition-all relative ${
                              hasContent ? 'panel-card--ready' : ''
                            }`}
                          >
                            {hasContent && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full" />
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <ActivityIcon className={`w-5 h-5 ${info.color}`} />
                              <h3 className="font-semibold">{activity.name}</h3>
                              {stageBadge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>
                              )}
                            </div>
                            <p className="text-sm opacity-70 mt-2">{activity.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {activity.skills.map((skill) => (
                                <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs opacity-50">~{activity.estimatedMinutes} min</span>
                              <div className="hud-control" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <select
                                  value={getTimerForPlugin(activity.key, activity.defaultTimerSeconds)}
                                  onChange={(e) => handleTimerOverride(activity.key, Number(e.target.value))}
                                  className="outline-none cursor-pointer"
                                >
                                  {[30, 45, 60, 90, 120, 180].map((s) => (
                                    <option key={s} value={s}>{s}s</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skill Games Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Skill Games
                {lesson.lessonPlanContent?.generatedGameContent && Object.keys(lesson.lessonPlanContent.generatedGameContent).length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-lc-blue/15 text-lc-blue rounded-full">
                    Content Ready
                  </span>
                )}
              </h2>
              {(Object.entries(getGamesGrouped()) as [string, typeof games][]).map(([category, categoryGames]) => {
                const filtered = pppFilter === 'all' ? categoryGames : categoryGames.filter((g) => g.pppStage === pppFilter);
                if (filtered.length === 0) return null;
                const info = GAME_CATEGORY_INFO[category as keyof typeof GAME_CATEGORY_INFO];
                const IconComponent = info.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                      <div className="hud-rule" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((game) => {
                        const hasContent = lesson.lessonPlanContent?.generatedGameContent?.[game.key];
                        const GameIcon = game.icon;
                        const stageBadge = game.pppStage === 'practice' ? { label: 'Practice', cls: 'bg-sky-500/15 text-sky-300' }
                          : game.pppStage === 'production' ? { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-300' }
                          : game.pppStage === 'presentation' ? { label: 'Present', cls: 'bg-violet-500/15 text-violet-300' }
                          : null;
                        return (
                          <button
                            key={game.key}
                            onClick={() => handleSelectGame(game)}
                            className={`panel-card p-6 text-left transition-all relative ${
                              hasContent ? 'panel-card--ready' : ''
                            }`}
                          >
                            {hasContent && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-lc-blue rounded-full" />
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <GameIcon className={`w-5 h-5 ${info.color}`} />
                              <h3 className="font-semibold">{game.name}</h3>
                              {stageBadge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>
                              )}
                            </div>
                            <p className="text-sm opacity-70 mt-1">{game.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {game.skills.map((skill) => (
                                <span key={skill} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="hud-control mt-3" onClick={(e) => e.stopPropagation()}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <select
                                value={getTimerForPlugin(game.key, game.defaultTimerSeconds)}
                                onChange={(e) => handleTimerOverride(game.key, Number(e.target.value))}
                                className="outline-none cursor-pointer"
                              >
                                {[15, 20, 30, 45, 60, 90, 120].map((s) => (
                                  <option key={s} value={s}>{s}s</option>
                                ))}
                              </select>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'game' && selectedGame ? (
          <div>
            {/* Lesson Flight Plan */}
            {lesson.isLessonActive && (
              <div className="mb-4">
                <LessonCaptainFlightPlan
                  steps={buildRuntimeFlightPlanSteps(lesson.lessonSlots)}
                  mode="runtime"
                  activeIndex={getFlightPlanActiveIndex(lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length)}
                  height={240}
                />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}>
                ← {lesson.isLessonActive ? 'Exit Lesson' : 'Switch Activity'}
              </Button>
              {lesson.isLessonActive && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextSlot}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {lesson.currentSlotIndex + 1 < lesson.lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                </Button>
              )}
            </div>
            <ModuleErrorBoundary moduleName={selectedGame.name} onReset={handleBackToSelection}>
              <GameShell game={selectedGame} config={EMPTY_CONFIG} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} />
            </ModuleErrorBoundary>
          </div>
        ) : viewMode === 'activity' && selectedActivity ? (
          <div>
            {/* Lesson Flight Plan */}
            {lesson.isLessonActive && (
              <div className="mb-4">
                <LessonCaptainFlightPlan
                  steps={buildRuntimeFlightPlanSteps(lesson.lessonSlots)}
                  mode="runtime"
                  activeIndex={getFlightPlanActiveIndex(lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length)}
                  height={240}
                />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}>
                ← {lesson.isLessonActive ? 'Exit Lesson' : 'Switch Activity'}
              </Button>
              {lesson.isLessonActive && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextSlot}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {lesson.currentSlotIndex + 1 < lesson.lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                </Button>
              )}
            </div>
            {activityContent ? (
              <ModuleErrorBoundary moduleName={selectedActivity.name} onReset={handleBackToSelection}>
                <ActivityShell
                  activity={selectedActivity}
                  generatedContent={activityContent}
                  timerSeconds={getTimerForPlugin(selectedActivity.key, selectedActivity.defaultTimerSeconds)}
                  onPhaseChange={lesson.isLessonActive ? lesson.handlePhaseChange : undefined}
                />
              </ModuleErrorBoundary>
            ) : (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <p className="text-lg font-game text-cyan-400">
                  Preparing {lesson.generatingModuleName || selectedActivity.name}
                </p>
                <p className="text-sm opacity-60 mt-2">
                  Generating content for your lesson...
                </p>
                <div className="flex gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Floating widget system */}
      {WIDGET_REGISTRY.map((widget) => (
        <WidgetShell
          key={widget.id}
          id={widget.id}
          label={widget.label}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={widget.iconPath} />
            </svg>
          }
        >
          <widget.component {...(widget.getProps?.({
              sessionId: session.id,
              students,
              topic: getEffectiveTopic(settings),
              difficulty: settings.difficulty,
              onShowAnswer: (q: string, a: string) => setScreenAnswer({ question: q, answer: a }),
            }) ?? {})} />
        </WidgetShell>
      ))}
      <WidgetLauncher sessionId={session.id} />

      {/* Answer overlay — shown on teacher's projected screen */}
      {screenAnswer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl shadow-2xl border border-white/10 max-w-3xl w-full p-8">
            <p className="text-sm opacity-50 uppercase tracking-wider font-semibold mb-3">Student Question</p>
            <p className="text-xl font-medium mb-6 leading-relaxed">{screenAnswer.question}</p>
            <hr className="border-white/10 mb-6" />
            <p className="text-sm opacity-50 uppercase tracking-wider font-semibold mb-3">Answer</p>
            <p className="text-2xl leading-relaxed whitespace-pre-wrap">{screenAnswer.answer}</p>
            <button
              onClick={() => setScreenAnswer(null)}
              className="mt-8 px-4 py-2 rounded-lg glass border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal — shown when generation credits are exhausted */}
      <PaywallModal
        open={lesson.creditsExhausted}
        onClose={lesson.dismissCreditsExhausted}
      />
    </div>
  );
}
