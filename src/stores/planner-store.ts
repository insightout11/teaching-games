import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/lib/difficulty';
import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from '@/lib/flight-plan-config';
import type { ActivityGeneratedContent, GameGeneratedContent } from '@/activities/types';
import { suggestModules, type PlanModule } from '@/lib/planner-utils';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';

export type { PlanModule };

/**
 * Transitional type — mirrors the current page.tsx slot shape.
 * Removed in Phase 2 when the Flight Plan UI uses modules[] directly.
 */
export type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
};

export type PlannerStep = 'mission-setup' | 'flight-plan' | 'launch';

const DEFAULT_LANDING_SLOT: LessonSlot = {
  type: 'activity',
  key: 'final-answer',
  name: 'Final Answer',
  category: 'closing',
};

const DEFAULT_SELECTED_SLOTS: (LessonSlot | null)[] = [
  null, null, null, null, DEFAULT_LANDING_SLOT,
];

interface PlannerState {
  // Navigation
  step: PlannerStep;

  // Step 1 — Mission Setup
  topic: string;
  difficulty: Difficulty;
  goal: GoalTag | null;
  lessonDurationMinutes: 30 | 45 | 60 | 90;

  // Transitional — used by current page.tsx UI; replaced by modules[] in Phase 2
  selectedSlots: (LessonSlot | null)[];

  // Step 2 — Flight Plan
  modules: PlanModule[];
  activeTab: 'build' | 'presets';
  loadedPresetId: string | null;

  // Step 3 — Review & Launch
  generationStatus: 'idle' | 'generating' | 'ready' | 'error';
  generationError: string | null;
  generatedContent: Record<string, ActivityGeneratedContent> | null;
  generatedGameContent: Record<string, GameGeneratedContent> | null;

  // Actions — navigation
  setStep(step: PlannerStep): void;

  // Actions — Step 1
  setTopic(topic: string): void;
  setDifficulty(d: Difficulty): void;
  setGoal(g: GoalTag): void;
  setDuration(minutes: 30 | 45 | 60 | 90): void;

  // Transitional slot actions (current page.tsx UI)
  setSelectedSlot(index: number, slot: LessonSlot): void;
  clearSelectedSlot(index: number): void;

  // Actions — Step 2 (Flight Plan)
  initModules(): void;
  moveModule(fromIndex: number, toIndex: number): void;
  replaceModule(id: string, newKey: string, newSlotType: SlotType): void;
  setActiveTab(tab: 'build' | 'presets'): void;
  loadPreset(preset: FlightPlanPreset): void;

  // Actions — Step 3
  setGenerationStatus(
    status: 'idle' | 'generating' | 'ready' | 'error',
    error?: string,
  ): void;
  setGenerationResult(
    content: Record<string, ActivityGeneratedContent>,
    gameContent: Record<string, GameGeneratedContent>,
  ): void;

  // Handoff to session. Does NOT reset — caller decides when to reset.
  launchLesson(): void;

  // Full reset — called when teacher starts a fresh plan.
  reset(): void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      // Initial state
      step: 'mission-setup',
      topic: '',
      difficulty: 'Intermediate',
      goal: null,
      lessonDurationMinutes: 60,
      selectedSlots: [...DEFAULT_SELECTED_SLOTS],
      modules: [],
      activeTab: 'build',
      loadedPresetId: null,
      generationStatus: 'idle',
      generationError: null,
      generatedContent: null,
      generatedGameContent: null,

      // Navigation
      setStep: (step) => set({ step }),

      // Step 1
      setTopic: (topic) => set({ topic }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setGoal: (goal) => set({ goal }),
      setDuration: (lessonDurationMinutes) => set({ lessonDurationMinutes }),

      // Transitional slot actions
      setSelectedSlot: (index, slot) =>
        set((state) => {
          const next = [...state.selectedSlots];
          next[index] = slot;
          return { selectedSlots: next };
        }),
      clearSelectedSlot: (index) =>
        set((state) => {
          const next = [...state.selectedSlots];
          next[index] = null;
          return { selectedSlots: next };
        }),

      // Step 2
      initModules: () => {
        const { goal, difficulty, lessonDurationMinutes } = get();
        if (!goal) return;
        set({ modules: suggestModules(goal, difficulty, lessonDurationMinutes) });
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
          goal: preset.goal,
          lessonDurationMinutes: preset.lessonDurationMinutes,
          modules: [takeoff, ...middle, landing],
          loadedPresetId: preset.id,
          activeTab: 'presets',
        });
      },

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

      // Handoff
      launchLesson: () => {
        const { topic, difficulty, goal, selectedSlots, generatedContent, generatedGameContent } =
          get();
        const MISSION_SELECTOR: LessonSlot = {
          type: 'activity',
          key: 'mission-selector',
          name: 'Mission Selector',
        };
        sessionStorage.setItem(
          'lessonPlanContent',
          JSON.stringify({
            customTopic: topic,
            difficulty,
            goal,
            isMissionBased: true,
            slots: [MISSION_SELECTOR, ...selectedSlots.filter(Boolean)],
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
          goal: null,
          lessonDurationMinutes: 60,
          selectedSlots: [...DEFAULT_SELECTED_SLOTS],
          modules: [],
          activeTab: 'build',
          loadedPresetId: null,
          generationStatus: 'idle',
          generationError: null,
          generatedContent: null,
          generatedGameContent: null,
        }),
    }),
    {
      name: 'lc-planner',
      // Do NOT persist generation status/result — stale content should not auto-reload.
      partialize: (state) => ({
        step: state.step,
        topic: state.topic,
        difficulty: state.difficulty,
        goal: state.goal,
        lessonDurationMinutes: state.lessonDurationMinutes,
        selectedSlots: state.selectedSlots,
        modules: state.modules,
        activeTab: state.activeTab,
        loadedPresetId: state.loadedPresetId,
      }),
    },
  ),
);
