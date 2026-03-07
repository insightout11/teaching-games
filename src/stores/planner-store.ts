import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/lib/difficulty';
import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from '@/lib/flight-plan-config';
import type { ActivityGeneratedContent, GameGeneratedContent, LessonPlanGenerateResponse } from '@/activities/types';
import { suggestModules, type PlanModule } from '@/lib/planner-utils';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
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

  // Step 3 — Review & Launch
  generationStatus: 'idle' | 'generating' | 'ready' | 'error';
  generationError: string | null;
  generatedContent: Record<string, ActivityGeneratedContent> | null;
  generatedGameContent: Record<string, GameGeneratedContent> | null;

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

  // Actions — Step 3
  setGenerationStatus(
    status: 'idle' | 'generating' | 'ready' | 'error',
    error?: string,
  ): void;
  setGenerationResult(
    content: Record<string, ActivityGeneratedContent>,
    gameContent: Record<string, GameGeneratedContent>,
  ): void;
  generateContent(): Promise<void>;

  // Handoff to session. Does NOT reset — caller decides when to reset.
  launchLesson(): void;

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
      generationStatus: 'idle',
      generationError: null,
      generatedContent: null,
      generatedGameContent: null,

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
        });
      },

      setReplaceDrawerModuleId: (id) => set({ replaceDrawerModuleId: id }),

      // Step 3
      setGenerationStatus: (generationStatus, error) =>
        set({
          generationStatus,
          generationError: error ?? null,
        }),

      setGenerationResult: (content, gameContent) =>
        set({
          generatedContent: content,
          generatedGameContent: gameContent,
          generationStatus: 'ready',
          generationError: null,
        }),

      generateContent: async () => {
        const { topic, difficulty, goals, modules } = get();
        const primaryGoal = derivePrimaryGoal(goals);
        const trimmedTopic = topic.trim();
        if (!trimmedTopic) {
          set({ generationStatus: 'error', generationError: 'Please enter a topic' });
          return;
        }

        const activityKeys = modules
          .filter((m) => {
            const act = getActivity(m.key);
            return !!act;
          })
          .map((m) => m.key);

        const gameKeys = modules
          .filter((m) => {
            const g = getGame(m.key);
            return !!g;
          })
          .map((m) => m.key);

        set({ generationStatus: 'generating', generationError: null });

        try {
          const response = await fetch('/api/lesson-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customTopic: trimmedTopic,
              difficulty,
              goal: primaryGoal,
              activities: activityKeys,
              games: gameKeys,
            }),
          });

          const data: LessonPlanGenerateResponse = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Failed to generate lesson plan');
          }

          set({
            generatedContent: data.content,
            generatedGameContent: data.gameContent || {},
            generationStatus: 'ready',
            generationError: null,
          });
        } catch (err) {
          console.error('Generation error:', err);
          set({
            generationStatus: 'error',
            generationError: err instanceof Error ? err.message : 'Failed to generate lesson plan',
          });
        }
      },

      // Handoff — build LessonSlot[] from modules for session-view compatibility
      launchLesson: () => {
        const { topic, difficulty, goals, modules, generatedContent, generatedGameContent } = get();
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
            isMissionBased: true,
            slots,
            generatedContent,
            generatedGameContent,
          }),
        );
        window.location.href = '/classes';
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
          generationStatus: 'idle',
          generationError: null,
          generatedContent: null,
          generatedGameContent: null,
        }),
    }),
    {
      name: 'lc-planner',
      partialize: (state) => ({
        step: state.step,
        topic: state.topic,
        difficulty: state.difficulty,
        goals: state.goals,
        lessonDurationMinutes: state.lessonDurationMinutes,
        modules: state.modules,
        activeTab: state.activeTab,
        loadedPresetId: state.loadedPresetId,
      }),
    },
  ),
);
