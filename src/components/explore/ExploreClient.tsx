'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { createClient } from '@/lib/supabase/client';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { getAllGames, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import type { GameCategory } from '@/games/types';
import type { ActivityCategory } from '@/activities/types';
import { TOPICS, DIFFICULTIES } from '@/stores/session-store';
import type { Topic, Difficulty } from '@/stores/session-store';

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

interface ActiveSession {
  sessionId: string;
  className: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  quiz: 'border-l-violet-500/50',
  vocabulary: 'border-l-amber-500/50',
  'grammar-writing': 'border-l-sky-500/50',
  'logic-puzzles': 'border-l-emerald-500/50',
  icebreaker: 'border-l-violet-500/50',
  learning: 'border-l-teal-500/50',
  practice: 'border-l-sky-500/50',
  debate: 'border-l-rose-500/50',
  closing: 'border-l-indigo-500/50',
};

function getCategoryAccent(cat: string): string {
  return CATEGORY_ACCENT[cat] ?? 'border-l-lc-border';
}

function getStageBadge(stage: string | undefined) {
  if (stage === 'presentation') return { label: 'Present', cls: 'bg-violet-500/15 text-violet-500' };
  if (stage === 'practice') return { label: 'Practice', cls: 'bg-sky-500/15 text-sky-500' };
  if (stage === 'production') return { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-600' };
  return null;
}

export function ExploreClient() {
  const games: GamePlugin[] = getAllGames().filter((g) => !g.flightPlanOnly);
  const activities: ActivityPlugin[] = getAllActivities().filter((a) => !a.flightPlanOnly);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [launchItem, setLaunchItem] = useState<{ name: string; key: string; type: 'game' | 'activity' } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | ''>('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Intermediate');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

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
    if (!launchItem) return;
    setClassesLoading(true);
    const supabase = createClient();
    supabase
      .from('classes')
      .select('id, name')
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Class[] | null }) => {
        setClasses(data ?? []);
        setClassesLoading(false);
      });
  }, [launchItem]);

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

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-6 lg:px-8 lg:pt-8 pb-12 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lc-text">Explore</h1>
        <p className="text-lc-text2 mt-1">✈ Run a game or activity with your class</p>
      </div>

      {/* Type filter tabs */}
      <div role="group" aria-label="Content type" className="flex gap-2 mb-4">
        {(['all', 'games', 'activities'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            aria-pressed={filter === tab}
            aria-label={tab === 'all' ? 'All types' : undefined}
            className={cn(
              'px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors',
              filter === tab
                ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
            )}
          >
            {filter === tab && <span className="mr-1 opacity-70">◆</span>}
            {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
          </button>
        ))}
      </div>

      {/* Skill filter */}
      <div role="group" aria-label="Skill category" className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSkillFilter('all')}
          aria-pressed={skillFilter === 'all'}
          aria-label="All skills"
          className={cn(
            'px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors',
            skillFilter === 'all'
              ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
              : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
          )}
        >
          {skillFilter === 'all' && <span className="mr-1 opacity-70">◆</span>}All
        </button>
        {SKILL_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSkillFilter(key)}
            aria-pressed={skillFilter === key}
            className={cn(
              'px-3 py-1 rounded text-xs font-instrument tracking-wide uppercase border transition-colors',
              skillFilter === key
                ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
            )}
          >
            {skillFilter === key && <span className="mr-1 opacity-70">◆</span>}{label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Games */}
        {showGames && gameCategoryOrder.map((cat) => {
          const allCatGames = gamesByCategory[cat];
          if (!allCatGames?.length) return null;
          const catGames = allCatGames.filter((g) => matchesSkillFilter(g.skills));
          if (!catGames.length) return null;
          const info = GAME_CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat} aria-label={info.name}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} aria-hidden="true" />
                <h2 className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</h2>
                <span className="flex items-center gap-1 text-xs text-lc-text3 mr-1" aria-hidden="true">
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><path d="M3 0L6 3L3 6L0 3Z"/></svg>
                  Games
                </span>
                <div className="hud-rule" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catGames.map((game) => {
                  const GameIcon = game.icon;
                  const stageBadge = getStageBadge(game.pppStage);
                  return (
                    <button
                      key={game.key}
                      onClick={() => setLaunchItem({ name: game.name, key: game.key, type: 'game' })}
                      aria-label={`${game.name} – ${stageBadge?.label ?? 'Game'}, ${game.estimatedMinutes} min`}
                      className={cn('panel-card border-l-2 p-6 text-left transition-all w-full', getCategoryAccent(cat))}
                    >
                      <div className="flex items-center gap-2 mb-1" aria-hidden="true">
                        <GameIcon className={`w-5 h-5 ${info.color}`} />
                        <span className="font-semibold">{game.name}</span>
                        {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                      </div>
                      <p className="text-sm opacity-70 mt-1" aria-hidden="true">{game.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3" aria-hidden="true">
                        {game.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text2 rounded font-instrument tracking-wide uppercase">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1" aria-hidden="true">
                        <Clock className="w-3 h-3 opacity-40" />
                        <span className="text-xs opacity-50">{game.estimatedMinutes} min</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Activities */}
        {showActivities && activityCategoryOrder.map((cat) => {
          const allCatActivities = activitiesByCategory[cat];
          if (!allCatActivities?.length) return null;
          const catActivities = allCatActivities.filter((a) => matchesSkillFilter(a.skills));
          if (!catActivities.length) return null;
          const info = CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat} aria-label={info.name}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} aria-hidden="true" />
                <h2 className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</h2>
                <span className="flex items-center gap-1 text-xs text-lc-text3 mr-1" aria-hidden="true">
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><path d="M3 0L6 3L3 6L0 3Z"/></svg>
                  Activities
                </span>
                <div className="hud-rule" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catActivities.map((activity) => {
                  const ActivityIcon = activity.icon;
                  const stageBadge = getStageBadge(activity.pppStage);
                  return (
                    <button
                      key={activity.key}
                      onClick={() => setLaunchItem({ name: activity.name, key: activity.key, type: 'activity' })}
                      aria-label={`${activity.name} – ${stageBadge?.label ?? 'Activity'}, ${activity.estimatedMinutes} min`}
                      className={cn('panel-card border-l-2 p-6 text-left transition-all w-full', getCategoryAccent(cat))}
                    >
                      <div className="flex items-center gap-2 mb-1" aria-hidden="true">
                        <ActivityIcon className={`w-5 h-5 ${info.color}`} />
                        <span className="font-semibold">{activity.name}</span>
                        {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                      </div>
                      <p className="text-sm opacity-70 mt-2" aria-hidden="true">{activity.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3" aria-hidden="true">
                        {activity.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text2 rounded font-instrument tracking-wide uppercase">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1" aria-hidden="true">
                        <Clock className="w-3 h-3 opacity-40" />
                        <span className="text-xs opacity-50">{activity.estimatedMinutes} min</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Launch modal */}
      <Modal
        open={!!launchItem}
        onClose={() => { setLaunchItem(null); setShowCreateClass(false); setNewClassName(''); }}
        title={launchItem ? `Launch ${launchItem.name}` : ''}
      >
        {/* Topic + Difficulty */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-lc-text3 mb-1">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as Topic | '')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-lc-border bg-lc-surface text-lc-text"
            >
              <option value="">General</option>
              {TOPICS.filter((t) => t !== 'General').map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-lc-text3 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-lc-border bg-lc-surface text-lc-text"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-5">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={`Or type a custom topic${selectedTopic ? ` (overrides ${selectedTopic})` : ''}…`}
            className="w-full text-sm px-3 py-2 rounded-lg border border-lc-border bg-lc-surface text-lc-text placeholder:text-lc-text3"
          />
        </div>

        {/* Active session shortcut */}
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

        {/* Class list */}
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
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class name"
                  autoFocus
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-lc-border bg-lc-surface text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-lc-blue/40"
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
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls.id, cls.name)}
                disabled={launching}
                className="w-full text-left px-4 py-3 rounded-lg border border-lc-border bg-lc-surface text-lc-text text-sm font-medium hover:border-lc-blue/50 hover:bg-lc-blue/5 transition-colors disabled:opacity-50"
              >
                {cls.name}
              </button>
            ))}
            <div className="pt-2 border-t border-lc-border mt-2">
              {showCreateClass ? (
                <form onSubmit={handleCreateClass} className="flex gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name"
                    autoFocus
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-lc-border bg-lc-surface text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-lc-blue/40"
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
      </Modal>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
