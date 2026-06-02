'use client';

// Library-style detail drawer for a single activity/game on Teacher Home.
// OVERVIEW-FIRST: opens as a preview (what it is / what students do / quick facts) with
// sticky actions. Setup (topic/difficulty/class) only appears after "Run now". This keeps
// the correct, explicit split so an activity is never silently turned into a lesson:
//   • Run now            → one-slot session (no takeoff/landing wrapper), like Browse
//   • Add to lesson plan → seedWithModule() (the only path that builds a lesson)
// Launch flow mirrors ExploreClient so behavior stays consistent across the app.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, Plus, ListPlus, ChevronLeft, Plane } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { TOPICS, DIFFICULTIES } from '@/stores/session-store';
import type { Topic, Difficulty } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';
import { SourceInputPanel } from '@/components/planner/source-input-panel';
import {
  type DiscoveryItem,
  getTypeLabel,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
  getCardTone,
  TONE_STYLES,
} from '@/lib/discovery-shelves';

interface ClassRow {
  id: string;
  name: string;
}

const LAST_CLASS_KEY = 'lc-last-class';

function readLastClass(): ClassRow | null {
  try {
    const raw = localStorage.getItem(LAST_CLASS_KEY);
    return raw ? (JSON.parse(raw) as ClassRow) : null;
  } catch {
    return null;
  }
}

