import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/mock/data';

// Mock-mode helper used by the teacher screen to show students who joined
// through the public join flow. Live mode keeps using Supabase directly.
export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true') {
    return NextResponse.json({ participants: [] }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ participants: [] });
  }

  mockStore.ensureSession(sessionId);

  const participants = mockStore
    .getSessionParticipants(sessionId)
    .map(({ id, student_id, display_name, avatar_seed, joined_at }) => ({
      id,
      student_id,
      display_name,
      avatar_seed,
      joined_at,
    }));

  return NextResponse.json({ participants }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
