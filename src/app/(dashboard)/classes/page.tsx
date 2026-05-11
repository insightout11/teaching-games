import { createServerSupabase } from '@/lib/supabase/server';
import { ClassList } from '@/components/class/class-list';

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  const supabase = createServerSupabase();
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 pt-6 lg:px-8 lg:pt-8 pb-12 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-lc-text">Your Classes</h1>
      </div>
      <ClassList initialClasses={classes ?? []} />
    </div>
  );
}
