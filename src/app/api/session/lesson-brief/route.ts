import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';

export const dynamic = 'force-dynamic';

// POST /api/session/lesson-brief
// The launch flow persists a compact, server-readable summary of what this
// lesson IS (goal, plan stages, source material) so separate-device features —
// the cockpit's captain suggestions above all — can ground themselves in the
// actual lesson instead of a bare topic string. Stored in session_private_state
// key 'lesson-brief' (no migration; topic/difficulty/vocab already live on the
// sessions row itself).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LessonBrief {
  goal?: string;
  stages?: Array<{ key: string; label: string }>;
  sourceTitle?: string;
  sourceSummary?: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function sanitizeBrief(raw: unknown): LessonBrief {
  if (!raw || typeof raw !== 'object') return {};
  const brief = raw as Record<string, unknown>;

  const stages: Array<{ key: string; label: string }> = [];
  for (const stage of Array.isArray(brief.stages) ? brief.stages : []) {
    if (!stage || typeof stage !== 'object') continue;
    const key = cleanText((stage as Record<string, unknown>).key, 80);
    const label = cleanText((stage as Record<string, unknown>).label, 60);
    if (!key && !label) continue;
    stages.push({ key, label: label || key });
    if (stages.length >= 12) break;
  }

  const goal = cleanText(brief.goal, 200);
  const sourceTitle = cleanText(brief.sourceTitle, 140);
  const sourceSummary = cleanText(brief.sourceSummary, 900);

  return {
    ...(goal ? { goal } : {}),
    ...(stages.length > 0 ? { stages } : {}),
    ...(sourceTitle ? { sourceTitle } : {}),
    ...(sourceSummary ? { sourceSummary } : {}),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json() as { sessionId?: unknown; brief?: unknown };
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      return NextResponse.json({ ok: true });
    }

    const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
    if (ownership.error) return ownership.error;

    const brief = sanitizeBrief(body.brief);
    if (Object.keys(brief).length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('session_private_state')
      .upsert(
        { session_id: sessionId, key: 'lesson-brief', payload: brief, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,key' },
      );

    if (error) {
      console.error('[lesson-brief POST] upsert error:', error);
      return NextResponse.json({ error: 'Failed to write lesson brief' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[lesson-brief POST] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
