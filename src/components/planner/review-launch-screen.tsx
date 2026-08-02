'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import type { GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import { GRAMMAR_TARGET_GROUPS } from '@/lib/grammar';
import type { GrammarTarget } from '@/lib/grammar';
import { FlightPathSVG } from './flight-path-svg';
import { createClient } from '@/lib/supabase/client';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Gauge, Loader2, MapPin, Plane, Plus, Rocket, Route, Users } from 'lucide-react';
import { TakeoffSpark } from '@/components/ui/takeoff-spark';
import { getDestinationById, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { distanceKm, formatDistance } from '@/lib/world-flight/geo';
import { resolveWorldFlightMovement } from '@/lib/world-flight/journey';
import { getPlaneAsset } from '@/lib/plane-progression';

type TeacherClass = {
  id: string;
  name: string;
  studentCount: number;
  currentDestinationId?: string | null;
  rangeKm?: number;
  planeKey?: string;
  planeSelectionRequired?: boolean;
};

export function ReviewLaunchScreen() {
  const {
    topic,
    difficulty,
    goals,
    lessonDurationMinutes,
    modules,
    selectedClassId,
    setSelectedClassId,
    setStep,
    launchLesson,
    setDifficulty,
    setGoals,
    setTopic,
    setDuration,
    grammarTarget,
    setGrammarTarget,
    sourceMaterial,
    setSourceMaterial,
    loadedPresetId,
    callsign: storedCallsign,
    ensureCallsign,
    worldFlightContext,
    worldFlightOriginId,
  } = usePlannerStore();

  const { loading: tierLoading, isPro, credits } = useTeacherTier();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createClassError, setCreateClassError] = useState<string | null>(null);

  // Stable flight number for this plan — shared with the lobby & arrival boards
  useEffect(() => { ensureCallsign(); }, [ensureCallsign]);
  const lessonId = storedCallsign ?? '';

  // Fetch teacher's classes on mount
  useEffect(() => {
    async function fetchClasses() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select('id, name, students(count)')
        .order('name');

      if (fetchError) {
        setLoadingClasses(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mapped: TeacherClass[] = (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        studentCount: (c.students as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));

      if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true' && mapped.length > 0) {
        const { data: states } = await supabase
          .from('class_world_flight_state')
          .select('class_id, current_destination_id, range_km, plane_key, plane_selection_required')
          .in('class_id', mapped.map((cls) => cls.id)) as {
            data: Array<{
              class_id: string;
              current_destination_id: string | null;
              range_km: number;
              plane_key: string;
              plane_selection_required: boolean;
            }> | null;
          };
        const statesByClass = new Map((states ?? []).map((state) => [state.class_id, state]));
        mapped = mapped.map((cls) => {
          const state = statesByClass.get(cls.id);
          return {
            ...cls,
            currentDestinationId: state?.current_destination_id ?? null,
            rangeKm: state?.range_km ?? STARTER_PLANE_RANGE_KM,
            planeKey: state?.plane_key ?? 'starter-biplane',
            planeSelectionRequired: state?.plane_selection_required ?? false,
          };
        });
      }

      setClasses(mapped);
      setLoadingClasses(false);

      // Auto-select if exactly 1 class
      if (mapped.length === 1) {
        setSelectedClassId(mapped[0].id);
      }
      // Pre-select persisted class if it still exists
      else if (selectedClassId && mapped.some((c) => c.id === selectedClassId)) {
        // Already set in store, no action needed
      }
      // If persisted class no longer exists, clear it
      else if (selectedClassId && !mapped.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(null);
      }
      // If no classes, show create form
      else if (mapped.length === 0) {
        setShowCreateForm(true);
      }
    }

    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const worldFlightDestination = worldFlightContext
    ? getDestinationById(worldFlightContext.destinationId)
    : null;
  const resolvedOriginId = selectedClass?.currentDestinationId ?? worldFlightOriginId;
  const worldFlightOrigin = resolvedOriginId ? getDestinationById(resolvedOriginId) : null;
  const worldFlightRangeKm = selectedClass?.rangeKm ?? STARTER_PLANE_RANGE_KM;
  const worldFlightDistanceKm = worldFlightDestination && worldFlightOrigin
    ? distanceKm(worldFlightOrigin, worldFlightDestination)
    : 0;
  const worldFlightMovement = worldFlightContext && worldFlightDestination
    ? resolveWorldFlightMovement({
        originDestinationId: worldFlightOrigin?.id ?? null,
        destinationId: worldFlightDestination.id,
        distanceKm: worldFlightDistanceKm,
        rangeKm: worldFlightRangeKm,
        requestedMove: worldFlightContext.requestedMove,
      })
    : null;
  const isLocalWorldFlightLesson = worldFlightOrigin?.id === worldFlightDestination?.id;
  const worldFlightPlaneName = getPlaneAsset(selectedClass?.planeKey).name;
  const worldFlightPlaneChoiceRequired = Boolean(worldFlightContext?.requestedMove && selectedClass?.planeSelectionRequired);

  async function handleCreateClass() {
    const trimmed = newClassName.trim();
    if (!trimmed) return;

    setCreating(true);
    setCreateClassError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      setCreateClassError("Couldn't create the class — check your connection and try again.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({ name: trimmed, teacher_id: user.id })
      .select('id, name')
      .single();

    if (insertError || !data) {
      setCreating(false);
      setCreateClassError("Couldn't create the class — check your connection and try again.");
      return;
    }

    const newClass: TeacherClass = {
      id: data.id,
      name: data.name,
      studentCount: 0,
      currentDestinationId: null,
      rangeKm: STARTER_PLANE_RANGE_KM,
      planeKey: 'starter-biplane',
      planeSelectionRequired: false,
    };
    setClasses((prev) => [...prev, newClass].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedClassId(data.id);
    setNewClassName('');
    setShowCreateForm(false);
    setCreating(false);
    setCreateClassError(null);
  }

  async function handleLaunch() {
    setIsLaunching(true);
    setError(null);
    try {
      await launchLesson();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to launch session');
      setIsLaunching(false);
    }
  }

  const canLaunch = modules.length > 0 && !!selectedClassId && !isLaunching;
  const launchBlockedByPlaneChoice = worldFlightPlaneChoiceRequired;
  const canLaunchFinal = canLaunch && !launchBlockedByPlaneChoice;

  const isAllAroundFlight = loadedPresetId === 'all-around-flight-60';
  const needsSourceWarning = isAllAroundFlight && !sourceMaterial;

  const checklist: Array<{ label: string; done: boolean; warn?: boolean }> = [
    { label: 'Flight Plan ready', done: modules.length > 0 },
    { label: 'Activities configured', done: modules.length > 0 },
    { label: 'Class selected', done: !!selectedClassId },
    { label: 'Content generates during the lesson', done: true },
    ...(isAllAroundFlight
      ? [{ label: 'Source material', done: !!sourceMaterial, warn: !sourceMaterial }]
      : []),
    ...(launchBlockedByPlaneChoice
      ? [{ label: 'Aircraft chosen in World Flight', done: false, warn: true }]
      : []),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Lesson ID */}
      <div className="text-center">
        <p className="text-xs text-lc-text3 uppercase tracking-widest mb-1">Lesson ID</p>
        <h1 className="text-2xl font-bold text-lc-text tracking-wider">{lessonId}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Summary + mini path */}
        <div className="space-y-4">
          <div className="bg-lc-card rounded-xl border border-lc-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider">
              Lesson Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-lc-text3">Topic</span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-lc-surface border border-lc-border rounded-md px-2 py-1 text-xs font-medium text-lc-text outline-none focus:ring-1 focus:ring-lc-blue/50 text-right w-48"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lc-text3">Duration</span>
                <div className="flex gap-1.5">
                  {([30, 45, 60, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        lessonDurationMinutes === d
                          ? 'bg-lc-blue text-white'
                          : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lc-text3">Goals</span>
                <select
                  value={goals[0] ?? ''}
                  onChange={(e) => setGoals([e.target.value as GoalTag])}
                  className="bg-lc-surface border border-lc-border rounded-md px-2 py-1 text-xs font-medium text-lc-text outline-none cursor-pointer"
                >
                  {(Object.entries(GOAL_LABELS) as [GoalTag, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lc-text3">Difficulty</span>
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d as Difficulty)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        difficulty === d
                          ? 'bg-lc-blue text-white'
                          : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lc-text3">Grammar Focus</span>
                <select
                  value={grammarTarget ?? ''}
                  onChange={(e) => setGrammarTarget(e.target.value ? e.target.value as GrammarTarget : null)}
                  className="bg-lc-surface border border-lc-border rounded-md px-2 py-1 text-xs font-medium text-lc-text outline-none cursor-pointer"
                >
                  <option value="">Any</option>
                  {Object.entries(GRAMMAR_TARGET_GROUPS).map(([group, targets]) => (
                    <optgroup key={group} label={group}>
                      {targets.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <Row label="Activities" value={String(modules.length)} />
            </div>
          </div>

          {/* Mini flight path */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-4">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Flight Plan
            </h3>
            <FlightPathSVG compact />
          </div>

          {/* Source warning for All-Around Flight */}
          {needsSourceWarning && (
            <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                No source added — the briefing will use a generated reader from your topic. Add a video or reading for a richer lesson.
              </p>
            </div>
          )}

          {/* Source material card */}
          {sourceMaterial && (
            <div className="bg-lc-card rounded-xl border border-lc-blue/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider flex items-center gap-2">
                  <span>🎬</span> Source Material
                </h3>
                <button
                  onClick={() => setSourceMaterial(null)}
                  className="text-xs text-lc-text3 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
              <p className="text-sm font-medium text-lc-text">{sourceMaterial.title}</p>
              {sourceMaterial.briefingOptions?.length ? (
                <p className="text-xs font-semibold text-cyan-300/75">
                  Adapted for {difficulty} · {sourceMaterial.wordCount ?? 0} words
                </p>
              ) : null}
              {sourceMaterial.duration && (
                <p className="text-xs text-lc-text3">
                  {Math.floor(sourceMaterial.duration / 60)}:{String(sourceMaterial.duration % 60).padStart(2, '0')} • {sourceMaterial.sourceType}
                </p>
              )}
              <p className="text-xs text-lc-text3 leading-relaxed line-clamp-3">
                {sourceMaterial.briefingText ?? sourceMaterial.rawText ?? sourceMaterial.summary}
              </p>
              {sourceMaterial.citations?.length ? (
                <div className="border-t border-lc-border pt-2">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                    Built from {sourceMaterial.citations.length} sources
                  </p>
                  <div className="space-y-1">
                    {sourceMaterial.citations.map((citation) => (
                      <a
                        key={citation.url}
                        href={citation.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-lc-blue hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                        {citation.publisher}: {citation.title}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right column — Class selector + checklist */}
        <div className="space-y-4">
          {/* Class selector */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-5">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Choose a class
            </h3>

            {loadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-lc-text3" />
              </div>
            ) : (
              <>
                {/* Pill row */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedClassId === c.id
                          ? 'bg-lc-blue text-white'
                          : 'bg-lc-surface text-lc-text2 hover:text-lc-text'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-lc-surface text-lc-text3 hover:text-lc-text transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>

                {/* Selected class info */}
                {selectedClass && (
                  <p className="text-xs text-lc-text3">
                    {selectedClass.studentCount} student{selectedClass.studentCount === 1 ? '' : 's'} in class
                  </p>
                )}

                {/* Inline create form */}
                {showCreateForm && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => { setNewClassName(e.target.value); setCreateClassError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
                        placeholder="Name your class"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-lc-surface border border-lc-border text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-lc-blue"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateClass}
                        disabled={!newClassName.trim() || creating}
                        className="px-3 py-1.5 rounded-lg bg-lc-blue text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Create
                      </button>
                      {classes.length > 0 && (
                        <button
                          onClick={() => { setShowCreateForm(false); setNewClassName(''); setCreateClassError(null); }}
                          className="text-xs text-lc-text3 hover:text-lc-text"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {createClassError && (
                      <p className="mt-2 text-xs text-red-400">{createClassError}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {worldFlightContext && worldFlightDestination && (
            <div className="overflow-hidden rounded-xl border border-cyan-300/25 bg-lc-card">
              <div className="flex items-center justify-between gap-3 border-b border-lc-border px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-lc-text2">
                  <Route className="h-4 w-4 text-cyan-300" aria-hidden />
                  World Flight Connection
                </h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  worldFlightPlaneChoiceRequired
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                    : worldFlightMovement?.movesClass
                    ? 'border-lc-success/30 bg-lc-success/10 text-lc-success'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                }`}>
                  {worldFlightPlaneChoiceRequired
                    ? 'Choose plane'
                    : worldFlightMovement?.movesClass ? 'Moves class' : isLocalWorldFlightLesson ? 'Local lesson' : 'Lesson only'}
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-lc-border">
                <div className="px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                    <MapPin className="h-3 w-3" aria-hidden />
                    From
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-lc-text">
                    {worldFlightOrigin?.city ?? 'First location'}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                    <Plane className="h-3 w-3 rotate-45" aria-hidden />
                    To
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-lc-text">{worldFlightDestination.city}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                    <Gauge className="h-3 w-3" aria-hidden />
                    Range
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-lc-text">{formatDistance(worldFlightRangeKm)}</p>
                </div>
              </div>

              <div className="border-t border-lc-border px-5 py-3">
                <p className="text-xs leading-relaxed text-lc-text2">
                  {worldFlightPlaneChoiceRequired
                    ? `Choose an aircraft in World Flight before ${selectedClass?.name ?? 'this class'} can move to ${worldFlightDestination.city}.`
                    : !worldFlightOrigin
                      ? `Completing the lesson establishes ${worldFlightDestination.city} as ${selectedClass?.name ?? 'this class'}'s first location.`
                    : isLocalWorldFlightLesson
                      ? `${selectedClass?.name ?? 'This class'} is already in ${worldFlightDestination.city}. This lesson adds evidence without moving the plane.`
                      : worldFlightMovement?.movesClass
                      ? `Completing the lesson moves ${selectedClass?.name ?? 'this class'} ${formatDistance(worldFlightDistanceKm)} from ${worldFlightOrigin.city} to ${worldFlightDestination.city}.`
                      : `${selectedClass?.name ?? 'This class'} can use this lesson, but completing it will not move the plane from ${worldFlightOrigin.city}.`}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
                  {worldFlightPlaneChoiceRequired
                    ? `${worldFlightPlaneName} · aircraft choice required before moving`
                    : `${worldFlightPlaneName} · Range checked again when you start`}
                </p>
              </div>
            </div>
          )}

          {/* Pre-flight checklist */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-5">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Pre-Flight Checklist
            </h3>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.16 }}
                >
                  {item.done ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.16 + 0.06, type: 'spring', stiffness: 420, damping: 15 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-lc-success" />
                    </motion.span>
                  ) : item.warn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-lc-text3" />
                  )}
                  <span
                    className={`text-sm ${item.done ? 'text-lc-text' : item.warn ? 'text-amber-300' : 'text-lc-text3'}`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Low-credit warning */}
          {!tierLoading && !isPro && credits === 2 && (
            <div className="px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              2 live lesson credits left. Pro removes the limit when you&apos;re ready.
            </div>
          )}
          {!tierLoading && !isPro && credits === 1 && (
            <div className="px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
              This is your last free live lesson credit. Upgrade after this lesson to keep teaching.
            </div>
          )}

          {/* Launch button — replaced with upgrade CTA when credits exhausted */}
          {!tierLoading && !isPro && credits === 0 ? (
            <div className="space-y-2">
              <a
                href="/pro"
                className="w-full flex items-center justify-center gap-2 py-4 bg-lc-blue/10 border border-lc-blue/30 text-lc-blue rounded-xl font-bold text-base hover:bg-lc-blue/20 transition-all"
              >
                Upgrade to Pro to launch more lessons →
              </a>
              <p className="text-xs text-center text-lc-text3">
                Or wait for your free monthly live lesson credit — you get 1 back each month.
              </p>
            </div>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={!canLaunchFinal}
              className="w-full flex items-center justify-center gap-2 py-4 bg-lc-success text-lc-bg rounded-xl font-bold text-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLaunching ? (
                <TakeoffSpark size={24} loading />
              ) : (
                <Rocket className="w-5 h-5" />
              )}
              {launchBlockedByPlaneChoice ? 'Choose an aircraft in World Flight first' : isLaunching ? 'Starting your live lesson...' : 'Start live lesson'}
            </button>
          )}
        </div>
      </div>

      {/* Back */}
      <div className="flex">
        <button
          onClick={() => setStep('flight-plan')}
          className="flex items-center gap-2 px-4 py-2.5 text-lc-text2 hover:text-lc-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Flight Plan
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-lc-text3">{label}</span>
      <span className="text-lc-text font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
