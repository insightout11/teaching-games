'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
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
type PppFilter = 'all' | 'presentation' | 'practice' | 'production';

interface Class {
  id: string;
  name: string;
}

interface ActiveSession {
  sessionId: string;
  className: string;
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
  const [pppFilter, setPppFilter] = useState<PppFilter>('all');
  const [launchItem, setLaunchItem] = useState<{ name: string; key: string; type: 'game' | 'activity' } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Intermediate');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Read persisted settings + active session from localStorage on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem('lc-explore-session');
      if (session) setActiveSession(JSON.parse(session));
      const settings = localStorage.getItem('lc-explore-settings');
      if (settings) {
        const { topic, difficulty } = JSON.parse(settings);
        if (topic !== undefined) setSelectedTopic(topic);
        if (difficulty !== undefined) setSelectedDifficulty(difficulty);
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
    localStorage.setItem('lc-explore-settings', JSON.stringify({ topic: selectedTopic, difficulty: selectedDifficulty }));
    sessionStorage.setItem(
      'lessonPlanContent',
      JSON.stringify({
        customTopic: selectedTopic,
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

  const showGames = filter === 'all' || filter === 'games';
  const showActivities = filter === 'all' || filter === 'activities';

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

  const gameCategoryOrder: GameCategory[] = ['vocabulary', 'grammar-writing', 'logic-puzzles'];
  const activityCategoryOrder: ActivityCategory[] = ['icebreaker', 'learning', 'practice', 'debate', 'closing'];

  return (
    <div className="hud-bg -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-6 lg:px-8 lg:pt-8 pb-12 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lc-text">Explore</h1>
        <p className="text-lc-text2 mt-1">Run a game or activity with your class</p>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'games', 'activities'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize',
              filter === tab
                ? 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
            )}
          >
            {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
          </button>
        ))}
      </div>

      {/* PPP stage filter */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs text-lc-text3 uppercase tracking-wider font-semibold mr-1">Stage:</span>
        {(['all', 'presentation', 'practice', 'production'] as PppFilter[]).map((stage) => (
          <button
            key={stage}
            onClick={() => setPppFilter(stage)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              pppFilter === stage
                ? stage === 'presentation' ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                  : stage === 'practice' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : stage === 'production' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-lc-blue/10 text-lc-blue border-lc-blue/30'
                : 'bg-transparent text-lc-text2 border-lc-border hover:border-lc-text3'
            }`}
          >
            {stage === 'all' ? 'All' : stage.charAt(0).toUpperCase() + stage.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Games */}
        {showGames && gameCategoryOrder.map((cat) => {
          const allCatGames = gamesByCategory[cat];
          if (!allCatGames?.length) return null;
          const catGames = pppFilter === 'all' ? allCatGames : allCatGames.filter((g) => g.pppStage === pppFilter);
          if (!catGames.length) return null;
          const info = GAME_CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} />
                <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                <span className="text-xs text-lc-text3 mr-1">— Games</span>
                <div className="hud-rule" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catGames.map((game) => {
                  const GameIcon = game.icon;
                  const stageBadge = getStageBadge(game.pppStage);
                  return (
                    <button
                      key={game.key}
                      onClick={() => setLaunchItem({ name: game.name, key: game.key, type: 'game' })}
                      className="panel-card p-6 text-left transition-all w-full"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GameIcon className={`w-5 h-5 ${info.color}`} />
                        <h3 className="font-semibold">{game.name}</h3>
                        {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                      </div>
                      <p className="text-sm opacity-70 mt-1">{game.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {game.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text3 rounded-full">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="text-xs opacity-50">~{game.estimatedMinutes} min</span>
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
          const catActivities = pppFilter === 'all' ? allCatActivities : allCatActivities.filter((a) => a.pppStage === pppFilter);
          if (!catActivities.length) return null;
          const info = CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                <CatIcon className={`w-4 h-4 ${info.color}`} />
                <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>{info.name}</span>
                <span className="text-xs text-lc-text3 mr-1">— Activities</span>
                <div className="hud-rule" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catActivities.map((activity) => {
                  const ActivityIcon = activity.icon;
                  const stageBadge = getStageBadge(activity.pppStage);
                  return (
                    <button
                      key={activity.key}
                      onClick={() => setLaunchItem({ name: activity.name, key: activity.key, type: 'activity' })}
                      className="panel-card p-6 text-left transition-all w-full"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ActivityIcon className={`w-5 h-5 ${info.color}`} />
                        <h3 className="font-semibold">{activity.name}</h3>
                        {stageBadge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>}
                      </div>
                      <p className="text-sm opacity-70 mt-2">{activity.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {activity.skills.map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-lc-border text-lc-text3 rounded-full">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="text-xs opacity-50">~{activity.estimatedMinutes} min</span>
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
        onClose={() => setLaunchItem(null)}
        title={launchItem ? `Launch ${launchItem.name}` : ''}
      >
        {/* Topic + Difficulty */}
        <div className="flex gap-3 mb-5">
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
            <Link
              href="/classes"
              className="text-lc-blue hover:underline font-medium"
              onClick={() => setLaunchItem(null)}
            >
              Create a class first →
            </Link>
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
              <Link
                href="/classes"
                className="text-sm text-lc-text3 hover:text-lc-blue transition-colors"
                onClick={() => setLaunchItem(null)}
              >
                + New class
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
