import type { createServiceClient } from '@/lib/supabase/service';

// Find-or-create the teacher's hidden demo class — home of the demo crew.
// Used by /api/session/demo (à-la-carte module testing) and /api/demo/class
// (Test Flight launches from the Captain's Flight modal).

const DEMO_CLASS_NAME = 'Demo Class';

// Crew names from the rename era — junk rows that pollute the roster and
// participation views. Swept on demo-class access; cascade removes their
// old scores (demo data only).
const LEGACY_CREW_NAMES = ['Demo Mia', 'Demo Leo', 'Demo Ava', 'Demo Kai'];

type Supabase = ReturnType<typeof createServiceClient>;

export async function ensureDemoClass(
  supabase: Supabase,
  teacherId: string,
): Promise<{ classId: string | null; error: string | null }> {
  const { data: existing } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('is_demo', true)
    .limit(1)
    .maybeSingle();

  let classId = existing?.id as string | undefined;

  if (!classId) {
    const { data: created, error: createError } = await supabase
      .from('classes')
      .insert({ teacher_id: teacherId, name: DEMO_CLASS_NAME, is_demo: true })
      .select('id')
      .single();

    if (createError || !created) {
      return { classId: null, error: createError?.message ?? 'Failed to create demo class' };
    }
    classId = created.id;
  } else {
    // Best-effort sweep of legacy "Demo X" crew rows on reuse.
    await supabase
      .from('students')
      .delete()
      .eq('class_id', classId)
      .in('name', LEGACY_CREW_NAMES);
  }

  return { classId: classId!, error: null };
}