export function DiscoveryDetailDrawer({ item, onClose }: { item: DiscoveryItem | null; onClose: () => void }) {
  const router = useRouter();
  const seedWithModule = usePlannerStore((s) => s.seedWithModule);
  const sourceAttached = usePlannerStore((s) => s.sourceMaterial);
  const { loading: tierLoading, isPro, credits } = useTeacherTier();

  // 'video' | 'text' when the activity needs a source; undefined when it doesn't.
  const requiresSource = item?.meta?.requiresSource;

  const [view, setView] = useState<'overview' | 'setup'>('overview');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [topic, setTopic] = useState<Topic | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [customTopic, setCustomTopic] = useState('');
  const [launching, setLaunching] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Reset to overview + load classes whenever the drawer opens for an item.
  useEffect(() => {
    if (!item) return;
    setView('overview');
    setLaunching(false);
    setShowCreateClass(false);
    setClassesLoading(true);
    const supabase = createClient();
    supabase
      .from('classes')
      .select('id, name')
      .order('created_at', { ascending: false })
      .then(({ data }: { data: ClassRow[] | null }) => {
        setClasses(data ?? []);
        setClassesLoading(false);
      });
  }, [item]);

  // Default the class picker to the last-used class (if still present), else the newest.
  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId('');
      return;
    }
    setSelectedClassId((prev) => {
      if (prev && classes.some((c) => c.id === prev)) return prev;
      const last = readLastClass();
      return last && classes.some((c) => c.id === last.id) ? last.id : classes[0].id;
    });
  }, [classes]);

  function closeAll() {
    setShowCreateClass(false);
    setNewClassName('');
    setLaunching(false);
    setView('overview');
    onClose();
  }

  async function runWithClass(classId: string) {
    if (!item || !classId) return;
    if (!tierLoading && !isPro && credits === 0) {
      setShowPaywall(true);
      return;
    }
    setLaunching(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      if (res.status === 402) {
        setLaunching(false);
        setShowPaywall(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to create session');
      const { sessionId } = await res.json();
      // Remember last-used class for one-tap launching next time.
      try {
        const name = classes.find((c) => c.id === classId)?.name ?? '';
        localStorage.setItem(LAST_CLASS_KEY, JSON.stringify({ id: classId, name }));
      } catch {
        /* ignore */
      }
      // One slot only — NO takeoff/landing wrapper. This is an activity, not a lesson.
      // Carry the attached source through so source-grounded activities can generate.
      const source = usePlannerStore.getState().sourceMaterial;
      sessionStorage.setItem(
        'lessonPlanContent',
        JSON.stringify({
          customTopic: customTopic.trim() || topic || 'General',
          difficulty,
          slots: [{ type: item.type, key: item.key, name: item.name }],
          generatedContent: {},
          generatedGameContent: {},
          ...(source ? { sourceMaterial: source } : {}),
        }),
      );
      window.location.href = `/sessions/${sessionId}`;
    } catch {
      setLaunching(false);
    }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCreatingClass(false);
      return;
    }
    const { data: newClass } = await supabase
      .from('classes')
      .insert({ name: newClassName.trim(), teacher_id: user.id })
      .select('id, name')
      .single();
    if (newClass) {
      setClasses([newClass, ...classes]);
      setNewClassName('');
      setShowCreateClass(false);
      runWithClass(newClass.id);
    }
    setCreatingClass(false);
  }

  function addToPlan() {
    if (!item) return;
    seedWithModule(item.key, item.meta?.slotFit?.[0] ?? 'practice');
    router.push('/lesson-planner');
  }

  const glyphs = item ? getInteractionGlyphs(item) : [];
  const selectedName = classes.find((c) => c.id === selectedClassId)?.name ?? '';

  return (
    <>
      <Modal open={!!item && !showPaywall} onClose={closeAll} title={item?.name}>
        {item && (
          <div className="space-y-5">
            {/* Inspection-card header: icon stamp + type · use case */}
            {(() => {
              const tone = TONE_STYLES[getCardTone(item)];
              const Icon = item.icon;
              return (
                <div className="-mt-2 flex items-center gap-3">
                  <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', tone.iconBg)}>
                    <Icon className={cn('h-6 w-6', tone.iconText)} />
                  </span>
                  <p className="font-instrument min-w-0 flex-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">
                    {getTypeLabel(item)} · {item.useCase}
                  </p>
                  {item.isPro && (
                    <span className="font-instrument shrink-0 rounded-full border border-lc-amber/40 bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lc-amber">
                      Pro
                    </span>
                  )}
                </div>
              );
            })()}

            {view === 'overview' ? (
              <>
                <p className="text-sm leading-relaxed text-lc-text2">{item.description}</p>

                {glyphs.length > 0 && (
                  <div>
                    <p className="font-instrument mb-2 text-[10px] uppercase tracking-wider text-lc-text3">
                      What students do
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {glyphs.map(({ icon: Glyph, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-lc-border bg-lc-surface px-2.5 py-1.5 text-xs text-lc-text2"
                        >
                          <Glyph className="h-4 w-4" aria-hidden />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick facts */}
                <div className="flex flex-wrap gap-2">
                  <Fact icon={<Clock className="h-3.5 w-3.5" />}>{item.estimatedMinutes} min</Fact>
                  <Fact icon={<Users className="h-3.5 w-3.5" />}>{getClassSizeChip(item)}</Fact>
                  <Fact>{getSourceChip(item)}</Fact>
                </div>

                {/* Sticky actions */}
                <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-3 border-t border-lc-border bg-lc-card/95 px-6 py-4 backdrop-blur">
                  <button
                    onClick={() => setView('setup')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lc-amber px-4 py-2.5 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90"
                  >
                    <Plane className="h-4 w-4" aria-hidden />
                    Run now
                  </button>
                  <button
                    onClick={addToPlan}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-lc-border bg-lc-surface px-4 py-2.5 text-sm font-medium text-lc-text2 transition-colors hover:border-lc-amber/50 hover:text-lc-text"
                  >
                    <ListPlus className="h-4 w-4" aria-hidden />
                    Add to plan
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setView('overview')}
                  className="-mt-1 inline-flex items-center gap-1 text-xs text-lc-text3 transition-colors hover:text-lc-text"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  Back to overview
                </button>

                {/* Source step — required for source-grounded activities */}
                {requiresSource && (
                  <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.04] p-3">
                    <p className="font-instrument mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/85">
                      Add a {requiresSource === 'video' ? 'video' : 'reading'}
                      <span className="rounded bg-cyan-300/15 px-1.5 py-0.5 text-[9px] tracking-normal text-cyan-100">Required</span>
                    </p>
                    <SourceInputPanel />
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-lc-text3">Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value as Topic | '')}
                      className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text"
                    >
                      <option value="">General</option>
                      {TOPICS.filter((t) => t !== 'General').map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-lc-text3">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={`Or type a custom topic${topic ? ` (overrides ${topic})` : ''}…`}
                  className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3"
                />

                {!tierLoading && !isPro && credits === 1 && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-400">
                    This is your last free Test Flight.
                  </div>
                )}

                {classesLoading ? (
                  <p className="text-sm text-lc-text3">Loading classes…</p>
                ) : classes.length === 0 ? (
                  showCreateClass ? (
                    <form onSubmit={handleCreateClass} className="flex gap-2">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Class name"
                        autoFocus
                        className="flex-1 rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3"
                      />
                      <button type="submit" disabled={creatingClass || !newClassName.trim()} className="rounded-lg bg-lc-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                        {creatingClass ? '…' : 'Create & run'}
                      </button>
                    </form>
                  ) : (
                    <button onClick={() => setShowCreateClass(true)} className="inline-flex items-center gap-1 text-sm font-medium text-lc-blue hover:underline">
                      <Plus className="h-4 w-4" /> Create a class to launch with
                    </button>
                  )
                ) : (
                  <div>
                    <label className="mb-1 block text-xs text-lc-text3">Class</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCreateClass(true)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-lc-text3 hover:text-lc-blue"
                    >
                      <Plus className="h-3.5 w-3.5" /> New class
                    </button>
                    {showCreateClass && (
                      <form onSubmit={handleCreateClass} className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Class name"
                          autoFocus
                          className="flex-1 rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3"
                        />
                        <button type="submit" disabled={creatingClass || !newClassName.trim()} className="rounded-lg bg-lc-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                          {creatingClass ? '…' : 'Create & run'}
                        </button>
                      </form>
                    )}

                    {/* Sticky one-tap launch for the selected (defaults to last-used) class */}
                    <div className="sticky bottom-0 -mx-6 -mb-6 mt-5 border-t border-lc-border bg-lc-card/95 px-6 py-4 backdrop-blur">
                      <button
                        onClick={() => runWithClass(selectedClassId)}
                        disabled={launching || !selectedClassId || (!!requiresSource && !sourceAttached)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-lc-amber px-4 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90 disabled:opacity-50"
                      >
                        <Plane className="h-4 w-4" aria-hidden />
                        {launching
                          ? 'Starting…'
                          : !!requiresSource && !sourceAttached
                            ? `Add a ${requiresSource === 'video' ? 'video' : 'reading'} to run`
                            : `Run in ${selectedName}`}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <PaywallModal open={showPaywall} onClose={() => { setShowPaywall(false); closeAll(); }} />
    </>
  );
}

function Fact({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-lc-text2">
      {icon}
      {children}
    </span>
  );
}
