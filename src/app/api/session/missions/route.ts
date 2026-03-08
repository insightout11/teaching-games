import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('session_missions')
      .select('client_id, mission_text')
      .eq('session_id', sessionId);

    if (error) {
      console.error('[session/missions] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }

    return NextResponse.json({ missions: data || [] });
  } catch (error) {
    console.error('[session/missions] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId: string; clientId: string; missionText: string };
    const { sessionId, clientId, missionText } = body;

    if (!sessionId || !clientId || !missionText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('session_missions')
      .upsert({ session_id: sessionId, client_id: clientId, mission_text: missionText }, { onConflict: 'session_id,client_id' });

    if (error) {
      console.error('[session/missions] upsert error:', error);
      return NextResponse.json({ error: 'Failed to save mission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[session/missions] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
