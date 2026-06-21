import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeClassBoardKey } from '@/lib/class-board';

export const dynamic = 'force-dynamic';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ClassBoardItemRow = {
  id: string;
  session_id: string;
  board_key: string;
  author_type: 'teacher' | 'student';
  client_id: string | null;
  display_name: string;
  category: string;
  zone_key: string;
  content: string;
  visibility: 'pending' | 'visible' | 'hidden';
  pinned: boolean;
  position: number;
  created_at: string;
  metadata?: { answer?: string; answerType?: string; answeredAt?: string; parentId?: string } | null;
  class_board_votes?: { count: number }[];
};

function mapItem(row: ClassBoardItemRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    boardKey: row.board_key,
    authorType: row.author_type,
    clientId: row.client_id,
    displayName: row.display_name,
    category: row.category,
    zoneKey: row.zone_key,
    content: row.content,
    visibility: row.visibility,
    pinned: row.pinned,
    position: row.position,
    createdAt: row.created_at,
    voteCount: row.class_board_votes?.[0]?.count ?? 0,
    answer: row.metadata?.answer ?? null,
    answerType: row.metadata?.answerType ?? null,
    answeredAt: row.metadata?.answeredAt ?? null,
    parentId: row.metadata?.parentId ?? null,
  };
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const boardKey = normalizeClassBoardKey(searchParams.get('boardKey'));

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const auth = await requireTeacherSession(sessionId);
    if ('error' in auth) return auth.error;

    const { data, error } = await auth.supabase
      .from('class_board_items')
      .select('id, session_id, board_key, author_type, client_id, display_name, category, zone_key, content, visibility, pinned, position, created_at, metadata, class_board_votes(count)')
      .eq('session_id', sessionId)
      .eq('board_key', boardKey)
      .neq('visibility', 'hidden')
      .order('pinned', { ascending: false })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Class Board items load error:', error);
      return NextResponse.json({ error: 'Failed to load board items' }, { status: 500 });
    }

    return NextResponse.json({ items: ((data ?? []) as unknown as ClassBoardItemRow[]).map(mapItem) });
  } catch (error) {
    console.error('Class Board items route error:', error);
    return NextResponse.json({ error: 'Failed to load board items' }, { status: 500 });
  }
}
