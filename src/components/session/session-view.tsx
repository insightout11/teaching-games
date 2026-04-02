'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSessionStore, getEffectiveTopic, DIFFICULTIES } from '@/stores/session-store';
import type { Difficulty } from '@/stores/session-store';
import { GRAMMAR_TARGET_GROUPS } from '@/lib/grammar';
import type { GrammarTarget } from '@/lib/grammar';
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
import { getAllGames, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildRuntimeFlightPlanSteps, getFlightPlanActiveIndex, calculateSlotBudgets, getExpectedPacingIndex, inferLessonDuration } from '@/lib/flight-plan-helpers';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { PRO_ACTIVITY_KEYS, PRO_GAME_KEYS } from '@/lib/standard-topics';

type SessionTypeFilter = 'all' | 'games' | 'activities';
type SessionSkillFilter = 'all' | 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'critical-thinking' | 'debate' | 'creativity';

const SESSION_SKILL_FILTERS: { key: SessionSkillFilter; label: string; skills: string[] }[] = [
  { key: 'vocabulary',        label: 'Vocabulary',        skills: ['Vocabulary', 'Word Knowledge', 'Precision', 'Spelling', 'Association', 'Register', 'Context'] },
  { key: 'grammar',           label: 'Grammar',           skills: ['Grammar', 'Sentence Structure', 'Proofreading', 'Attention'] },
  { key: 'speaking',          label: 'Speaking',          skills: ['Speaking', 'Fluency', 'Pragmatics', 'Listening', 'Question Formation'] },
  { key: 'writing',           label: 'Writing',           skills: ['Writing', 'Creative Writing', 'Storytelling'] },
  { key: 'critical-thinking', label: 'Critical Thinking', skills: ['Critical Thinking', 'Questioning', 'Deduction', 'Pattern Recognition'] },
  { key: 'debate',            label: 'Debate',            skills: ['Debate', 'Persuasion'] },
  { key: 'creativity',        label: 'Creativity',        skills: ['Creativity', 'Creative Writing', 'Role-play'] },
];

const GAME_CATEGORY_ORDER = ['vocabulary', 'grammar-writing', 'logic-puzzles'] as const;
const ACTIVITY_CATEGORY_ORDER = ['icebreaker', 'learning', 'practice', 'debate', 'closing'] as const;

const HELMET_SEEDS = ['teal', 'amber', 'red', 'blue', 'violet', 'green', 'white', 'gold', 'black', 'pink', 'silver', 'rainbow'];
const VALID_HELMET_SEEDS = new Set(HELMET_SEEDS);

