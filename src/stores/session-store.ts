import { create } from 'zustand';
import type { Student, Score } from '@/lib/supabase/types';
import {
  getActivityInstanceIdentity,
  getInputSpecRevision,
  inputSpecChannelName,
  INPUT_SPEC_REALTIME_EVENT,
  type InputSpec,
  type InputSpecRealtimePayload,
  type TimedRoundClock,
} from '@/lib/input-spec';
import type { Difficulty } from '@/lib/difficulty';
import type { GrammarTarget } from '@/lib/grammar';
import type { CharacterCard } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import { countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  logRealtimeDiagnostic,
  sendWithOneRetry,
  waitForChannelSubscription,
} from '@/lib/realtime-health';


export type PickerMode = 'fair' | 'random';
export type GameMode = 'normal' | 'spinner';

// Captain's Flight preset id — the flight log (lesson memory) is scoped to this flagship preset.
const CAPTAINS_FLIGHT_PRESET_ID = 'all-around-flight-60';

// Session types
export type { Difficulty } from '@/lib/difficulty';
export { DIFFICULTIES } from '@/lib/difficulty';
export type Topic = 'General' | 'Action' | 'Business' | 'Academic' | 'Travel' | 'Technology' | 'Literature' | 'Space' | 'Nature' | 'Cooking' | 'Art' | 'Sports' | 'History' | 'Psychology';
export type Tone = 'Neutral' | 'Casual' | 'Formal' | 'Humorous' | 'Professional' | 'Kid-friendly';
// Option arrays
export const TOPICS: Topic[] = ['General', 'Action', 'Business', 'Academic', 'Travel', 'Technology', 'Literature', 'Space', 'Nature', 'Cooking', 'Art', 'Sports', 'History', 'Psychology'];
export const TONES: Tone[] = ['Neutral', 'Casual', 'Formal', 'Humorous', 'Professional', 'Kid-friendly'];

export type ScoringMode = 'participation' | 'accuracy' | 'competitive';
export const SCORING_MODES: ScoringMode[] = ['participation', 'accuracy', 'competitive'];

export function goalToScoringMode(goal?: string | null): ScoringMode {
  const participationGoals = ['speaking-fluency', 'discussion-debate', 'confidence-building', 'collaboration', 'creativity'];
  const accuracyGoals = ['grammar-reinforcement', 'critical-thinking', 'vocabulary-building'];
  if (goal && participationGoals.includes(goal)) return 'participation';
  if (goal && accuracyGoals.includes(goal)) return 'accuracy';
  return 'competitive';
}

export interface SessionSettings {
  difficulty: Difficulty;
  topic: Topic;
  customTopic: string; // Free-text custom topic (overrides topic dropdown when set)
  tone: Tone;
  timerSeconds: number; // Per-game timer, injected by shells (not stored globally)
  scoringMode: ScoringMode;
  grammarTarget: GrammarTarget | null;
}

// Helper to get the effective topic string (custom or dropdown)
export function getEffectiveTopic(settings: SessionSettings): string {
  return settings.customTopic.trim() || settings.topic;
}

/**
 * Human-facing lesson theme for on-screen labels (e.g. "Word must relate to X", the mode/topic
 * chip). Source-grounded lessons — World Flight destinations, pasted/video/document sources —
 * carry the theme in sourceMaterial.title while customTopic/topic stay at the generic 'General'
 * default. Prefer the source title over a bare 'General' so labels aren't misleading. For AI
 * generation use getEffectiveTopic (the routes ground on sourceMaterial separately); this is for
 * display and topic-constraint text only.
 */
export function getDisplayTopic(
  settings: SessionSettings,
  sourceMaterial?: { title?: string } | null,
): string {
  const topic = getEffectiveTopic(settings);
  if (topic && topic !== 'General') return topic;
  return sourceMaterial?.title?.trim() || topic;
}

// Spin Wheel modifier for gamification
export interface TurnModifier {
  multiplier: 1 | 2 | 3;
  bonus: number;
  shield: boolean;
  label: string;
}

