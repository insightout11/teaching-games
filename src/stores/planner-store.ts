import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '@/lib/difficulty';
import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from '@/lib/flight-plan-config';
import type { GrammarTarget } from '@/lib/grammar';
import { suggestModules, type PlanModule } from '@/lib/planner-utils';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset, type FlightPresetConfig } from '@/lib/flight-plan-presets';
import type { ScoringMode } from '@/stores/session-store';
import { getActivity } from '@/activities/registry';
import { getGame } from '@/games/registry';
import type { SourceMaterial, SourceType } from '@/types/source-material';
import type { WorldFlightLaunchContext, WorldFlightSessionContext } from '@/lib/world-flight/journey';

const VIDEO_SOURCE_TYPES = new Set<SourceType>([
  'youtube', 'ted', 'teded', 'bbc', 'kurzgesagt',
  'bbc-ideas', 'bigthink', 'vox', 'kids',
  'natgeo', 'crash-course',
  'travel-english', 'business-english', 'internet-memes', 'minecraft',
]);

const TEXT_SOURCE_TYPES = new Set<SourceType>(['text', 'pdf', 'image', 'lyrics', 'stories', 'voa', 'picture-books']);

type PlannerSourceKind = 'video' | 'text' | null;

function getSourceKind(sourceMaterial: SourceMaterial | null | undefined): PlannerSourceKind {
  if (!sourceMaterial) return null;
  if (VIDEO_SOURCE_TYPES.has(sourceMaterial.sourceType)) return 'video';
  if (TEXT_SOURCE_TYPES.has(sourceMaterial.sourceType)) return 'text';
  return null;
}

function withFlightMeta(
  preset: FlightPlanPreset | null | undefined,
  key: string,
  overrides?: { stageId?: string; stageLabel?: string; isMicroEvent?: boolean },
): Pick<PlanModule, 'stageId' | 'stageLabel' | 'isMicroEvent'> {
  const stageId = overrides?.stageId ?? preset?.flightConfig?.stageByKey[key];
  const stage = stageId ? preset?.flightConfig?.stages.find((s) => s.stageId === stageId) : undefined;
  return {
    ...(stageId ? { stageId } : {}),
    ...(overrides?.stageLabel || stage?.label ? { stageLabel: overrides?.stageLabel ?? stage?.label } : {}),
    ...((overrides?.isMicroEvent ?? stage?.kind === 'micro-event') ? { isMicroEvent: true } : {}),
  };
}

function makePresetModule(
  preset: FlightPlanPreset,
  slotType: SlotType,
  key: string,
  overrides?: { stageId?: string; stageLabel?: string; isMicroEvent?: boolean; pool?: string[] },
): PlanModule {
  return {
    id: crypto.randomUUID(),
    slotType,
    key,
    isLocked: false,
    ...withFlightMeta(preset, key, overrides),
    ...(overrides?.pool ? { pool: overrides.pool } : {}),
  };
}

function applyAllAroundSourceRouting(
  modules: PlanModule[],
  preset: FlightPlanPreset,
  sourceKind: PlannerSourceKind,
): PlanModule[] {
  if (preset.id !== 'all-around-flight-60') return modules;

  if (sourceKind === 'video') {
    return modules.map((m) =>
      m.stageId === 'briefing' || m.key === 'read-aloud'
        ? { ...m, key: 'video-player', slotType: 'presentation', ...withFlightMeta(preset, 'video-player') }
        : m,
    );
  }

  return modules;
}

function buildFlightConfigForSlots(
  flightConfig: FlightPresetConfig | undefined,
  slots: LessonSlot[],
): FlightPresetConfig | undefined {
  if (!flightConfig) return undefined;

  const activeStageIds = new Set(slots.map((slot) => slot.stageId).filter(Boolean));
  const stageLabelOverrides = new Map<string, string>();

  slots.forEach((slot) => {
    if (slot.stageId && slot.stageLabel) {
      stageLabelOverrides.set(slot.stageId, slot.stageLabel);
    }
  });

  return {
    ...flightConfig,
    stages: flightConfig.stages
      .filter((stage) => activeStageIds.has(stage.stageId))
      .map((stage) => ({
        ...stage,
        label: stageLabelOverrides.get(stage.stageId) ?? stage.label,
      })),
  };
}

