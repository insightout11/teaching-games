import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isSessionStale } from '@/lib/session-freshness';
import { mockStore } from '@/lib/mock/data';
import { assignSeats, MAX_CABIN_SEATS } from '@/lib/live-room/seats';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isMock = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

type Row = { client_id: string; display_name: string; avatar_seed: string | null; joined_at: string; seat?: number | null };

/** The cabin as the phone's seat map sees it: first names and avatars only, the same people the big screen shows. */
function cabinFor(rows: Row[], clientId: string) {
  const cabin = assignSeats([...rows].sort((a, b) => a.joined_at.localeCompare(b.joined_at)));
  const seats = cabin.flatMap((p, i) => (p ? [{ seat: i, name: p.display_name, avatarSeed: p.avatar_seed, mine: p.client_id === clientId, picked: typeof p.seat === 'number' }] : []));
  return { seats, mine: seats.find((s) => s.mine)?.seat ?? null };
}

async function readRows(sessionId: string): Promise<Row[] | null> {
  if (isMock()) return mockStore.getSessionParticipants(sessionId);
  const read = (columns: string) => createServiceClient().from('session_participants').select(columns).eq('session_id', sessionId);
  let { data, error } = await read('client_id, display_name, avatar_seed, joined_at, seat');
  if (error) ({ data, error } = await read('client_id, display_name, avatar_seed, joined_at')); // before migration 069
  return error ? null : (data as unknown as Row[]);
}

// GET /api/student/seat?sessionId&clientId: the seat map for a student aboard this session.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') ?? '', clientId = searchParams.get('clientId') ?? '';
  if (!uuid.test(sessionId) || !uuid.test(clientId)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const rows = await readRows(sessionId);
  if (!rows) return NextResponse.json({ error: 'Failed to load seats' }, { status: 500 });
  if (!rows.some((r) => r.client_id === clientId)) return NextResponse.json({ error: 'Not aboard' }, { status: 403 });
  return NextResponse.json(cabinFor(rows, clientId), { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/student/seat { sessionId, clientId, seat }: pick a free seat (first tap wins).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { sessionId?: unknown; clientId?: unknown; seat?: unknown } | null;
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  const clientId = typeof body?.clientId === 'string' ? body.clientId : '';
  const seat = typeof body?.seat === 'number' && Number.isInteger(body.seat) ? body.seat : -1;
  if (!uuid.test(sessionId) || !uuid.test(clientId) || seat < 0 || seat >= MAX_CABIN_SEATS) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const rows = await readRows(sessionId);
  if (!rows) return NextResponse.json({ error: 'Failed to load seats' }, { status: 500 });
  const me = rows.find((r) => r.client_id === clientId);
  if (!me) return NextResponse.json({ error: 'Not aboard' }, { status: 403 });
  // Taken by someone else as the cabin stands now (a picked seat, or a boarding-order seat already filled)
  const current = cabinFor(rows, clientId).seats.find((s) => s.seat === seat);
  if (current && !current.mine) return NextResponse.json({ error: 'taken', ...cabinFor(rows, clientId) }, { status: 409 });

  if (isMock()) {
    (me as Row).seat = seat;
    return NextResponse.json(cabinFor(rows, clientId));
  }
  const service = createServiceClient();
  const { data: session } = await service.from('sessions').select('status, started_at').eq('id', sessionId).maybeSingle();
  if (!session || session.status !== 'active' || isSessionStale(session.started_at)) {
    return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
  }
  const { error } = await service.from('session_participants').update({ seat }).eq('session_id', sessionId).eq('client_id', clientId);
  // 23505 = someone took it a moment earlier (unique index in migration 069)
  if (error) {
    const fresh = await readRows(sessionId);
    return NextResponse.json({ error: error.code === '23505' ? 'taken' : 'Failed to pick seat', ...(fresh ? cabinFor(fresh, clientId) : {}) }, { status: error.code === '23505' ? 409 : 500 });
  }
  const fresh = await readRows(sessionId);
  return NextResponse.json(fresh ? cabinFor(fresh, clientId) : { seats: [], mine: seat });
}