function resolveHelmet(avatarSeed: string, name: string): string {
  if (VALID_HELMET_SEEDS.has(avatarSeed)) return avatarSeed;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HELMET_SEEDS[hash % HELMET_SEEDS.length];
}
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
  const setSettings = useSessionStore((s) => s.setSettings);
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);
  const addStudent = useSessionStore((s) => s.addStudent);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedGame, setSelectedGame] = useState<GamePlugin | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityPlugin | null>(null);
  const [activityContent, setActivityContent] = useState<ActivityGeneratedContent | null>(null);
  const [gameContent, setGameContent] = useState<GameGeneratedContent | null>(null);
  // Content overrides from takeoff regeneration (mission/character context)
  const [contentOverrides, setContentOverrides] = useState<Record<string, ActivityGeneratedContent>>({});
  const contentOverridesRef = useRef(contentOverrides);
  contentOverridesRef.current = contentOverrides;
  const [ended, setEnded] = useState(session.status === 'ended');
  const [students, setStudents] = useState(serverStudents);
  const [timerOverrides, setTimerOverrides] = useState<Record<string, number>>({});
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [screenAnswer, setScreenAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all');
  const [skillFilter, setSkillFilter] = useState<SessionSkillFilter>('all');
  const [swapSuggestion, setSwapSuggestion] = useState<{
    type: 'activity' | 'game';
    plugin: ActivityPlugin | GamePlugin;
  } | null>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Clear stale explore-session reference if this session is already ended
  useEffect(() => {
    if (session.status === 'ended') {
      localStorage.removeItem('lc-explore-session');
    }
  }, [session.status]);

  // Teacher tier — used to gate Pro modules in the selection grid
  const teacherTier = useTeacherTier();
  // Separate from lesson.creditsExhausted (which fires on 402 from generate route);
  // this fires when a Standard user clicks a Pro game that doesn't go through generate.
  const [showProGate, setShowProGate] = useState(false);
  const supabase = createClient();
  const games = getAllGames().filter((g) => !g.flightPlanOnly);
  const activities = getAllActivities().filter((a) => !a.flightPlanOnly);

  // ─── Lesson session controller ─────────────────────────────────────────
  const lesson = useLessonSession(session.id, settings, students.length);

  // ─── Pacing state ──────────────────────────────────────────────────────
  const sessionStartTimeRef = useRef<number | null>(null);
  const [pacingTick, setPacingTick] = useState(0);
  const [showPacingNudge, setShowPacingNudge] = useState(false);
  const nudgeDismissedForSlotRef = useRef<number>(-1);
  const [modulePhase, setModulePhase] = useState<string>('idle');

  const plannerDuration = usePlannerStore((s) => s.lessonDurationMinutes);

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
      const activity = getAllActivities().find((a) => a.key === slot.key);
      if (activity) {
        handleSelectActivity(activity);
      }
    } else if (slot.type === 'game') {
      const game = getAllGames().find((g) => g.key === slot.key);
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

  // Track session start time
  useEffect(() => {
    if (lesson.isLessonActive && sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = Date.now();
    } else if (!lesson.isLessonActive) {
      sessionStartTimeRef.current = null;
    }
  }, [lesson.isLessonActive]);

  // 60-second pacing tick
  useEffect(() => {
    if (!lesson.isLessonActive) return;
    const id = setInterval(() => setPacingTick((c) => c + 1), 60_000);
    return () => clearInterval(id);
  }, [lesson.isLessonActive]);

  // Reset nudge on slot advance
  useEffect(() => {
    setShowPacingNudge(false);
  }, [lesson.currentSlotIndex]);

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
    localStorage.removeItem('lc-explore-session');
    setEnded(true);
  };

  const handleCopyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${session.id}`;
    navigator.clipboard.writeText(joinUrl);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 2000);
  };

  const handleSelectGame = (game: GamePlugin) => {
    // Pro games require Pro tier or onboarding credits.
    // (Server-side gating for game per-round routes is a v1.x item; UI gate is the primary guard here.)
    if (PRO_GAME_KEYS.has(game.key) && !teacherTier.isPro && teacherTier.credits <= 0 && !teacherTier.loading) {
      setShowProGate(true);
      return;
    }

    activeActivityKeyRef.current = null;
    setSwapSuggestion(null);
    setSelectedGame(game);
    setSelectedActivity(null);
    setActivityContent(null);

    const resolved = lesson.selectGame(game);
    setGameContent(resolved);
    setViewMode('game');
  };

  const handleSelectActivity = async (activity: ActivityPlugin) => {
    activeActivityKeyRef.current = activity.key;
    setSwapSuggestion(null);
    setSelectedActivity(activity);
    setSelectedGame(null);
    setActivityContent(null);
    setGameContent(null);
    setViewMode('activity');

    const resolved = await lesson.selectActivity(activity);
    // Only apply if this activity is still the active one (guards against rapid slot advances)
    if (activeActivityKeyRef.current === activity.key) {
      // Apply regen override if available (set by a previous takeoff activity)
      setActivityContent(contentOverridesRef.current[activity.key] ?? resolved);
    }
  };

  const handleContentRegenerate = useCallback((updatedContent: Record<string, ActivityGeneratedContent>) => {
    setContentOverrides((prev) => ({ ...prev, ...updatedContent }));
  }, []);

  const getTimerForPlugin = useCallback((key: string, defaultTimer: number) => {
    return timerOverrides[key] ?? defaultTimer;
  }, [timerOverrides]);

  const handleTimerOverride = useCallback((key: string, seconds: number) => {
    setTimerOverrides((prev) => ({ ...prev, [key]: seconds }));
  }, []);

  const handleBackToSelection = () => {
    const prevKey = selectedActivity?.key ?? selectedGame?.key;
    const prevStage = selectedActivity?.pppStage ?? selectedGame?.pppStage;

    setViewMode('selection');
    setSelectedGame(null);
    setSelectedActivity(null);
    setActivityContent(null);
    setGameContent(null);
    setSwapSuggestion(null);

    if (prevKey && prevStage) {
      const activityCandidates = activities.filter(
        (a) => a.pppStage === prevStage && a.key !== prevKey
      );
      const gameCandidates = games.filter(
        (g) => g.pppStage === prevStage && g.key !== prevKey
      );
      const all = [
        ...activityCandidates.map((p) => ({ type: 'activity' as const, plugin: p as ActivityPlugin | GamePlugin })),
        ...gameCandidates.map((p) => ({ type: 'game' as const, plugin: p as ActivityPlugin | GamePlugin })),
      ];
      if (all.length > 0) {
        setSwapSuggestion(all[Math.floor(Math.random() * all.length)]);
      }
    }
  };

  const handleNextSlot = () => {
    lesson.advanceSlot();
  };

  // Reset module phase when slot advances so the pulse clears on the new module
  useEffect(() => {
    setModulePhase('idle');
  }, [lesson.currentSlotIndex]);

  const handleActivityPhaseChange = useCallback((phase: string) => {
    setModulePhase(phase);
    lesson.handlePhaseChange(phase);
  }, [lesson.handlePhaseChange]);

  const isModuleFinished = modulePhase === 'finished' && lesson.isLessonActive;

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

  // ─── Pacing derived values ─────────────────────────────────────────────
  const lessonDurationMinutes =
    lesson.lessonPlanContent?.lessonDurationMinutes ??
    plannerDuration ??
    inferLessonDuration(lesson.lessonSlots.length);

  const slotBudgets = useMemo(
    () =>
      lesson.lessonSlots.length > 0
        ? calculateSlotBudgets(lessonDurationMinutes, lesson.lessonSlots)
        : null,
    [lessonDurationMinutes, lesson.lessonSlots],
  );

  // pacingIndex recomputes on tick and slot change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pacingIndex = useMemo(() => {
    if (!slotBudgets) return undefined;
    const index = getExpectedPacingIndex(sessionStartTimeRef.current, slotBudgets);
    return index ?? undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotBudgets, pacingTick]);

  // Nudge check — fires on pacing tick (must be after slotBudgets + pacingIndex memos)
  useEffect(() => {
    if (!slotBudgets || sessionStartTimeRef.current === null) return;
    if (nudgeDismissedForSlotRef.current === lesson.currentSlotIndex) return;
    const i = lesson.currentSlotIndex;
    const budget = slotBudgets[i] ?? 0;
    if (budget === 0) return;
    const slotStartMin = slotBudgets.slice(0, i).reduce((a, b) => a + b, 0);
    const elapsedMin = (Date.now() - sessionStartTimeRef.current) / 60000;
    const slotRunningMin = elapsedMin - slotStartMin;
    if (slotRunningMin > budget * 1.5) {
      setShowPacingNudge(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacingTick, lesson.currentSlotIndex, slotBudgets]);

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

    return (
      <div className="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <div className="max-w-3xl mx-auto space-y-6 pt-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-lc-text">
              {lesson.lessonSlots.length === 1 ? `Ready to play ${lesson.lessonSlots[0].name}` : 'Launch Lobby'}
            </h1>
            <p className="text-sm text-lc-text2">
              {lesson.customTopic}
              {lesson.isMissionBased && <span className="ml-2 text-lc-warn font-medium">Mission Lesson</span>}
            </p>
          </div>

          {/* Join Info */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="text-center space-y-3">
              <p className="text-xs opacity-50 uppercase tracking-wider font-semibold">Join Link</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-cyan-400 text-sm bg-lc-surface border border-lc-border px-4 py-2 rounded-lg font-mono break-all">
                  {joinUrl}
                </code>
                <button
                  onClick={handleCopyJoinLink}
                  className="px-3 py-2 rounded-lg glass border border-lc-border text-xs hover:bg-lc-card transition-colors"
                >
                  {joinLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold opacity-70 uppercase tracking-wider">
                Students Joined
              </h2>
              <span className="text-2xl font-bold text-lc-blue">{students.length}</span>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm opacity-50">Waiting for students to join...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col items-center gap-1.5 bg-lc-card rounded-2xl px-4 py-3 min-w-[72px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/avatars/avatar-${resolveHelmet(s.avatar_seed, s.name)}.png`} alt="" width={48} height={48} className="w-12 h-12 rounded-xl" />
                    <span className="text-sm font-semibold text-lc-text truncate max-w-[72px] text-center">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flight Plan Summary — only for multi-slot lessons */}
          {lesson.lessonSlots.length > 1 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-3">
                Flight Plan
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {lesson.lessonSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 px-3 py-2 bg-lc-surface rounded-lg text-xs text-center min-w-[80px]"
                  >
                    <p className="opacity-50 uppercase tracking-wider mb-0.5">{i + 1}</p>
                    <p className="font-medium truncate">{slot.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mission Selector Status — only when mission-selector is in the plan */}
          {lesson.lessonSlots.some((s) => s.key === 'mission-selector') && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                {lesson.missionSelectorReady ? (
                  <>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-sm text-emerald-500">Mission Selector ready</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-lc-blue">Preparing Mission Selector...</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Begin Lesson / Start item */}
          <button
            onClick={lesson.beginLesson}
            disabled={!lesson.missionSelectorReady}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {lesson.lessonSlots.length === 1 ? `Start ${lesson.lessonSlots[0].name}` : 'Begin Lesson'}
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
            <h1 className="text-xl font-bold text-lc-text">{cls.name} — Live Session</h1>
            <p className="text-sm text-lc-text2">
              {students.length} students
              {lesson.isMissionBased && (
                <span className="ml-2 text-amber-400">Mission Lesson</span>
              )}
              {lesson.lessonPlanContent && !lesson.isMissionBased && lesson.lessonSlots.length > 1 && (
                <span className="ml-2 text-cyan-400">Lesson Plan Loaded</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Visible level + grammar chips during gameplay */}
            {viewMode !== 'selection' && (
              <>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings({ difficulty: e.target.value as Difficulty })}
                  className="text-xs font-semibold bg-lc-card border border-lc-border rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={settings.grammarTarget ?? ''}
                  onChange={(e) => setGrammarTarget(e.target.value ? e.target.value as GrammarTarget : null)}
                  className="text-xs font-semibold bg-lc-card border border-lc-border rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="">Grammar: Any</option>
                  {Object.entries(GRAMMAR_TARGET_GROUPS).map(([group, targets]) => (
                    <optgroup key={group} label={group}>
                      {targets.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
              </>
            )}
            {/* Gear icon for settings during gameplay */}
            {viewMode !== 'selection' && (
              <div className="relative" ref={settingsPopoverRef}>
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="p-1.5 rounded-lg hover:bg-lc-card transition-colors"
                  title="Session settings"
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettingsPopover && (
                  <div className="absolute right-0 top-full mt-2 z-50 glass rounded-xl p-3 shadow-xl border border-lc-border min-w-[320px]">
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
          <div className="space-y-6">
            {/* Settings on selection screen */}
            <div className="hud-settings-panel p-2 shadow-lg">
              <SessionSettingsBar />
            </div>

            {/* Swap Suggestion Card */}
            {swapSuggestion && (
              <div className="rounded-xl border border-lc-border bg-lc-surface p-4">
                <p className="mb-2 text-xs font-medium text-lc-text3 uppercase tracking-wider">
                  ✨ Try next
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lc-text">{swapSuggestion.plugin.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    swapSuggestion.plugin.pppStage === 'presentation' ? 'bg-violet-500/15 text-violet-500'
                    : swapSuggestion.plugin.pppStage === 'practice' ? 'bg-sky-500/15 text-sky-500'
                    : 'bg-emerald-500/15 text-emerald-500'
                  }`}>
                    {swapSuggestion.plugin.pppStage === 'presentation' ? 'Present'
                      : swapSuggestion.plugin.pppStage === 'practice' ? 'Practice'
                      : 'Produce'}
                  </span>
                </div>
                <p className="text-xs text-lc-text3 mb-3">~{swapSuggestion.plugin.estimatedMinutes} min</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (swapSuggestion.type === 'activity') {
                        handleSelectActivity(swapSuggestion.plugin as ActivityPlugin);
                      } else {
                        handleSelectGame(swapSuggestion.plugin as GamePlugin);
                      }
                    }}
                    className="rounded-lg bg-lc-card px-4 py-1.5 text-sm font-medium text-lc-text hover:bg-lc-border"
                  >
                    Launch Now
                  </button>
                  <button
                    onClick={() => setSwapSuggestion(null)}
                    className="text-sm text-lc-text3 hover:text-lc-text2 px-2"
                  >
                    Browse all →
                  </button>
                </div>
              </div>
            )}

            {/* Type filter tabs */}
            <div role="group" aria-label="Content type" className="flex gap-2">
              {(['all', 'games', 'activities'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTypeFilter(tab)}
                  aria-pressed={typeFilter === tab}
                  className={`px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors ${
                    typeFilter === tab
                      ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                      : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
                  }`}
                >
                  {typeFilter === tab && <span className="mr-1 opacity-70">◆</span>}
                  {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
                </button>
              ))}
            </div>

            {/* Skill filter pills */}
            <div role="group" aria-label="Skill category" className="flex flex-wrap gap-2">
              <button
                onClick={() => setSkillFilter('all')}
                aria-pressed={skillFilter === 'all'}
                className={`px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors ${
                  skillFilter === 'all'
                    ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                    : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
                }`}
              >
                {skillFilter === 'all' && <span className="mr-1 opacity-70">◆</span>}All
              </button>
              {SESSION_SKILL_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSkillFilter(key)}
                  aria-pressed={skillFilter === key}
                  className={`px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors ${
                    skillFilter === key
                      ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                      : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
                  }`}
                >
                  {skillFilter === key && <span className="mr-1 opacity-70">◆</span>}{label}
                </button>
              ))}
            </div>

            {/* Games */}
            {(typeFilter === 'all' || typeFilter === 'games') && (
              <div className="space-y-6">
                {GAME_CATEGORY_ORDER.map((cat) => {
                  const catGames = games.filter((g) => g.category === cat && (
                    skillFilter === 'all' || SESSION_SKILL_FILTERS.find((f) => f.key === skillFilter)?.skills.some((s) => g.skills.includes(s))
                  ));
                  if (!catGames.length) return null;
                  const info = GAME_CATEGORY_INFO[cat];
                  const IconComponent = info.icon;
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                        <IconComponent className={`w-4 h-4 ${info.color}`} />
                        <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                        <span className="flex items-center gap-1 text-xs text-lc-text3 mr-1" aria-hidden="true">
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><path d="M3 0L6 3L3 6L0 3Z"/></svg>
                          Games
                        </span>
                        <div className="hud-rule" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catGames.map((game) => {
                          const hasContent = lesson.lessonPlanContent?.generatedGameContent?.[game.key];
                          const GameIcon = game.icon;
                          const stageBadge = game.pppStage === 'practice' ? { label: 'Practice', cls: 'bg-sky-500/15 text-sky-500' }
                            : game.pppStage === 'production' ? { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-500' }
                            : game.pppStage === 'presentation' ? { label: 'Present', cls: 'bg-violet-500/15 text-violet-500' }
                            : null;
                          const isProGame = PRO_GAME_KEYS.has(game.key);
                          return (
                            <button
                              key={game.key}
                              onClick={() => handleSelectGame(game)}
                              className={`panel-card p-6 text-left transition-all relative ${hasContent ? 'panel-card--ready' : ''}`}
                            >
                              {hasContent && <div className="absolute top-2 right-2 w-2 h-2 bg-lc-blue rounded-full" />}
                              <div className="flex items-center gap-2 mb-1">
                                <GameIcon className={`w-5 h-5 ${info.color}`} />
                                <h3 className="font-semibold">{game.name}</h3>
                                {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                                {isProGame && !teacherTier.isPro && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 ml-auto">Pro</span>}
                              </div>
                              <p className="text-sm opacity-70 mt-1">{game.description}</p>
                              <div className="flex flex-wrap gap-1 mt-3">
                                {game.skills.map((skill) => (
                                  <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text2 rounded font-instrument tracking-wide uppercase">{skill}</span>
                                ))}
                              </div>
                              <div className="hud-control mt-3" onClick={(e) => e.stopPropagation()}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <select value={getTimerForPlugin(game.key, game.defaultTimerSeconds)} onChange={(e) => handleTimerOverride(game.key, Number(e.target.value))} className="outline-none cursor-pointer">
                                  {[15, 20, 30, 45, 60, 90, 120].map((s) => <option key={s} value={s}>{s}s</option>)}
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
            )}

            {/* Activities */}
            {(typeFilter === 'all' || typeFilter === 'activities') && (
              <div className="space-y-6">
                {ACTIVITY_CATEGORY_ORDER.map((cat) => {
                  const catActivities = activities.filter((a) => a.category === cat && (
                    skillFilter === 'all' || SESSION_SKILL_FILTERS.find((f) => f.key === skillFilter)?.skills.some((s) => (a.skills as string[]).includes(s))
                  ));
                  if (!catActivities.length) return null;
                  const info = CATEGORY_INFO[cat];
                  const IconComponent = info.icon;
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                        <IconComponent className={`w-4 h-4 ${info.color}`} />
                        <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                        <span className="flex items-center gap-1 text-xs text-lc-text3 mr-1" aria-hidden="true">
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><path d="M3 0L6 3L3 6L0 3Z"/></svg>
                          Activities
                        </span>
                        <div className="hud-rule" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catActivities.map((activity) => {
                          const hasContent = lesson.lessonPlanContent?.generatedContent[activity.key];
                          const ActivityIcon = activity.icon;
                          const stageBadge = activity.pppStage === 'presentation' ? { label: 'Present', cls: 'bg-violet-500/15 text-violet-500' }
                            : activity.pppStage === 'practice' ? { label: 'Practice', cls: 'bg-sky-500/15 text-sky-500' }
                            : activity.pppStage === 'production' ? { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-500' }
                            : null;
                          const isProActivity = PRO_ACTIVITY_KEYS.has(activity.key);
                          return (
                            <button
                              key={activity.key}
                              onClick={() => handleSelectActivity(activity)}
                              className={`panel-card p-6 text-left transition-all relative ${hasContent ? 'panel-card--ready' : ''}`}
                            >
                              {hasContent && <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full" />}
                              <div className="flex items-center gap-2 mb-1">
                                <ActivityIcon className={`w-5 h-5 ${info.color}`} />
                                <h3 className="font-semibold">{activity.name}</h3>
                                {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                                {isProActivity && !teacherTier.isPro && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 ml-auto">Pro</span>}
                              </div>
                              <p className="text-sm opacity-70 mt-2">{activity.description}</p>
                              <div className="flex flex-wrap gap-1 mt-3">
                                {activity.skills.map((skill) => (
                                  <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text2 rounded font-instrument tracking-wide uppercase">{skill}</span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs opacity-50">~{activity.estimatedMinutes} min</span>
                                <div className="hud-control" onClick={(e) => e.stopPropagation()}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <select value={getTimerForPlugin(activity.key, activity.defaultTimerSeconds)} onChange={(e) => handleTimerOverride(activity.key, Number(e.target.value))} className="outline-none cursor-pointer">
                                    {[30, 45, 60, 90, 120, 180].map((s) => <option key={s} value={s}>{s}s</option>)}
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
            )}
          </div>
        ) : viewMode === 'game' && selectedGame ? (
          <div>
            {/* Lesson Flight Plan */}
            {lesson.isLessonActive && lesson.lessonSlots.length > 1 && (
              <div className="mb-4">
                <LessonCaptainFlightPlan
                  steps={buildRuntimeFlightPlanSteps(lesson.lessonSlots)}
                  mode="runtime"
                  activeIndex={getFlightPlanActiveIndex(lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length)}
                  slotBudgets={slotBudgets ?? undefined}
                  pacingIndex={pacingIndex}
                  height={120}
                />
                {showPacingNudge && lesson.isLessonActive && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/80 mt-2">
                    <span className="shrink-0 text-base">⏱️</span>
                    <span className="grow text-white/70 text-xs">
                      Suggested wrap-up time — ready to move on?
                    </span>
                    <button
                      onClick={() => {
                        nudgeDismissedForSlotRef.current = lesson.currentSlotIndex;
                        setShowPacingNudge(false);
                      }}
                      className="shrink-0 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                    >
                      Keep Going
                    </button>
                    <button
                      onClick={() => {
                        setShowPacingNudge(false);
                        lesson.advanceSlot();
                      }}
                      className="shrink-0 text-xs text-white font-medium px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/20 transition-colors"
                    >
                      Next Module →
                    </button>
                  </div>
                )}
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
                  className={`bg-gradient-to-r from-cyan-500 to-blue-600 transition-shadow${isModuleFinished ? ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_4px_rgba(34,211,238,0.45)] animate-pulse' : ''}`}
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
            {lesson.isLessonActive && lesson.lessonSlots.length > 1 && (
              <div className="mb-4">
                <LessonCaptainFlightPlan
                  steps={buildRuntimeFlightPlanSteps(lesson.lessonSlots)}
                  mode="runtime"
                  activeIndex={getFlightPlanActiveIndex(lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length)}
                  slotBudgets={slotBudgets ?? undefined}
                  pacingIndex={pacingIndex}
                  height={120}
                />
                {showPacingNudge && lesson.isLessonActive && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/80 mt-2">
                    <span className="shrink-0 text-base">⏱️</span>
                    <span className="grow text-white/70 text-xs">
                      Suggested wrap-up time — ready to move on?
                    </span>
                    <button
                      onClick={() => {
                        nudgeDismissedForSlotRef.current = lesson.currentSlotIndex;
                        setShowPacingNudge(false);
                      }}
                      className="shrink-0 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                    >
                      Keep Going
                    </button>
                    <button
                      onClick={() => {
                        setShowPacingNudge(false);
                        lesson.advanceSlot();
                      }}
                      className="shrink-0 text-xs text-white font-medium px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/20 transition-colors"
                    >
                      Next Module →
                    </button>
                  </div>
                )}
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
                  className={`bg-gradient-to-r from-cyan-500 to-blue-600 transition-shadow${isModuleFinished ? ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_4px_rgba(34,211,238,0.45)] animate-pulse' : ''}`}
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
                  onPhaseChange={lesson.isLessonActive ? handleActivityPhaseChange : undefined}
                  onContentRegenerate={handleContentRegenerate}
                />
              </ModuleErrorBoundary>
            ) : (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <p className="text-lg font-game text-lc-blue">
                  Preparing {lesson.generatingModuleName || selectedActivity.name}
                </p>
                <p className="text-sm text-lc-text3 mt-2">
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
          <div className="glass rounded-2xl shadow-2xl border border-lc-border max-w-3xl w-full p-8">
            <p className="text-sm opacity-50 uppercase tracking-wider font-semibold mb-3">Student Question</p>
            <p className="text-xl font-medium mb-6 leading-relaxed">{screenAnswer.question}</p>
            <hr className="border-lc-border mb-6" />
            <p className="text-sm opacity-50 uppercase tracking-wider font-semibold mb-3">Answer</p>
            <p className="text-2xl leading-relaxed whitespace-pre-wrap">{screenAnswer.answer}</p>
            <button
              onClick={() => setScreenAnswer(null)}
              className="mt-8 px-4 py-2 rounded-lg glass border border-lc-border text-sm hover:bg-lc-card transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal — shown when generation credits are exhausted or a Pro module is clicked */}
      <PaywallModal
        open={lesson.creditsExhausted || showProGate}
        onClose={() => {
          lesson.dismissCreditsExhausted();
          setShowProGate(false);
        }}
      />
    </div>
  );
}
