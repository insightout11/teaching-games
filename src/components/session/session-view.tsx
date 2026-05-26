'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSessionStore, getEffectiveTopic, DIFFICULTIES } from '@/stores/session-store';
import type { Difficulty, Tone, ScoringMode } from '@/stores/session-store';
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
import { QRCodeSVG } from 'qrcode.react';
import { getAllGames, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';
import { buildRuntimeFlightPlanSteps, getFlightPlanActiveIndex, calculateSlotBudgets, getExpectedPacingIndex, inferLessonDuration, computeAltitude, computeEarthState } from '@/lib/flight-plan-helpers';
import type { EarthState } from '@/lib/flight-plan-helpers';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { PRO_ACTIVITY_KEYS, PRO_GAME_KEYS } from '@/lib/standard-topics';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { useStudentPrefs } from '@/hooks/use-student-prefs';
import type { TopSubmission } from '@/games/types';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import { RunwayPlaneScene } from '@/components/ui/runway-plane-scene';
import { FlightTransitionOverlay } from '@/components/session/flight-transition-overlay';
import { CaptainPickCard } from '@/components/session/captain-pick-card';
import { FlightSessionView } from '@/components/session/flight-session-view';
import type { FlightTransitionLeg } from '@/components/session/flight-transition-overlay';
import { DEFAULT_PLANE_KEY } from '@/lib/plane-progression';

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

const GAME_CATEGORY_ORDER = ['quiz', 'vocabulary', 'grammar-writing', 'logic-puzzles'] as const;
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

interface SessionParticipant {
  id: string;
  student_id: string | null;
  display_name: string;
  avatar_seed: string | null;
  joined_at: string;
}
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
  // Use individual selectors to avoid re-rendering on unrelated store changes where possible.
  const initSession = useSessionStore((s) => s.initSession);
  const settings = useSessionStore((s) => s.settings);
  const setSettings = useSessionStore((s) => s.setSettings);
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);
  const addStudent = useSessionStore((s) => s.addStudent);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedGame, setSelectedGame] = useState<GamePlugin | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityPlugin | null>(null);
  const [activityContent, setActivityContent] = useState<ActivityGeneratedContent | null>(null);
  const [activityContentFailed, setActivityContentFailed] = useState(false);
  const [gameContent, setGameContent] = useState<GameGeneratedContent | null>(null);
  // Content overrides from takeoff regeneration (mission/character context)
  const [contentOverrides, setContentOverrides] = useState<Record<string, ActivityGeneratedContent>>({});
  const contentOverridesRef = useRef(contentOverrides);
  contentOverridesRef.current = contentOverrides;
  const [ended, setEnded] = useState(session.status === 'ended');
  const [students, setStudents] = useState(serverStudents);
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [timerOverrides, setTimerOverrides] = useState<Record<string, number>>({});
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCockpitQr, setShowCockpitQr] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [screenAnswer, setScreenAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all');
  const [skillFilter, setSkillFilter] = useState<SessionSkillFilter>('all');
  const [swapSuggestion, setSwapSuggestion] = useState<{
    type: 'activity' | 'game';
    plugin: ActivityPlugin | GamePlugin;
  } | null>(null);
  const [showPivotDrawer, setShowPivotDrawer] = useState(false);
  const [selectedPlaneKey] = useState(DEFAULT_PLANE_KEY);
  const [moduleTransition, setModuleTransition] = useState<{
    from: string | null;
    to: string | null;
    weatherState: WeatherState;
    altitudeFrom: number;
    altitudeTo: number;
    leg: FlightTransitionLeg;
  } | null>(null);

  // Bonus vote state
  const [bonusVotePollId, setBonusVotePollId] = useState<string | null>(null);
  const [bonusVoteCandidates, setBonusVoteCandidates] = useState<GamePlugin[]>([]);
  const { tallies: bonusTallies, votes: bonusVotes } = usePollVotes(bonusVotePollId);

  // Top 3 reveal state
  const [featuredSubmissions, setFeaturedSubmissions] = useState<TopSubmission[] | null>(null);
  const prefsMap = useStudentPrefs(session.id);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Clear stale explore-session reference if this session is already ended
  useEffect(() => {
    if (session.status === 'ended') {
      localStorage.removeItem('lc-explore-session');
    }
  }, [session.status]);

  // Receive "Share answer on screen" messages from the questions popup window
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ch = new BroadcastChannel(`lc-session-${session.id}`);
    ch.onmessage = (e: MessageEvent) => {
      if (e.data?.kind === 'show-answer') {
        setScreenAnswer({ question: e.data.question, answer: e.data.answer });
      }
    };
    return () => ch.close();
  }, [session.id]);

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

  // ─── Sky weather state — position-based for linear narrative arc ──────
  const weatherState = useMemo<WeatherState>(() => {
    if (!lesson.isLessonActive) return 'idle';
    if (lesson.phase === 'lobby') return 'climbing';
    if (lesson.phase === 'landing' || lesson.phase === 'ended') return 'landing';
    const totalSlots = lesson.lessonSlots.length;
    const idx = lesson.currentSlotIndex;
    // Single-slot sessions (explore quick-play) cruise at altitude — no runway
    if (totalSlots <= 1) return 'cruising';
    if (idx === 0) return 'climbing';
    if (idx >= totalSlots - 1) return 'landing';
    const progress = idx / (totalSlots - 1);
    if (progress < 0.35) return 'climbing';
    if (progress < 0.65) return 'cruising';
    return 'golden';
  }, [lesson.isLessonActive, lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length]);

  const altitude = useMemo(
    () => {
      if (!lesson.isLessonActive) return 0.8;
      if (lesson.lessonSlots.length <= 1) return 0.75;
      return computeAltitude(lesson.currentSlotIndex, lesson.lessonSlots.length);
    },
    [lesson.isLessonActive, lesson.currentSlotIndex, lesson.lessonSlots.length],
  );

  const earthState = useMemo<EarthState>(
    () => {
      if (!lesson.isLessonActive) return 'flight';
      if (lesson.lessonSlots.length <= 1) return 'flight';
      return computeEarthState(lesson.currentSlotIndex, lesson.lessonSlots.length);
    },
    [lesson.isLessonActive, lesson.currentSlotIndex, lesson.lessonSlots.length],
  );

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
      initSession(session.id, cls.id, []);
      existingScores.forEach((s) => useSessionStore.getState().addRealtimeScore(s));
      // Apply class presets (difficulty/tone/scoringMode) — overrides stale localStorage defaults.
      // For scoringMode: only apply class default when the lesson plan has no explicit mode
      // (lesson plan explicit > class default > goal-derived, which use-lesson-session sets first).
      const lessonPlanHasScoringMode = (() => {
        try {
          const s = typeof window !== 'undefined' ? sessionStorage.getItem('lessonPlanContent') : null;
          return s ? !!JSON.parse(s).scoringMode : false;
        } catch { return false; }
      })();
      const patch: Parameters<typeof setSettings>[0] = {};
      if (cls.default_difficulty) patch.difficulty = cls.default_difficulty as Difficulty;
      if (cls.default_tone) patch.tone = cls.default_tone as Tone;
      if (cls.default_scoring_mode && !lessonPlanHasScoringMode) {
        patch.scoringMode = cls.default_scoring_mode as ScoringMode;
      }
      if (Object.keys(patch).length > 0) setSettings(patch);
      // Write effective settings to DB so students can see topic/difficulty on the waiting screen.
      // Read from getState() to capture any patches applied above.
      const s = useSessionStore.getState().settings;
      void fetch('/api/session/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          topic: s.topic,
          difficulty: s.difficulty,
          customTopic: s.customTopic || null,
        }),
      });
      initDone.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, cls.id]);

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
    };

    const interval = setInterval(poll, 3000);
    // Also poll immediately on mount
    poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cls.id]);

  // Sync only joined participants into the store (prevents unjoined roster students from getting roles)
  useEffect(() => {
    sessionParticipants.forEach((p) => {
      if (!p.student_id) return;
      const student = students.find((s) => s.id === p.student_id);
      if (student) addStudent(student);
    });
  }, [sessionParticipants, students, addStudent]);

  // Poll session_participants to show who actually joined this session in the lobby
  useEffect(() => {
    let cancelled = false;
    const pollParticipants = async () => {
      if (isMockMode()) {
        const res = await fetch(`/api/student/participants?sessionId=${session.id}`);
        if (!res.ok) return;
        const body = await res.json() as { participants?: SessionParticipant[] };
        const data = body.participants ?? [];
        if (cancelled) return;
        setSessionParticipants((prev) => {
          if (data.length === prev.length && data.every((p, i) => p.id === prev[i]?.id)) return prev;
          return data;
        });
        return;
      }

      const sb = createClient();
      const { data } = await sb
        .from('session_participants')
        .select('id, student_id, display_name, avatar_seed, joined_at')
        .eq('session_id', session.id)
        .order('joined_at') as { data: SessionParticipant[] | null };
      if (cancelled || !data) return;
      setSessionParticipants((prev) => {
        if (data.length === prev.length && data.every((p, i) => p.id === prev[i]?.id)) return prev;
        return data;
      });
    };

    const interval = setInterval(pollParticipants, 3000);
    pollParticipants();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session.id]);

  const handleEndSession = async () => {
    if (bonusVotePollId) {
      await supabase.from('polls').update({ is_active: false }).eq('id', bonusVotePollId);
    }
    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    sessionStorage.removeItem('lessonPlanContent');
    localStorage.removeItem('lc-explore-session');
    setEnded(true);
  };

  const handleLaunchBonusVote = async () => {
    const lastKey = selectedGame?.key ?? selectedActivity?.key ?? null;
    const eligibleGames = games.filter((g) => !PRO_GAME_KEYS.has(g.key) && g.key !== lastKey);
    // Pick 3 random candidates
    const shuffled = [...eligibleGames].sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 3);
    if (candidates.length < 2) return;

    const { data, error } = await supabase
      .from('polls')
      .insert({
        session_id: session.id,
        question: 'Vote for your bonus game!',
        options: candidates.map((g) => g.name),
        is_active: true,
        metadata: {
          poll_type: 'bonus_vote',
          games: candidates.map((g) => ({ key: g.key, name: g.name })),
        },
      })
      .select('id')
      .single();

    if (!error && data) {
      setBonusVoteCandidates(candidates);
      setBonusVotePollId(data.id);
    }
  };

  const handleConfirmBonusWinner = async (winnerKey: string) => {
    if (bonusVotePollId) {
      await supabase.from('polls').update({ is_active: false }).eq('id', bonusVotePollId);
    }
    setBonusVotePollId(null);
    const winnerGame = games.find((g) => g.key === winnerKey);
    if (winnerGame) {
      setSelectedGame(winnerGame);
      setViewMode('game');
    }
  };

  const handleDismissBonusVote = async () => {
    if (bonusVotePollId) {
      await supabase.from('polls').update({ is_active: false }).eq('id', bonusVotePollId);
    }
    setBonusVotePollId(null);
    setBonusVoteCandidates([]);
  };

  const joinUrl = `${window.location.origin}/join/${session.id}`;

  const handleCopyJoinLink = () => {
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
    setActivityContentFailed(false);
    setGameContent(null);
    setViewMode('activity');

    const resolved = await lesson.selectActivity(activity);
    // Only apply if this activity is still the active one (guards against rapid slot advances)
    if (activeActivityKeyRef.current === activity.key) {
      // Apply regen override if available (set by a previous takeoff activity)
      const content = contentOverridesRef.current[activity.key] ?? resolved;
      if (content === null) {
        setActivityContentFailed(true);
      }
      setActivityContent(content);
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

  const handleNextSlotWithTransition = useCallback(() => {
    const currentIndex = lesson.currentSlotIndex;
    const nextIndex = currentIndex + 1;
    const hasNextSlot = nextIndex < lesson.lessonSlots.length;
    if (lesson.isLessonActive && hasNextSlot) {
      const fromName = selectedGame?.name ?? selectedActivity?.name ?? null;
      const nextSlot = lesson.lessonSlots[nextIndex];
      const found = nextSlot
        ? (nextSlot.type === 'game'
            ? getAllGames().find((g) => g.key === nextSlot.key)
            : getAllActivities().find((a) => a.key === nextSlot.key))
        : undefined;
      const toName = found?.name ?? nextSlot?.name ?? null;
      const totalSlots = lesson.lessonSlots.length;
      // Destination sky phase (same formula as weatherState memo)
      let toWeather: WeatherState = 'cruising';
      if (nextIndex >= totalSlots - 1) toWeather = 'landing';
      else if (totalSlots > 1) {
        const progress = nextIndex / (totalSlots - 1);
        if (progress < 0.35) toWeather = 'climbing';
        else if (progress < 0.65) toWeather = 'cruising';
        else toWeather = 'golden';
      }
      // Leg type: takeoff = first transition; descent = last two slots; cruise = middle
      const leg: FlightTransitionLeg =
        nextIndex === 1 ? 'takeoff'
        : nextIndex >= totalSlots - 2 ? 'descent'
        : 'cruise';
      // Altitude animates from current slot to destination slot
      const altFrom = totalSlots > 2 ? computeAltitude(currentIndex, totalSlots) : 0;
      const altTo   = totalSlots > 2 ? computeAltitude(nextIndex,    totalSlots) : 0;
      setModuleTransition({
        from: fromName,
        to: toName,
        weatherState: toWeather,
        altitudeFrom: altFrom,
        altitudeTo: altTo,
        leg,
      });
    }
    lesson.advanceSlot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, selectedGame, selectedActivity]);

  // Reset module phase when slot advances so the pulse clears on the new module
  useEffect(() => {
    setModulePhase('idle');
  }, [lesson.currentSlotIndex]);

  const handleActivityPhaseChange = useCallback((phase: string) => {
    setModulePhase(phase);
    lesson.handlePhaseChange(phase);
  }, [lesson.handlePhaseChange]);

  const isModuleFinished = modulePhase === 'finished' && lesson.isLessonActive;
  const flightConfig = lesson.lessonPlanContent?.flightConfig;
  const isAllAroundFlight = lesson.lessonPlanContent?.flightPresetId === 'all-around-flight-60' && Boolean(flightConfig);

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
    return (
      <div className="relative min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <SkyBackground weatherState="landing" earthState="landing" altitude={0} intensity="moderate" className="!left-64" />
        {/* Plane parked on right taxiway — class has landed */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 7, left: '256px' }}>
          <div className="absolute bottom-0 left-[62%] -translate-x-1/2">
            <RunwayPlaneScene planeKey={selectedPlaneKey} planeSize="xl" showRunway={false} />
          </div>
        </div>
        <div className="relative z-10 pb-52">
          <EndSessionSummary classId={cls.id} className={cls.name} sessionId={session.id} />
        </div>
      </div>
    );
  }

  // Prevent SSR/hydration mismatch: render a loading shell until client mounts
  if (!mounted) {
    return (
      <div className="relative min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <SkyBackground intensity="subtle" className="!left-64" />
        <div className="relative z-10 flex items-center justify-center pt-24">
          <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ─── LOBBY VIEW ──────────────────────────────────────────────────────────
  if (lesson.phase === 'lobby') {

    return (
      <div className="relative h-screen overflow-hidden -m-6 lg:-m-8 theme-Midnight hud-bg">
        <SkyBackground weatherState="climbing" earthState="takeoff" intensity="subtle" className="!left-64" />
        {/* Plane parked on left taxiway — above sky layers (z-7), below cards (z-10) */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 7, left: '256px' }}>
          <div className="absolute bottom-0 left-[38%] -translate-x-1/2">
            <RunwayPlaneScene planeKey={selectedPlaneKey} planeSize="xl" showRunway={false} />
          </div>
        </div>
        <div className="relative z-10 h-[74vh] overflow-hidden">
          <div className="h-full flex flex-col max-w-5xl mx-auto px-6 lg:px-8 pt-5 pb-4">

            {/* Title */}
            <div className="text-center mb-4 flex-shrink-0">
              <h1 className="text-2xl font-bold text-lc-text">
                {lesson.lessonSlots.length === 1 ? `Ready to play ${lesson.lessonSlots[0].name}` : 'Launch Lobby'}
              </h1>
              <p className="text-sm text-lc-text2">
                {lesson.customTopic}
                {lesson.isMissionBased && <span className="ml-2 text-lc-warn font-medium">Mission Lesson</span>}
              </p>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

              {/* Left column: Join QR + Flight Plan */}
              <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
                <div className="glass rounded-2xl p-5 flex-shrink-0">
                  <p className="text-xs opacity-50 uppercase tracking-wider font-semibold text-center mb-3">Join Link</p>
                  <div className="flex justify-center mb-3">
                    <div className="p-2.5 bg-white rounded-xl">
                      <QRCodeSVG value={joinUrl} size={120} level="H" includeMargin={false} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-cyan-400 text-xs bg-lc-surface border border-lc-border px-3 py-1.5 rounded-lg font-mono break-all flex-1 min-w-0">
                      {joinUrl}
                    </code>
                    <button
                      onClick={handleCopyJoinLink}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg glass border border-lc-border text-xs hover:bg-lc-card transition-colors"
                    >
                      {joinLinkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {lesson.lessonSlots.length > 1 && (
                  <div className="glass rounded-2xl p-5 flex-shrink-0">
                    <h2 className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-3">Flight Plan</h2>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {lesson.lessonSlots.map((slot, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 px-3 py-2 bg-lc-surface rounded-lg text-xs text-center min-w-[72px]"
                        >
                          <p className="opacity-50 uppercase tracking-wider mb-0.5">{i + 1}</p>
                          <p className="font-medium truncate">{slot.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Students Joined + Mission status */}
              <div className="flex flex-col gap-4 min-h-0">
                <div className="glass rounded-2xl p-5 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h2 className="text-xs font-semibold opacity-70 uppercase tracking-wider">Students Joined</h2>
                    <span className="text-2xl font-bold text-lc-blue">{sessionParticipants.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {sessionParticipants.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm opacity-50">Waiting for students to join...</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sessionParticipants.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col items-center gap-1 bg-lc-card rounded-2xl px-3 py-2 min-w-[64px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/avatars/avatar-${resolveHelmet(p.avatar_seed ?? '', p.display_name)}.png`} alt="" width={40} height={40} className="w-10 h-10 rounded-xl" />
                            <span className="text-xs font-semibold text-lc-text truncate max-w-[64px] text-center">{p.display_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {lesson.lessonSlots.some((s) => s.key === 'mission-selector') && (
                  <div className="glass rounded-2xl p-4 flex-shrink-0">
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
              </div>
            </div>

            {/* Begin Lesson + End Session — pinned at bottom */}
            <div className="flex-shrink-0 pt-4 space-y-2">
              <button
                onClick={lesson.beginLesson}
                disabled={!lesson.missionSelectorReady}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg text-white transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {lesson.lessonSlots.length === 1 ? `Start ${lesson.lessonSlots[0].name}` : 'Begin Lesson'}
              </button>
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
        </div>
      </div>
    );
  }

  // ─── MAIN SESSION VIEW ───────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
      <SkyBackground
        weatherState={weatherState}
        currentSlotIndex={lesson.currentSlotIndex}
        altitude={altitude}
        earthState={earthState}
        intensity="moderate"
        className="!left-64"
      />
      {/* Plane on runway — left taxiway (takeoff) or right taxiway (landing) */}
      {(earthState === 'takeoff' || earthState === 'landing') && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 7, left: '256px' }}>
          <div className={`absolute bottom-0 ${earthState === 'takeoff' ? 'left-[38%]' : 'left-[62%]'} -translate-x-1/2`}>
            <RunwayPlaneScene planeKey={selectedPlaneKey} planeSize="xl" showRunway={false} />
          </div>
        </div>
      )}
      <div className="relative z-10 space-y-4">
        {/* Session header */}
        <div className="flex items-center justify-between hud-header-bar">
          <div>
            <h1 className="text-xl font-bold text-lc-text">{cls.name} — Live Session</h1>
            <p className="text-sm text-lc-text2">
              {sessionParticipants.length} students
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
              onClick={() => setShowQrModal(true)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Show QR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareMode((v) => !v)}
              className={shareMode ? 'text-green-400 hover:text-green-300' : 'text-lc-text3 hover:text-lc-text2'}
              title={shareMode ? 'Exit Zoom Mode — class questions widget visible again' : 'Zoom Mode — hides class questions from shared screen'}
            >
              {shareMode ? '● Zoom' : 'Zoom Mode'}
            </Button>
            {shareMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = new URL(`/questions/${session.id}`, window.location.origin);
                  url.searchParams.set('topic', getEffectiveTopic(settings));
                  url.searchParams.set('difficulty', settings.difficulty);
                  window.open(url.toString(), 'classquestions', 'popup=true,width=700,height=760,scrollbars=yes');
                }}
                className="text-amber-400 hover:text-amber-300"
                title="Open class questions in a private popup window"
              >
                Questions ↗
              </Button>
            )}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/sessions/${session.id}/cockpit`, '_blank')}
                onContextMenu={(e) => { e.preventDefault(); setShowCockpitQr((v) => !v); }}
                className="text-violet-400 hover:text-violet-300"
                title="Open Teacher Cockpit on phone (right-click for QR code)"
              >
                📱 Cockpit ↗
              </Button>
              {showCockpitQr && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-2xl z-50 flex flex-col items-center gap-2">
                  <QRCodeSVG
                    value={`${window.location.origin}/sessions/${session.id}/cockpit`}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                  <p className="text-xs text-gray-500 font-medium">Scan to open cockpit</p>
                  <button
                    onClick={() => setShowCockpitQr(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕ close
                  </button>
                </div>
              )}
            </div>
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

            {/* Bonus Round — shown when lesson is complete and session still active */}
            {lesson.phase === 'ended' && !bonusVotePollId && (
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-lc-text text-sm">Lesson complete — got time to spare?</p>
                  <p className="text-xs text-lc-text3 mt-0.5">Let the class vote on a bonus game.</p>
                </div>
                <button
                  onClick={handleLaunchBonusVote}
                  className="flex-shrink-0 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-sm text-white shadow hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Bonus Round?
                </button>
              </div>
            )}

            {/* Bonus Vote Live Panel */}
            {bonusVotePollId && bonusVoteCandidates.length > 0 && (
              <div className="rounded-2xl border border-cyan-500/30 bg-lc-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lc-text text-sm">Vote: Bonus Game — {bonusVotes.length} vote{bonusVotes.length !== 1 ? 's' : ''}</p>
                  <button onClick={handleDismissBonusVote} className="text-xs text-lc-text3 hover:text-lc-text">Cancel</button>
                </div>
                <div className="space-y-2">
                  {bonusVoteCandidates.map((g) => {
                    const count = bonusTallies[g.name] ?? 0;
                    const total = bonusVotes.length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={g.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-lc-text font-medium">{g.name}</span>
                          <span className="text-lc-text3 tabular-nums">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const maxCount = Math.max(...bonusVoteCandidates.map((g) => bonusTallies[g.name] ?? 0));
                  const leaders = maxCount > 0 ? bonusVoteCandidates.filter((g) => (bonusTallies[g.name] ?? 0) === maxCount) : [];
                  return (
                    <div className="flex gap-2 flex-wrap">
                      {leaders.length === 1 ? (
                        <button
                          onClick={() => handleConfirmBonusWinner(leaders[0].key)}
                          className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-sm text-white shadow hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Launch {leaders[0].name}
                        </button>
                      ) : leaders.length > 1 ? (
                        <>
                          <p className="w-full text-xs text-lc-text3">Tie — you pick:</p>
                          {leaders.map((g) => (
                            <button
                              key={g.key}
                              onClick={() => handleConfirmBonusWinner(g.key)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-lc-text font-medium transition-all"
                            >
                              {g.name}
                            </button>
                          ))}
                        </>
                      ) : (
                        <p className="text-xs text-lc-text3">Waiting for votes…</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

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
          isAllAroundFlight && flightConfig ? (
            <FlightSessionView
              slots={lesson.lessonSlots}
              currentSlotIndex={lesson.currentSlotIndex}
              phase={lesson.phase}
              flightConfig={flightConfig}
              currentModuleName={selectedGame.name}
              isModuleFinished={isModuleFinished}
              onExit={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}
              onSwap={() => setShowPivotDrawer(true)}
              onNext={handleNextSlotWithTransition}
            >
              <ModuleErrorBoundary moduleName={selectedGame.name} onReset={handleBackToSelection}>
                <GameShell game={selectedGame} config={EMPTY_CONFIG} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} onRevealTopSubmissions={(subs) => setFeaturedSubmissions(subs)} />
              </ModuleErrorBoundary>
            </FlightSessionView>
          ) : (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPivotDrawer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-lc-text3 hover:text-amber-400 hover:bg-amber-500/10 border border-lc-border hover:border-amber-500/30 rounded-lg transition-all"
                  title="Swap to a different activity right now"
                >
                  ⚡ Swap
                </button>
                {lesson.isLessonActive && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNextSlotWithTransition}
                    className={`bg-gradient-to-r from-cyan-500 to-blue-600 transition-shadow${isModuleFinished ? ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_4px_rgba(34,211,238,0.45)] animate-pulse' : ''}`}
                  >
                    {lesson.currentSlotIndex + 1 < lesson.lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                  </Button>
                )}
              </div>
            </div>
            <ModuleErrorBoundary moduleName={selectedGame.name} onReset={handleBackToSelection}>
              <GameShell game={selectedGame} config={EMPTY_CONFIG} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} onRevealTopSubmissions={(subs) => setFeaturedSubmissions(subs)} />
            </ModuleErrorBoundary>
          </div>
          )
        ) : viewMode === 'activity' && selectedActivity ? (
          isAllAroundFlight && flightConfig ? (
            <FlightSessionView
              slots={lesson.lessonSlots}
              currentSlotIndex={lesson.currentSlotIndex}
              phase={lesson.phase}
              flightConfig={flightConfig}
              currentModuleName={lesson.generatingModuleName || selectedActivity.name}
              isModuleFinished={isModuleFinished}
              onExit={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}
              onSwap={() => setShowPivotDrawer(true)}
              onNext={handleNextSlotWithTransition}
            >
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
              ) : activityContentFailed ? (
                <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <p className="text-lg font-bold text-red-400 mb-2">Content generation failed</p>
                  <p className="text-sm text-lc-text3 mb-6">
                    Couldn&apos;t generate content for {selectedActivity.name}. Check your connection and try again.
                  </p>
                  <button
                    onClick={() => handleSelectActivity(selectedActivity)}
                    className="px-6 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24">
                  <p className="text-2xl font-game text-lc-blue">
                    Preparing {lesson.generatingModuleName || selectedActivity.name}
                  </p>
                  <p className="text-sm text-lc-text3 mt-3 opacity-60">
                    Generating content for your lesson...
                  </p>
                </div>
              )}
            </FlightSessionView>
          ) : (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPivotDrawer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-lc-text3 hover:text-amber-400 hover:bg-amber-500/10 border border-lc-border hover:border-amber-500/30 rounded-lg transition-all"
                  title="Swap to a different activity right now"
                >
                  ⚡ Swap
                </button>
                {lesson.isLessonActive && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNextSlotWithTransition}
                    className={`bg-gradient-to-r from-cyan-500 to-blue-600 transition-shadow${isModuleFinished ? ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0d1117] shadow-[0_0_18px_4px_rgba(34,211,238,0.45)] animate-pulse' : ''}`}
                  >
                    {lesson.currentSlotIndex + 1 < lesson.lessonSlots.length ? 'Next Item →' : 'Complete Lesson'}
                  </Button>
                )}
              </div>
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
            ) : activityContentFailed ? (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <p className="text-lg font-bold text-red-400 mb-2">Content generation failed</p>
                <p className="text-sm text-lc-text3 mb-6">
                  Couldn&apos;t generate content for {selectedActivity.name}. Check your connection and try again.
                </p>
                <button
                  onClick={() => handleSelectActivity(selectedActivity)}
                  className="px-6 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <p className="text-2xl font-game text-lc-blue">
                  Preparing {lesson.generatingModuleName || selectedActivity.name}
                </p>
                <p className="text-sm text-lc-text3 mt-3 opacity-60">
                  Generating content for your lesson...
                </p>
              </div>
            )}
          </div>
          )
        ) : null}
      </div>

      {/* Captain's Pick card — spotlight overlay triggered by teacher */}
      {session && <CaptainPickCard sessionId={session.id} />}

      {/* Flight transition overlay — between lesson modules */}
      {moduleTransition && (
        <FlightTransitionOverlay
          from={moduleTransition.from}
          to={moduleTransition.to}
          weatherState={moduleTransition.weatherState}
          altitudeFrom={moduleTransition.altitudeFrom}
          altitudeTo={moduleTransition.altitudeTo}
          leg={moduleTransition.leg}
          planeKey={selectedPlaneKey}
          onDismiss={() => setModuleTransition(null)}
        />
      )}

      {/* Floating widget system — class-questions hidden in Zoom Mode */}
      {WIDGET_REGISTRY.filter((w) => !shareMode || w.id !== 'class-questions').map((widget) => (
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
      <WidgetLauncher sessionId={session.id} shareMode={shareMode} />

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

      {/* Top 3 reveal overlay — shown when teacher taps "Reveal Top 3" */}
      {featuredSubmissions && (
        <div
          className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-6"
          onClick={() => setFeaturedSubmissions(null)}
        >
          <div className="max-w-2xl w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Top Answers</h2>
            {featuredSubmissions.map((sub, i) => {
              const pref = prefsMap.get(sub.clientId);
              const showName = pref?.score_visible !== false;
              return (
                <div key={i} className="glass rounded-2xl p-5 border border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-lg text-white leading-relaxed flex-1">&ldquo;{sub.content}&rdquo;</p>
                    <span className="text-xl font-bold text-yellow-400 flex-shrink-0">{sub.points} pts</span>
                  </div>
                  {sub.feedback && (
                    <p className="text-sm text-cyan-400 mt-3 leading-relaxed">{sub.feedback}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {showName ? sub.displayName : 'Anonymous pilot'}
                  </p>
                </div>
              );
            })}
            <button
              onClick={() => setFeaturedSubmissions(null)}
              className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* QR code modal — shown when teacher clicks "Show QR" during session */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="glass rounded-2xl p-8 space-y-4 text-center shadow-2xl border border-lc-border"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs opacity-50 uppercase tracking-wider font-semibold">Join Link</p>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={joinUrl} size={200} level="H" includeMargin={false} />
              </div>
            </div>
            <code className="block text-cyan-400 text-sm bg-lc-surface border border-lc-border px-4 py-2 rounded-lg font-mono break-all">
              {joinUrl}
            </code>
            <div className="flex gap-2 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJoinLink}
                className="text-cyan-400 hover:text-cyan-300"
              >
                {joinLinkCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowQrModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Pivot Drawer — swap the currently running activity/game */}
      {showPivotDrawer && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowPivotDrawer(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[440px] max-w-[90vw] bg-lc-card border-l border-lc-border z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-lc-border">
              <div>
                <h2 className="font-semibold text-lc-text">Swap Activity</h2>
                <p className="text-xs text-lc-text3 mt-0.5">Ends current activity, starts new one immediately</p>
              </div>
              <button onClick={() => setShowPivotDrawer(false)} className="p-1 hover:bg-lc-surface rounded-lg">
                <svg className="w-5 h-5 text-lc-text3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {GAME_CATEGORY_ORDER.map((cat) => {
                const currentKey = selectedGame?.key ?? selectedActivity?.key;
                const catGames = games.filter((g) => g.category === cat && g.key !== currentKey);
                if (!catGames.length) return null;
                const info = GAME_CATEGORY_INFO[cat];
                const IconComponent = info.icon;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-xs font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {catGames.map((game) => {
                        const GameIcon = game.icon;
                        return (
                          <button
                            key={game.key}
                            onClick={() => {
                              lesson.insertAndPivotSlot(game.key, 'game', game.name);
                              setShowPivotDrawer(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-lc-surface rounded-lg border border-lc-border hover:border-lc-blue/40 transition-all text-left"
                          >
                            <GameIcon className="w-5 h-5 text-lc-text3 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-lc-text">{game.name}</p>
                              <p className="text-xs text-lc-text3 truncate">{game.description}</p>
                            </div>
                            <span className="text-xs text-lc-text3 flex-shrink-0">~{game.estimatedMinutes}m</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {ACTIVITY_CATEGORY_ORDER.map((cat) => {
                const currentKey = selectedGame?.key ?? selectedActivity?.key;
                const catActivities = activities.filter((a) => a.category === cat && a.key !== currentKey);
                if (!catActivities.length) return null;
                const info = CATEGORY_INFO[cat];
                const IconComponent = info.icon;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className={`w-4 h-4 ${info.color}`} />
                      <span className={`text-xs font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {catActivities.map((activity) => {
                        const ActivityIcon = activity.icon;
                        return (
                          <button
                            key={activity.key}
                            onClick={() => {
                              lesson.insertAndPivotSlot(activity.key, 'activity', activity.name);
                              setShowPivotDrawer(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-lc-surface rounded-lg border border-lc-border hover:border-lc-blue/40 transition-all text-left"
                          >
                            <ActivityIcon className="w-5 h-5 text-lc-text3 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-lc-text">{activity.name}</p>
                              <p className="text-xs text-lc-text3 truncate">{activity.description}</p>
                            </div>
                            <span className="text-xs text-lc-text3 flex-shrink-0">~{activity.estimatedMinutes}m</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
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
