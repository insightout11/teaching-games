export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { DepartureBoard } from '@/components/home/departure-board';
import { getDepartureBoard } from '@/lib/home-board';

// Home = the departures board: one row per class, one click to a live class (docs/home-page-concept.md).
// The flight shelves that used to live here are on /flights.
export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const rows = await getDepartureBoard(user.id);
  return <DepartureBoard rows={rows} />;
}
