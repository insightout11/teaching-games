import { create } from 'zustand';
import type { Student, Score } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import { createClient } from '@/lib/supabase/client';

export type PickerMode = 'fair' | 'random';
export type GameMode = 'normal' | 'spinner';

// Session types
export type Difficulty = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
export type Topic = 'General' | 'Action' | 'Business' | 'Academic' | 'Travel' | 'Technology' | 'Literature' | 'Space' | 'Nature' | 'Cooking' | 'Art' | 'Sports' | 'History' | 'Psychology';
export type Tone = 'Neutral' | 'Casual' | 'Formal' | 'Humorous' | 'Professional' | 'Kid-friendly';
// Option arrays
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];
export const TOPICS: Topic[] = ['General', 'Action', 'Business', 'Academic', 'Travel', 'Technology', 'Literature', 'Space', 'Nature', 'Cooking', 'Art', 'Sports', 'History', 'Psychology'];
export const TONES: Tone[] = ['Neutral', 'Casual', 'Formal', 'Humorous', 'Professional', 'Kid-friendly'];

export interface SessionSettings {
  difficulty: Difficulty;
  topic: Topic;
  customTopic: string; // Free-text custom topic (overrides topic dropdown when set)
  tone: Tone;
  timerSeconds: number; // Per-game timer, injected by shells (not stored globally)
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
  reset: () => void;
}

function calculateStreakBonus(streakCount: number): number {
  if (streakCount <= 1) return 0;
  return Math.min(streakCount - 1, 5);
}

const DEFAULT_SETTINGS: SessionSettings = {
  difficulty: 'Advanced',
  topic: 'General',
  customTopic: '',
  tone: 'Neutral',
  timerSeconds: 30,
};

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
  settings: { ...DEFAULT_SETTINGS },
  turnModifier: null,
  needsSpin: false,
  activeGameKey: null,
  inputSpec: null,

  initSession: (sessionId, classId, students) => {
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
      settings: { ...DEFAULT_SETTINGS },
      turnModifier: null,
      needsSpin: false,
      gameMode: 'normal',
      activeGameKey: null,
      inputSpec: null,
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
    const { streaks } = get();
    const newStreaks = { ...streaks };
    // Use student_id for roster students, client_id for remote students
    const streakKey = score.student_id || score.client_id;
    if (streakKey) {
      if (score.is_correct) {
        newStreaks[streakKey] = (newStreaks[streakKey] ?? 0) + 1;
      } else {
        newStreaks[streakKey] = 0;
      }
    }
    set((state) => ({
      scores: [...state.scores, score],
      streaks: newStreaks,
    }));
  },

  addRealtimeScore: (score) => {
    set((state) => {
      if (state.scores.some((s) => s.id === score.id)) return state;
      return { scores: [...state.scores, score] };
    });
  },

  setSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings },
  })),

  setTopic: (topic: Topic) => set((state) => ({
    settings: { ...state.settings, topic },
  })),

  // Handler for custom topic (clears when topic dropdown is used)
  setCustomTopic: (customTopic: string) => set((state) => ({
    settings: { ...state.settings, customTopic },
  })),

  nextRound: () => set((state) => ({ roundNumber: state.roundNumber + 1 })),

  setActiveGame: (gameKey: string | null) => set({ activeGameKey: gameKey }),

  setInputSpec: async (spec: InputSpec | null) => {
    const { sessionId } = get();
    set({ inputSpec: spec });

    // Sync to database so student controllers can poll for it
    if (sessionId) {
      const supabase = createClient();
      await supabase
        .from('sessions')
        .update({ input_spec: spec })
        .eq('id', sessionId);
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

  awardPoints: async (studentId: string, points: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

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

  reset: () => set({
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
  }),
}));

export { calculateStreakBonus };
