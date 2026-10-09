import { createServerSupabase } from '@/lib/supabase/server';
import { ClassList } from '@/components/class/class-list';
import { getDepartureBoard } from '@/lib/home-board';

export const dynamic = 'force-dynamic';

// Classes = the hangar: the same rows as the Home board, shown as one boarding pass per class.
export default async function ClassesPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { rows } = await getDepartureBoard(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header className="pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Hangar</p>
        <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">Your <em className="text-amber-300">classes</em></h1>
      </header>
      <ClassList rows={rows} />
    </div>
  );
}
