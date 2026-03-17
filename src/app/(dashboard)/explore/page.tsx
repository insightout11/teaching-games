export const dynamic = 'force-dynamic';

import { getAllGames } from '@/games/registry';
import { getAllActivities } from '@/activities/registry';
import { ExploreClient } from '@/components/explore/ExploreClient';

export default function ExplorePage() {
  const games = getAllGames();
  const activities = getAllActivities();
  return <ExploreClient games={games} activities={activities} />;
}
