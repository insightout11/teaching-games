'use client';

// "Build this lesson" launcher for the All-Around Flight hero. Instead of dumping the
// teacher into the Lesson Planner, this collects the minimum (topic · optional source ·
// class) and launches the FULL pre-sequenced preset directly via the planner store's
// launchLesson() — everything ready to go.

import { useEffect, useState } from 'react';
import { Plane, Plus, Paperclip, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { useTeacherProfile } from '@/hooks/use-teacher-profile';
import { levelToDifficulty } from '@/lib/teacher-profile';
import { TOPICS, DIFFICULTIES } from '@/stores/session-store';
import type { Topic, Difficulty } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';
import { SourceInputPanel } from '@/components/planner/source-input-panel';
import { getFeaturedPreset } from '@/lib/discovery-shelves';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';

interface ClassRow {
  id: string;
  name: string;
}
const LAST_CLASS_KEY = 'lc-last-class';

export function FeaturedFlightLaunchModal({
  open,
  onClose,
  expandSource = false,
  pendingNote = null,
  preset: presetProp = null,
  initialTopic,
}: {
  open: boolean;
  onClose: () => void;
  expandSource?: boolean;
  /** One-line banner shown when the launcher was auto-opened from the /video-lesson demo handoff. */
  pendingNote?: string | null;
  /** Preset to launch. Defaults to the featured Captain's Flight when omitted. */
  preset?: FlightPlanPreset | null;
  /** Pre-fills the custom-topic field (Ready to Teach launches a pre-chosen topic). */
  initialTopic?: string;
}) {
  const loadPreset = usePlannerStore((s) => s.loadPreset);
  const setTopicStore = usePlannerStore((s) => s.setTopic);
  const setDifficultyStore = usePlannerStore((s) => s.setDifficulty);
  const setSelectedClassId = usePlannerStore((s) => s.setSelectedClassId);
  const launchLesson = usePlannerStore((s) => s.launchLesson);
  const sourceAttached = usePlannerStore((s) => s.sourceMaterial);
  const { loading: tierLoading, isPro, credits } = useTeacherTier();
  const { profile } = useTeacherProfile();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelClass] = useState('');
  const [topic, setTopic] = useState<Topic | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [customTopic, setCustomTopic] = useState('');
  const [launching, setLaunching] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLaunching(false);
    setShowCreateClass(false);
    if (initialTopic) setCustomTopic(initialTopic);
    setShowSource(expandSource || !!usePlannerStore.getState().sourceMaterial);
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
  }, [open, expandSource, initialTopic]);

  // Pre-fill difficulty from the teacher's onboarding level when the launcher opens.
  useEffect(() => {
    const fromProfile = levelToDifficulty(profile.level);
    if (open && fromProfile) setDifficulty(fromProfile);
  }, [open, profile.level]);

  useEffect(() => {
    if (classes.length === 0) {
      setSelClass('');
      return;
    }
    setSelClass((prev) => {
      if (prev && classes.some((c) => c.id === prev)) return prev;
      try {
        const raw = localStorage.getItem(LAST_CLASS_KEY);
        const last = raw ? (JSON.parse(raw) as ClassRow) : null;
        if (last && classes.some((c) => c.id === last.id)) return last.id;
      } catch {
        /* ignore */
      }
      return classes[0].id;
    });
  }, [classes]);

  const preset = presetProp ?? getFeaturedPreset();
  const selectedName = classes.find((c) => c.id === selectedClassId)?.name ?? '';

  async function doLaunch(classId: string) {
    if (!preset || !classId) return;
    if (!tierLoading && !isPro && credits === 0) {
      setShowPaywall(true);
      return;
    }
    setLaunching(true);
    try {
      loadPreset(preset);
      setTopicStore(customTopic.trim() || topic || 'General');
      setDifficultyStore(difficulty);
      setSelectedClassId(classId);
      try {
        localStorage.setItem(
          LAST_CLASS_KEY,
          JSON.stringify({ id: classId, name: classes.find((c) => c.id === classId)?.name ?? '' }),
        );
      } catch {
        /* ignore */
      }
      await launchLesson(); // navigates on success
      setLaunching(false);
    } catch {
      setLaunching(false);
      setShowPaywall(true);
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
      doLaunch(newClass.id);
    }
    setCreatingClass(false);
  }

  return (
    <>
      <Modal open={open && !showPaywall} onClose={() => { setLaunching(false); onClose(); }} title={`Start ${preset?.name ?? "Captain's Flight"}`}>
        <div className="space-y-4">
          {pendingNote && (
            <div className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-2.5 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              {pendingNote}
            </div>
          )}
          <p className="text-sm leading-relaxed text-lc-text2">
            A complete live lesson — warm-up, language, discussion, a game, and a landing — generated around
            your topic{sourceAttached ? ' and source' : ''}.
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-lc-text3">Topic</label>
              <Select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic | '')}
                inputSize="compact"
              >
                <option value="">General</option>
                {TOPICS.filter((t) => t !== 'General').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-lc-text3">Difficulty</label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                inputSize="compact"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
          </div>
          <Input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={`Or type a custom topic${topic ? ` (overrides ${topic})` : ''}…`}
            inputSize="compact"
          />

          {/* Optional source */}
          {showSource ? (
            <div className="rounded-xl border border-lc-border bg-lc-surface/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-instrument flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-lc-text3">
                  Source
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] tracking-normal text-lc-text3">Optional</span>
                </p>
                {!sourceAttached && (
                  <button onClick={() => setShowSource(false)} className="text-[11px] text-lc-text3 hover:text-lc-text">Hide</button>
                )}
              </div>
              <SourceInputPanel />
            </div>
          ) : (
            <button
              onClick={() => setShowSource(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text2 transition-colors hover:border-cyan-400/40 hover:text-lc-text"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              Add a video or article <span className="text-lc-text3">(optional)</span>
            </button>
          )}

          {!tierLoading && !isPro && credits === 1 && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-400">
              This is your last free live lesson credit.
            </div>
          )}

          {/* Class */}
          {classesLoading ? (
            <p className="text-sm text-lc-text3">Loading classes…</p>
          ) : classes.length === 0 ? (
            showCreateClass ? (
              <form onSubmit={handleCreateClass} className="flex gap-2">
                <Input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class name"
                  autoFocus
                  inputSize="compact"
                  className="w-auto flex-1"
                />
                <button type="submit" disabled={creatingClass || !newClassName.trim()} className="rounded-lg bg-lc-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {creatingClass ? '…' : 'Create & launch'}
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
              <Select
                value={selectedClassId}
                onChange={(e) => setSelClass(e.target.value)}
                inputSize="compact"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          )}

          {classes.length > 0 && (
            <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-lc-border bg-lc-card/95 px-6 py-4 backdrop-blur">
              <button
                onClick={() => doLaunch(selectedClassId)}
                disabled={launching || !selectedClassId}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-lc-amber px-4 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90 disabled:opacity-50"
              >
                <Plane className="h-4 w-4" aria-hidden />
                {launching ? 'Building lesson…' : `Launch in ${selectedName}`}
              </button>
            </div>
          )}
        </div>
      </Modal>

      <PaywallModal open={showPaywall} onClose={() => { setShowPaywall(false); onClose(); }} />
    </>
  );
}
