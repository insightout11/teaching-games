'use client';

// Library-style detail drawer for a single activity/game on Teacher Home.
// Clicking a card opens THIS — it previews the item, then offers the correct,
// explicit actions so an activity is never silently turned into a lesson:
//   • Run activity now  → one-slot session (no takeoff/landing wrapper), like Browse
//   • Add to lesson plan → seedWithModule() (the only path that builds a lesson)
// Launch flow mirrors ExploreClient so behavior stays consistent across the app.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, Plus, ListPlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { createClient } from '@/lib/supabase/client';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { TOPICS, DIFFICULTIES } from '@/stores/session-store';
import type { Topic, Difficulty } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';
import {
  type DiscoveryItem,
  getTypeLabel,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
} from '@/lib/discovery-shelves';

interface ClassRow {
  id: string;
  name: string;
}

export function DiscoveryDetailDrawer({ item, onClose }: { item: DiscoveryItem | null; onClose: () => void }) {
  const router = useRouter();
  const seedWithModule = usePlannerStore((s) => s.seedWithModule);
  const { loading: tierLoading, isPro, credits } = useTeacherTier();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [topic, setTopic] = useState<Topic | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [customTopic, setCustomTopic] = useState('');
  const [launching, setLaunching] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Load classes when the drawer opens.
  useEffect(() => {
    if (!item) return;
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

  function reset() {
    setShowCreateClass(false);
    setNewClassName('');
    setLaunching(false);
  }

  async function runWithClass(classId: string) {
    if (!item) return;
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
      // One slot only — NO takeoff/landing wrapper. This is an activity, not a lesson.
      sessionStorage.setItem(
        'lessonPlanContent',
        JSON.stringify({
          customTopic: customTopic.trim() || topic || 'General',
          difficulty,
          slots: [{ type: item.type, key: item.key, name: item.name }],
          generatedContent: {},
          generatedGameContent: {},
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

  return (
    <>
      <Modal open={!!item && !showPaywall} onClose={() => { reset(); onClose(); }} title={item?.name}>
        {item && (
          <div className="space-y-5">
            {/* Type + use case */}
            <div className="flex items-center justify-between gap-2 -mt-2">
              <p className="font-instrument text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">
                {getTypeLabel(item)} · {item.useCase}
              </p>
              {item.isPro && (
                <span className="font-instrument rounded-full border border-lc-amber/40 bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lc-amber">
                  Pro
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-lc-text2">{item.description}</p>

            {/* Quick facts */}
            <div className="flex flex-wrap gap-2">
              <Fact icon={<Clock className="h-3.5 w-3.5" />}>{item.estimatedMinutes} min</Fact>
              <Fact icon={<Users className="h-3.5 w-3.5" />}>{getClassSizeChip(item)}</Fact>
              <Fact>{getSourceChip(item)}</Fact>
            </div>

            {/* What students do */}
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

            {/* Run now */}
            <div className="border-t border-lc-border pt-4">
              <p className="mb-3 text-sm font-semibold text-lc-text">Run activity now</p>

              <div className="mb-3 flex gap-3">
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
                className="mb-4 w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3"
              />

              {!tierLoading && !isPro && credits === 1 && (
                <div className="mb-3 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-400">
                  This is your last free Test Flight.
                </div>
              )}

              <p className="mb-2 text-sm text-lc-text3">Select a class to launch with:</p>
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
                      className="flex-1 rounded-lg border border-lc-border bg-lc-surface px-3 py-1.5 text-sm text-lc-text placeholder:text-lc-text3"
                    />
                    <button type="submit" disabled={creatingClass || !newClassName.trim()} className="rounded-lg bg-lc-blue px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      {creatingClass ? '…' : 'Create'}
                    </button>
                  </form>
                ) : (
                  <button onClick={() => setShowCreateClass(true)} className="inline-flex items-center gap-1 text-sm font-medium text-lc-blue hover:underline">
                    <Plus className="h-4 w-4" /> Create a class
                  </button>
                )
              ) : (
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => runWithClass(cls.id)}
                      disabled={launching}
                      className="w-full rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-3 text-left text-sm font-medium text-lc-text transition-colors hover:border-cyan-400/60 hover:bg-cyan-400/10 disabled:opacity-50"
                    >
                      ▶ {cls.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary: add to a lesson plan */}
            <div className="border-t border-lc-border pt-4">
              <button
                onClick={addToPlan}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-lc-border bg-lc-surface px-4 py-2.5 text-sm font-medium text-lc-text2 transition-colors hover:border-lc-amber/50 hover:text-lc-text"
              >
                <ListPlus className="h-4 w-4" aria-hidden />
                Add to a lesson plan
              </button>
              <p className="mt-2 text-center text-[11px] text-lc-text3">
                Builds a full Flight Plan around this activity (adds a takeoff &amp; landing).
              </p>
            </div>
          </div>
        )}
      </Modal>

      <PaywallModal open={showPaywall} onClose={() => { setShowPaywall(false); onClose(); }} />
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
