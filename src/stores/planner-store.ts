import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/lib/difficulty';
import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from '@/lib/flight-plan-config';
import { suggestModules, type PlanModule } from '@/lib/planner-utils';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import type { ScoringMode } from '@/stores/session-store';
import { getActivity } from '@/activities/registry';
import { getGame } from '@/games/registry';

export type { PlanModule };

/** Internal type used by launchLesson() to build sessionStorage payload. */
type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
};

export type PlannerStep = 'mission-setup' | 'flight-plan' | 'launch';

interface PlannerState {
  // Navigation
  step: PlannerStep;

  // Step 1 — Mission Setup
  topic: string;
  difficulty: Difficulty;
  goals: GoalTag[];
  lessonDurationMinutes: 30 | 45 | 60 | 90;

  // Step 2 — Flight Plan
  modules: PlanModule[];
  activeTab: 'build' | 'presets';
  loadedPresetId: string | null;
  replaceDrawerModuleId: string | null;
  overrideScoringMode: ScoringMode | null;

  // Step 3 — Launch
  selectedClassId: string | null;

  // Derived
  primaryGoal: GoalTag;

  // Actions — navigation
  setStep(step: PlannerStep): void;

  // Actions — Step 1
  setTopic(topic: string): void;
  setDifficulty(d: Difficulty): void;
  setGoals(goals: GoalTag[]): void;
  toggleGoal(g: GoalTag): void;
  setDuration(minutes: 30 | 45 | 60 | 90): void;

  // Actions — Step 2 (Flight Plan)
  initModules(): void;
  moveModule(fromIndex: number, toIndex: number): void;
  replaceModule(id: string, newKey: string, newSlotType: SlotType): void;
  setActiveTab(tab: 'build' | 'presets'): void;
  loadPreset(preset: FlightPlanPreset): void;
  setReplaceDrawerModuleId(id: string | null): void;

  // Actions — Step 3 (Launch)
  setSelectedClassId(id: string | null): void;

  // Handoff to session. Does NOT reset — caller decides when to reset.
  launchLesson(): Promise<void>;

  // Full reset — called when teacher starts a fresh plan.
  reset(): void;
}

function derivePrimaryGoal(goals: GoalTag[]): GoalTag {
  return goals[0] ?? 'discussion-debate';
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      // Initial state
      step: 'mission-setup',
      topic: '',
      difficulty: 'Intermediate',
      goals: [],
      lessonDurationMinutes: 30,
      modules: [],
      activeTab: 'build',
      loadedPresetId: null,
      replaceDrawerModuleId: null,
      overrideScoringMode: null,
      selectedClassId: null,

      // Derived
      get primaryGoal() {
        return derivePrimaryGoal(get().goals);
      },

      // Navigation
      setStep: (step) => set({ step }),

      // Step 1
      setTopic: (topic) => set({ topic }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setGoals: (goals) => set({ goals }),
      toggleGoal: (g) =>
        set((state) => {
          const next = state.goals.includes(g)
            ? state.goals.filter((x) => x !== g)
            : [...state.goals, g];
          return { goals: next };
        }),
      setDuration: (lessonDurationMinutes) => set({ lessonDurationMinutes }),

      // Step 2
      initModules: () => {
        const { goals, difficulty, lessonDurationMinutes } = get();
        const primaryGoal = derivePrimaryGoal(goals);
        set({ modules: suggestModules(primaryGoal, difficulty, lessonDurationMinutes) });
      },

      moveModule: (fromIndex, toIndex) =>
        set((state) => {
          const mods = [...state.modules];
          if (mods[fromIndex]?.isLocked || mods[toIndex]?.isLocked) return state;
          const [moved] = mods.splice(fromIndex, 1);
          mods.splice(toIndex, 0, moved);
          return { modules: mods };
        }),

      replaceModule: (id, newKey, newSlotType) =>
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id ? { ...m, key: newKey, slotType: newSlotType } : m,
          ),
        })),

      setActiveTab: (activeTab) => set({ activeTab }),

      loadPreset: (preset) => {
        const takeoff: PlanModule = {
          id: crypto.randomUUID(),
          slotType: 'takeoff',
          key: 'mission-selector',
          isLocked: true,
        };

        const landingCandidates = FLIGHT_PLAN_ITEMS.filter((item) => item.missionLanding);
        const landingItem =
          landingCandidates.find((item) => item.goalFit.includes(preset.goal)) ??
          FLIGHT_PLAN_ITEMS.find((item) => item.key === 'final-answer')!;
        const landing: PlanModule = {
          id: crypto.randomUUID(),
          slotType: 'landing',
          key: landingItem.key,
          isLocked: true,
        };

        const middle: PlanModule[] = preset.moduleSequence.map(({ slotType, key }) => ({
          id: crypto.randomUUID(),
          slotType,
          key,
          isLocked: false,
        }));

        set({
          goals: [preset.goal],
          lessonDurationMinutes: preset.lessonDurationMinutes,
          modules: [takeoff, ...middle, landing],
          loadedPresetId: preset.id,
          activeTab: 'presets',
          overrideScoringMode: preset.scoringMode ?? null,
        });
      },

      setReplaceDrawerModuleId: (id) => set({ replaceDrawerModuleId: id }),

      setSelectedClassId: (id) => set({ selectedClassId: id }),

      // Handoff — structure-only payload. Content generated lazily at runtime.
      launchLesson: async () => {
        const { topic, difficulty, goals, modules, selectedClassId, overrideScoringMode } = get();
        if (!selectedClassId) return;

        const primaryGoal = derivePrimaryGoal(goals);

        const slots: LessonSlot[] = modules.map((m) => {
          const activity = getActivity(m.key);
          if (activity) {
            return { type: 'activity' as const, key: m.key, name: activity.name, category: activity.category };
          }
          const game = getGame(m.key);
          if (game) {
            return { type: 'game' as const, key: m.key, name: game.name, category: game.category };
          }
          return { type: 'activity' as const, key: m.key, name: m.key };
        });

        sessionStorage.setItem(
          'lessonPlanContent',
          JSON.stringify({
            customTopic: topic,
            difficulty,
            goal: primaryGoal,
            ...(overrideScoringMode ? { scoringMode: overrideScoringMode } : {}),
            isMissionBased: true,
            slots,
            generatedContent: {},
            generatedGameContent: {},
          }),
        );

        const res = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId: selectedClassId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create session' }));
          throw new Error(err.error ?? 'Failed to create session');
        }

        const { sessionId } = await res.json();
        window.location.href = `/sessions/${sessionId}`;
      },

      // Reset
      reset: () =>
        set({
          step: 'mission-setup',
          topic: '',
          difficulty: 'Intermediate',
          goals: [],
          lessonDurationMinutes: 30,
          modules: [],
          activeTab: 'build',
          loadedPresetId: null,
          replaceDrawerModuleId: null,
          overrideScoringMode: null,
          selectedClassId: null,
        }),
    }),
    {
      name: 'lc-planner',
      version: 2,
      migrate: (persisted) => {
        // Strip step from old cached data (was persisted in v1, causes hydration crash)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { step: _drop, ...rest } = persisted as Record<string, unknown>;
        return rest;
      },
      partialize: (state) => ({
        topic: state.topic,
        difficulty: state.difficulty,
        goals: state.goals,
        lessonDurationMinutes: state.lessonDurationMinutes,
        modules: state.modules,
        activeTab: state.activeTab,
        loadedPresetId: state.loadedPresetId,
        selectedClassId: state.selectedClassId,
      }),
    },
  ),
);