function buildModulesFromPreset(
  preset: FlightPlanPreset,
  sourceKind: PlannerSourceKind,
): PlanModule[] {
  const takeoffKey = preset.skipTakeoffLanding ? null : (preset.takeoff ?? 'mission-selector');

  const middle: PlanModule[] = preset.moduleSequence
    .filter(({ key }) => key !== takeoffKey)
    .map(({ slotType, key, stageId, stageLabel, isMicroEvent, pool }) =>
      makePresetModule(preset, slotType, key, { stageId, stageLabel, isMicroEvent, pool }),
    );

  let modules: PlanModule[];
  if (preset.skipTakeoffLanding) {
    modules = middle;
  } else {
    const resolvedTakeoffKey = preset.takeoff ?? 'mission-selector';
    const takeoff = makePresetModule(preset, 'takeoff', resolvedTakeoffKey);

    let landingKey = preset.landing;
    if (!landingKey) {
      const landingCandidates = FLIGHT_PLAN_ITEMS.filter((item) => item.missionLanding);
      const landingItem =
        landingCandidates.find((item) => item.goalFit.includes(preset.goal)) ??
        FLIGHT_PLAN_ITEMS.find((item) => item.key === 'final-answer')!;
      landingKey = landingItem.key;
    }
    const landing = makePresetModule(preset, 'landing', landingKey);

    modules = [takeoff, ...middle, landing];
  }

  modules = applyAllAroundSourceRouting(modules, preset, sourceKind);

  if (preset.id !== 'all-around-flight-60' && sourceKind === 'video' && !modules.some((m) => m.key === 'video-player')) {
    const takeoffIdx = modules.findIndex((m) => m.slotType === 'takeoff');
    const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
    modules.splice(insertAt, 0, makePresetModule(preset, 'presentation', 'video-player'));
  }
  if (preset.id !== 'all-around-flight-60' && sourceKind === 'text' && !modules.some((m) => m.key === 'read-aloud')) {
    const takeoffIdx = modules.findIndex((m) => m.slotType === 'takeoff');
    const insertAt = takeoffIdx >= 0 ? takeoffIdx + 1 : 0;
    modules.splice(insertAt, 0, makePresetModule(preset, 'presentation', 'read-aloud'));
  }

  return modules;
}

export type { PlanModule };