// Wheel segments with weights (higher = more likely)
export const WHEEL_SEGMENTS: Array<{ modifier: TurnModifier; weight: number }> = [
  { modifier: { multiplier: 1, bonus: 0, shield: false, label: 'x1' }, weight: 40 },
  { modifier: { multiplier: 2, bonus: 0, shield: false, label: 'x2' }, weight: 25 },
  { modifier: { multiplier: 3, bonus: 0, shield: false, label: 'x3' }, weight: 5 },
  { modifier: { multiplier: 1, bonus: 5, shield: false, label: '+5' }, weight: 15 },
  { modifier: { multiplier: 1, bonus: 0, shield: true, label: 'Shield' }, weight: 15 },
];

// One prediction the class committed to at takeoff, with the class's vote split and the held-back
// answer — surfaced after the briefing by the "Listen for it" reveal (Captain's Flight, Stage 1).
export interface PredictionResult {
  text: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
  revealFact: string;
  countA: number;
  countB: number;
}

// Captain's Flight lesson memory (Stage 2). Each key beat appends one line so the Final Word can
// debrief the class on what actually happened. Deliberately SEPARATE from tripLog so it never trips
// the flash-quiz trip-mode gate (which keys off tripLog, Travel-only).
export interface FlightLogEntry {
  beat: 'prediction' | 'opinion-pulse' | 'toolkit' | 'council';
  /** One-line recap for the end-session flight log. */
  text: string;
  /** Toolkit words — rendered as chips in the Final Word debrief. */
  vocab?: string[];
  /** A projected-safe callback the Final Word can pose back to the class. */
  callback?: string;
}

// One line of the Travel arc's trip log — what the class did at a stop.
export interface TripLogEntry {
  stageId: string;
  text: string;
  /** The stop's real anchor words (the dish ordered, transport taken, attraction visited) —
   *  surfaced as vocab chips in the Trip Recap landing. */
  vocab?: string[];
}

interface SessionState {
  sessionId: string | null;
  classId: string | null;
  students: Student[];
  scores: Score[];
  streaks: Record<string, number>;
  pickerMode: PickerMode;
  gameMode: GameMode;
  callCounts: Record<string, number>;
  currentStudentId: string | null;
  roundNumber: number;

  // Session settings
  settings: SessionSettings;

  // Lesson source material (article/video) — set on lesson load. Lets games that
  // generate live via their own routes (e.g. flash-quiz) ground content in the
  // same source the lesson-plan generator uses. Not persisted to localStorage.
  sourceMaterial: SourceMaterial | null;

  // Spin wheel modifier (null = needs to spin)
  turnModifier: TurnModifier | null;
  needsSpin: boolean;

  // Current active game for student submissions
  activeGameKey: string | null;

  // Input spec for student controller
  inputSpec: InputSpec | null;

  // Server-stamped clock for the active timed round (set from the input-spec API
  // response). Teacher-side timers derive their countdown from this + serverClockOffset
  // so they agree with student devices within a tick. Null when no timed round is live.
  activeTimedRound: TimedRoundClock | null;
  // serverNow − local Date.now() at the last input-spec write, in ms.
  serverClockOffset: number;

  // Content repetition tracking — prevents same content appearing twice in a session
  seenItemsByGame: Record<string, string[]>; // gameKey -> seen item identifiers (e.g. weakWords)
  seenCacheIds: string[]; // generated_content UUIDs already served this session

  // Mission system
  studentMissions: Record<string, string>;   // clientId → mission question
  landingAnswers: Record<string, string>;     // clientId → landing answer

  // Lesson type system
  classMission: string | null;
  openingStances: Record<string, string>;       // clientId → opening stance text
  characterAssignments: Record<string, CharacterCard>; // clientId → assigned character

  // Trip log (Travel arc) — what the class actually did at each stop, so the landing recap
  // and the World Flight leg evidence can retell the trip.
  tripLog: TripLogEntry[];

