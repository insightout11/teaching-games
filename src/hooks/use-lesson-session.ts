'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, getEffectiveTopic, goalToScoringMode } from '@/stores/session-store';
import type { SessionSettings, ScoringMode } from '@/stores/session-store';
import type { Difficulty } from '@/stores/session-store';
import type { GrammarTarget } from '@/lib/grammar';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin, ActivityGeneratedContent, GameGeneratedContent, SourceVocabItem, LessonPlanGenerateResponse } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import type { FlightPresetConfig } from '@/lib/flight-plan-presets';
import type { WorldFlightSessionContext } from '@/lib/world-flight/journey';
import { missionSelectorFallback } from '@/lib/fallback-content';
import { switchedSuitcase } from '@/activities/cabin-mystery/cases/switched-suitcase';

// ─── Types ─────────────────────────────────────────────────────────────────

export type LessonPhase = 'idle' | 'lobby' | 'mission-select' | 'live' | 'landing' | 'ended';

export type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
  stageId?: string;
  stageLabel?: string;
  isMicroEvent?: boolean;
  pool?: string[];
};

const LANDING_ACTIVITY_KEYS = new Set(['final-answer', 'mic-drop', 'lightning-round', 'opinion-shift']);

// Games that actually consume `config.preGeneratedContent`. Every other game
// fetches its own (now source-aware) content live via its own route and ignores
// the dispatcher's copy — so prefetching it is a wasted AI generation. Keep this
// in sync with games that read preGeneratedContent in their component.
const GAMES_WITH_PREFETCHED_CONTENT = new Set(['vocab-sprint', 'story-sprint']);

// ─── sessionStorage reader ─────────────────────────────────────────────────

interface LessonPlanPayload {
  customTopic: string;
  callsign?: string;
  slots: LessonSlot[];
  generatedContent: Record<string, ActivityGeneratedContent>;
  generatedGameContent: Record<string, GameGeneratedContent>;
  flightPresetId?: string;
  flightConfig?: FlightPresetConfig;
  goal?: string;
  scoringMode?: ScoringMode;
  isMissionBased?: boolean;
  lessonDurationMinutes?: number;
  difficulty?: Difficulty;
  grammarTarget?: GrammarTarget | null;
  directLaunch?: boolean;
  sourceMaterial?: SourceMaterial;
  /** Per-stage sources for curated arcs (Travel trip), keyed by activity key. */
  stageSources?: Record<string, SourceMaterial>;
  worldFlightContext?: WorldFlightSessionContext;
  /** World Flight route — the two cities this lesson flies between. */
  originId?: string;
  destinationId?: string;
}

function getLessonPlanContent(): LessonPlanPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('lessonPlanContent');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        customTopic: parsed.customTopic,
        callsign: parsed.callsign,
        slots: parsed.slots || [],
        generatedContent: parsed.generatedContent || {},
        generatedGameContent: parsed.generatedGameContent || {},
        flightPresetId: parsed.flightPresetId,
        flightConfig: parsed.flightConfig,
        goal: parsed.goal,
        scoringMode: parsed.scoringMode,
        isMissionBased: parsed.isMissionBased,
        lessonDurationMinutes: parsed.lessonDurationMinutes,
        difficulty: parsed.difficulty,
        grammarTarget: parsed.grammarTarget ?? null,
        directLaunch: parsed.directLaunch ?? false,
        sourceMaterial: parsed.sourceMaterial ?? undefined,
        stageSources: parsed.stageSources ?? undefined,
        worldFlightContext: parsed.worldFlightContext ?? undefined,
        originId: parsed.originId ?? undefined,
        destinationId: parsed.destinationId ?? undefined,
      };
    }
  } catch (e) {
    console.error('Failed to load lesson plan content:', e);
  }
  return null;
}

// ─── Hook return type ──────────────────────────────────────────────────────

export interface LessonSession {
  // Owned state
  phase: LessonPhase;
  currentSlotIndex: number;
  lessonSlots: LessonSlot[];
  isMissionBased: boolean;
  missionSelectorReady: boolean;
  generatingModuleName: string | null;
  customTopic: string;
  lessonPlanContent: LessonPlanPayload | null;