/** Internal type used by launchLesson() to build sessionStorage payload. */
type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
  stageId?: string;
  stageLabel?: string;
  isMicroEvent?: boolean;
  pool?: string[];
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
  callsign: string | null; // stable flight number for this plan (e.g. "LC-3544")
  worldFlightContext: WorldFlightLaunchContext | null;

  // World Flight route (origin -> destination cities) carried into the session so
  // the arrival scene + flight clock know which two cities the lesson flies between.
  worldFlightOriginId: string | null;
  worldFlightDestinationId: string | null;

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
  setWorldFlightContext(context: WorldFlightLaunchContext | null): void;
  setWorldFlightRoute(originId: string | null, destinationId: string | null): void;

  // Generate the flight callsign once per plan (idempotent); returns it.
  ensureCallsign(): string;

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
      callsign: null,
      worldFlightContext: null,
      worldFlightOriginId: null,
      worldFlightDestinationId: null,

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
        const sourceKind = getSourceKind(sourceMaterial);
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
          modules: state.modules.map((m) => {
            if (m.id !== id) return m;
            return { ...m, key: newKey, slotType: newSlotType };
          }),
        })),

      setActiveTab: (activeTab) => set({ activeTab }),

      loadPreset: (preset) => {
        const { sourceMaterial } = get();
        const modules = buildModulesFromPreset(preset, getSourceKind(sourceMaterial));

        set({
          goals: [preset.goal],
          lessonDurationMinutes: preset.lessonDurationMinutes,
          modules,
          loadedPresetId: preset.id,
          activeTab: 'presets',
          overrideScoringMode: preset.scoringMode ?? null,
          worldFlightContext: null,
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
          worldFlightContext: null,
        });
      },

      setSelectedClassId: (id) => set({ selectedClassId: id }),
      setGrammarTarget: (grammarTarget) => set({ grammarTarget }),
      setSourceMaterial: (sourceMaterial) => {
        const { loadedPresetId } = get();
        const loadedPreset = loadedPresetId ? FLIGHT_PLAN_PRESETS.find((p) => p.id === loadedPresetId) : null;

        if (loadedPreset?.id === 'all-around-flight-60') {
          set({
            sourceMaterial,
            modules: buildModulesFromPreset(loadedPreset, getSourceKind(sourceMaterial)),
          });
          return;
        }

        set({ sourceMaterial });
      },
      setWorldFlightContext: (worldFlightContext) => set({ worldFlightContext }),

      // Handoff — structure-only payload. Content generated lazily at runtime.
      ensureCallsign: () => {
        const existing = get().callsign;
        if (existing) return existing;
        const code = `LC-${Math.floor(1000 + Math.random() * 9000)}`;
        set({ callsign: code });
        return code;
      },

      setWorldFlightRoute: (originId, destinationId) =>
        set({ worldFlightOriginId: originId, worldFlightDestinationId: destinationId }),

      launchLesson: async () => {
        const { topic, difficulty, goals, modules, selectedClassId, overrideScoringMode, lessonDurationMinutes, grammarTarget, sourceMaterial, loadedPresetId, worldFlightContext, worldFlightOriginId, worldFlightDestinationId } = get();
        if (!selectedClassId) return;
        const callsign = get().ensureCallsign();

        const primaryGoal = derivePrimaryGoal(goals);
        const loadedPreset = loadedPresetId ? FLIGHT_PLAN_PRESETS.find((p) => p.id === loadedPresetId) : null;

        // Always rebuild from the latest preset definition for all-around-flight so that
        // pool arrays and isMicroEvent flags are never stale from a persisted planner state.
        const freshModules = loadedPreset?.id === 'all-around-flight-60'
          ? buildModulesFromPreset(loadedPreset, getSourceKind(sourceMaterial))
          : modules;

        const slots: LessonSlot[] = freshModules.map((m) => {
          const meta = {
            ...(m.stageId ? { stageId: m.stageId } : {}),
            ...(m.stageLabel ? { stageLabel: m.stageLabel } : {}),
            ...(m.isMicroEvent ? { isMicroEvent: true } : {}),
            ...(m.pool ? { pool: m.pool } : {}),
          };
          const activity = getActivity(m.key);
          if (activity) {
            return { type: 'activity' as const, key: m.key, name: activity.name, category: activity.category, ...meta };
          }
          const game = getGame(m.key);
          if (game) {
            return { type: 'game' as const, key: m.key, name: game.name, category: game.category, ...meta };
          }
          return { type: 'activity' as const, key: m.key, name: m.key, ...meta };
        });

        const hasMissionSelector = modules.some((m) => m.key === 'mission-selector');
        const flightConfig = buildFlightConfigForSlots(loadedPreset?.flightConfig, slots);

        const lessonPlanPayload = {
          customTopic: topic,
          callsign,
          difficulty,
          goal: primaryGoal,
          lessonDurationMinutes,
          ...(overrideScoringMode ? { scoringMode: overrideScoringMode } : {}),
          ...(hasMissionSelector ? { isMissionBased: true } : {}),
          ...(grammarTarget ? { grammarTarget } : {}),
          ...(sourceMaterial ? { sourceMaterial } : {}),
          ...(flightConfig && loadedPreset ? { flightPresetId: loadedPreset.id, flightConfig } : {}),
          ...(worldFlightDestinationId ? { originId: worldFlightOriginId, destinationId: worldFlightDestinationId } : {}),
          slots,
          generatedContent: {},
          generatedGameContent: {},
        };

        // One-shot: consume the World Flight route so a later non-WF launch
        // doesn't inherit a stale destination.
        set({ worldFlightOriginId: null, worldFlightDestinationId: null });

        const res = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selectedClassId,
            ...(worldFlightContext ? { worldFlightContext } : {}),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create session' }));
          throw new Error(err.error ?? 'Failed to create session');
        }

        const result = await res.json() as {
          sessionId: string;
          worldFlightContext?: WorldFlightSessionContext;
        };
        sessionStorage.setItem(
          'lessonPlanContent',
          JSON.stringify({
            ...lessonPlanPayload,
            ...(result.worldFlightContext ? { worldFlightContext: result.worldFlightContext } : {}),
          }),
        );
        set({ worldFlightContext: null });
        const { sessionId } = result;
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
          callsign: null,
          worldFlightContext: null,
          worldFlightOriginId: null,
          worldFlightDestinationId: null,
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
        worldFlightContext: state.worldFlightContext,
      }),
    },
  ),
);