  // "Listen for it" predictions (Captain's Flight, Stage 1) — the takeoff predictions the class
  // committed to, held back until the briefing's reveal panel. Separate from tripLog so it never
  // trips the flash-quiz trip-mode gate. Written by prediction-round in deferReveal mode.
  predictionResults: PredictionResult[];

  // Flight log (Captain's Flight, Stage 2) — lesson memory written by key beats, read by the Final
  // Word debrief and the end-session recap. Populated only when flightPresetId is Captain's Flight.
  flightLog: FlightLogEntry[];
  // Active flight preset id — set on lesson load; scopes the flight log to Captain's Flight.
  flightPresetId: string | null;

  // Actions
  initSession: (sessionId: string, classId: string, students: Student[]) => void;
  setPickerMode: (mode: PickerMode) => void;
  setGameMode: (mode: GameMode) => void;
  setCurrentStudent: (studentId: string) => void;
  /** Bump a student's call count without changing the current student — used by the Travel
   *  arc to spread featured traveller turns fairly ACROSS stops (least-featured go first). */
  recordFeature: (studentId: string) => void;
  pickStudent: () => string | null;
  spinWheel: () => TurnModifier;
  clearModifier: () => void;
  recordScore: (score: Score) => void;
  addRealtimeScore: (score: Score) => void;
  setSettings: (settings: Partial<SessionSettings>) => void;
  setTopic: (topic: Topic) => void;
  setCustomTopic: (customTopic: string) => void;
  setSourceMaterial: (sourceMaterial: SourceMaterial | null) => void;
  nextRound: () => void;
  setActiveGame: (gameKey: string | null) => void;
  setInputSpec: (spec: InputSpec | null, activityInstanceIdentity?: InputSpecRealtimePayload['activityInstanceIdentity']) => Promise<void>;
  addStudent: (student: Student) => void;
  addSeenItems: (gameKey: string, items: string[]) => void;
  addSeenCacheId: (id: string) => void;
  addStudentMission: (clientId: string, mission: string) => void;
  addLandingAnswer: (clientId: string, answer: string) => void;
  setClassMission: (question: string) => void;
  addOpeningStance: (clientId: string, stance: string) => void;
  addCharacterAssignment: (clientId: string, character: CharacterCard) => void;
  addTripLogEntry: (entry: TripLogEntry) => void;
  setPredictionResults: (results: PredictionResult[]) => void;
  addFlightLogEntry: (entry: FlightLogEntry) => void;
  setFlightPresetId: (id: string | null) => void;
  setGrammarTarget: (target: GrammarTarget | null) => void;
  reset: () => void;
}

function calculateStreakBonus(streakCount: number): number {
  if (streakCount <= 1) return 0;
  return Math.min(streakCount - 1, 5);
}

const DEFAULT_SETTINGS: SessionSettings = {
  difficulty: 'Easy',
  topic: 'General',
  customTopic: '',
  tone: 'Neutral',
  timerSeconds: 30,
  scoringMode: 'competitive',
  grammarTarget: null,
};

const SETTINGS_STORAGE_KEY = 'lc-session-settings';
// NOTE: topic/customTopic are deliberately NOT persisted. They are per-lesson
// values set authoritatively by the loaded lesson plan. Persisting them caused
// the previous lesson's topic to be the active value during the window before a
// new session's plan loaded — so live content generation (e.g. Rank It) could
// fire grounded on the prior lesson's subject while the UI label showed the new
// one. Only durable class-level defaults belong here.
type PersistedSettings = Pick<SessionSettings, 'difficulty' | 'tone' | 'scoringMode'>;

function loadPersistedSettings(): Partial<PersistedSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    // Explicitly pick allowed keys so any legacy persisted topic/customTopic
    // (written before this field set was narrowed) can never leak back in.
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Partial<PersistedSettings> = {};
    if (typeof parsed.difficulty === 'string') next.difficulty = parsed.difficulty as Difficulty;
    if (typeof parsed.tone === 'string') next.tone = parsed.tone as SessionSettings['tone'];
    if (typeof parsed.scoringMode === 'string') next.scoringMode = parsed.scoringMode as SessionSettings['scoringMode'];
    return next;
  } catch {
    return {};
  }
}

