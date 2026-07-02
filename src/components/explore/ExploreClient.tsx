'use client';

import { useState, useEffect, useRef, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { getAllGames, getGame, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, getActivity, CATEGORY_INFO } from '@/activities/registry';
import type { GameCategory } from '@/games/types';
import type { ActivityCategory } from '@/activities/types';
import { TOPICS, DIFFICULTIES } from '@/stores/session-store';
import type { Topic, Difficulty } from '@/stores/session-store';
import { usePlannerStore } from '@/stores/planner-store';
import type { SlotType } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { trackEvent } from '@/lib/analytics/posthog';

type FilterTab = 'all' | 'games' | 'activities';
type SkillFilter = 'all' | 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'critical-thinking' | 'debate' | 'creativity';

const SKILL_FILTERS: { key: SkillFilter; label: string; skills: string[] }[] = [
  { key: 'vocabulary',        label: 'Vocabulary',        skills: ['Vocabulary', 'Word Knowledge', 'Precision', 'Spelling', 'Association', 'Register', 'Context'] },
  { key: 'grammar',           label: 'Grammar',           skills: ['Grammar', 'Sentence Structure', 'Proofreading', 'Attention'] },
  { key: 'speaking',          label: 'Speaking',          skills: ['Speaking', 'Fluency', 'Pragmatics', 'Listening', 'Question Formation'] },
  { key: 'writing',           label: 'Writing',           skills: ['Writing', 'Creative Writing', 'Storytelling'] },
  { key: 'critical-thinking', label: 'Critical Thinking', skills: ['Critical Thinking', 'Questioning', 'Deduction', 'Pattern Recognition'] },
  { key: 'debate',            label: 'Debate',            skills: ['Debate', 'Persuasion'] },
  { key: 'creativity',        label: 'Creativity',        skills: ['Creativity', 'Creative Writing', 'Role-play'] },
];

interface Class {
  id: string;
  name: string;
}

function minStudentsFor(item: { key: string; type: 'game' | 'activity' } | null): number {
  if (!item) return 1;
  const plugin = item.type === 'game' ? getGame(item.key) : getActivity(item.key);
  return plugin?.minStudents ?? 1;
}

interface ActiveSession {
  sessionId: string;
  className: string;
}

// Full class strings (not built from string concatenation) so Tailwind's
// content scanner picks them up.
const CATEGORY_TINT: Record<string, string> = {
  'text-violet-400': 'bg-violet-400/10',
  'text-cyan-400': 'bg-cyan-400/10',
  'text-emerald-400': 'bg-emerald-400/10',
  'text-amber-400': 'bg-amber-400/10',
  'text-sky-400': 'bg-sky-400/10',
  'text-rose-400': 'bg-rose-400/10',
  'text-teal-400': 'bg-teal-400/10',
};

function tintFor(color: string): string {
  return CATEGORY_TINT[color] ?? 'bg-lc-surface';
}

// First preset that features each module key — a quiet discovery cross-link,
// not a full listing of every preset that uses it.
const PRESET_NAME_BY_MODULE_KEY: Record<string, string> = {};
for (const preset of FLIGHT_PLAN_PRESETS) {
  for (const seqModule of preset.moduleSequence) {
    if (!(seqModule.key in PRESET_NAME_BY_MODULE_KEY)) {
      PRESET_NAME_BY_MODULE_KEY[seqModule.key] = preset.name;
    }
  }
}

function ModuleCard({
  icon: Icon,
  name,
  description,
  skills,
  estimatedMinutes,
  typeLabel,
  color,
  presetFootnote,
  onLaunch,
  onAddToPlan,
}: {
  icon: ComponentType<{ className?: string }>;
  name: string;
  description: string;
  skills: string[];
  estimatedMinutes: number;
  typeLabel: 'Game' | 'Activity';
  color: string;
  presetFootnote?: string;
  onLaunch: () => void;
  onAddToPlan: () => void;
}) {
  const visibleSkills = skills.slice(0, 2);
  const extraCount = skills.length - visibleSkills.length;

  return (
    <div className="panel-card p-0 overflow-hidden flex flex-col">
      <button
        onClick={onLaunch}
        aria-label={`${name} – ${typeLabel}, ${estimatedMinutes} min`}
        className="flex-1 flex gap-3 p-4 text-left w-full"
      >
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tintFor(color))} aria-hidden="true">
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-sm text-lc-text block truncate">{name}</span>
          <p className="text-xs text-lc-text3 mt-0.5">{typeLabel} · {estimatedMinutes} min</p>
          <p className="text-xs text-lc-text2 opacity-80 mt-1.5 line-clamp-2">{description}</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {visibleSkills.map((skill) => (
                <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-lc-border text-lc-text2 rounded font-instrument tracking-wide uppercase">
                  {skill}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-[10px] text-lc-text3">+{extraCount}</span>
              )}
            </div>
          )}
          {presetFootnote && (
            <p className="text-[10px] text-lc-text3 mt-1.5">In {presetFootnote}</p>
          )}
        </div>
      </button>
      <div className="px-4 pb-3 pt-1 border-t border-lc-border/40 flex items-center justify-between gap-2">
        <button
          onClick={onAddToPlan}
          aria-label="Add to lesson plan"
          title="Add to lesson plan"
          className="p-1.5 rounded-lg text-lc-text3 hover:text-lc-amber hover:bg-lc-surface transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <Button onClick={onLaunch} size="sm" className="px-3 py-1.5 text-xs">
          Launch
        </Button>
      </div>
    </div>
  );
}

