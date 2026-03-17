'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { GAME_CATEGORY_INFO } from '@/games/registry';
import { CATEGORY_INFO } from '@/activities/registry';
import type { GameCategory } from '@/games/types';
import type { ActivityCategory } from '@/activities/types';

type FilterTab = 'all' | 'games' | 'activities';

interface Class {
  id: string;
  name: string;
}

interface ExploreClientProps {
  games: GamePlugin[];
  activities: ActivityPlugin[];
}

export function ExploreClient({ games, activities }: ExploreClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
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
      .then(({ data }) => {
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lc-text">Explore</h1>
        <p className="text-lc-text3 mt-1">Run a game or activity with your class</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8">
        {(['all', 'games', 'activities'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
              filter === tab
                ? 'bg-lc-blue text-white'
                : 'bg-lc-card text-lc-text3 hover:text-lc-text border border-lc-border'
            )}
          >
            {tab === 'all' ? 'All' : tab === 'games' ? 'Games' : 'Activities'}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {/* Games */}
        {showGames && gameCategoryOrder.map((cat) => {
          const catGames = gamesByCategory[cat];
          if (!catGames?.length) return null;
          const info = GAME_CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className={cn('w-4 h-4', info.color)} />
                <h2 className="text-sm font-semibold text-lc-text uppercase tracking-wider">{info.name}</h2>
                <span className="text-xs text-lc-text3 ml-1">— Games</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catGames.map((game) => {
                  const GameIcon = game.icon;
                  return (
                    <div
                      key={game.key}
                      className="bg-lc-card border border-lc-border rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', info.color)}>
                          <GameIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lc-text text-sm leading-snug">{game.name}</div>
                          <div className="text-xs text-lc-text3 mt-0.5">{info.name} · {game.estimatedMinutes}m</div>
                        </div>
                      </div>
                      <p className="text-xs text-lc-text3 leading-relaxed flex-1">{game.description}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setLaunchItem({ name: game.name })}
                          className="text-xs font-medium text-lc-blue hover:text-lc-blue/80 transition-colors"
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
          const catActivities = activitiesByCategory[cat];
          if (!catActivities?.length) return null;
          const info = CATEGORY_INFO[cat];
          const CatIcon = info.icon;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className={cn('w-4 h-4', info.color)} />
                <h2 className="text-sm font-semibold text-lc-text uppercase tracking-wider">{info.name}</h2>
                <span className="text-xs text-lc-text3 ml-1">— Activities</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catActivities.map((activity) => {
                  const ActivityIcon = activity.icon;
                  return (
                    <div
                      key={activity.key}
                      className="bg-lc-card border border-lc-border rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', info.color)}>
                          <ActivityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-lc-text text-sm leading-snug">{activity.name}</div>
                          <div className="text-xs text-lc-text3 mt-0.5">{info.name} · {activity.estimatedMinutes}m</div>
                        </div>
                      </div>
                      <p className="text-xs text-lc-text3 leading-relaxed flex-1">{activity.description}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setLaunchItem({ name: activity.name })}
                          className="text-xs font-medium text-lc-blue hover:text-lc-blue/80 transition-colors"
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
