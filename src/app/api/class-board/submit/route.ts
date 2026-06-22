import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';
import { normalizeClassBoardKey, type ClassBoardVisibility } from '@/lib/class-board';
import { isProfane } from '@/lib/profanity';

export const dynamic = 'force-dynamic';

interface SubmitRequest {
  sessionId: string;
  boardKey?: string;
  authorType?: 'teacher' | 'student';
  clientId?: string | null;
  displayName: string;
  content: string;
  category?: string;
  zoneKey?: string;
  visibility?: ClassBoardVisibility;
  position?: number;
  parentId?: string;
  wordCloud?: boolean;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CONTENT_LENGTH = 500;
const MAX_ITEMS_PER_STUDENT = 20;

function cleanKey(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
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
    .select('id, class_id, status, started_at')
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

  if (session.status !== 'active' || isSessionStale(session.started_at)) {
    return { error: NextResponse.json({ error: 'Session is not active' }, { status: 400 }) };
  }

  return { supabase };
}

async function requireStudentSession(sessionId: string, clientId: string) {
  const supabase = createServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status, started_at')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  }
  if (session.status !== 'active' || isSessionStale(session.started_at)) {
    return { error: NextResponse.json({ error: 'Session is not active' }, { status: 400 }) };
  }

  const { data: participant } = await supabase
    .from('session_participants')
    .select('client_id')
    .eq('session_id', sessionId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (!participant) {
    return { error: NextResponse.json({ error: 'Join the session first' }, { status: 403 }) };
  }

  return { supabase };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitRequest;
    const authorType = body.authorType === 'teacher' ? 'teacher' : 'student';
    const boardKey = normalizeClassBoardKey(body.boardKey);
    const sessionId = body.sessionId;
    const content = body.content?.trim();
    const displayName = body.displayName?.trim() || (authorType === 'teacher' ? 'Teacher' : 'Student');
    const category = cleanKey(body.category, 'idea');
    const zoneKey = cleanKey(body.zoneKey, 'main');

    if (!sessionId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }
    if (authorType === 'student' && (!body.clientId || !uuidRegex.test(body.clientId))) {
      return NextResponse.json({ error: 'Invalid clientId format' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer` }, { status: 400 });
    }
    // Word Cloud: silently drop obvious profanity so it never reaches the screen.
    // Reported as success so the student isn't tipped off; the word simply never appears.
    if (body.wordCloud && isProfane(content)) {
      return NextResponse.json({ success: true, filtered: true });
    }

    const auth = authorType === 'teacher'
      ? await requireTeacherSession(sessionId)
      : await requireStudentSession(sessionId, body.clientId!);
    if ('error' in auth) return auth.error;

    if (authorType === 'student') {
      const { count } = await auth.supabase
        .from('class_board_items')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('board_key', boardKey)
        .eq('client_id', body.clientId!);

      if ((count ?? 0) >= MAX_ITEMS_PER_STUDENT) {
        return NextResponse.json({ error: 'Board item limit reached for this session' }, { status: 429 });
      }
    }

    const visibility = authorType === 'teacher'
      ? body.visibility === 'pending' ? 'pending' : 'visible'
      : 'pending';
    const position = Number.isFinite(body.position) ? Math.max(0, Math.trunc(body.position!)) : 0;
    const parentId = body.parentId && uuidRegex.test(body.parentId) ? body.parentId : undefined;
    const metadata = parentId ? { parentId } : {};

    const { data: item, error: insertError } = await auth.supabase
      .from('class_board_items')
      .insert({
        session_id: sessionId,
        board_key: boardKey,
        author_type: authorType,
        client_id: authorType === 'student' ? body.clientId! : null,
        display_name: displayName.slice(0, 80),
        category,
        zone_key: zoneKey,
        content,
        visibility,
        position,
        metadata,
      })
      .select()
      .single();

    if (insertError || !item) {
      console.error('Class Board submit error:', insertError);
      return NextResponse.json({ error: 'Failed to submit board item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Class Board submit route error:', error);
    return NextResponse.json({ error: 'Failed to submit board item' }, { status: 500 });
  }
}