  // Derived
  isLessonActive: boolean;
  currentSlot: LessonSlot | null;
  isGeneratingContent: boolean;
  creditsExhausted: boolean;
  dismissCreditsExhausted: () => void;

  // Content resolution
  selectActivity: (activity: ActivityPlugin) => Promise<ActivityGeneratedContent | null>;
  selectGame: (game: GamePlugin) => GameGeneratedContent | null;

  // Actions
  beginLesson: () => void;
  advanceSlot: () => void;
  /** Bail out of the current activity and immediately start a different one. */
  insertAndPivotSlot: (key: string, type: 'game' | 'activity', name: string) => void;
  /** Replace the next slot in place, preserving stageId/stageLabel/isMicroEvent. */
  replaceNextSlot: (key: string, type: 'game' | 'activity', name: string) => void;
  /** Resolve the CURRENT slot to a concrete module after a pool spin (clears the pool). */
  resolveCurrentSlot: (key: string, type: 'game' | 'activity', name: string) => void;
  /** Jump directly to any slot index (skip ahead or go back). */
  goToSlot: (index: number) => void;
  handlePhaseChange: (phase: string) => void;
  setWorldFlightPlaneKey: (planeKey: string, rangeKm?: number) => void;
  exitLesson: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useLessonSession(
  sessionId: string,
  settings: SessionSettings,
  studentCount: number,
): LessonSession {
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const setSettings = useSessionStore((s) => s.setSettings);
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);
  const setSourceMaterial = useSessionStore((s) => s.setSourceMaterial);

  // ─── Core state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<LessonPhase>('idle');
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [isMissionBased, setIsMissionBased] = useState(false);
  const [missionSelectorReady, setMissionSelectorReady] = useState(false);
  const [missionSelectorGenerating, setMissionSelectorGenerating] = useState(false);
  const [generatingModuleName, setGeneratingModuleName] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [lessonPlanContent, setLessonPlanContent] = useState<LessonPlanPayload | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  // Monotonic counter — increments on every advanceSlot/beginLesson to ensure
  // the pending-auto-start effect fires even when `phase` doesn't change
  // (e.g. live → live when advancing between two non-landing slots).
  const [slotTrigger, setSlotTrigger] = useState(0);

  // ─── Content prefetch ──────────────────────────────────────────────────
  const prefetchedContentRef = useRef<Record<string, ActivityGeneratedContent | GameGeneratedContent>>({});
  const prefetchingKeysRef = useRef<Set<string>>(new Set());

  // ─── Canonical source vocab ─────────────────────────────────────────────
  const sourceVocabRef = useRef<SourceVocabItem[]>([]);

