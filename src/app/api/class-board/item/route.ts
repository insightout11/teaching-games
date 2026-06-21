import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { type ClassBoardVisibility } from '@/lib/class-board';

export const dynamic = 'force-dynamic';

interface UpdateRequest {
  sessionId: string;
  itemId: string;
  content?: string;
  category?: string;
  zoneKey?: string;
  visibility?: ClassBoardVisibility;
  pinned?: boolean;
  position?: number;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CONTENT_LENGTH = 500;
const VALID_VISIBILITY = new Set<ClassBoardVisibility>(['pending', 'visible', 'hidden']);

function cleanKey(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
}

async function requireTeacherSession(sessionId: string) {
  const authClient = createServerSupabase();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, class_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  }

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (classError || !cls || cls.teacher_id !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase };
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as UpdateRequest;
    const { sessionId, itemId } = body;

    if (!sessionId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(itemId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }
    if (body.content !== undefined && body.content.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer` }, { status: 400 });
    }
    if (body.visibility && !VALID_VISIBILITY.has(body.visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }

    const auth = await requireTeacherSession(sessionId);
    if ('error' in auth) return auth.error;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.content !== undefined) update.content = body.content.trim();
    if (body.category !== undefined) update.category = cleanKey(body.category) ?? 'idea';
    if (body.zoneKey !== undefined) update.zone_key = cleanKey(body.zoneKey) ?? 'main';
    if (body.visibility !== undefined) update.visibility = body.visibility;
    if (body.pinned !== undefined) update.pinned = body.pinned;
    if (body.position !== undefined && Number.isFinite(body.position)) update.position = Math.trunc(body.position);

    const { data: item, error: updateError } = await auth.supabase
      .from('class_board_items')
      .update(update)
      .eq('id', itemId)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError || !item) {
      console.error('Class Board item update error:', updateError);
      return NextResponse.json({ error: 'Failed to update board item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Class Board item route error:', error);
    return NextResponse.json({ error: 'Failed to update board item' }, { status: 500 });
  }
}
