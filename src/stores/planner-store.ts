import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/lib/difficulty';
import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from '@/lib/flight-plan-config';
import type { GrammarTarget } from '@/lib/grammar';
import { suggestModules, type PlanModule } from '@/lib/planner-utils';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import type { ScoringMode } from '@/stores/session-store';
import { getActivity } from '@/activities/registry';
import { getGame } from '@/games/registry';
import type { SourceMaterial, SourceType } from '@/types/source-material';

const VIDEO_SOURCE_TYPES = new Set<SourceType>([
  'youtube', 'ted', 'teded', 'bbc', 'kurzgesagt',
  'bbc-ideas', 'bigthink', 'vox', 'kids',
  'natgeo', 'crash-course',
  'travel-english', 'business-english', 'internet-memes', 'minecraft',
]);

const TEXT_SOURCE_TYPES = new Set<SourceType>(['stories', 'voa', 'picture-books']);

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
  insertAfterIndex: number | null;
  overrideScoringMode: ScoringMode | null;

  // Step 3 — Launch
  selectedClassId: string | null;
  grammarTarget: GrammarTarget | null;
  sourceMaterial: SourceMaterial | null;

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
  setInsertAfterIndex(index: number | null): void;
  /** Insert a new module after the given index. */
  insertModule(afterIndex: number, key: string): void;
  /** Remove a module by id. No-op if it would leave 0 modules. */
  removeModule(id: string): void;
  /** Seed the flight plan with a single game/activity and jump to the flight-plan step. */
  seedWithModule(key: string, slotType: SlotType): void;

  // Actions — Step 3 (Launch)
  setSelectedClassId(id: string | null): void;
  setGrammarTarget(t: GrammarTarget | null): void;
  setSourceMaterial(s: SourceMaterial | null): void;

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
      activeTab: 'presets',
      loadedPresetId: null,
      replaceDrawerModuleId: null,
      insertAfterIndex: null,
      overrideScoringMode: null,
      selectedClassId: null,
      grammarTarget: null,
      sourceMaterial: null,

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
        const { goals, difficulty, lessonDurationMinutes, sourceMaterial } = get();
        const primaryGoal = derivePrimaryGoal(goals);
        const sourceKind = sourceMaterial
          ? VIDEO_SOURCE_TYPES.has(sourceMaterial.sourceType) ? 'video'
          : TEXT_SOURCE_TYPES.has(sourceMaterial.sourceType) ? 'text'
          : null
          : null;
        const base = suggestModules(primaryGoal, difficulty, lessonDurationMinutes, sourceKind);
        if (sourceMaterial && VIDEO_SOURCE_TYPES.has(sourceMaterial.sourceType) && !base.some((m) => m.key === 'video-player')) {
          const takeoffIdx = base.findIndex((m) => m.slotType === 'takeoff');
          const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
          base.splice(insertAt, 0, { id: crypto.randomUUID(), slotType: 'presentation', key: 'video-player', isLocked: false });
        }
        if (sourceMaterial && TEXT_SOURCE_TYPES.has(sourceMaterial.sourceType) && !base.some((m) => m.key === 'read-aloud')) {
          const takeoffIdx = base.findIndex((m) => m.slotType === 'takeoff');
          const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
          base.splice(insertAt, 0, { id: crypto.randomUUID(), slotType: 'presentation', key: 'read-aloud', isLocked: false });
        }
        set({ modules: base });
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
        const takeoffKey = preset.skipTakeoffLanding ? null : (preset.takeoff ?? 'mission-selector');

        const middle: PlanModule[] = preset.moduleSequence
          .filter(({ key }) => key !== takeoffKey)
          .map(({ slotType, key }) => ({
            id: crypto.randomUUID(),
            slotType,
            key,
            isLocked: false,
          }));

        let modules: PlanModule[];
        if (preset.skipTakeoffLanding) {
          modules = middle;
        } else {
          const takeoffKey = preset.takeoff ?? 'mission-selector';
          const takeoff: PlanModule = {
            id: crypto.randomUUID(),
            slotType: 'takeoff',
            key: takeoffKey,
            isLocked: false,
          };

          let landingKey = preset.landing;
          if (!landingKey) {
            const landingCandidates = FLIGHT_PLAN_ITEMS.filter((item) => item.missionLanding);
            const landingItem =
              landingCandidates.find((item) => item.goalFit.includes(preset.goal)) ??
              FLIGHT_PLAN_ITEMS.find((item) => item.key === 'final-answer')!;
            landingKey = landingItem.key;
          }
          const landing: PlanModule = {
            id: crypto.randomUUID(),
            slotType: 'landing',
            key: landingKey,
            isLocked: false,
          };

          modules = [takeoff, ...middle, landing];
        }

        const { sourceMaterial } = get();
        if (sourceMaterial && VIDEO_SOURCE_TYPES.has(sourceMaterial.sourceType) && !modules.some((m) => m.key === 'video-player')) {
          const takeoffIdx = modules.findIndex((m) => m.slotType === 'takeoff');
          const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
          modules.splice(insertAt, 0, { id: crypto.randomUUID(), slotType: 'presentation', key: 'video-player', isLocked: false });
        }
        if (sourceMaterial && TEXT_SOURCE_TYPES.has(sourceMaterial.sourceType) && !modules.some((m) => m.key === 'read-aloud')) {
          const takeoffIdx = modules.findIndex((m) => m.slotType === 'takeoff');
          const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
          modules.splice(insertAt, 0, { id: crypto.randomUUID(), slotType: 'presentation', key: 'read-aloud', isLocked: false });
        }

        set({
          goals: [preset.goal],
          lessonDurationMinutes: preset.lessonDurationMinutes,
          modules,
          loadedPresetId: preset.id,
          activeTab: 'presets',
          overrideScoringMode: preset.scoringMode ?? null,
        });
      },

      setReplaceDrawerModuleId: (id) => set({ replaceDrawerModuleId: id }),
      setInsertAfterIndex: (index) => set({ insertAfterIndex: index }),
      insertModule: (afterIndex, key) => {
        const fpItem = FLIGHT_PLAN_ITEMS.find((i) => i.key === key);
        const slotType = fpItem?.slotFit[0] ?? 'practice';
        const insertAt = Math.max(0, afterIndex + 1);
        set((state) => {
          const mods = [...state.modules];
          mods.splice(insertAt, 0, { id: crypto.randomUUID(), slotType, key, isLocked: false });
          return { modules: mods, insertAfterIndex: null };
        });
      },

      removeModule: (id) =>
        set((state) => {
          if (state.modules.length <= 1) return state;
          return { modules: state.modules.filter((m) => m.id !== id) };
        }),

      seedWithModule: (key, slotType) => {
        const takeoff: PlanModule = { id: crypto.randomUUID(), slotType: 'takeoff', key: 'mission-selector', isLocked: false };
        const middle: PlanModule = { id: crypto.randomUUID(), slotType, key, isLocked: false };
        const landing: PlanModule = { id: crypto.randomUUID(), slotType: 'landing', key: 'opinion-shift', isLocked: false };
        set({
          step: 'flight-plan',
          activeTab: 'build',
          modules: [takeoff, middle, landing],
          loadedPresetId: null,
          overrideScoringMode: null,
        });
      },

      setSelectedClassId: (id) => set({ selectedClassId: id }),
      setGrammarTarget: (grammarTarget) => set({ grammarTarget }),
      setSourceMaterial: (sourceMaterial) => set({ sourceMaterial }),

      // Handoff — structure-only payload. Content generated lazily at runtime.
      launchLesson: async () => {
        const { topic, difficulty, goals, modules, selectedClassId, overrideScoringMode, lessonDurationMinutes, grammarTarget, sourceMaterial } = get();
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

        const hasMissionSelector = modules.some((m) => m.key === 'mission-selector');

        sessionStorage.setItem(
          'lessonPlanContent',
          JSON.stringify({
            customTopic: topic,
            difficulty,
            goal: primaryGoal,
            lessonDurationMinutes,
            ...(overrideScoringMode ? { scoringMode: overrideScoringMode } : {}),
            ...(hasMissionSelector ? { isMissionBased: true } : {}),
            ...(grammarTarget ? { grammarTarget } : {}),
            ...(sourceMaterial ? { sourceMaterial } : {}),
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
          insertAfterIndex: null,
          overrideScoringMode: null,
          selectedClassId: null,
          grammarTarget: null,
          sourceMaterial: null,
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
        grammarTarget: state.grammarTarget,
      }),
    },
  ),
);
