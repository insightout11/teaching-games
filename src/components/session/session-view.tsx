'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSessionStore, getEffectiveTopic } from '@/stores/session-store';
import type { Difficulty, Tone, ScoringMode } from '@/stores/session-store';
import { useRealtimeLeaderboard } from '@/hooks/use-realtime-leaderboard';
import { useLessonSession } from '@/hooks/use-lesson-session';
import { GameShell } from './game-shell';
import { ActivityShell } from './activity-shell';
import { ModuleErrorBoundary } from './module-error-boundary';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { DemoSimulator } from './demo-simulator';
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
import type { WorldFlightProgressionRewardResult } from '@/lib/world-flight/progression';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { PRO_ACTIVITY_KEYS, PRO_GAME_KEYS } from '@/lib/standard-topics';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { useStudentPrefs } from '@/hooks/use-student-prefs';
import type { TopSubmission } from '@/games/types';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import { RunwayPlaneScene } from '@/components/ui/runway-plane-scene';
import { LobbyAirfieldScene } from '@/components/ui/lobby-airfield-scene';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightTransitionOverlay } from '@/components/session/flight-transition-overlay';
import { rollWeather } from '@/components/world-flight/arrival-scene/weather';
import { CaptainPickCard } from '@/components/session/captain-pick-card';
import { FlightSessionView } from '@/components/session/flight-session-view';
import { RouteChoicePanel } from '@/components/session/route-choice-panel';
import type { FlightTransitionLeg } from '@/components/session/flight-transition-overlay';
import { DEFAULT_PLANE_KEY } from '@/lib/plane-progression';
import { WorldFlightArrivalBackdrop } from '@/components/session/world-flight-backdrop';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { HOME_BASE_ID, HOME_BASE_NAME, HOME_BASE_SCENE } from '@/lib/world-flight/home-base';
import { getDestinationById } from '@/data/world-flight/destinations';
import { DestinationMediaCard } from '@/components/place-media/destination-media-card';
import { getLessonIntroMediaForDestination } from '@/lib/place-media';
import { distanceKm } from '@/lib/world-flight/geo';
import { arrivalHour, clockHourAt, timeOfDay } from '@/lib/world-flight/flight-time';
import { avatarUrl } from '@/lib/avatar-options';
import { ExternalLink, Maximize2, Minimize2, PlaneLanding, QrCode, Settings, Smartphone } from 'lucide-react';

// Map a flight-clock hour to a SkyBackground weather palette. Thresholds are
// tuned so a sunset departure -> overnight -> sunrise arrival reproduces the
// legacy climbing -> cruising -> golden -> landing arc exactly, while shorter
// flights simply stop earlier (e.g. a short hop ends at night, not sunrise).
function weatherForHour(hour: number): WeatherState {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 7.5 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'climbing'; // sunset / dusk (departure)
  if (h >= 6 && h < 7.5) return 'landing';  // sunrise
  if (h >= 4.5 && h < 6) return 'golden';   // pre-dawn
  return 'cruising';                         // deep night (20:00–04:30)
}

// ─── Departure board ────────────────────────────────────────────────────────

