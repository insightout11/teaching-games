import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/debate-board/points?sessionId=...&side=for|against
// Returns the points for one side of a debate prep board. Students poll their own
// side; the teacher board uses realtime instead. `side` is optional — omit to get
// both sides (not used by students, but handy for debugging).

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const side = searchParams.get('side');

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    if (side && side !== 'for' && side !== 'against') {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('debate_points')
      .select('id, client_id, display_name, side, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (side) query = query.eq('side', side);

    const { data, error } = await query;
    if (error) {
      console.error('Debate board points error:', error);
      return NextResponse.json({ error: 'Failed to load points' }, { status: 500 });
    }

    return NextResponse.json({ points: data ?? [] });
  } catch (error) {
    console.error('Debate board points error:', error);
    return NextResponse.json({ error: 'Failed to load points' }, { status: 500 });
  }
}