  const captureSourceVocab = useCallback((data: Pick<LessonPlanGenerateResponse, 'sourceVocab'>) => {
    if (data.sourceVocab?.length && sourceVocabRef.current.length === 0) {
      sourceVocabRef.current = data.sourceVocab;
      if (sessionId) {
        fetch('/api/session/reference-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, sourceVocab: data.sourceVocab }),
        }).catch((err) => console.warn('canonical vocab write failed:', err));
      }
    }
  }, [sessionId]);

  // ─── Pending auto-start (set by beginLesson / advanceSlot, consumed by effect) ──
  const pendingAutoStartRef = useRef<number | null>(null);

  // ─── Mission context helper ────────────────────────────────────────────
  const getMissionContext = useCallback((): string[] => {
    const missions = useSessionStore.getState().studentMissions;
    const all = Object.values(missions);
    return Array.from(new Set(all)).slice(0, 5);
  }, []);

  // ─── Prefetch a module's content ───────────────────────────────────────
  const prefetchModule = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= lessonSlots.length) return;
    const slot = lessonSlots[slotIndex];
    const key = slot.key;

    if (prefetchedContentRef.current[key] || prefetchingKeysRef.current.has(key)) return;
    if (lessonPlanContent?.generatedContent[key] || lessonPlanContent?.generatedGameContent?.[key]) return;

    // Self-generating games ignore preGeneratedContent — skip the wasted prefetch.
    if (slot.type === 'game' && !GAMES_WITH_PREFETCHED_CONTENT.has(key)) return;

    const needsSourceVocab = lessonSlots.some((s) => s.key === 'language-toolkit');

    // Don't prefetch language-toolkit until canonical vocab is ready — it would generate a second list
    if (needsSourceVocab && key === 'language-toolkit' && sourceVocabRef.current.length === 0) return;

    prefetchingKeysRef.current.add(key);

    // Prefer the launch-time topic (source of truth from the lesson plan) over
    // settings.customTopic, which is populated asynchronously and can still be empty
    // when generation fires — that silently falls back to 'General' → off-topic content.
    const effectiveTopic = lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings);
    const missionContext = getMissionContext();
    const isLanding = LANDING_ACTIVITY_KEYS.has(key);
    const isGame = slot.type === 'game';

    const endpoint = isLanding ? '/api/landing/generate' : '/api/lesson-plan/generate';
    const sourceMaterial = lessonPlanContent?.stageSources?.[key] ?? lessonPlanContent?.sourceMaterial;
    const sourceVocabPayload = sourceVocabRef.current.length > 0 ? { sourceVocab: sourceVocabRef.current } : {};
    const body = isLanding
      ? { activityKey: key, topic: effectiveTopic, difficulty: settings.difficulty }
      : isGame
        ? { customTopic: effectiveTopic, difficulty: settings.difficulty, games: [key], sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}), ...(needsSourceVocab ? { needsSourceVocab: true, ...sourceVocabPayload } : {}) }
        : { customTopic: effectiveTopic, difficulty: settings.difficulty, activities: [key], studentCount, sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}), ...(needsSourceVocab ? { needsSourceVocab: true, ...sourceVocabPayload } : {}) };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data: LessonPlanGenerateResponse) => {
        captureSourceVocab(data);
        if (data.success === false) return;
        if (isLanding && data.content) {
          prefetchedContentRef.current[key] = data.content as unknown as ActivityGeneratedContent;
        } else if (isGame && data.gameContent?.[key]) {
          prefetchedContentRef.current[key] = data.gameContent[key];
        } else if (data.content?.[key]) {
          prefetchedContentRef.current[key] = data.content[key];
        }
      })
      .catch((err) => {
        console.error(`Failed to prefetch ${key}:`, err);
      })
      .finally(() => {
        prefetchingKeysRef.current.delete(key);
      });
  }, [lessonSlots, lessonPlanContent, settings, studentCount, sessionId, getMissionContext, captureSourceVocab]);

  // ─── Content resolution: activity ──────────────────────────────────────
  const selectActivity = useCallback(async (activity: ActivityPlugin): Promise<ActivityGeneratedContent | null> => {
    if (activity.key === 'cabin-mystery') {
      return { ...switchedSuitcase, topicContext: lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings) };
    }

    // Prefetched content
    const prefetched = prefetchedContentRef.current[activity.key] as ActivityGeneratedContent | undefined;
    if (prefetched) return prefetched;

    // Pre-generated content from lesson planner
    // Exception: grammar target-dependent activities (check-in, clarify, proof) are
    // pre-generated before the teacher picks the target in the check-in, so if the
    // confirmed target differs, skip the stale pre-gen and regenerate with the real target.
    if (lessonPlanContent?.generatedContent[activity.key]) {
      const pregen = lessonPlanContent.generatedContent[activity.key] as ActivityGeneratedContent & { grammarTarget?: string };
      const currentTarget = settings.grammarTarget;
      const targetDependent = activity.key === 'grammar-check-in' || activity.key === 'grammar-clarify' || activity.key === 'grammar-proof';
      if (!targetDependent || !currentTarget || pregen.grammarTarget === currentTarget) {
        return pregen;
      }
    }

    // Generate on-the-fly
    const isLanding = LANDING_ACTIVITY_KEYS.has(activity.key);
    const currentPhase = phase;

    if (currentPhase !== 'idle') {
      setGeneratingModuleName(activity.name);
    }
    setIsGeneratingContent(true);

    try {
      // Prefer the launch-time topic (source of truth from the lesson plan) over
    // settings.customTopic, which is populated asynchronously and can still be empty
    // when generation fires — that silently falls back to 'General' → off-topic content.
    const effectiveTopic = lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings);
      const missionContext = getMissionContext();
      const endpoint = isLanding ? '/api/landing/generate' : '/api/lesson-plan/generate';
      const sourceMaterial = lessonPlanContent?.stageSources?.[activity.key] ?? lessonPlanContent?.sourceMaterial;
      const needsSourceVocab = lessonSlots.some((s) => s.key === 'language-toolkit');
      const sourceVocabPayload = sourceVocabRef.current.length > 0 ? { sourceVocab: sourceVocabRef.current } : {};
      const body = isLanding
        ? JSON.stringify({ activityKey: activity.key, topic: effectiveTopic, difficulty: settings.difficulty })
        : JSON.stringify({
            customTopic: effectiveTopic,
            difficulty: settings.difficulty,
            activities: [activity.key],
            studentCount,
            sessionId,
            ...(missionContext.length > 0 ? { missionContext } : {}),
            ...(settings.grammarTarget ? { grammarTarget: settings.grammarTarget } : {}),
            ...(sourceMaterial ? { sourceMaterial } : {}),
            ...(needsSourceVocab ? { needsSourceVocab: true, ...sourceVocabPayload } : {}),
          });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.status === 402) {
        setCreditsExhausted(true);
        // Return minimal fallback — don't block the session
        return { activityKey: activity.key, topicContext: lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings) };
      }

      const data: LessonPlanGenerateResponse = await response.json();
      captureSourceVocab(data);
      const resolvedContent = isLanding ? (data.content as unknown as ActivityGeneratedContent) : data.content?.[activity.key];
      if (data.success !== false && resolvedContent) {
        return resolvedContent;
      }
      throw new Error('Failed to generate activity content');
    } catch (error) {
      console.error('Failed to generate activity content:', error);
      return null;
    } finally {
      setIsGeneratingContent(false);
      setGeneratingModuleName(null);
    }
  }, [lessonPlanContent, lessonSlots, phase, settings, studentCount, sessionId, getMissionContext, captureSourceVocab]);

  // ─── Content resolution: game ──────────────────────────────────────────
  const selectGame = useCallback((game: GamePlugin): GameGeneratedContent | null => {
    const prefetched = prefetchedContentRef.current[game.key] as GameGeneratedContent | undefined;
    if (prefetched) return prefetched;

    if (lessonPlanContent?.generatedGameContent?.[game.key]) {
      return lessonPlanContent.generatedGameContent[game.key];
    }

    // Games handle null content internally via their own generate-round APIs
    return null;
  }, [lessonPlanContent]);

  // ─── Load lesson plan from sessionStorage on mount ─────────────────────
  useEffect(() => {
    const content = getLessonPlanContent();
    if (content) {
      setLessonPlanContent(content);
      setCustomTopic(content.customTopic);
      setSourceMaterial(content.sourceMaterial ?? null);
      setSettings({
        scoringMode: content.scoringMode ?? goalToScoringMode(content.goal),
        ...(content.difficulty ? { difficulty: content.difficulty } : {}),
      });
      if (content.isMissionBased) {
        setIsMissionBased(true);
      }

      if (content.slots && content.slots.length > 0) {
        setLessonSlots(content.slots);

        if (content.directLaunch) {
          // Explicit direct launch (Explore "run it now"): skip lobby, go live immediately.
          setPhase('live');
          pendingAutoStartRef.current = 0;
        } else {
          // Every real lesson launch shows the join lobby — students always join first,
          // regardless of whether content was pre-generated (planner, courses, Travel).
          setPhase('lobby');
        }
      }
    }
  }, [setCustomTopic, setSettings, setSourceMaterial]);

  // Apply grammarTarget from lesson plan AFTER initSession has run (initSession resets settings).
  // This runs on the render where phase transitions to 'lobby', which is after the first effects flush.
  useEffect(() => {
    if (phase === 'lobby' && lessonPlanContent?.grammarTarget) {
      setGrammarTarget(lessonPlanContent.grammarTarget as GrammarTarget);
    }
  }, [phase, lessonPlanContent, setGrammarTarget]);

  // ─── Mission rehydration from DB ───────────────────────────────────────
  useEffect(() => {
    if (!sessionId || phase === 'idle') return;

    const { addStudentMission } = useSessionStore.getState();

    fetch(`/api/session/missions?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.missions) {
          for (const m of data.missions) {
            addStudentMission(m.client_id, m.mission_text);
          }
        }
      })
      .catch(() => {}); // non-critical
    // Only run on mount when session is active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ─── Generate mission-selector content in background during lobby ──────
  useEffect(() => {
    if (phase !== 'lobby' || missionSelectorReady || missionSelectorGenerating) return;

    const missionSlot = lessonSlots.find((s) => s.key === 'mission-selector');
    if (!missionSlot) {
      setMissionSelectorReady(true);
      return;
    }

    setMissionSelectorGenerating(true);

    const topic = lessonPlanContent?.customTopic || '';
    const difficulty = settings.difficulty;
    const goal = lessonPlanContent?.goal;

    fetch('/api/lesson-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customTopic: topic,
        difficulty,
        goal,
        activities: ['mission-selector'],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success !== false && data.content?.['mission-selector']) {
          prefetchedContentRef.current['mission-selector'] = data.content['mission-selector'];
        } else {
          // API failed or returned no content (auth error, credits, AI failure) — use fallback
          prefetchedContentRef.current['mission-selector'] = missionSelectorFallback(topic);
        }
        setMissionSelectorReady(true);
      })
      .catch((err) => {
        console.error('Failed to generate mission-selector content:', err);
        prefetchedContentRef.current['mission-selector'] = missionSelectorFallback(topic);
        setMissionSelectorReady(true);
      })
      .finally(() => {
        setMissionSelectorGenerating(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, missionSelectorReady, missionSelectorGenerating]);

  // ─── Process pending auto-start ────────────────────────────────────────
  // We use a ref + effect to avoid calling selectActivity/selectGame during render
  const autoStartCallbackRef = useRef<((index: number) => void) | null>(null);

  // This callback is stored in a ref so the effect can call it
  autoStartCallbackRef.current = (index: number) => {
    if (index >= lessonSlots.length) return;

    setCurrentSlotIndex(index);

    // Prefetch next module
    if (index + 1 < lessonSlots.length) {
      setTimeout(() => prefetchModule(index + 1), 500);
    }
  };

  useEffect(() => {
    if (pendingAutoStartRef.current !== null) {
      const index = pendingAutoStartRef.current;
      pendingAutoStartRef.current = null;
      autoStartCallbackRef.current?.(index);
    }
    // slotTrigger increments on every beginLesson/advanceSlot so this effect
    // fires even when phase stays the same (e.g. live → live).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slotTrigger]);

  // ─── Actions ───────────────────────────────────────────────────────────

  const beginLesson = useCallback(() => {
    const firstSlot = lessonSlots[0];
    const firstKey = firstSlot?.key ?? '';
    const startPhase = firstKey === 'mission-selector' ? 'mission-select'
      : LANDING_ACTIVITY_KEYS.has(firstKey) ? 'landing'
      : 'live';
    setPhase(startPhase);
    pendingAutoStartRef.current = 0;
    setSlotTrigger((c) => c + 1);
  }, [lessonSlots]);

  const advanceSlot = useCallback(() => {
    const nextIndex = currentSlotIndex + 1;
    if (nextIndex < lessonSlots.length) {
      const nextSlot = lessonSlots[nextIndex];
      const isLanding = LANDING_ACTIVITY_KEYS.has(nextSlot.key);
      setPhase(isLanding ? 'landing' : 'live');
      pendingAutoStartRef.current = nextIndex;
      setSlotTrigger((c) => c + 1);
    } else {
      setPhase('ended');
    }
  }, [currentSlotIndex, lessonSlots]);

  const insertAndPivotSlot = useCallback((key: string, type: 'game' | 'activity', name: string) => {
    const newSlot: LessonSlot = { key, type, name };
    const insertAt = currentSlotIndex + 1;
    setLessonSlots((prev) => {
      const next = [...prev];
      next.splice(insertAt, 0, newSlot);
      return next;
    });
    const isLanding = LANDING_ACTIVITY_KEYS.has(key);
    setPhase(isLanding ? 'landing' : 'live');
    pendingAutoStartRef.current = insertAt;
    setSlotTrigger((c) => c + 1);
  }, [currentSlotIndex]);

  const goToSlot = useCallback((index: number) => {
    if (index < 0 || index >= lessonSlots.length) return;
    const slot = lessonSlots[index];
    const isLanding = LANDING_ACTIVITY_KEYS.has(slot.key);
    setPhase(isLanding ? 'landing' : 'live');
    pendingAutoStartRef.current = index;
    setSlotTrigger((c) => c + 1);
  }, [lessonSlots]);

  const replaceNextSlot = useCallback((key: string, type: 'game' | 'activity', name: string) => {
    setLessonSlots((prev) => {
      const next = [...prev];
      const nextIdx = currentSlotIndex + 1;
      if (nextIdx < next.length) {
        next[nextIdx] = { ...next[nextIdx], key, type, name };
      }
      return next;
    });
  }, [currentSlotIndex]);

  // Ref so resolveCurrentSlot (stable identity) always targets the live slot, even
  // when called from a callback captured on an earlier render (handlePoolResolved).
  const currentSlotIndexRef = useRef(currentSlotIndex);
  currentSlotIndexRef.current = currentSlotIndex;

  const resolveCurrentSlot = useCallback((key: string, type: 'game' | 'activity', name: string) => {
    setLessonSlots((prev) => {
      const idx = currentSlotIndexRef.current;
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], key, type, name, pool: undefined };
      return next;
    });
  }, []);

  // Stable ref-based callback to avoid identity changes propagating through ActivityShell → activity
  const handlePhaseChangeRef = useRef<(activityPhase: string) => void>(() => {});
  handlePhaseChangeRef.current = (activityPhase: string) => {
    if (activityPhase === 'finished' && currentSlotIndex === 0 && lessonSlots[0]?.key === 'mission-selector') {
      // Mission selector just finished — prefetch next 2 modules with mission context
      setTimeout(() => {
        prefetchModule(1);
        if (lessonSlots.length > 2) {
          setTimeout(() => prefetchModule(2), 200);
        }
      }, 300);
    }
  };
  const handlePhaseChange = useCallback((activityPhase: string) => {
    handlePhaseChangeRef.current(activityPhase);
  }, []);

  const setWorldFlightPlaneKey = useCallback((planeKey: string, rangeKm?: number) => {
    setLessonPlanContent((prev) => {
      if (!prev?.worldFlightContext) return prev;
      const nextWorldFlightContext = {
        ...prev.worldFlightContext,
        planeKey,
        ...(typeof rangeKm === 'number' ? { rangeKm } : {}),
      };
      const next = {
        ...prev,
        worldFlightContext: nextWorldFlightContext,
      };

      try {
        const stored = sessionStorage.getItem('lessonPlanContent');
        const parsed = stored ? JSON.parse(stored) : {};
        sessionStorage.setItem(
          'lessonPlanContent',
          JSON.stringify({
            ...parsed,
            worldFlightContext: {
              ...(parsed.worldFlightContext ?? {}),
              planeKey,
              ...(typeof rangeKm === 'number' ? { rangeKm } : {}),
            },
          }),
        );
      } catch (error) {
        console.warn('Failed to persist World Flight plane choice locally:', error);
      }

      return next;
    });
  }, []);

  const exitLesson = useCallback(() => {
    setPhase('idle');
  }, []);

  // ─── Derived values ────────────────────────────────────────────────────
  const isLessonActive = phase !== 'idle' && phase !== 'ended';
  const currentSlot = lessonSlots[currentSlotIndex] ?? null;

  return {
    phase,
    currentSlotIndex,
    lessonSlots,
    isMissionBased,
    missionSelectorReady,
    generatingModuleName,
    customTopic: lessonPlanContent?.customTopic || '',
    lessonPlanContent,

    isLessonActive,
    currentSlot,
    isGeneratingContent,
    creditsExhausted,
    dismissCreditsExhausted: () => setCreditsExhausted(false),

    selectActivity,
    selectGame,

    beginLesson,
    advanceSlot,
    insertAndPivotSlot,
    replaceNextSlot,
    resolveCurrentSlot,
    goToSlot,
    handlePhaseChange,
    setWorldFlightPlaneKey,
    exitLesson,
  };
}
