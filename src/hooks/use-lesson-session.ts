'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, getEffectiveTopic, goalToScoringMode } from '@/stores/session-store';
import type { SessionSettings, ScoringMode } from '@/stores/session-store';
import type { Difficulty } from '@/stores/session-store';
import type { GrammarTarget } from '@/lib/grammar';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin, ActivityGeneratedContent, GameGeneratedContent } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import { missionSelectorFallback } from '@/lib/fallback-content';

// ─── Types ─────────────────────────────────────────────────────────────────

export type LessonPhase = 'idle' | 'lobby' | 'mission-select' | 'live' | 'landing' | 'ended';

export type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
};

const LANDING_ACTIVITY_KEYS = new Set(['final-answer', 'mic-drop', 'lightning-round', 'opinion-shift']);

// ─── sessionStorage reader ─────────────────────────────────────────────────

interface LessonPlanPayload {
  customTopic: string;
  slots: LessonSlot[];
  generatedContent: Record<string, ActivityGeneratedContent>;
  generatedGameContent: Record<string, GameGeneratedContent>;
  goal?: string;
  scoringMode?: ScoringMode;
  isMissionBased?: boolean;
  lessonDurationMinutes?: number;
  difficulty?: Difficulty;
  grammarTarget?: GrammarTarget | null;
  directLaunch?: boolean;
  sourceMaterial?: SourceMaterial;
}

function getLessonPlanContent(): LessonPlanPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('lessonPlanContent');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        customTopic: parsed.customTopic,
        slots: parsed.slots || [],
        generatedContent: parsed.generatedContent || {},
        generatedGameContent: parsed.generatedGameContent || {},
        goal: parsed.goal,
        scoringMode: parsed.scoringMode,
        isMissionBased: parsed.isMissionBased,
        lessonDurationMinutes: parsed.lessonDurationMinutes,
        difficulty: parsed.difficulty,
        grammarTarget: parsed.grammarTarget ?? null,
        directLaunch: parsed.directLaunch ?? false,
        sourceMaterial: parsed.sourceMaterial ?? undefined,
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
  handlePhaseChange: (phase: string) => void;
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

    prefetchingKeysRef.current.add(key);

    const effectiveTopic = getEffectiveTopic(settings);
    const missionContext = getMissionContext();
    const isLanding = LANDING_ACTIVITY_KEYS.has(key);
    const isGame = slot.type === 'game';

    const endpoint = isLanding ? '/api/landing/generate' : '/api/lesson-plan/generate';
    const sourceMaterial = lessonPlanContent?.sourceMaterial;
    const body = isLanding
      ? { activityKey: key, topic: effectiveTopic, difficulty: settings.difficulty }
      : isGame
        ? { customTopic: effectiveTopic, difficulty: settings.difficulty, games: [key], sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}) }
        : { customTopic: effectiveTopic, difficulty: settings.difficulty, activities: [key], studentCount, sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}) };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) return;
        if (isLanding && data.content) {
          prefetchedContentRef.current[key] = data.content;
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
  }, [lessonSlots, lessonPlanContent, settings, studentCount, sessionId, getMissionContext]);

  // ─── Content resolution: activity ──────────────────────────────────────
  const selectActivity = useCallback(async (activity: ActivityPlugin): Promise<ActivityGeneratedContent | null> => {
    // Prefetched content
    const prefetched = prefetchedContentRef.current[activity.key] as ActivityGeneratedContent | undefined;
    if (prefetched) return prefetched;

    // Pre-generated content from lesson planner
    // Exception: grammar-check-in content must match the current grammarTarget.
    // If the teacher changed the target in the lobby, skip stale pre-generated content
    // so it regenerates with the correct sentences.
    if (lessonPlanContent?.generatedContent[activity.key]) {
      const pregen = lessonPlanContent.generatedContent[activity.key] as ActivityGeneratedContent & { grammarTarget?: string };
      const currentTarget = settings.grammarTarget;
      if (activity.key !== 'grammar-check-in' || !currentTarget || pregen.grammarTarget === currentTarget) {
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
      const effectiveTopic = getEffectiveTopic(settings);
      const missionContext = getMissionContext();
      const endpoint = isLanding ? '/api/landing/generate' : '/api/lesson-plan/generate';
      const sourceMaterial = lessonPlanContent?.sourceMaterial;
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
          });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.status === 402) {
        setCreditsExhausted(true);
        // Return minimal fallback — don't block the session
        return { activityKey: activity.key, topicContext: getEffectiveTopic(settings) };
      }

      const data = await response.json();
      const resolvedContent = isLanding ? data.content : data.content?.[activity.key];
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
  }, [lessonPlanContent, phase, settings, studentCount, sessionId, getMissionContext]);

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
      setSettings({
        scoringMode: content.scoringMode ?? goalToScoringMode(content.goal),
        ...(content.difficulty ? { difficulty: content.difficulty } : {}),
      });
      if (content.isMissionBased) {
        setIsMissionBased(true);
      }

      if (content.slots && content.slots.length > 0) {
        setLessonSlots(content.slots);

        const hasPreGenerated = Object.keys(content.generatedContent).length > 0 ||
          Object.keys(content.generatedGameContent).length > 0;

        if (hasPreGenerated || content.directLaunch) {
          // Pre-generated content or direct Explore launch: skip lobby, go live immediately
          setPhase('live');
          pendingAutoStartRef.current = 0;
        } else {
          // Structure-only from planner: show lobby for students to join
          setPhase('lobby');
        }
      }
    }
  }, [setCustomTopic, setSettings]);

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
    handlePhaseChange,
    exitLesson,
  };
}
