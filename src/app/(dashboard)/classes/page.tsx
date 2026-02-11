import { createServerSupabase } from '@/lib/supabase/server';
import { ClassList } from '@/components/class/class-list';

export default async function ClassesPage() {
  const supabase = createServerSupabase();
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-lc-text">Your Classes</h1>
      </div>
      <ClassList initialClasses={classes ?? []} />
    </div>
  );
}
