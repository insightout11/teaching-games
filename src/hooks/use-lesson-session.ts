'use client';

import { FLIGHT_BEFORE_KEY, saveSessionRecord } from '@/lib/flight-result';
import { anonymiseThread, planKeyOf, restorableThread, threadHasContent } from '@/lib/thread-backup';
import { filterTripSlots } from '@/lib/world-flight/trip-stops';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, getEffectiveTopic, goalToScoringMode } from '@/stores/session-store';
import type { SessionSettings, ScoringMode } from '@/stores/session-store';
import type { Difficulty } from '@/stores/session-store';
import { grammarFamily, type GrammarTarget } from '@/lib/grammar';
import { openHuntChannel } from '@/lib/live-room/hunt';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin, ActivityGeneratedContent, GameGeneratedContent, SourceVocabItem, LessonPlanGenerateResponse } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import {
  lessonPlanStorageKey,
  resolveLessonPlanPayload,
  type LessonSlot,
} from '@/lib/lesson-plan-payload';
import type { FlightPresetConfig } from '@/lib/flight-plan-presets';
import type { CourseLessonContext } from '@/lib/course-context';
import type { WorldFlightSessionContext } from '@/lib/world-flight/journey';
import { missionSelectorFallback } from '@/lib/fallback-content';
import { switchedSuitcase } from '@/activities/cabin-mystery/cases/switched-suitcase';
import {
  clearLessonRuntimeSnapshot,
  readLessonRuntimeSnapshot,
  writeLessonRuntimeSnapshot,
  type RecoverableLessonPhase,
} from '@/lib/lesson-runtime-state';

export type { LessonSlot } from '@/lib/lesson-plan-payload';

// ─── Types ─────────────────────────────────────────────────────────────────

export type LessonPhase = 'idle' | 'lobby' | 'mission-select' | 'live' | 'landing' | 'ended';

const LANDING_ACTIVITY_KEYS = new Set(['final-answer', 'mic-drop', 'lightning-round', 'opinion-shift']);

// Games that actually consume `config.preGeneratedContent`. Every other game
// fetches its own (now source-aware) content live via its own route and ignores
// the dispatcher's copy — so prefetching it is a wasted AI generation. Keep this
// in sync with games that read preGeneratedContent in their component.
const GAMES_WITH_PREFETCHED_CONTENT = new Set(['vocab-sprint', 'story-sprint']);
// Activities that seed their own content from the session store (no AI generation / prefetch).
const SELF_SEEDED_ACTIVITIES = new Set(['trip-recap', 'speak-reveal']);

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
  courseContext?: CourseLessonContext;
  /** Per-stage sources for curated arcs (Travel trip), keyed by activity key. */
  stageSources?: Record<string, SourceMaterial>;
  worldFlightContext?: WorldFlightSessionContext;
  /** World Flight route — the two cities this lesson flies between. */
  originId?: string;
  destinationId?: string;
}