function DepartureBoardPanel({
  slots,
  flightCode,
  className,
}: {
  slots: Array<{ name: string; key: string; pool?: string[] }>;
  flightCode: string;
  className?: string;
}) {
  const getStatus = (i: number) => {
    if (i === 0) return { label: 'BOARDING', cls: 'text-emerald-400', pulse: true };
    if (i < 3)   return { label: 'ON TIME',  cls: 'text-amber-400/70', pulse: false };
    return         { label: 'SCHED',     cls: 'text-amber-400/38', pulse: false };
  };
  const amber = { textShadow: '0 0 10px rgba(251,191,36,0.35)' };
  // Single-activity sessions: pin the row to the top and enlarge it so it reads
  // as the headline departure, rather than a tiny line floating mid-board.
  const sparse = slots.length <= 2;

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col ${className ?? ''}`}
      style={{
        background: 'rgba(3,6,12,0.97)',
        border: '1px solid rgba(251,191,36,0.18)',
        boxShadow: '0 0 28px rgba(251,191,36,0.05), inset 0 1px 0 rgba(251,191,36,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(251,191,36,0.12)' }}>
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400/80" aria-hidden>
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
          <span className="text-[10px] font-mono font-bold tracking-[0.22em] text-amber-400/90 uppercase" style={amber}>
            Departures
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-[0.18em] text-amber-400/40">{flightCode}</span>
      </div>

      {/* Column labels */}
      <div className="grid px-4 py-1 flex-shrink-0" style={{ gridTemplateColumns: '36px 1fr 86px', gap: '0 12px', borderBottom: '1px solid rgba(251,191,36,0.07)' }}>
        {(['FLT', 'DESTINATION', 'STATUS'] as const).map((h) => (
          <span key={h} className="text-[8px] font-mono text-amber-400/28 tracking-[0.18em]">{h}</span>
        ))}
      </div>

      {/* Rows — for a full plan, flex-1 on each row distributes height evenly.
          For a single/short session, pin to the top so the activity headlines. */}
      <div className={`flex flex-col overflow-y-auto min-h-0 ${sparse ? 'flex-shrink-0' : 'flex-1'}`}>
        {slots.map((slot, i) => {
          const st = getStatus(i);
          const isNext = i === 0;
          const isUndetermined = slot.key === 'mission-selector' || (slot.pool?.length ?? 0) > 0;
          return (
            <div
              key={i}
              className={`grid px-4 items-center ${sparse ? 'flex-shrink-0' : 'flex-1'}`}
              style={{
                gridTemplateColumns: sparse ? '44px 1fr 86px' : '36px 1fr 86px',
                gap: '0 12px',
                minHeight: sparse ? '64px' : '36px',
                borderBottom: i < slots.length - 1 ? '1px solid rgba(251,191,36,0.05)' : 'none',
                background: isNext ? 'rgba(251,191,36,0.03)' : 'transparent',
              }}
            >
              <span
                className={`font-mono font-bold text-amber-400/50 ${sparse ? 'text-[15px]' : 'text-[11px]'}`}
                style={isNext ? amber : {}}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {isUndetermined ? (
                <span className={`font-mono text-amber-400/35 italic tracking-wide ${sparse ? 'text-[15px]' : 'text-[11px]'}`}>
                  ✦ Waypoint
                </span>
              ) : (
                <span
                  className={`font-mono truncate ${sparse ? 'text-[18px]' : 'text-[12px]'}`}
                  style={{
                    color: isNext ? 'rgba(251,191,36,0.95)' : 'rgba(251,191,36,0.55)',
                    textShadow: isNext ? amber.textShadow : 'none',
                  }}
                >
                  {slot.name}
                </span>
              )}
              <span className={`text-[9px] font-mono font-bold tracking-[0.1em] ${st.cls} ${st.pulse ? 'animate-pulse' : ''}`}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Spacer keeps the footer pinned to the bottom when rows are top-aligned */}
      {sparse && <div className="flex-1 min-h-0" />}
      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(251,191,36,0.07)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="text-[8px] font-mono text-amber-400/32 tracking-[0.15em] uppercase">
          Gate open · All passengers board
        </span>
      </div>
    </div>
  );
}

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

// ─── Pool Spinner ─────────────────────────────────────────────────────────────

function PoolSpinner({
  pool,
  stageLabel,
  onResolved,
}: {
  pool: string[];
  stageLabel?: string;
  onResolved: (key: string) => void;
}) {
  const poolItems = pool.map((key) => {
    const a = getAllActivities().find((act) => act.key === key);
    if (a) return { key, name: a.name };
    const g = getAllGames().find((gm) => gm.key === key);
    return { key, name: g?.name ?? key };
  });

  const winnerKey = useRef(pool[Math.floor(Math.random() * pool.length)]).current;
  const [displayIdx, setDisplayIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    let alive = true;
    let count = 0;

    function tick() {
      if (!alive) return;
      count++;
      const FAST = 18;   // 18 rapid cycles
      const SLOW = 8;    // 8 decelerating cycles
      if (count <= FAST) {
        setDisplayIdx(Math.floor(Math.random() * pool.length));
        setTimeout(tick, 55);
      } else if (count <= FAST + SLOW) {
        const t = (count - FAST) / SLOW;
        setDisplayIdx(Math.floor(Math.random() * pool.length));
        setTimeout(tick, 80 + t * 340); // 80ms → 420ms
      } else {
        const wi = pool.indexOf(winnerKey);
        setDisplayIdx(wi >= 0 ? wi : 0);
        setRevealed(true);
        setTimeout(() => { if (alive) onResolvedRef.current(winnerKey); }, 1600);
      }
    }

    tick();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = poolItems[displayIdx];
  const winnerIdx = pool.indexOf(winnerKey);

  return (
    // Full-screen overlay so nothing can obscure it
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8"
      style={{ background: 'rgba(8,12,22,0.93)', backdropFilter: 'blur(18px)' }}
    >
      {/* Stage label */}
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">
        {stageLabel ? `${stageLabel} · ` : ''}Choosing next activity
      </p>

      {/* Slot-machine display card */}
      <div
        className={`relative px-14 py-8 rounded-3xl font-game text-4xl text-center transition-all ${
          revealed
            ? 'border-2 border-cyan-400 text-cyan-200 scale-110'
            : 'border border-white/20 text-white scale-100'
        }`}
        style={revealed ? {
          background: 'rgba(34,211,238,0.09)',
          boxShadow: '0 0 50px rgba(34,211,238,0.45), 0 0 100px rgba(34,211,238,0.18)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        } : {
          background: 'rgba(255,255,255,0.05)',
          transition: 'all 0.12s ease',
        }}
      >
        <span style={{ minWidth: 260, display: 'inline-block' }}>{current?.name ?? '…'}</span>
      </div>

      {/* Spinning dots / ready label */}
      {!revealed ? (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-cyan-300 font-semibold tracking-wide text-lg">Selected!</span>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            Preparing content…
          </div>
        </div>
      )}

      {/* All candidates shown at bottom — winner lights up */}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg px-8 mt-4">
        {poolItems.map((item, i) => (
          <span
            key={item.key}
            className={`px-3.5 py-1 rounded-full text-sm border transition-all duration-500 ${
              revealed && i === winnerIdx
                ? 'border-cyan-400/70 text-cyan-300 bg-cyan-500/12'
                : 'border-white/10 text-white/25'
            }`}
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SessionView({ session, cls, students: serverStudents, existingScores }: SessionViewProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes where possible.
  const initSession = useSessionStore((s) => s.initSession);
  const settings = useSessionStore((s) => s.settings);
  const setSettings = useSessionStore((s) => s.setSettings);
  const addStudent = useSessionStore((s) => s.addStudent);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedGame, setSelectedGame] = useState<GamePlugin | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityPlugin | null>(null);
  const [activityContent, setActivityContent] = useState<ActivityGeneratedContent | null>(null);
  const [activityContentFailed, setActivityContentFailed] = useState(false);
  const [gameContent, setGameContent] = useState<GameGeneratedContent | null>(null);
  const [journeySaveStatus, setJourneySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [worldFlightReward, setWorldFlightReward] = useState<WorldFlightProgressionRewardResult | null>(null);
  // Content overrides from takeoff regeneration (mission/character context)
  const [contentOverrides, setContentOverrides] = useState<Record<string, ActivityGeneratedContent>>({});
  const contentOverridesRef = useRef(contentOverrides);
  contentOverridesRef.current = contentOverrides;
  const [ended, setEnded] = useState(session.status === 'ended');
  const [students, setStudents] = useState(serverStudents);
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [timerOverrides, setTimerOverrides] = useState<Record<string, number>>({});
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [cockpitLinkCopied, setCockpitLinkCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCockpitQr, setShowCockpitQr] = useState(false);
  const [browserOrigin, setBrowserOrigin] = useState('');
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    isMicroEvent: boolean;
    stageId?: string;
  } | null>(null);
  const [poolSpinning, setPoolSpinning] = useState<{ pool: string[]; stageLabel?: string } | null>(null);

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

  useEffect(() => {
    if (isFullScreen) {
      document.documentElement.dataset.sessionFullscreen = 'true';
    } else {
      delete document.documentElement.dataset.sessionFullscreen;
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      delete document.documentElement.dataset.sessionFullscreen;
    };
  }, [isFullScreen]);

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

  // Receive cross-device answer display events from the teacher cockpit.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return;

    const client = createClient();
    const channel = client
      .channel(`session-screen-answer:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_private_state',
          filter: `session_id=eq.${session.id}`,
        },
        (payload: { new: unknown }) => {
          const row = payload.new as {
            key: string;
            payload?: { type?: string; question?: string; answer?: string };
          } | null;

          if (
            row?.key === 'screen-answer' &&
            row.payload?.type === 'screen-answer' &&
            row.payload.question &&
            row.payload.answer
          ) {
            setScreenAnswer({
              question: row.payload.question,
              answer: row.payload.answer,
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [session.id]);

  // Teacher tier — used to gate Pro modules in the selection grid
  const teacherTier = useTeacherTier();
  // Separate from lesson.creditsExhausted (which fires on 402 from generate route);
  // this fires when a Standard user clicks a Pro game that doesn't go through generate.
  const [showProGate, setShowProGate] = useState(false);
  const [showRouteChoice, setShowRouteChoice] = useState(false);
  const [routeChoicePool, setRouteChoicePool] = useState<string[] | null>(null);
  const supabase = createClient();
  const games = getAllGames().filter((g) => !g.flightPlanOnly);
  const activities = getAllActivities().filter((a) => !a.flightPlanOnly);

  useEffect(() => {
    setBrowserOrigin(window.location.origin);
  }, []);

  // ─── Lesson session controller ─────────────────────────────────────────
  const lesson = useLessonSession(session.id, settings, students.length);

  // ─── World Flight arrival context — the two cities this lesson flies between ──
  // Resolve the route ids from the top-level fields, falling back to the
  // server-validated worldFlightContext (which is reliably persisted across
  // reloads, unlike the top-level ids). Either path yields the same city.
  const wfDestinationId =
    lesson.lessonPlanContent?.destinationId ?? lesson.lessonPlanContent?.worldFlightContext?.destinationId;
  const wfOriginId =
    lesson.lessonPlanContent?.originId ?? lesson.lessonPlanContent?.worldFlightContext?.originDestinationId ?? null;
  const wfDestination = useMemo(
    () => (wfDestinationId ? getDestinationById(wfDestinationId) : undefined),
    [wfDestinationId],
  );
  const wfLessonMedia = useMemo(
    () => (wfDestination ? getLessonIntroMediaForDestination(wfDestination.id) : null),
    [wfDestination],
  );
  // Arrival time-of-day from the continuous flight clock (distance-scaled). Long
  // hauls land at sunrise; short hops stay in the same light they left in.
  const wfArrivalTimeOfDay = useMemo(
    () => {
      if (!wfDestination) return undefined;
      const origin = (wfOriginId ? getDestinationById(wfOriginId) : undefined) ?? wfDestination;
      return timeOfDay(arrivalHour(distanceKm(origin, wfDestination)));
    },
    [wfDestination, wfOriginId],
  );
  // Great-circle distance for the flight clock (null for non-World-Flight lessons).
  const flightDistanceKm = useMemo(
    () => {
      if (!wfDestination) return null;
      const origin = (wfOriginId ? getDestinationById(wfOriginId) : undefined) ?? wfDestination;
      return distanceKm(origin, wfDestination);
    },
    [wfDestination, wfOriginId],
  );
  // Origin city + its departure-time light, for the takeoff fly-out (departure
  // sits at the start of the flight clock — sunset/dusk).
  const wfOrigin = useMemo(
    () => (wfOriginId ? getDestinationById(wfOriginId) : undefined),
    [wfOriginId],
  );
  const wfDepartureTimeOfDay = useMemo(
    () => (flightDistanceKm == null ? undefined : timeOfDay(clockHourAt(0, flightDistanceKm))),
    [flightDistanceKm],
  );
  // Home base (LC International) time of day — non-World-Flight flights take off
  // from + land at home, so its scene should feel alive across the day. Derive it
  // from the real local hour, but mount-gated (SSR-safe default 'dusk') so the
  // server and first client render agree and the palette never flips mid-hydrate.
  const [homeBaseTod, setHomeBaseTod] = useState<TimeOfDay>('dusk');
  useEffect(() => setHomeBaseTod(timeOfDay(new Date().getHours())), []);
  // One climate-weighted weather per flight (stable per session + destination),
  // shared by the transition cloud pass / cruise precipitation and the city scenes.
  const flightWeather = useMemo(() => {
    const d = wfDestination ?? wfOrigin;
    if (!d) return 'clear' as const;
    return rollWeather(`${session?.id ?? 'flight'}:${d.id}`, d.scene, wfArrivalTimeOfDay === 'night');
  }, [wfDestination, wfOrigin, session?.id, wfArrivalTimeOfDay]);

  // ─── Sky weather state ────────────────────────────────────────────────
  const weatherState = useMemo<WeatherState>(() => {
    if (!lesson.isLessonActive) return 'idle';
    const totalSlots = lesson.lessonSlots.length;
    const idx = lesson.currentSlotIndex;

    // World Flight: drive the sky from the continuous, distance-scaled flight
    // clock so the whole arc stays in order and short hops don't force a sunrise
    // arrival. Position 0 = departure (sunset), 1 = touchdown.
    if (flightDistanceKm != null && totalSlots > 1) {
      const progress =
        lesson.phase === 'lobby' ? 0
        : (lesson.phase === 'landing' || lesson.phase === 'ended') ? 1
        : idx / (totalSlots - 1);
      return weatherForHour(clockHourAt(progress, flightDistanceKm));
    }

    // Legacy slot-based arc (non-World-Flight lessons).
    if (lesson.phase === 'lobby') return 'climbing';
    if (lesson.phase === 'landing' || lesson.phase === 'ended') return 'landing';
    if (totalSlots <= 1) return 'cruising';
    if (idx === 0) return 'climbing';
    if (idx >= totalSlots - 1) return 'landing';
    const progress = idx / (totalSlots - 1);
    if (progress < 0.2) return 'climbing';
    if (progress < 0.8) return 'cruising';
    return 'golden';
  }, [lesson.isLessonActive, lesson.phase, lesson.currentSlotIndex, lesson.lessonSlots.length, flightDistanceKm]);

  const altitude = useMemo(
    () => {
      if (!lesson.isLessonActive) return 0.8;
      if (lesson.lessonSlots.length <= 1) return 0.6;
      // Cap cruise altitude — at peak (1) the parallax pushes the ocean down behind the
      // panels; keeping it lower leaves a visible ocean band under the flight.
      return Math.min(0.6, computeAltitude(lesson.currentSlotIndex, lesson.lessonSlots.length));
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

  // In-session ground backdrop: the city we're parked at while taking off (first
  // module) or landing (last module). World Flight uses the origin/destination
  // city; every other flight uses LC International (home base). Mid-flight modules
  // ('flight') stay sky-only — you're in the air, not at a city.
  const groundCity = useMemo(
    () => {
      if (earthState === 'takeoff' && wfOrigin) return { id: wfOrigin.id, scene: wfOrigin.scene, tod: wfDepartureTimeOfDay };
      if (earthState === 'landing' && wfDestination) return { id: wfDestination.id, scene: wfDestination.scene, tod: wfArrivalTimeOfDay };
      if (earthState === 'takeoff' || earthState === 'landing') return { id: HOME_BASE_ID, scene: HOME_BASE_SCENE, tod: homeBaseTod };
      return null;
    },
    [earthState, wfOrigin, wfDestination, wfDepartureTimeOfDay, wfArrivalTimeOfDay, homeBaseTod],
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

  // Holds pool data for a slot that arrived while the flight animation was still playing
  const pendingPoolSlotRef = useRef<{ pool: string[]; stageLabel?: string } | null>(null);

  // Auto-start the current slot when it changes (driven by the hook)
  const lastAutoStartedSlotRef = useRef<number>(-1);
  useEffect(() => {
    if (lesson.phase === 'idle' || lesson.phase === 'lobby' || lesson.phase === 'ended') return;
    if (lesson.currentSlot === null) return;
    if (lastAutoStartedSlotRef.current === lesson.currentSlotIndex) return;

    lastAutoStartedSlotRef.current = lesson.currentSlotIndex;
    const slot = lesson.currentSlot;

    // Pool slot — wait for the flight animation to finish before showing the spinner.
    // End-game pools are resolved by the class vote (RouteChoicePanel), not the spinner.
    if (slot.pool && slot.pool.length > 1 && slot.stageId !== 'end-game') {
      if (moduleTransition) {
        // Flight animation still playing — defer until onDismiss
        pendingPoolSlotRef.current = { pool: slot.pool, stageLabel: slot.stageLabel };
      } else {
        setPoolSpinning({ pool: slot.pool, stageLabel: slot.stageLabel });
      }
      return;
    }

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
  }, [lesson.currentSlotIndex, lesson.phase, lesson.currentSlot, moduleTransition]);

  // When the flight transition clears, fire any pool spinner that was deferred
  useEffect(() => {
    if (moduleTransition === null && pendingPoolSlotRef.current) {
      const pending = pendingPoolSlotRef.current;
      pendingPoolSlotRef.current = null;
      setPoolSpinning(pending);
    }
  }, [moduleTransition]);

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

  const finishSession = async (completed: boolean) => {
    // Flip to the "You've Landed" arrival immediately so "Complete Flight" lands
    // instantly; the DB end + cleanup run in the background (best-effort).
    const expectsJourneyMove = completed && lesson.lessonPlanContent?.worldFlightContext?.movesClass === true;
    if (expectsJourneyMove) setJourneySaveStatus('saving');
    sessionStorage.removeItem('lessonPlanContent');
    localStorage.removeItem('lc-explore-session');
    setEnded(true);

    if (bonusVotePollId) {
      await supabase.from('polls').update({ is_active: false }).eq('id', bonusVotePollId);
    }

    try {
      const response = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, completed }),
      });

      const result = await response.json().catch(() => ({ error: 'Failed to end session' })) as {
        error?: string;
        legStatus?: string;
        progressionReward?: WorldFlightProgressionRewardResult | null;
      };
      if (!response.ok) {
        console.error('Failed to end session:', result.error);
        if (expectsJourneyMove) setJourneySaveStatus('error');
        return;
      }

      if (expectsJourneyMove) {
        setJourneySaveStatus(result.legStatus === 'completed' ? 'saved' : 'error');
        setWorldFlightReward(result.progressionReward ?? null);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      if (expectsJourneyMove) setJourneySaveStatus('error');
    }
  };

  const handleEndSession = () => {
    void finishSession(false);
  };

  const handleCompleteSession = () => {
    void finishSession(true);
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

  // From the You've Landed screen — "take off again" for a bonus round:
  // re-open the session and launch the vote, dropping back to the grid.
  const handleBonusFromArrival = async () => {
    await supabase.from('sessions').update({ status: 'active', ended_at: null }).eq('id', session.id);
    setEnded(false);
    await handleLaunchBonusVote();
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

  const joinUrl = `${browserOrigin}/join/${session.id}`;
  const cockpitUrl = browserOrigin
    ? `${browserOrigin}/sessions/${session.id}/cockpit`
    : `/sessions/${session.id}/cockpit`;
  const cockpitHost = browserOrigin ? new URL(browserOrigin).hostname : '';
  const cockpitUrlNeedsLan =
    cockpitHost === 'localhost' || cockpitHost === '127.0.0.1' || cockpitHost === '::1';

  const handleCopyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 2000);
  };

  const handleCopyCockpitLink = () => {
    navigator.clipboard.writeText(cockpitUrl);
    setCockpitLinkCopied(true);
    setTimeout(() => setCockpitLinkCopied(false), 2000);
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

  const handlePoolResolved = useCallback((key: string) => {
    setPoolSpinning(null);
    const activity = getAllActivities().find((a) => a.key === key);
    if (activity) {
      handleSelectActivity(activity);
      return;
    }
    const game = getAllGames().find((g) => g.key === key);
    if (game) {
      handleSelectGame(game);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const isNextUndetermined = nextSlot?.key === 'mission-selector' || (nextSlot?.pool?.length ?? 0) > 0;
      const toName = isNextUndetermined ? 'Waypoint' : (found?.name ?? nextSlot?.name ?? null);
      const totalSlots = lesson.lessonSlots.length;
      // Destination sky phase (same logic as the weatherState memo)
      let toWeather: WeatherState = 'cruising';
      if (flightDistanceKm != null && totalSlots > 1) {
        const progress = nextIndex >= totalSlots - 1 ? 1 : nextIndex / (totalSlots - 1);
        toWeather = weatherForHour(clockHourAt(progress, flightDistanceKm));
      } else if (nextIndex >= totalSlots - 1) {
        toWeather = 'landing';
      } else if (totalSlots > 1) {
        const progress = nextIndex / (totalSlots - 1);
        if (progress < 0.2) toWeather = 'climbing';
        else if (progress < 0.8) toWeather = 'cruising';
        else toWeather = 'golden';
      }
      // Leg type: takeoff = first transition; descent = final transition only; cruise = middle
      const leg: FlightTransitionLeg =
        nextIndex === 1 ? 'takeoff'
        : nextIndex >= totalSlots - 1 ? 'descent'
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
        isMicroEvent: !!nextSlot?.isMicroEvent,
        stageId: nextSlot?.stageId,
      });
    }
    // Final module complete — fly straight to the "You've Landed" arrival. Do NOT
    // advanceSlot first: that lands on an empty slot and momentarily renders the
    // selection/explore grid before `ended` flips to the landing screen.
    if (lesson.isLessonActive && !hasNextSlot) {
      handleCompleteSession();
      return;
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
  const destinationMediaPanel = wfDestination && wfLessonMedia && lesson.isLessonActive && !lesson.currentSlot?.isMicroEvent ? (
    <DestinationMediaCard
      media={wfLessonMedia}
      placeName={`${wfDestination.city}, ${wfDestination.country}`}
      label="Destination context"
      compact
      className="mb-4"
    />
  ) : null;
  const flightConfig = lesson.lessonPlanContent?.flightConfig;
  // Any preset with a curated flightConfig gets the full flight treatment (journey
  // view + end-game class vote), not just the All-Around flight.
  const isCuratedFlight = Boolean(flightConfig);

  const handleNextWithRouteChoice = useCallback(() => {
    // Fire the class vote when the NEXT slot is an end-game pool (any preset),
    // instead of advancing straight into the slot's hardcoded default game.
    const nextSlot = lesson.lessonSlots[lesson.currentSlotIndex + 1];
    if (nextSlot?.stageId === 'end-game' && (nextSlot.pool?.length ?? 0) > 1) {
      setRouteChoicePool(nextSlot.pool ?? null);
      setShowRouteChoice(true);
    } else {
      handleNextSlotWithTransition();
    }
  }, [lesson, handleNextSlotWithTransition]);

  const { replaceNextSlot } = lesson;
  const handleRouteChosen = useCallback((key: string, type: 'game' | 'activity', name: string) => {
    replaceNextSlot(key, type, name);
    setShowRouteChoice(false);
    handleNextSlotWithTransition();
  }, [replaceNextSlot, handleNextSlotWithTransition]);

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
      <div className="relative h-screen overflow-hidden -m-6 lg:-m-8 theme-Midnight hud-bg">
        {wfDestination ? (
          /* World Flight: the destination's city composited over the shared sky —
             same backdrop + scale as the descent transition and in-session ground. */
          <WorldFlightArrivalBackdrop
            destinationId={wfDestination.id}
            scene={wfDestination.scene}
            weatherState="landing"
            altitude={0}
            timeOfDay={wfArrivalTimeOfDay}
            planeKey={selectedPlaneKey}
            isFullScreen={isFullScreen}
          />
        ) : (
          /* Non-World-Flight: land back at LC International (home base) — same
             engine backdrop as the lobby/transitions, closing the round trip. */
          <WorldFlightArrivalBackdrop
            destinationId={HOME_BASE_ID}
            scene={HOME_BASE_SCENE}
            weatherState="landing"
            altitude={0}
            timeOfDay={homeBaseTod}
            planeKey={selectedPlaneKey}
            isFullScreen={isFullScreen}
          />
        )}
        {/* Legibility scrim — dims the lit skyline behind the centered results
            column so the cards/labels read clearly, while the scene still shows
            at the edges (landmarks, plane, runway). */}
        <div
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{
            left: isFullScreen ? 0 : 256,
            background:
              'radial-gradient(ellipse 46% 80% at 50% 40%, rgba(3,7,16,0.80) 0%, rgba(3,7,16,0.46) 48%, transparent 74%)',
          }}
        />
        {/* Only the results scroll — the airfield stays pinned behind */}
        <div className="relative z-10 h-full overflow-y-auto px-6 lg:px-8 py-6 pb-80">
          {journeySaveStatus !== 'idle' && (
            <div className={`mx-auto mb-2 max-w-2xl rounded-lg border px-4 py-2 text-center text-xs font-semibold backdrop-blur-md ${
              journeySaveStatus === 'error'
                ? 'border-red-300/30 bg-red-950/60 text-red-100'
                : 'border-cyan-300/25 bg-slate-950/60 text-cyan-100'
            }`}>
              {journeySaveStatus === 'saving' && `Saving ${cls.name}'s arrival in ${wfDestination?.city ?? 'the destination'}...`}
              {journeySaveStatus === 'saved' && `${cls.name}'s journey is saved. ${wfDestination?.city ?? 'This destination'} is now the class's current city.`}
              {journeySaveStatus === 'error' && 'The lesson ended, but the class journey could not be saved. Reopen World Flight before planning the next route.'}
            </div>
          )}
          <EndSessionSummary
            classId={cls.id}
            className={cls.name}
            sessionId={session.id}
            flightCode={lesson.lessonPlanContent?.callsign ?? `LC-${session.id.slice(-4).toUpperCase()}`}
            progressionReward={worldFlightReward}
            onLaunchBonusVote={handleBonusFromArrival}
          />
        </div>
      </div>
    );
  }

  // Prevent SSR/hydration mismatch: render a loading shell until client mounts
  if (!mounted) {
    return (
      <div className="relative min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
        <SkyBackground intensity="subtle" className={isFullScreen ? '' : '!left-64'} />
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
        {/* Sky only — the airfield scene owns the ground (z-base) */}
        <SkyBackground weatherState="climbing" earthState="takeoff" intensity="subtle" showEarth={false} showMoon className={isFullScreen ? '' : '!left-64'} />
        {/* Consolidated airfield: ground + hangar + plane + tower + windsock + distant
            planes in one scaling SVG, so they stay locked together at any screen size (z-1).
            When an origin city exists (World Flight, prior leg), theme the horizon to the
            city we're departing FROM; otherwise fall back to the generic home airfield. */}
        <div
          className="fixed inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 1, left: isFullScreen ? 0 : 256 }}
        >
          {wfOrigin ? (
            <LobbyAirfieldScene
              originId={wfOrigin.id}
              scene={wfOrigin.scene}
              timeOfDay={wfDepartureTimeOfDay}
              weather={flightWeather}
              planeKey={selectedPlaneKey}
              className="absolute inset-0"
            />
          ) : (
            /* Home base (LC International) — the SAME engine scene the plane rolls
               down on takeoff, parked + landed here in the lobby for continuity.
               transparentSky lets the lobby's SkyBackground show through. */
            <DestinationArrivalScene
              destinationId={HOME_BASE_ID}
              scene={HOME_BASE_SCENE}
              phase="landed"
              progress={1}
              transparentSky
              fit="slice"
              timeOfDay={homeBaseTod}
              planeKey={selectedPlaneKey}
              className="absolute inset-0"
            />
          )}
        </div>
        <div className="relative z-10 flex flex-col h-[78vh] px-6 lg:px-8 pt-4 pb-3">

            {/* Slim title bar */}
            <div className="flex items-baseline justify-between mb-3 flex-shrink-0">
              <h1 className="text-lg font-bold text-lc-text">
                {lesson.lessonSlots.length === 1 ? `Ready · ${lesson.lessonSlots[0].name}` : 'Launch Lobby'}
              </h1>
              <p className="text-sm text-lc-text2 truncate ml-4">
                {lesson.customTopic}
                {lesson.isMissionBased && <span className="ml-2 text-lc-warn font-medium">Mission</span>}
              </p>
            </div>

            {/* 3-column grid: QR | Departure board | Passengers — capped width so board stays compact */}
            <div className="grid gap-4 flex-1 min-h-0 w-full mx-auto" style={{ gridTemplateColumns: '240px minmax(300px, 560px) 260px', maxWidth: '1100px' }}>

              {/* Left: Join QR + Teacher Device */}
              <div className="flex flex-col gap-3 min-h-0">
                <div className="glass rounded-2xl p-4 flex-shrink-0">
                  <p className="text-[10px] opacity-50 uppercase tracking-wider font-semibold text-center mb-2.5">Join Link</p>
                  <div className="flex justify-center mb-2.5">
                    <div className="p-2 bg-white rounded-xl">
                      <QRCodeSVG value={joinUrl} size={148} level="H" includeMargin={false} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code className="text-cyan-400 text-[10px] bg-lc-surface border border-lc-border px-2 py-1 rounded-lg font-mono truncate flex-1 min-w-0">
                      {joinUrl}
                    </code>
                    <button
                      onClick={handleCopyJoinLink}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg glass border border-lc-border text-xs hover:bg-lc-card transition-colors"
                    >
                      {joinLinkCopied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="glass rounded-2xl p-3 flex-shrink-0">
                  <p className="text-[10px] opacity-50 uppercase tracking-wider font-semibold mb-2">Teacher Device</p>
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0 rounded-lg bg-white p-1.5">
                      <QRCodeSVG value={cockpitUrl} size={56} level="H" includeMargin={false} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-lc-text mb-1.5 leading-tight">Open cockpit before launch</p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(cockpitUrl, '_blank', 'noopener,noreferrer')}
                          className="min-h-8 rounded-lg border border-violet-400/25 bg-violet-400/10 px-2.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-400/15"
                        >
                          <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCockpitQr(true)}
                          className="min-h-8 rounded-lg border border-violet-400/25 bg-violet-400/10 px-2.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-400/15"
                        >
                          <span className="inline-flex items-center gap-1"><QrCode className="h-3 w-3" />QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: Departure board — fills full height */}
              <DepartureBoardPanel
                slots={lesson.lessonSlots}
                flightCode={lesson.lessonPlanContent?.callsign ?? `LC-${session.id.slice(-4).toUpperCase()}`}
                className="h-full"
              />

              {/* Right: Passengers */}
              <div className="flex flex-col gap-3 min-h-0">
                <div className="glass rounded-2xl p-4 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <h2 className="text-xs font-semibold opacity-70 uppercase tracking-wider">Passengers</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-lc-blue">{sessionParticipants.length}</span>
                      {sessionParticipants.length > 0 && (
                        <span className="text-[9px] font-mono font-bold tracking-[0.12em] text-emerald-400 animate-pulse">BOARDED</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {sessionParticipants.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs opacity-50">Waiting for students…</p>
                      </div>
                    ) : (
                      <motion.div layout className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {sessionParticipants.map((p) => (
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0, scale: 0.5, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                              className="flex flex-col items-center gap-1 bg-lc-card rounded-2xl px-2.5 py-2 min-w-[56px]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={avatarUrl(p.avatar_seed, p.display_name)} alt="" width={36} height={36} className="w-9 h-9 rounded-xl" />
                              <span className="text-[10px] font-semibold text-lc-text truncate max-w-[56px] text-center">{p.display_name}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                </div>

                {lesson.lessonSlots.some((s) => s.key === 'mission-selector') && (
                  <div className="glass rounded-2xl p-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      {lesson.missionSelectorReady ? (
                        <><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /><span className="text-xs text-emerald-500">Mission Selector ready</span></>
                      ) : (
                        <><div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /><span className="text-xs text-lc-blue">Preparing Mission Selector…</span></>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Begin Lesson — aligned to the Departures column (middle of the grid) */}
            <div className="flex-shrink-0 pt-3 w-full mx-auto" style={{ maxWidth: '1100px' }}>
              <div className="grid gap-4" style={{ gridTemplateColumns: '240px minmax(300px, 560px) 260px' }}>
                <div />
                <div className="space-y-1.5">
                  <button
                    onClick={lesson.beginLesson}
                    disabled={!lesson.missionSelectorReady}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg text-white transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {lesson.lessonSlots.length === 1 ? `Start ${lesson.lessonSlots[0].name}` : 'Begin Lesson'}
                  </button>
                  <div className="text-center">
                    <button onClick={handleEndSession} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                      End Session
                    </button>
                  </div>
                </div>
                <div />
              </div>
            </div>

        </div>

        {/* Cockpit QR modal — must be inside lobby return; the main-view modal can't render during early-return */}
        {showCockpitQr && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setShowCockpitQr(false)}
          >
            <div
              className="glass w-full max-w-md rounded-2xl border border-lc-border p-7 text-center shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <p className="text-xs opacity-50 uppercase tracking-wider font-semibold">Teacher Cockpit</p>
                <h2 className="text-xl font-bold text-lc-text">Open controls on your device</h2>
                <p className="text-sm text-lc-text3">Scan this while signed in as the class teacher. Students who scan it cannot access controls unless they pass the teacher ownership check.</p>
              </div>
              <div className="flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={cockpitUrl} size={210} level="H" includeMargin={false} />
                </div>
              </div>
              <code className="block rounded-lg border border-lc-border bg-lc-surface px-4 py-2 font-mono text-sm text-violet-300 break-all">{cockpitUrl}</code>
              {cockpitUrlNeedsLan && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Phone access note</p>
                  <p className="mt-1 text-sm text-amber-100/80">This QR uses localhost, which phones cannot reach. Open from a deployed URL or LAN address first.</p>
                </div>
              )}
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Access protection</p>
                <p className="mt-1 text-sm text-cyan-100/75">Cockpit loads only for the authenticated owner of this class.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopyCockpitLink} className="text-violet-300 hover:text-violet-200">{cockpitLinkCopied ? 'Copied!' : 'Copy Link'}</Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(cockpitUrl, '_blank', 'noopener,noreferrer')} className="text-cyan-400 hover:text-cyan-300">Open Cockpit</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCockpitQr(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN SESSION VIEW ───────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 theme-Midnight hud-bg">
      {groundCity ? (
        /* Ground: the origin/destination city (World Flight) or LC International
           (home base), same composited backdrop + scale as the transitions. */
        <WorldFlightArrivalBackdrop
          destinationId={groundCity.id}
          scene={groundCity.scene}
          weatherState={weatherState}
          altitude={altitude}
          timeOfDay={groundCity.tod}
          planeKey={selectedPlaneKey}
          isFullScreen={isFullScreen}
        />
      ) : (
        <>
          <SkyBackground
            weatherState={weatherState}
            currentSlotIndex={lesson.currentSlotIndex}
            altitude={altitude}
            earthState={earthState}
            intensity="moderate"
            className={isFullScreen ? '' : '!left-64'}
          />
          {/* Plane on runway — left taxiway (takeoff) or right taxiway (landing) */}
          {(earthState === 'takeoff' || earthState === 'landing') && (
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 7, left: isFullScreen ? 0 : '256px' }}>
              <div className={`absolute bottom-0 ${earthState === 'takeoff' ? 'left-[38%]' : 'left-[62%]'} -translate-x-1/2`}>
                <RunwayPlaneScene planeKey={selectedPlaneKey} planeSize="xl" showRunway={false} frontFacing frontVariant="3q" />
              </div>
            </div>
          )}
        </>
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
            {viewMode !== 'selection' && (
              <div className="relative" ref={settingsPopoverRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className="gap-2 text-lc-text2 hover:text-lc-text"
                  title="Teacher tools and session settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden xl:inline">Teacher Tools</span>
                </Button>
                {showSettingsPopover && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-[min(92vw,430px)] glass rounded-2xl p-4 shadow-xl border border-lc-border space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">Teacher Tools</p>
                      <p className="mt-1 text-sm text-lc-text2">
                        {settings.difficulty} - Grammar: {settings.grammarTarget ?? 'Any'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-lc-border/70 bg-lc-surface/70 p-3 overflow-x-auto">
                      <SessionSettingsBar />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(cockpitUrl, '_blank', 'noopener,noreferrer')}
                        className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-400/15"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Open Cockpit
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCockpitQr(true)}
                        className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-400/15"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <QrCode className="h-4 w-4" />
                          Cockpit QR
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="gap-2"
              title="Show student join QR"
            >
              <span className="rounded bg-white p-0.5">
                <QRCodeSVG value={joinUrl} size={24} bgColor="#ffffff" fgColor="#0f172a" includeMargin={false} />
              </span>
              <span className="hidden lg:inline">Join QR</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullScreen((v) => !v)}
              className={isFullScreen ? 'text-cyan-400 hover:text-cyan-300' : 'text-lc-text3 hover:text-lc-text2'}
              title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen — hide sidebar for more space'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              className="border border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              End Session
            </Button>
          </div>
        </div>

        {/* Selection / Game / Activity View */}
        {viewMode === 'selection' && poolSpinning === null ? (
          <div className="space-y-6">
            {/* Settings on selection screen */}
            <div className="hud-settings-panel p-2 shadow-lg">
              <SessionSettingsBar />
            </div>

            {/* Flight complete — land to arrival, or run a bonus round first */}
            {lesson.phase === 'ended' && !bonusVotePollId && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-amber-500/10 p-5"
              >
                <div className="flex items-center gap-2.5">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.12, type: 'spring', stiffness: 360, damping: 14 }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/15"
                  >
                    <PlaneLanding className="h-5 w-5 text-cyan-300" strokeWidth={1.75} />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-lc-text text-sm">Flight complete — ready to land?</p>
                    <p className="text-xs text-lc-text3 mt-0.5">Every module is done. Land to arrive at the results, or run a quick bonus round first.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 pl-[46px]">
                  <button
                    onClick={handleEndSession}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-sm text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <PlaneLanding className="h-4 w-4" strokeWidth={2} />
                    Land · View Results
                  </button>
                  <button
                    onClick={handleLaunchBonusVote}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-cyan-200 border border-cyan-400/25 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-95 transition-all"
                  >
                    Bonus Round
                  </button>
                </div>
              </motion.div>
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
        ) : poolSpinning !== null ? (
          <PoolSpinner
            pool={poolSpinning.pool}
            stageLabel={poolSpinning.stageLabel}
            onResolved={handlePoolResolved}
          />
        ) : viewMode === 'game' && selectedGame ? (
          isCuratedFlight && flightConfig ? (
            <FlightSessionView
              slots={lesson.lessonSlots}
              currentSlotIndex={lesson.currentSlotIndex}
              phase={lesson.phase}
              flightConfig={flightConfig}
              currentModuleName={selectedGame.name}
              isModuleFinished={isModuleFinished}
              onExit={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}
              onSwap={() => setShowPivotDrawer(true)}
              onNext={handleNextWithRouteChoice}
              onGoToSlot={lesson.goToSlot}
            >
              <ModuleErrorBoundary moduleName={selectedGame.name} onReset={handleBackToSelection}>
                {destinationMediaPanel}
                <GameShell game={selectedGame} config={EMPTY_CONFIG} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} onRevealTopSubmissions={(subs) => setFeaturedSubmissions(subs)} isMicroEvent={lesson.currentSlot?.isMicroEvent} destinationId={wfDestinationId} />
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
              {destinationMediaPanel}
              <GameShell game={selectedGame} config={EMPTY_CONFIG} preGeneratedContent={gameContent} timerSeconds={getTimerForPlugin(selectedGame.key, selectedGame.defaultTimerSeconds)} onRevealTopSubmissions={(subs) => setFeaturedSubmissions(subs)} isMicroEvent={lesson.currentSlot?.isMicroEvent} destinationId={wfDestinationId} />
            </ModuleErrorBoundary>
          </div>
          )
        ) : viewMode === 'activity' && selectedActivity ? (
          isCuratedFlight && flightConfig ? (
            <FlightSessionView
              slots={lesson.lessonSlots}
              currentSlotIndex={lesson.currentSlotIndex}
              phase={lesson.phase}
              flightConfig={flightConfig}
              currentModuleName={lesson.generatingModuleName || selectedActivity.name}
              isModuleFinished={isModuleFinished}
              onExit={lesson.isLessonActive ? handleExitLessonMode : handleBackToSelection}
              onSwap={() => setShowPivotDrawer(true)}
              onNext={handleNextWithRouteChoice}
              onGoToSlot={lesson.goToSlot}
            >
              {activityContent ? (
                <ModuleErrorBoundary moduleName={selectedActivity.name} onReset={handleBackToSelection}>
                  {destinationMediaPanel}
                  <ActivityShell
                    activity={selectedActivity}
                    generatedContent={activityContent}
                    timerSeconds={getTimerForPlugin(selectedActivity.key, selectedActivity.defaultTimerSeconds)}
                    onPhaseChange={lesson.isLessonActive ? handleActivityPhaseChange : undefined}
                    onContentRegenerate={handleContentRegenerate}
                    isMicroEvent={lesson.currentSlot?.isMicroEvent}
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
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/75 px-10 py-8 shadow-2xl backdrop-blur-md">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                    <p className="text-2xl font-game text-white text-center" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.55)' }}>
                      Preparing {lesson.generatingModuleName || selectedActivity.name}
                    </p>
                    <p className="text-sm text-cyan-200/80">Generating content for your lesson…</p>
                  </div>
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
                {destinationMediaPanel}
                <ActivityShell
                  activity={selectedActivity}
                  generatedContent={activityContent}
                  timerSeconds={getTimerForPlugin(selectedActivity.key, selectedActivity.defaultTimerSeconds)}
                  onPhaseChange={lesson.isLessonActive ? handleActivityPhaseChange : undefined}
                  onContentRegenerate={handleContentRegenerate}
                  isMicroEvent={lesson.currentSlot?.isMicroEvent}
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
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/75 px-10 py-8 shadow-2xl backdrop-blur-md">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                  <p className="text-2xl font-game text-white text-center" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.55)' }}>
                    Preparing {lesson.generatingModuleName || selectedActivity.name}
                  </p>
                  <p className="text-sm text-cyan-200/80">Generating content for your lesson…</p>
                </div>
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
          weather={flightWeather}
          isMicroEvent={moduleTransition.isMicroEvent}
          stageId={moduleTransition.stageId}
          arrivalScene={wfDestination ? {
            destinationId: wfDestination.id,
            scene: wfDestination.scene,
            cityName: wfDestination.city,
            timeOfDay: wfArrivalTimeOfDay,
            weather: rollWeather(`${session?.id ?? 'flight'}:${wfDestination.id}`, wfDestination.scene, wfArrivalTimeOfDay === 'night'),
            planeKey: selectedPlaneKey,
          } : {
            /* Non-World-Flight: land back at LC International (home base) — the
               same engine scene as the lobby, replacing the old generic runway. */
            destinationId: HOME_BASE_ID,
            scene: HOME_BASE_SCENE,
            cityName: HOME_BASE_NAME,
            timeOfDay: homeBaseTod,
            weather: flightWeather,
            planeKey: selectedPlaneKey,
          }}
          departureScene={wfOrigin ? {
            destinationId: wfOrigin.id,
            scene: wfOrigin.scene,
            cityName: wfOrigin.city,
            timeOfDay: wfDepartureTimeOfDay,
            weather: rollWeather(`${session?.id ?? 'flight'}:${wfOrigin.id}`, wfOrigin.scene, wfDepartureTimeOfDay === 'night'),
            planeKey: selectedPlaneKey,
          } : {
            /* Non-World-Flight: take off from LC International (home base). */
            destinationId: HOME_BASE_ID,
            scene: HOME_BASE_SCENE,
            cityName: HOME_BASE_NAME,
            timeOfDay: homeBaseTod,
            weather: flightWeather,
            planeKey: selectedPlaneKey,
          }}
          onDismiss={() => setModuleTransition(null)}
        />
      )}

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

      {/* Teacher cockpit QR modal — private controls, protected by teacher auth + ownership */}
      {showCockpitQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowCockpitQr(false)}
        >
          <div
            className="glass w-full max-w-md rounded-2xl border border-lc-border p-7 text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-xs opacity-50 uppercase tracking-wider font-semibold">Teacher Cockpit</p>
              <h2 className="text-xl font-bold text-lc-text">Open controls on your device</h2>
              <p className="text-sm text-lc-text3">
                Scan this while signed in as the class teacher. Students who scan it cannot access controls
                unless they pass the teacher ownership check.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={cockpitUrl} size={210} level="H" includeMargin={false} />
              </div>
            </div>

            <code className="block rounded-lg border border-lc-border bg-lc-surface px-4 py-2 font-mono text-sm text-violet-300 break-all">
              {cockpitUrl}
            </code>

            {cockpitUrlNeedsLan && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Phone access note</p>
                <p className="mt-1 text-sm text-amber-100/80">
                  This QR uses localhost, which phones usually cannot reach. Open this teacher screen from a
                  deployed URL, tunnel, or LAN address first, then show this QR again.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Access protection</p>
              <p className="mt-1 text-sm text-cyan-100/75">
                Cockpit loads only for the authenticated owner of this class. Unauthorized users are redirected
                to login or shown a not-found page.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCockpitLink}
                className="text-violet-300 hover:text-violet-200"
              >
                {cockpitLinkCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(cockpitUrl, '_blank', 'noopener,noreferrer')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Open Cockpit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCockpitQr(false)}>
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

      {showRouteChoice && (
        <RouteChoicePanel sessionId={session.id} pool={routeChoicePool ?? undefined} onRouteChosen={handleRouteChosen} />
      )}

      {/* Demo mode — simulated students drive the live loop via real endpoints */}
      {cls.is_demo && <DemoSimulator sessionId={session.id} />}
      {cls.is_demo && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-950/80 px-4 py-1.5 text-xs font-medium text-amber-200 shadow-lg backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Demo mode — these students are simulated.
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