function savePersistedSettings(settings: SessionSettings): void {
  if (typeof window === 'undefined') return;
  const { difficulty, tone, scoringMode } = settings;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ difficulty, tone, scoringMode }));
}

function getInitialSettings(): SessionSettings {
  return { ...DEFAULT_SETTINGS, ...loadPersistedSettings() };
}

// Track the last spec value confirmed written to DB.
// Null writes are skipped when DB is already null, preventing stale overwrites
// from rapid IDLE/PRESENTING → VOTING transitions where null fires before binary.
let lastWrittenInputSpec: InputSpec | null | undefined = undefined;
let inputSpecWriteQueue: Promise<void> = Promise.resolve();
let inputSpecWriteGeneration = 0;
let inputSpecBroadcastSessionId: string | null = null;
let inputSpecBroadcastChannel: RealtimeChannel | null = null;
let inputSpecBroadcastReady: Promise<void> | null = null;

function resetInputSpecBroadcastChannel() {
  if (inputSpecBroadcastChannel) {
    void inputSpecBroadcastChannel.unsubscribe();
  }
  inputSpecBroadcastSessionId = null;
  inputSpecBroadcastChannel = null;
  inputSpecBroadcastReady = null;
}

async function ensureInputSpecBroadcastChannel(sessionId: string): Promise<{
  channel: RealtimeChannel;
  ready: Promise<void>;
}> {
  if (
    inputSpecBroadcastChannel &&
    inputSpecBroadcastReady &&
    inputSpecBroadcastSessionId === sessionId
  ) {
    return { channel: inputSpecBroadcastChannel, ready: inputSpecBroadcastReady };
  }

  resetInputSpecBroadcastChannel();
  const { createClient } = await import('@/lib/supabase/client');
  const channel = createClient().channel(inputSpecChannelName(sessionId));
  const ready = waitForChannelSubscription(channel);

  inputSpecBroadcastSessionId = sessionId;
  inputSpecBroadcastChannel = channel;
  inputSpecBroadcastReady = ready;
  return { channel, ready };
}