export function getLessonPlanContent(
  sessionId: string,
  persistedContent?: LessonPlanPayload | null,
): LessonPlanPayload | null {
  if (typeof window === 'undefined') return resolveLessonPlanPayload(persistedContent);
  return resolveLessonPlanPayload(
    persistedContent,
    sessionStorage.getItem(lessonPlanStorageKey(sessionId)),
    sessionStorage.getItem('lessonPlanContent'),
  );
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
  /** Live Room (plan-free only): prepare an activity for a source ahead of launch. */
  prefetchForRoom: (activity: ActivityPlugin, source: SourceMaterial) => void;
  selectGame: (game: GamePlugin) => GameGeneratedContent | null;

  // Actions
  beginLesson: () => void;
  advanceSlot: () => void;
  /** Bail out of the current activity and immediately start a different one. */
  insertAndPivotSlot: (key: string, type: 'game' | 'activity', name: string) => void;
  /** Live Room: fly a plan in this running session right away (students are already on board). */
  loadPlan: (content: LessonPlanPayload) => void;
  /** Turbulence: put a short break (a micro-event) next; the caller then advances into it. */
  insertTurbulence: () => void;
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
  persistedContent?: LessonPlanPayload | null,
): LessonSession {
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const setSettings = useSessionStore((s) => s.setSettings);
  const setGrammarTarget = useSessionStore((s) => s.setGrammarTarget);
  const setSourceMaterial = useSessionStore((s) => s.setSourceMaterial);
  const setFlightPresetId = useSessionStore((s) => s.setFlightPresetId);

  // ─── Core state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<LessonPhase>('idle');
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [isMissionBased, setIsMissionBased] = useState(false);
  const [missionSelectorReady, setMissionSelectorReady] = useState(false);
  const [missionSelectorGenerating, setMissionSelectorGenerating] = useState(false);
  const [generatingModuleName, setGeneratingModuleName] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [lessonPlanContent, setLessonPlanContent] = useState<LessonPlanPayload | null>(
    () => resolveLessonPlanPayload(persistedContent),
  );
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

  // ─── Lesson Kit ─────────────────────────────────────────────────────────
  // What later stages should build on: the key phrases (sourceVocabRef, above) and the scene
  // once Scene Igniter has played, so Conversation Rounds can continue it.
  const sceneKitRef = useRef<{ title: string; context: string; characters?: string[]; keyLines?: string[] } | null>(null);
  const setLessonKitInStore = useSessionStore((s) => s.setLessonKit);
  const publishKit = useCallback(() => {
    if (lessonSlots.length <= 1) return; // flight plans only
    const phrases = sourceVocabRef.current.map((v) => v.term).filter(Boolean).slice(0, 8);
    const scene = sceneKitRef.current ? { title: sceneKitRef.current.title, context: sceneKitRef.current.context, ...(sceneKitRef.current.characters ? { characters: sceneKitRef.current.characters } : {}) } : undefined;
    const grammarTarget = useSessionStore.getState().settings.grammarTarget ?? undefined;
    const struggles = (useSessionStore.getState().lessonThread.struggles ?? []).slice(-4).map((x) => ({ text: x.text, ...(x.fix ? { fix: x.fix } : {}) }));
    const flightQuestion = useSessionStore.getState().lessonThread.flightQuestion?.question;
    setLessonKitInStore(phrases.length || scene || grammarTarget || struggles.length || flightQuestion ? { ...(phrases.length ? { phrases } : {}), ...(scene ? { scene } : {}), ...(grammarTarget ? { grammarTarget } : {}), ...(struggles.length ? { struggles } : {}), ...(flightQuestion ? { flightQuestion } : {}) } : null);
  }, [lessonSlots.length, setLessonKitInStore]);
  const publishKitRef = useRef(publishKit);
  publishKitRef.current = publishKit;
  // Grammar flight: the Produce stage plays the speaking game for the target's FAMILY
  // (tenses → Tense Time Machine, comparisons → Compare It, questions → Answer First;
  // families without a game yet keep Grammar Boss). Only stages not yet played change.
  useEffect(() => {
    if (lessonPlanContent?.flightPresetId !== 'grammar-60') return;
    const family = grammarFamily(settings.grammarTarget);
    const key = family === 'tenses' ? 'tense-time-machine' : family === 'comparisons' ? 'compare-it' : family === 'questions' ? 'answer-first' : 'grammar-boss';
    setLessonSlots((prev) => {
      const i = prev.findIndex((sl) => sl.stageId === 'produce');
      if (i < 0 || i <= currentSlotIndexRef.current || prev[i].key === key) return prev;
      const names: Record<string, string> = { 'tense-time-machine': 'Tense Time Machine', 'compare-it': 'Compare It', 'answer-first': 'Answer First', 'grammar-boss': 'Grammar Boss' };
      const next = [...prev];
      next[i] = { ...next[i], key, type: key === 'grammar-boss' ? 'game' : 'activity', name: names[key] };
      return next;
    });
  }, [settings.grammarTarget, lessonPlanContent?.flightPresetId]);

  // Phones learn the grammar target from the session row (reference card, Grammar Hunt), but
  // targets set by a flight plan or the Check-in only lived in this store. Save them.
  const savedTargetRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const target = settings.grammarTarget ?? null;
    if (!sessionId || savedTargetRef.current === target) return;
    if (savedTargetRef.current === undefined && target === null) { savedTargetRef.current = null; return; }
    savedTargetRef.current = target;
    void fetch('/api/session/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, grammarTarget: target }) }).catch(() => {});
  }, [sessionId, settings.grammarTarget]);

  // Back up the lesson thread (the takeoff "before" above all) so a refresh can't break the landing
  // reveal; restore it once if this plan's thread came back empty. Names stripped, plan-scoped.
  const lessonThreadNow = useSessionStore((s) => s.lessonThread);
  const restoreLessonThread = useSessionStore((s) => s.restoreLessonThread);
  const planKey = planKeyOf(lessonPlanContent);
  const restoredRef = useRef('');
  useEffect(() => {
    if (!sessionId || !planKey || restoredRef.current === planKey) return;
    restoredRef.current = planKey;
    if (threadHasContent(useSessionStore.getState().lessonThread)) return;
    void fetch(`/api/session/flight-result?sessionId=${encodeURIComponent(sessionId)}&key=${FLIGHT_BEFORE_KEY}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { payload?: unknown } | null) => {
        const thread = restorableThread(d?.payload, planKey);
        if (thread && !threadHasContent(useSessionStore.getState().lessonThread)) restoreLessonThread(thread);
      })
      .catch(() => {});
  }, [sessionId, planKey, restoreLessonThread]);
  useEffect(() => {
    if (!sessionId || !planKey || !threadHasContent(lessonThreadNow)) return;
    const id = window.setTimeout(() => {
      saveSessionRecord(sessionId, FLIGHT_BEFORE_KEY, { planKey, thread: anonymiseThread(lessonThreadNow) });
    }, 3000);
    return () => window.clearTimeout(id);
  }, [sessionId, planKey, lessonThreadNow]);

  // Grammar Hunt: tally every phone's stamps into the lesson thread.
  const recordHuntStamps = useSessionStore((s) => s.recordHuntStamps);
  useEffect(() => {
    if (!sessionId) return;
    const ch = openHuntChannel(sessionId, (m) => { if (m.type === 'stamps') recordHuntStamps(m.clientId, m.name, m.count); });
    return () => ch.close();
  }, [sessionId, recordHuntStamps]);

  // Captain's Flight: the Big Discussion plays the format that fits the Flight Question
  // (opinion → Hot Take Arena, problem → Decision Council, personal → Conversation Rounds).
  const flightQ = useSessionStore((s) => s.lessonThread.flightQuestion);
  useEffect(() => {
    if (!flightQ) return;
    publishKit();
    if (lessonPlanContent?.flightPresetId !== 'all-around-flight-60') return;
    const key = flightQ.type === 'problem' ? 'decision-council' : flightQ.type === 'personal' ? 'conversation-rounds' : 'hot-take-arena';
    const names: Record<string, string> = { 'hot-take-arena': 'Hot Take Arena', 'decision-council': 'Decision Council', 'conversation-rounds': 'Conversation Rounds' };
    setLessonSlots((prev) => {
      const i = prev.findIndex((sl) => sl.stageId === 'production');
      if (i < 0 || i <= currentSlotIndexRef.current || prev[i].key === key) return prev;
      const next = [...prev];
      next[i] = { ...next[i], key, type: 'activity', name: names[key] };
      return next;
    });
  }, [flightQ, lessonPlanContent?.flightPresetId, publishKit]);

  // Travel: Plan the Day keeps the stops the class voted for; drop the others not yet played.
  const tripStops = useSessionStore((s) => s.lessonThread.tripStops);
  useEffect(() => {
    if (!tripStops || lessonPlanContent?.flightPresetId !== 'travel-60') return;
    setLessonSlots((prev) => {
      const next = filterTripSlots(prev, tripStops, currentSlotIndexRef.current);
      return next.length === prev.length ? prev : next;
    });
  }, [tripStops, lessonPlanContent?.flightPresetId]);

  // Struggles arrive mid-lesson (Fix the Captain, speaking games): re-publish so review stages get them.
  const struggleCount = useSessionStore((s) => s.lessonThread.struggles?.length ?? 0);
  useEffect(() => { if (struggleCount) publishKit(); }, [publishKit, struggleCount]);
  // The grammar target is confirmed mid-lesson (Check-in), so re-publish when it changes.
  useEffect(() => { publishKit(); }, [publishKit, settings.grammarTarget]);
  const captureKit = useCallback((key: string, content: unknown) => {
    if (key !== 'scene-igniter' || !content) return;
    const scene = (content as { scenes?: Array<{ title?: string; context?: string; cast?: Array<{ name?: string; role?: string }>; lines?: Array<{ text?: string }> }> }).scenes?.[0];
    if (!scene?.title || !scene.context) return;
    const characters = (scene.cast ?? []).map((c) => (c?.name ? `${c.name}${c.role ? ` (${c.role})` : ''}` : '')).filter(Boolean);
    const keyLines = (scene.lines ?? []).map((l) => l.text ?? '').filter(Boolean).slice(0, 4);
    sceneKitRef.current = { title: scene.title, context: scene.context, ...(characters.length ? { characters } : {}), ...(keyLines.length ? { keyLines } : {}) };
    publishKitRef.current();
  }, []);

  const captureSourceVocab = useCallback((data: Pick<LessonPlanGenerateResponse, 'sourceVocab'>) => {
    if (data.sourceVocab?.length && sourceVocabRef.current.length === 0) {
      sourceVocabRef.current = data.sourceVocab;
      publishKitRef.current();
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

    // Self-seeded activities (content comes from the session store, not AI) — skip prefetch.
    if (SELF_SEEDED_ACTIVITIES.has(key)) return;

    const needsSourceVocab = lessonSlots.length > 1; // Lesson Kit: every stage of a flight plan shares the key phrases

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
    const courseContextPayload = lessonPlanContent?.courseContext ? { courseContext: lessonPlanContent.courseContext } : {};
    const kitStruggles = useSessionStore.getState().lessonKit?.struggles;
    const kitFlightQuestion = useSessionStore.getState().lessonKit?.flightQuestion;
    const kitPayload = {
      ...(kitFlightQuestion ? { flightQuestion: kitFlightQuestion } : {}),
      ...(sceneKitRef.current ? { sceneContext: sceneKitRef.current } : {}),
      ...(kitStruggles?.length ? { struggles: kitStruggles } : {}),
      ...(settings.grammarTarget ? { grammarTarget: settings.grammarTarget } : {}),
    };
    const body = isLanding
      ? { activityKey: key, topic: effectiveTopic, difficulty: settings.difficulty, ...(sourceMaterial ? { sourceKey: sourceMaterial.sourceKey ?? sourceMaterial.title } : {}), ...(missionContext.length > 0 ? { missionContext } : {}) }
      : isGame
        ? { customTopic: effectiveTopic, difficulty: settings.difficulty, games: [key], sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}), ...courseContextPayload, ...kitPayload, ...(needsSourceVocab ? { needsSourceVocab: true, ...sourceVocabPayload } : {}) }
        : { customTopic: effectiveTopic, difficulty: settings.difficulty, activities: [key], studentCount, sessionId, ...(missionContext.length > 0 ? { missionContext } : {}), ...(sourceMaterial ? { sourceMaterial } : {}), ...courseContextPayload, ...kitPayload, ...(needsSourceVocab ? { needsSourceVocab: true, ...sourceVocabPayload } : {}) };

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
          captureKit(key, data.content[key]);
        }
      })
      .catch((err) => {
        console.error(`Failed to prefetch ${key}:`, err);
      })
      .finally(() => {
        prefetchingKeysRef.current.delete(key);
      });
  }, [lessonSlots, lessonPlanContent, settings, studentCount, sessionId, getMissionContext, captureSourceVocab, captureKit]);

  // ─── Content resolution: activity ──────────────────────────────────────
  // Live Room background preparation, keyed by activity and tagged with the
  // source it was generated for (only reused while that source is in focus).
  const roomPrefetchRef = useRef<Record<string, { sourceKey: string; promise: Promise<ActivityGeneratedContent | null> }>>({});
  const prefetchForRoom = useCallback((activity: ActivityPlugin, source: SourceMaterial) => {
    if (lessonPlanContent || LANDING_ACTIVITY_KEYS.has(activity.key) || SELF_SEEDED_ACTIVITIES.has(activity.key) || activity.key === 'cabin-mystery') return;
    const sourceKey = source.sourceKey ?? source.title;
    if (roomPrefetchRef.current[activity.key]?.sourceKey === sourceKey) return;
    const promise = fetch('/api/lesson-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customTopic: source.title.slice(0, 120),
        difficulty: settings.difficulty,
        activities: [activity.key],
        studentCount,
        sessionId,
        ...(settings.grammarTarget ? { grammarTarget: settings.grammarTarget } : {}),
        sourceMaterial: source,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LessonPlanGenerateResponse | null) => (data && data.success !== false ? data.content?.[activity.key] ?? null : null))
      .catch(() => null);
    roomPrefetchRef.current[activity.key] = { sourceKey, promise };
  }, [lessonPlanContent, settings.difficulty, settings.grammarTarget, studentCount, sessionId]);

  const selectActivityInner = useCallback(async (activity: ActivityPlugin): Promise<ActivityGeneratedContent | null> => {
    if (activity.key === 'cabin-mystery') {
      return { ...switchedSuitcase, topicContext: lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings) };
    }
    // Picture Quiz runs from the Junior picture-question bank — no AI generation.
    if (activity.key === 'picture-quiz' || activity.key === 'picture-stories') {
      return { activityKey: activity.key, topicContext: lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings) };
    }
    // Trip Recap seeds itself from the session trip log — no AI generation.
    if (activity.key === 'trip-recap') {
      return { activityKey: 'trip-recap', topicContext: lessonPlanContent?.customTopic?.trim() || getEffectiveTopic(settings) };
    }

    // Prefetched content
    const prefetched = prefetchedContentRef.current[activity.key] as ActivityGeneratedContent | undefined;
    if (prefetched) return prefetched;

    // Live Room: content prepared for the source that is still in focus.
    if (!lessonPlanContent) {
      const prepared = roomPrefetchRef.current[activity.key];
      const current = useSessionStore.getState().sourceMaterial;
      if (prepared && current && prepared.sourceKey === (current.sourceKey ?? current.title)) {
        const content = await prepared.promise;
        if (content) return content;
      }
    }

    // Pre-generated content from lesson planner
    // Exception: grammar target-dependent activities (check-in, clarify, proof) are
    // pre-generated before the teacher picks the target in the check-in, so if the
    // confirmed target differs, skip the stale pre-gen and regenerate with the real target.
    if (lessonPlanContent?.generatedContent[activity.key]) {
      const pregen = lessonPlanContent.generatedContent[activity.key] as ActivityGeneratedContent & { grammarTarget?: string };
      const currentTarget = settings.grammarTarget;
      const targetDependent = activity.key === 'grammar-check-in' || activity.key === 'grammar-clarify' || activity.key === 'grammar-proof' || activity.key === 'fix-the-captain' || activity.key === 'grammar-spotlight';
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
      // Plan-free Live Room sessions carry their source (a shown article/image) in the
      // session store — the same place self-generating games already read it from.
      const sourceMaterial = lessonPlanContent
        ? lessonPlanContent.stageSources?.[activity.key] ?? lessonPlanContent.sourceMaterial
        : useSessionStore.getState().sourceMaterial ?? undefined;
      const needsSourceVocab = lessonSlots.length > 1; // Lesson Kit: every stage of a flight plan shares the key phrases
      const sourceVocabPayload = sourceVocabRef.current.length > 0 ? { sourceVocab: sourceVocabRef.current } : {};
      const courseContextPayload = lessonPlanContent?.courseContext ? { courseContext: lessonPlanContent.courseContext } : {};
      const body = isLanding
        ? JSON.stringify({ activityKey: activity.key, topic: effectiveTopic, difficulty: settings.difficulty, ...(sourceMaterial ? { sourceKey: sourceMaterial.sourceKey ?? sourceMaterial.title } : {}), ...(missionContext.length > 0 ? { missionContext } : {}) })
        : JSON.stringify({
            customTopic: effectiveTopic,
            difficulty: settings.difficulty,
            activities: [activity.key],
            studentCount,
            sessionId,
            ...(missionContext.length > 0 ? { missionContext } : {}),
            ...(settings.grammarTarget ? { grammarTarget: settings.grammarTarget } : {}),
            ...(sourceMaterial ? { sourceMaterial } : {}),
            ...(sceneKitRef.current ? { sceneContext: sceneKitRef.current } : {}),
            ...(useSessionStore.getState().lessonKit?.struggles?.length ? { struggles: useSessionStore.getState().lessonKit!.struggles } : {}),
            ...courseContextPayload,
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

  const selectActivity = useCallback(async (activity: ActivityPlugin): Promise<ActivityGeneratedContent | null> => {
    const resolved = await selectActivityInner(activity);
    captureKit(activity.key, resolved);
    return resolved;
  }, [selectActivityInner, captureKit]);

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
    const content = getLessonPlanContent(sessionId, persistedContent);
    if (content) {
      setLessonPlanContent(content);
      setCustomTopic(content.customTopic);
      setSourceMaterial(content.sourceMaterial ?? null);
      // Scopes the flight log (lesson memory) to Captain's Flight.
      setFlightPresetId(content.flightPresetId ?? null);
      setSettings({
        scoringMode: content.scoringMode ?? goalToScoringMode(content.goal),
        ...(content.difficulty ? { difficulty: content.difficulty } : {}),
      });
      if (content.isMissionBased) {
        setIsMissionBased(true);
      }

      if (content.slots && content.slots.length > 0) {
        const recovered = readLessonRuntimeSnapshot(sessionId, content.slots);
        const slots = recovered?.lessonSlots ?? content.slots;
        setLessonSlots(slots);

        if (recovered) {
          setCurrentSlotIndex(recovered.currentSlotIndex);
          setPhase(recovered.phase);
          pendingAutoStartRef.current = recovered.currentSlotIndex;
          setSlotTrigger((count) => count + 1);
        } else if (content.directLaunch) {
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
  }, [sessionId, persistedContent, setCustomTopic, setSettings, setSourceMaterial, setFlightPresetId]);

  useEffect(() => {
    if (!['mission-select', 'live', 'landing'].includes(phase) || lessonSlots.length === 0) return;
    writeLessonRuntimeSnapshot(sessionId, {
      version: 1,
      phase: phase as RecoverableLessonPhase,
      currentSlotIndex,
      lessonSlots,
      updatedAt: Date.now(),
    });
  }, [sessionId, phase, currentSlotIndex, lessonSlots]);

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

  const loadPlan = useCallback((content: LessonPlanPayload) => {
    if (!content.slots?.length) return;
    // Same as the mount loader, but starts at once: the class is already in the room.
    prefetchedContentRef.current = {};
    sourceVocabRef.current = [];
    sceneKitRef.current = null;
    setLessonPlanContent(content);
    setCustomTopic(content.customTopic);
    setSourceMaterial(content.sourceMaterial ?? null);
    setFlightPresetId(content.flightPresetId ?? null);
    setSettings({ scoringMode: content.scoringMode ?? goalToScoringMode(content.goal), ...(content.difficulty ? { difficulty: content.difficulty } : {}) });
    if (content.grammarTarget) setGrammarTarget(content.grammarTarget as GrammarTarget);
    setLessonSlots(content.slots);
    setCurrentSlotIndex(0);
    setPhase(LANDING_ACTIVITY_KEYS.has(content.slots[0].key) ? 'landing' : 'live');
    pendingAutoStartRef.current = 0;
    setSlotTrigger((c) => c + 1);
  }, [setCustomTopic, setSourceMaterial, setFlightPresetId, setSettings, setGrammarTarget]);

  const insertTurbulence = useCallback(() => {
    // Alternate the break so repeated turbulence doesn't feel the same.
    const turbulenceCount = lessonSlots.filter((sl) => sl.stageId === 'turbulence').length;
    const key = turbulenceCount % 2 === 0 ? 'static' : 'would-you-rather';
    const newSlot: LessonSlot = { key, type: 'activity', name: key === 'static' ? 'Static' : 'Would You Rather', isMicroEvent: true, stageId: 'turbulence', stageLabel: 'Turbulence' };
    setLessonSlots((prev) => {
      if (prev[currentSlotIndex + 1]?.stageId === 'turbulence') return prev;
      const next = [...prev];
      next.splice(currentSlotIndex + 1, 0, newSlot);
      return next;
    });
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
        const storageKey = lessonPlanStorageKey(sessionId);
        const stored = sessionStorage.getItem(storageKey) ?? sessionStorage.getItem('lessonPlanContent');
        const parsed = stored ? JSON.parse(stored) : {};
        sessionStorage.setItem(
          storageKey,
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
  }, [sessionId]);

  const exitLesson = useCallback(() => {
    clearLessonRuntimeSnapshot(sessionId);
    setPhase('idle');
  }, [sessionId]);

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
    prefetchForRoom,
    selectGame,

    beginLesson,
    advanceSlot,
    insertAndPivotSlot,
    insertTurbulence,
    loadPlan,
    replaceNextSlot,
    resolveCurrentSlot,
    goToSlot,
    handlePhaseChange,
    setWorldFlightPlaneKey,
    exitLesson,
  };
}
