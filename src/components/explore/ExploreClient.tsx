'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

type FilterTab = 'all' | 'games' | 'activities';
type PppFilter = 'all' | 'presentation' | 'practice' | 'production';

interface Class {
  id: string;
  name: string;
}

function getStageBadge(stage: string | undefined) {
  if (stage === 'presentation') return { label: 'Present', cls: 'bg-violet-500/15 text-violet-300' };
  if (stage === 'practice') return { label: 'Practice', cls: 'bg-sky-500/15 text-sky-300' };
  if (stage === 'production') return { label: 'Produce', cls: 'bg-emerald-500/15 text-emerald-300' };
  return null;
}

export function ExploreClient() {
  const games: GamePlugin[] = getAllGames();
  const activities: ActivityPlugin[] = getAllActivities();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [pppFilter, setPppFilter] = useState<PppFilter>('all');
  const [launchItem, setLaunchItem] = useState<{ name: string } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

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

  function handleSelectClass(classId: string) {
    router.push(`/classes/${classId}`);
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
        <h1 className="text-2xl font-bold text-white">Explore</h1>
        <p className="text-white/50 mt-1">Run a game or activity with your class</p>
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
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
            )}
          >
            {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
          </button>
        ))}
      </div>

      {/* PPP stage filter */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs text-white/40 uppercase tracking-wider font-semibold mr-1">Stage:</span>
        {(['all', 'presentation', 'practice', 'production'] as PppFilter[]).map((stage) => (
          <button
            key={stage}
            onClick={() => setPppFilter(stage)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              pppFilter === stage
                ? stage === 'presentation' ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                  : stage === 'practice' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : stage === 'production' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 text-white border-white/20'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
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
                <span className="text-xs text-white/30 mr-1">— Games</span>
                <div className="hud-rule" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catGames.map((game) => {
                  const GameIcon = game.icon;
                  const stageBadge = getStageBadge(game.pppStage);
                  return (
                    <div key={game.key} className="panel-card p-5 text-left flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', info.color)}>
                          <GameIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm leading-snug">{game.name}</span>
                            {stageBadge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">{info.name} · {game.estimatedMinutes}m</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed flex-1">{game.description}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setLaunchItem({ name: game.name })}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Launch →
                        </button>
                      </div>
                    </div>
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
                <span className="text-xs text-white/30 mr-1">— Activities</span>
                <div className="hud-rule" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catActivities.map((activity) => {
                  const ActivityIcon = activity.icon;
                  const stageBadge = getStageBadge(activity.pppStage);
                  return (
                    <div key={activity.key} className="panel-card p-5 text-left flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', info.color)}>
                          <ActivityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm leading-snug">{activity.name}</span>
                            {stageBadge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageBadge.cls}`}>{stageBadge.label}</span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">{info.name} · {activity.estimatedMinutes}m</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed flex-1">{activity.description}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setLaunchItem({ name: activity.name })}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Launch →
                        </button>
                      </div>
                    </div>
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
        <p className="text-sm text-lc-text3 mb-4">Select a class to launch this with:</p>
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
                onClick={() => handleSelectClass(cls.id)}
                className="w-full text-left px-4 py-3 rounded-lg border border-lc-border bg-lc-surface text-lc-text text-sm font-medium hover:border-lc-blue/50 hover:bg-lc-blue/5 transition-colors"
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
