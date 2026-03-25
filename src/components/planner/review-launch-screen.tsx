'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { GOAL_LABELS } from '@/lib/flight-plan-config';
import type { GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import { GRAMMAR_TARGET_GROUPS } from '@/lib/grammar';
import type { GrammarTarget } from '@/lib/grammar';
import { FlightPathSVG } from './flight-path-svg';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, Loader2, Plus, Rocket, Users } from 'lucide-react';

type TeacherClass = { id: string; name: string; studentCount: number };

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
  } = usePlannerStore();

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callsign = useMemo(
    () => `MISSION LC-${String(Math.floor(1000 + Math.random() * 9000))}`,
    [],
  );

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
      const mapped: TeacherClass[] = (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        studentCount: (c.students as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));

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

  async function handleCreateClass() {
    const trimmed = newClassName.trim();
    if (!trimmed) return;

    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({ name: trimmed, teacher_id: user.id })
      .select('id, name')
      .single();

    if (insertError || !data) {
      setCreating(false);
      return;
    }

    const newClass: TeacherClass = { id: data.id, name: data.name, studentCount: 0 };
    setClasses((prev) => [...prev, newClass].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedClassId(data.id);
    setNewClassName('');
    setShowCreateForm(false);
    setCreating(false);
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

  const checklist = [
    { label: 'Flight plan structured', done: modules.length > 0 },
    { label: 'Modules configured', done: modules.length > 0 },
    { label: 'Class selected', done: !!selectedClassId },
    { label: 'Content generates at runtime', done: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Callsign */}
      <div className="text-center">
        <p className="text-xs text-lc-text3 uppercase tracking-widest mb-1">Callsign</p>
        <h1 className="text-2xl font-bold text-lc-text tracking-wider">{callsign}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Summary + mini path */}
        <div className="space-y-4">
          <div className="bg-lc-card rounded-xl border border-lc-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider">
              Mission Summary
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
              <Row label="Modules" value={String(modules.length)} />
            </div>
          </div>

          {/* Mini flight path */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-4">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Flight Plan
            </h3>
            <FlightPathSVG compact />
          </div>
        </div>

        {/* Right column — Class selector + checklist */}
        <div className="space-y-4">
          {/* Class selector */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-5">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Select Class
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
                    {selectedClass.studentCount} student{selectedClass.studentCount !== 1 ? 's' : ''} in roster
                  </p>
                )}

                {/* Inline create form */}
                {showCreateForm && (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
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
                        onClick={() => { setShowCreateForm(false); setNewClassName(''); }}
                        className="text-xs text-lc-text3 hover:text-lc-text"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pre-flight checklist */}
          <div className="bg-lc-card rounded-xl border border-lc-border p-5">
            <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-3">
              Pre-Flight Checklist
            </h3>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${item.done ? 'text-lc-success' : 'text-lc-text3'}`}
                  />
                  <span
                    className={`text-sm ${item.done ? 'text-lc-text' : 'text-lc-text3'}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={!canLaunch}
            className="w-full flex items-center justify-center gap-2 py-4 bg-lc-success text-lc-bg rounded-xl font-bold text-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLaunching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5" />
            )}
            {isLaunching ? 'Launching...' : 'Launch Mission'}
          </button>
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
