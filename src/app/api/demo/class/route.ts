import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { ensureDemoClass } from '@/lib/demo-class';

export const dynamic = 'force-dynamic';

// POST /api/demo/class
// Returns the teacher's hidden demo class id (creating it on first use) so
// the Captain's Flight launcher can run a Test Flight: the full preset lesson
// launched against the demo class, with the demo crew answering instead of
// real students. Session creation itself goes through the normal launch path
// (credits and all) — this route only resolves the destination class.
export async function POST() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ error: 'Demo class is unavailable in mock mode' }, { status: 503 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const supabase = createServiceClient();
  const { classId, error } = await ensureDemoClass(supabase, teacher.id);

  if (error || !classId) {
    return NextResponse.json({ error: error ?? 'Failed to resolve demo class' }, { status: 500 });
  }

  return NextResponse.json({ classId });
}