function SkillPopover({ value, onChange }: { value: SkillFilter; onChange: (v: SkillFilter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = value === 'all' ? 'Skill' : SKILL_FILTERS.find((f) => f.key === value)?.label ?? 'Skill';

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Filter by skill"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-instrument tracking-wide uppercase border transition-colors',
          value !== 'all'
            ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
            : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
        )}
      >
        {activeLabel}
        <ChevronDown className="w-3 h-3" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Skill category"
          className="absolute left-0 top-full mt-1.5 w-48 rounded-xl border border-lc-border bg-lc-card shadow-lg z-30 py-1"
        >
          <button
            role="option"
            onClick={() => { onChange('all'); setOpen(false); }}
            aria-selected={value === 'all'}
            className={cn(
              'w-full text-left px-3 py-2 text-sm transition-colors',
              value === 'all' ? 'text-lc-blue' : 'text-lc-text2 hover:bg-lc-surface'
            )}
          >
            All skills
          </button>
          {SKILL_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              role="option"
              onClick={() => { onChange(key); setOpen(false); }}
              aria-selected={value === key}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                value === key ? 'text-lc-blue' : 'text-lc-text2 hover:bg-lc-surface'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExploreClient() {
  const router = useRouter();
  const { seedWithModule } = usePlannerStore();
  const { loading: tierLoading, isPro, credits } = useTeacherTier();
  const games: GamePlugin[] = getAllGames().filter((g) => !g.flightPlanOnly);
  const activities: ActivityPlugin[] = getAllActivities().filter((a) => !a.flightPlanOnly);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [search, setSearch] = useState('');
  const [launchItem, setLaunchItem] = useState<{ name: string; key: string; type: 'game' | 'activity' } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  const [launching, setLaunching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | ''>('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Intermediate');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showTopicDifficulty, setShowTopicDifficulty] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Read persisted settings + active session from localStorage on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem('lc-explore-session');
      if (session) setActiveSession(JSON.parse(session));
      const settings = localStorage.getItem('lc-explore-settings');
      if (settings) {
        const { topic, difficulty, customTopic: ct } = JSON.parse(settings);
        if (topic !== undefined) setSelectedTopic(topic);
        if (difficulty !== undefined) setSelectedDifficulty(difficulty);
        if (ct !== undefined) setCustomTopic(ct);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setIsAuthenticated(!!data.user);
    }
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!launchItem || !isAuthenticated) return;
    setClassesLoading(true);
    const supabase = createClient();
    supabase
      .from('classes')
      .select('id, name')
      .order('created_at', { ascending: false })
      .then(async ({ data }: { data: Class[] | null }) => {
        const classList = data ?? [];
        setClasses(classList);
        setClassesLoading(false);
        // Roster size per class — used to gate modules that need more students than a class has.
        if (classList.length > 0) {
          const { data: studentRows } = await supabase
            .from('students')
            .select('class_id')
            .in('class_id', classList.map((c) => c.id));
          const counts: Record<string, number> = {};
          for (const row of (studentRows ?? []) as { class_id: string }[]) {
            counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
          }
          setClassStudentCounts(counts);
        }
      });
  }, [launchItem, isAuthenticated]);

  function writeAndNavigate(sessionId: string, directLaunch: boolean) {
    if (!launchItem) return;
    localStorage.setItem('lc-explore-settings', JSON.stringify({ topic: selectedTopic, difficulty: selectedDifficulty, customTopic }));
    sessionStorage.setItem(
      'lessonPlanContent',
      JSON.stringify({
        customTopic: customTopic.trim() || selectedTopic,
        difficulty: selectedDifficulty,
        slots: [{ type: launchItem.type, key: launchItem.key, name: launchItem.name }],
        generatedContent: {},
        generatedGameContent: {},
        ...(directLaunch ? { directLaunch: true } : {}),
      }),
    );
    window.location.href = `/sessions/${sessionId}`;
  }

  async function handleSelectClass(classId: string, className: string) {
    if (!launchItem) return;
    setLaunching(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      if (res.status === 402) {
        setLaunching(false);
        setLaunchItem(null);
        setShowPaywall(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to create session');
      const { sessionId } = await res.json();
      trackEvent('test_flight_started', { itemType: launchItem.type, itemKey: launchItem.key });
      localStorage.setItem('lc-explore-session', JSON.stringify({ sessionId, className }));
      writeAndNavigate(sessionId, false);
    } catch {
      setLaunching(false);
    }
  }

  function handleContinueSession() {
    if (!activeSession || !launchItem) return;
    setLaunching(true);
    writeAndNavigate(activeSession.sessionId, true);
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreatingClass(false); return; }
    const { data: newClass } = await supabase
      .from('classes')
      .insert({ name: newClassName.trim(), teacher_id: user.id })
      .select('id, name')
      .single();
    if (newClass) {
      setClasses([newClass, ...classes]);
      setNewClassName('');
      setShowCreateClass(false);
      handleSelectClass(newClass.id, newClass.name);
    }
    setCreatingClass(false);
  }

  const showGames = filter === 'all' || filter === 'games';
  const showActivities = filter === 'all' || filter === 'activities';

  function matchesSkillFilter(skills: string[]): boolean {
    if (skillFilter === 'all') return true;
    const filterSkills = SKILL_FILTERS.find((f) => f.key === skillFilter)?.skills ?? [];
    return skills.some((s) => filterSkills.includes(s));
  }

  const query = search.trim().toLowerCase();
  function matchesSearch(name: string, description: string, skills: string[]): boolean {
    if (!query) return true;
    return (
      name.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query) ||
      skills.some((s) => s.toLowerCase().includes(query))
    );
  }

  const resultCount =
    (showGames ? games.filter((g) => matchesSkillFilter(g.skills) && matchesSearch(g.name, g.description, g.skills)).length : 0) +
    (showActivities ? activities.filter((a) => matchesSkillFilter(a.skills) && matchesSearch(a.name, a.description, a.skills)).length : 0);

  // Group games by category
  const gamesByCategory = games.reduce<Record<string, GamePlugin[]>>((acc, game) => {
    (acc[game.category] ??= []).push(game);
    return acc;
  }, {});

  // Group activities by category
  const activitiesByCategory = activities.reduce<Record<string, ActivityPlugin[]>>((acc, activity) => {
    (acc[activity.category] ??= []).push(activity);
    return acc;
  }, {});

  const gameCategoryOrder: GameCategory[] = ['quiz', 'vocabulary', 'grammar-writing', 'logic-puzzles'];
  const activityCategoryOrder: ActivityCategory[] = ['icebreaker', 'learning', 'practice', 'debate', 'closing'];

  function handleAddToPlan(key: string, slotType: SlotType) {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    seedWithModule(key, slotType);
    router.push('/lesson-planner');
  }

  function handleLaunchItem(item: { name: string; key: string; type: 'game' | 'activity' }) {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!tierLoading && !isPro && credits === 0) {
      setShowPaywall(true);
      return;
    }
    setLaunchItem(item);
  }

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-6 lg:px-8 lg:pt-8 pb-12 min-h-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-lc-text">Browse</h1>
        <p className="text-lc-text2 mt-1">✈ Run a game or activity with your class</p>
      </div>

      {/* Toolbar: search + type segmented control + skill popover */}
      <div className="sticky top-0 z-20 -mx-6 px-6 lg:-mx-8 lg:px-8 py-3 mb-6 bg-lc-bg/95 backdrop-blur border-b border-lc-border-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text3" aria-hidden />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games and activities…"
              aria-label="Search games and activities"
              inputSize="compact"
              variant="search"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lc-text3 transition-colors hover:text-lc-text"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <div role="group" aria-label="Content type" className="flex rounded-lg border border-lc-border overflow-hidden shrink-0">
            {(['all', 'games', 'activities'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                aria-pressed={filter === tab}
                aria-label={tab === 'all' ? 'All types' : undefined}
                className={cn(
                  'px-3 py-1.5 text-xs font-instrument tracking-wide uppercase transition-colors',
                  filter === tab
                    ? 'bg-lc-blue/10 text-lc-blue'
                    : 'bg-transparent text-lc-text2 hover:text-lc-text hover:bg-lc-surface'
                )}
              >
                {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
              </button>
            ))}
          </div>

          <SkillPopover value={skillFilter} onChange={setSkillFilter} />

          {(search || skillFilter !== 'all' || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSkillFilter('all'); setFilter('all'); }}
              className="text-xs text-lc-text3 hover:text-lc-text transition-colors shrink-0"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-lc-text3 shrink-0">
            {resultCount} result{resultCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {resultCount === 0 && (
          <div className="rounded-xl border border-lc-border bg-lc-surface/40 px-6 py-10 text-center text-sm text-lc-text3">
            No games or activities match{search ? ` “${search.trim()}”` : ' those filters'}.
          </div>
        )}
        {/* Games */}
        {showGames && gameCategoryOrder.map((cat) => {
          const allCatGames = gamesByCategory[cat];
          if (!allCatGames?.length) return null;
          const catGames = allCatGames.filter((g) => matchesSkillFilter(g.skills) && matchesSearch(g.name, g.description, g.skills));
          if (!catGames.length) return null;
          const info = GAME_CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat} aria-label={info.name}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} aria-hidden="true" />
                <h2 className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</h2>
                <div className="hud-rule" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catGames.map((game) => (
                  <ModuleCard
                    key={game.key}
                    icon={game.icon}
                    name={game.name}
                    description={game.description}
                    skills={game.skills}
                    estimatedMinutes={game.estimatedMinutes}
                    typeLabel="Game"
                    color={info.color}
                    presetFootnote={PRESET_NAME_BY_MODULE_KEY[game.key]}
                    onLaunch={() => handleLaunchItem({ name: game.name, key: game.key, type: 'game' })}
                    onAddToPlan={() => handleAddToPlan(game.key, game.pppStage)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Activities */}
        {showActivities && activityCategoryOrder.map((cat) => {
          const allCatActivities = activitiesByCategory[cat];
          if (!allCatActivities?.length) return null;
          const catActivities = allCatActivities.filter((a) => matchesSkillFilter(a.skills) && matchesSearch(a.name, a.description, a.skills));
          if (!catActivities.length) return null;
          const info = CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat} aria-label={info.name}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} aria-hidden="true" />
                <h2 className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</h2>
                <div className="hud-rule" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catActivities.map((activity) => (
                  <ModuleCard
                    key={activity.key}
                    icon={activity.icon}
                    name={activity.name}
                    description={activity.description}
                    skills={activity.skills}
                    estimatedMinutes={activity.estimatedMinutes}
                    typeLabel="Activity"
                    color={info.color}
                    presetFootnote={PRESET_NAME_BY_MODULE_KEY[activity.key]}
                    onLaunch={() => handleLaunchItem({ name: activity.name, key: activity.key, type: 'activity' })}
                    onAddToPlan={() => handleAddToPlan(activity.key, activity.pppStage)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Launch modal */}
      <Modal
        open={!!launchItem}
        onClose={() => { setLaunchItem(null); setShowCreateClass(false); setNewClassName(''); setShowTopicDifficulty(false); }}
        title={launchItem ? `Launch ${launchItem.name}` : ''}
      >
        {/* Low-credit warning */}
        {!tierLoading && !isPro && credits === 2 && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            2 Test Flights left. Pro removes the limit when you&apos;re ready.
          </div>
        )}
        {!tierLoading && !isPro && credits === 1 && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
            This is your last free Test Flight. Upgrade after this lesson to keep teaching.
          </div>
        )}

        {/* Active session shortcut — pinned top, it's the fastest path */}
        {activeSession && (
          <div className="mb-4">
            <p className="text-xs text-lc-text3 mb-2">Active session:</p>
            <button
              onClick={handleContinueSession}
              disabled={launching}
              className="w-full text-left px-4 py-3 rounded-lg border border-cyan-500/40 bg-cyan-500/5 text-lc-text text-sm font-medium hover:border-cyan-500/70 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
            >
              ▶ Continue in {activeSession.className}
            </button>
          </div>
        )}

        {/* Class list — the primary decision */}
        <p className="text-sm text-lc-text3 mb-3">
          {activeSession ? 'Or start a new session:' : 'Select a class to launch this with:'}
        </p>
        {classesLoading ? (
          <p className="text-sm text-lc-text3">Loading classes…</p>
        ) : classes.length === 0 ? (
          <div className="text-sm text-lc-text3">
            <p className="mb-3">You haven&apos;t created a class yet.</p>
            {showCreateClass ? (
              <form onSubmit={handleCreateClass} className="flex gap-2">
                <Input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class name"
                  autoFocus
                  inputSize="sm"
                  className="w-auto flex-1 rounded-lg"
                />
                <button
                  type="submit"
                  disabled={creatingClass || !newClassName.trim()}
                  className="text-sm px-3 py-1.5 rounded-lg bg-lc-blue text-white font-medium disabled:opacity-50"
                >
                  {creatingClass ? '…' : 'Create'}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateClass(true)}
                className="text-lc-blue hover:underline font-medium"
              >
                + Create a class
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => {
              const minStudents = minStudentsFor(launchItem);
              const count = classStudentCounts[cls.id];
              const tooFew = minStudents > 1 && count !== undefined && count < minStudents;
              return (
                <button
                  key={cls.id}
                  onClick={() => !tooFew && handleSelectClass(cls.id, cls.name)}
                  disabled={launching || tooFew}
                  title={tooFew ? `Needs ${minStudents}+ students — ${cls.name} has ${count}` : undefined}
                  className="w-full text-left px-4 py-3 rounded-lg border border-lc-border bg-lc-surface text-lc-text text-sm font-medium hover:border-lc-blue/50 hover:bg-lc-blue/5 transition-colors disabled:opacity-50 disabled:hover:border-lc-border disabled:hover:bg-lc-surface"
                >
                  {cls.name}
                  {tooFew && (
                    <span className="block text-xs text-lc-text3 mt-0.5">Needs {minStudents}+ students ({count} in this class)</span>
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-lc-border mt-2">
              {showCreateClass ? (
                <form onSubmit={handleCreateClass} className="flex gap-2">
                  <Input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name"
                    autoFocus
                    inputSize="sm"
                    className="w-auto flex-1 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={creatingClass || !newClassName.trim()}
                    className="text-sm px-3 py-1.5 rounded-lg bg-lc-blue text-white font-medium disabled:opacity-50"
                  >
                    {creatingClass ? '…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateClass(false); setNewClassName(''); }}
                    className="text-sm px-2 py-1.5 rounded-lg text-lc-text3 hover:text-lc-text transition-colors"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="text-sm text-lc-text3 hover:text-lc-blue transition-colors"
                >
                  + New class
                </button>
              )}
            </div>
          </div>
        )}

        {/* Topic & difficulty — collapsed by default; most launches use defaults */}
        <div className="mt-5 pt-4 border-t border-lc-border">
          <button
            type="button"
            onClick={() => setShowTopicDifficulty((v) => !v)}
            aria-expanded={showTopicDifficulty}
            className="w-full flex items-center justify-between text-sm text-lc-text2 hover:text-lc-text transition-colors"
          >
            <span>
              Topic &amp; difficulty:{' '}
              <span className="font-medium text-lc-text">
                {customTopic.trim() || selectedTopic || 'General'} · {selectedDifficulty}
              </span>
            </span>
            <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', showTopicDifficulty && 'rotate-180')} aria-hidden />
          </button>

          {showTopicDifficulty && (
            <div className="mt-3">
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-lc-text3 mb-1">Topic</label>
                  <Select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value as Topic | '')}
                    inputSize="compact"
                  >
                    <option value="">General</option>
                    {TOPICS.filter((t) => t !== 'General').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-lc-text3 mb-1">Difficulty</label>
                  <Select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
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
                placeholder={`Or type a custom topic${selectedTopic ? ` (overrides ${selectedTopic})` : ''}…`}
                inputSize="compact"
              />
            </div>
          )}
        </div>
      </Modal>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