async function broadcastInputSpec(sessionId: string, payload: InputSpecRealtimePayload) {
  const startedAt = Date.now();
  const sent = await sendWithOneRetry(async () => {
    const { channel, ready } = await ensureInputSpecBroadcastChannel(sessionId);
    await ready;
    const result = await channel.send({
      type: 'broadcast',
      event: INPUT_SPEC_REALTIME_EVENT,
      payload,
    });
    logRealtimeDiagnostic('input-spec-sender', 'send_result', {
      revision: payload.inputSpecRevision,
      result,
      elapsed_ms: Date.now() - startedAt,
    });
    return result;
  }, () => {
    resetInputSpecBroadcastChannel();
    logRealtimeDiagnostic('input-spec-sender', 'retrying', {
      revision: payload.inputSpecRevision,
    });
  });

  if (!sent) {
    resetInputSpecBroadcastChannel();
    logRealtimeDiagnostic('input-spec-sender', 'degraded', {
      revision: payload.inputSpecRevision,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lessoncaptain:realtime-degraded'));
    }
  }
}

// Weighted random selection for wheel
function selectWeightedRandom(): TurnModifier {
  const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const segment of WHEEL_SEGMENTS) {
    random -= segment.weight;
    if (random <= 0) return segment.modifier;
  }
  return WHEEL_SEGMENTS[0].modifier;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  classId: null,
  students: [],
  scores: [],
  streaks: {},
  pickerMode: 'fair',
  gameMode: 'normal',
  callCounts: {},
  currentStudentId: null,
  roundNumber: 1,
  settings: getInitialSettings(),
  sourceMaterial: null,
  turnModifier: null,
  needsSpin: false,
  activeGameKey: null,
  inputSpec: null,
  activeTimedRound: null,
  serverClockOffset: 0,
  seenItemsByGame: {},
  seenCacheIds: [],
  studentMissions: {},
  landingAnswers: {},
  classMission: null,
  openingStances: {},
  characterAssignments: {},
  tripLog: [],
  predictionResults: [],
  flightLog: [],
  flightPresetId: null,

  initSession: (sessionId, classId, students) => {
    lastWrittenInputSpec = undefined; // Reset per-session tracking
    inputSpecWriteGeneration += 1;
    inputSpecWriteQueue = Promise.resolve();
    if (inputSpecBroadcastSessionId !== sessionId) {
      resetInputSpecBroadcastChannel();
    }
    const callCounts: Record<string, number> = {};
    const streaks: Record<string, number> = {};
    students.forEach((s) => {
      callCounts[s.id] = 0;
      streaks[s.id] = 0;
    });
    set({
      sessionId,
      classId,
      students,
      scores: [],
      streaks,
      callCounts,
      currentStudentId: null,
      roundNumber: 1,
      settings: getInitialSettings(),
      turnModifier: null,
      needsSpin: false,
      gameMode: 'normal',
      activeGameKey: null,
      inputSpec: null,
      activeTimedRound: null,
      serverClockOffset: 0,
      seenItemsByGame: {},
      seenCacheIds: [],
      studentMissions: {},
      landingAnswers: {},
      classMission: null,
      openingStances: {},
      characterAssignments: {},
      tripLog: [],
      predictionResults: [],
      // flightLog clears per session; flightPresetId is set separately on lesson load.
      flightLog: [],
    });
  },

  addTripLogEntry: (entry) => {
    const { tripLog } = get();
    // One entry per stage — a re-run of a stop replaces its line instead of duplicating it.
    set({ tripLog: [...tripLog.filter((e) => e.stageId !== entry.stageId), entry] });
  },

  setPredictionResults: (results) => set({ predictionResults: results }),

  addFlightLogEntry: (entry) => {
    // Flight log is a Captain's Flight feature only — silently ignore elsewhere so shared beats
    // (would-you-rather, rank-it, language-toolkit) don't populate it in other presets.
    if (get().flightPresetId !== CAPTAINS_FLIGHT_PRESET_ID) return;
    const { flightLog } = get();
    // One entry per beat — a re-run replaces its line instead of duplicating it.
    set({ flightLog: [...flightLog.filter((e) => e.beat !== entry.beat), entry] });
  },

  setFlightPresetId: (id) => set({ flightPresetId: id }),

  setPickerMode: (mode) => set({ pickerMode: mode }),

  setGameMode: () => set({ gameMode: 'normal', turnModifier: null, needsSpin: false }),

  setCurrentStudent: (studentId) => {
    const { callCounts } = get();
    set({
      currentStudentId: studentId,
      callCounts: { ...callCounts, [studentId]: (callCounts[studentId] ?? 0) + 1 },
      needsSpin: false,
      turnModifier: null,
    });
  },

  recordFeature: (studentId) => {
    const { callCounts } = get();
    set({ callCounts: { ...callCounts, [studentId]: (callCounts[studentId] ?? 0) + 1 } });
  },

  pickStudent: () => {
    const { students, pickerMode, callCounts } = get();
    if (students.length === 0) return null;

    let picked: Student;

    if (pickerMode === 'random') {
      picked = students[Math.floor(Math.random() * students.length)];
    } else {
      const minCalls = Math.min(...Object.values(callCounts));
      const candidates = students.filter((s) => (callCounts[s.id] ?? 0) === minCalls);
      picked = candidates[Math.floor(Math.random() * candidates.length)];
    }

    set({
      currentStudentId: picked.id,
      callCounts: { ...callCounts, [picked.id]: (callCounts[picked.id] ?? 0) + 1 },
      needsSpin: false,
      turnModifier: null,
    });
    return picked.id;
  },

  spinWheel: () => {
    const modifier = selectWeightedRandom();
    set({ turnModifier: modifier, needsSpin: false });
    return modifier;
  },

  clearModifier: () => {
    set({ turnModifier: null, needsSpin: false });
  },

  recordScore: (score) => {
    set((state) => {
      // Deduplicate — realtime subscription may fire for the same score
      // that handleScore already recorded
      if (state.scores.some((s) => s.id === score.id)) return state;

      const newStreaks = { ...state.streaks };
      // Use student_id for roster students, client_id for remote students
      const streakKey = score.student_id || score.client_id;
      if (streakKey && countsForLeaderboard(score)) {
        if (isCorrectScore(score)) {
          newStreaks[streakKey] = (newStreaks[streakKey] ?? 0) + 1;
        } else {
          newStreaks[streakKey] = 0;
        }
      }
      return {
        scores: [...state.scores, score],
        streaks: newStreaks,
      };
    });
  },

  addRealtimeScore: (score) => {
    set((state) => {
      if (state.scores.some((s) => s.id === score.id)) return state;
      return { scores: [...state.scores, score] };
    });
  },

  setSettings: (newSettings) => set((state) => {
    const next = { ...state.settings, ...newSettings };
    savePersistedSettings(next);
    return { settings: next };
  }),

  setTopic: (topic: Topic) => set((state) => {
    const next = { ...state.settings, topic };
    savePersistedSettings(next);
    return { settings: next };
  }),

  // Handler for custom topic (clears when topic dropdown is used)
  setCustomTopic: (customTopic: string) => set((state) => {
    const next = { ...state.settings, customTopic };
    savePersistedSettings(next);
    return { settings: next };
  }),

  setSourceMaterial: (sourceMaterial: SourceMaterial | null) => set({ sourceMaterial }),

  nextRound: () => set((state) => ({ roundNumber: state.roundNumber + 1 })),

  setActiveGame: (gameKey: string | null) => set({ activeGameKey: gameKey }),

  setInputSpec: async (spec: InputSpec | null, suppliedActivityInstanceIdentity) => {
    const { sessionId, inputSpec: current } = get();
    // Skip no-op updates to avoid triggering unnecessary re-renders
    if (spec === current) return;
    if (spec === null && current === null) return;
    const baseActivityInstanceIdentity = suppliedActivityInstanceIdentity
      ?? getActivityInstanceIdentity(spec ?? current);
    const activityInstanceIdentity = suppliedActivityInstanceIdentity
      ? suppliedActivityInstanceIdentity
      : spec === null && baseActivityInstanceIdentity
        ? { ...baseActivityInstanceIdentity, sequence: baseActivityInstanceIdentity.sequence + 1 }
        : baseActivityInstanceIdentity;
    set({ inputSpec: spec });

    // Sync to database so student controllers can poll for it
    if (!sessionId) {
      return;
    }

    const writeGeneration = inputSpecWriteGeneration;
    // Serialize canonical writes. Reveal → next prompt → restart transitions can fire
    // in adjacent React commits; overlapping requests previously let an older clear
    // arrive after the new prompt and strand fresh/rejoining students on standby.
    inputSpecWriteQueue = inputSpecWriteQueue.catch(() => {}).then(async () => {
      if (writeGeneration !== inputSpecWriteGeneration) return;
      // Activities can emit null repeatedly while already idle. Evaluate this against
      // the last confirmed write inside the queue, not against an in-flight request.
      if (spec === null && (lastWrittenInputSpec === null || lastWrittenInputSpec === undefined)) return;

      try {
        const res = await fetch('/api/session/input-spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, spec, activityInstanceIdentity }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null) as
            | {
                spec?: InputSpec | null;
                inputSpecRevision?: string;
                serverNow?: number;
                activityInstanceIdentity?: InputSpecRealtimePayload['activityInstanceIdentity'];
              }
            | null;
          const stamped = data?.spec ?? null;
          const serverNow = typeof data?.serverNow === 'number' ? data.serverNow : Date.now();
          const inputSpecRevision = typeof data?.inputSpecRevision === 'string'
            ? data.inputSpecRevision
            : getInputSpecRevision(stamped);
          lastWrittenInputSpec = stamped;
          logRealtimeDiagnostic('input-spec-sender', 'database_write_complete', {
            revision: inputSpecRevision,
          });
          void broadcastInputSpec(sessionId, {
            spec: stamped,
            inputSpecRevision,
            serverNow,
            activityInstanceIdentity:
              data?.activityInstanceIdentity
              ?? getActivityInstanceIdentity(stamped)
              ?? activityInstanceIdentity,
          });
          if (stamped && typeof stamped.timerSeconds === 'number' && typeof stamped.startedAt === 'number') {
            const offset = serverNow - Date.now();
            const prev = get().activeTimedRound;
            const isNewRound = !prev || prev.clientStartedAt !== stamped.clientStartedAt || prev.startedAt !== stamped.startedAt;
            set({
              serverClockOffset: offset,
              ...(isNewRound
                ? {
                    activeTimedRound: {
                      clientStartedAt: stamped.clientStartedAt,
                      startedAt: stamped.startedAt,
                      answersOpenAt: stamped.answersOpenAt,
                      timerSeconds: stamped.timerSeconds,
                    },
                  }
                : {}),
            });
          } else if (get().activeTimedRound) {
            set({ activeTimedRound: null });
          }
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('[setInputSpec] API write failed:', res.status, err);
        }
      } catch (error) {
        console.error('[setInputSpec] fetch error:', error);
      }
    });
    return inputSpecWriteQueue;
  },

  addStudent: (student: Student) => set((state) => {
    // Avoid duplicates
    if (state.students.some((s) => s.id === student.id)) {
      return state;
    }
    return {
      students: [...state.students, student],
      callCounts: { ...state.callCounts, [student.id]: 0 },
      streaks: { ...state.streaks, [student.id]: 0 },
    };
  }),

  addSeenItems: (gameKey: string, items: string[]) => set((state) => ({
    seenItemsByGame: {
      ...state.seenItemsByGame,
      [gameKey]: [...(state.seenItemsByGame[gameKey] ?? []), ...items],
    },
  })),

  addSeenCacheId: (id: string) => set((state) => ({
    seenCacheIds: [...state.seenCacheIds, id],
  })),

  addStudentMission: (clientId: string, mission: string) => set((state) => ({
    studentMissions: { ...state.studentMissions, [clientId]: mission },
  })),

  addLandingAnswer: (clientId: string, answer: string) => set((state) => ({
    landingAnswers: { ...state.landingAnswers, [clientId]: answer },
  })),

  setClassMission: (question: string) => set({ classMission: question }),

  addOpeningStance: (clientId: string, stance: string) => set((state) => ({
    openingStances: { ...state.openingStances, [clientId]: stance },
  })),

  addCharacterAssignment: (clientId: string, character: CharacterCard) => set((state) => ({
    characterAssignments: { ...state.characterAssignments, [clientId]: character },
  })),

  setGrammarTarget: (target: GrammarTarget | null) => set((state) => ({
    settings: { ...state.settings, grammarTarget: target },
  })),

  reset: () => {
    lastWrittenInputSpec = undefined;
    inputSpecWriteGeneration += 1;
    inputSpecWriteQueue = Promise.resolve();
    resetInputSpecBroadcastChannel();
    set({
      sessionId: null,
      classId: null,
      students: [],
      scores: [],
      streaks: {},
      pickerMode: 'fair',
      gameMode: 'normal',
      callCounts: {},
      currentStudentId: null,
      roundNumber: 1,
      settings: { ...DEFAULT_SETTINGS },
      sourceMaterial: null,
      turnModifier: null,
      needsSpin: false,
      activeGameKey: null,
      inputSpec: null,
      activeTimedRound: null,
      serverClockOffset: 0,
      seenItemsByGame: {},
      seenCacheIds: [],
      studentMissions: {},
      landingAnswers: {},
      classMission: null,
      openingStances: {},
      characterAssignments: {},
      tripLog: [],
      predictionResults: [],
      flightLog: [],
      flightPresetId: null,
    });
  },
}));

export { calculateStreakBonus };
