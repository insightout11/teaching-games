import { create } from 'zustand';
import type { Student, Score } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type { Difficulty } from '@/lib/difficulty';
import type { GrammarTarget } from '@/lib/grammar';
import type { CharacterCard } from '@/activities/types';


export type PickerMode = 'fair' | 'random';
export type GameMode = 'normal' | 'spinner';

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
export const PARTICIPATION_POINTS = 5;

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

  // Spin wheel modifier (null = needs to spin)
  turnModifier: TurnModifier | null;
  needsSpin: boolean;

  // Current active game for student submissions
  activeGameKey: string | null;

  // Input spec for student controller
  inputSpec: InputSpec | null;

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

  // Actions
  initSession: (sessionId: string, classId: string, students: Student[]) => void;
  setPickerMode: (mode: PickerMode) => void;
  setGameMode: (mode: GameMode) => void;
  setCurrentStudent: (studentId: string) => void;
  pickStudent: () => string | null;
  spinWheel: () => TurnModifier;
  clearModifier: () => void;
  recordScore: (score: Score) => void;
  addRealtimeScore: (score: Score) => void;
  setSettings: (settings: Partial<SessionSettings>) => void;
  setTopic: (topic: Topic) => void;
  setCustomTopic: (customTopic: string) => void;
  nextRound: () => void;
  awardPoints: (studentId: string, points: number) => Promise<void>;
  setActiveGame: (gameKey: string | null) => void;
  setInputSpec: (spec: InputSpec | null) => Promise<void>;
  addStudent: (student: Student) => void;
  addSeenItems: (gameKey: string, items: string[]) => void;
  addSeenCacheId: (id: string) => void;
  addStudentMission: (clientId: string, mission: string) => void;
  addLandingAnswer: (clientId: string, answer: string) => void;
  setClassMission: (question: string) => void;
  addOpeningStance: (clientId: string, stance: string) => void;
  addCharacterAssignment: (clientId: string, character: CharacterCard) => void;
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
type PersistedSettings = Pick<SessionSettings, 'difficulty' | 'topic' | 'customTopic' | 'tone' | 'scoringMode'>;

function loadPersistedSettings(): Partial<PersistedSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedSettings>) : {};
  } catch {
    return {};
  }
}

function savePersistedSettings(settings: SessionSettings): void {
  if (typeof window === 'undefined') return;
  const { difficulty, topic, customTopic, tone, scoringMode } = settings;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ difficulty, topic, customTopic, tone, scoringMode }));
}

function getInitialSettings(): SessionSettings {
  return { ...DEFAULT_SETTINGS, ...loadPersistedSettings() };
}

// Track the last spec value confirmed written to DB.
// Null writes are skipped when DB is already null, preventing stale overwrites
// from rapid IDLE/PRESENTING → VOTING transitions where null fires before binary.
let lastWrittenInputSpec: InputSpec | null | undefined = undefined;

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
  turnModifier: null,
  needsSpin: false,
  activeGameKey: null,
  inputSpec: null,
  seenItemsByGame: {},
  seenCacheIds: [],
  studentMissions: {},
  landingAnswers: {},
  classMission: null,
  openingStances: {},
  characterAssignments: {},

  initSession: (sessionId, classId, students) => {
    lastWrittenInputSpec = undefined; // Reset per-session tracking
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
      seenItemsByGame: {},
      seenCacheIds: [],
      studentMissions: {},
      landingAnswers: {},
      classMission: null,
      openingStances: {},
      characterAssignments: {},
    });
  },

  setPickerMode: (mode) => set({ pickerMode: mode }),

  setGameMode: (mode) => set({ gameMode: mode }),

  setCurrentStudent: (studentId) => {
    const { callCounts, gameMode } = get();
    set({
      currentStudentId: studentId,
      callCounts: { ...callCounts, [studentId]: (callCounts[studentId] ?? 0) + 1 },
      needsSpin: gameMode === 'spinner',
      turnModifier: gameMode === 'spinner' ? null : get().turnModifier,
    });
  },

  pickStudent: () => {
    const { students, pickerMode, callCounts, gameMode } = get();
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
      needsSpin: gameMode === 'spinner',
      turnModifier: gameMode === 'spinner' ? null : get().turnModifier,
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
      if (streakKey) {
        if (score.is_correct) {
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

  nextRound: () => set((state) => ({ roundNumber: state.roundNumber + 1 })),

  setActiveGame: (gameKey: string | null) => set({ activeGameKey: gameKey }),

  setInputSpec: async (spec: InputSpec | null) => {
    const { sessionId, inputSpec: current } = get();
    // Skip no-op updates to avoid triggering unnecessary re-renders
    if (spec === current) return;
    if (spec === null && current === null) return;
    set({ inputSpec: spec });

    // Sync to database so student controllers can poll for it
    if (!sessionId) {
      return;
    }

    // Skip null writes when DB is already null. Activities go through IDLE → PRESENTING → VOTING,
    // firing null on each intermediate state. Without this guard, a null write (PRESENTING) can
    // race with the binary write (VOTING) and overwrite the active spec.
    if (spec === null && (lastWrittenInputSpec === null || lastWrittenInputSpec === undefined)) {
      return;
    }

    // Write via server-side API route (service role) so the write reaches the same DB
    // that the student poll route reads from — bypasses any browser client auth issues.
    try {
      const res = await fetch('/api/session/input-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, spec }),
      });
      if (res.ok) {
        lastWrittenInputSpec = spec;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[setInputSpec] API write failed:', res.status, err);
      }
    } catch (error) {
      console.error('[setInputSpec] fetch error:', error);
    }
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

  awardPoints: async (studentId: string, points: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data, error } = await supabase.from('scores').insert({
      session_id: sessionId,
      student_id: studentId,
      points,
      streak_count: 0,
      streak_bonus: 0,
      is_correct: true,
      response_data: { type: 'participation' },
    }).select().single();

    if (!error && data) {
      set((state) => ({
        scores: [...state.scores, data as Score],
      }));
    }
  },

  reset: () => {
    lastWrittenInputSpec = undefined;
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
      turnModifier: null,
      needsSpin: false,
      activeGameKey: null,
      inputSpec: null,
      seenItemsByGame: {},
      seenCacheIds: [],
      studentMissions: {},
      landingAnswers: {},
      classMission: null,
      openingStances: {},
      characterAssignments: {},
    });
  },
}));

export { calculateStreakBonus };
