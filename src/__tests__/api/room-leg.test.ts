import { beforeEach, describe, expect, it, vi } from 'vitest';

let state: Record<string, unknown> | null = null;
let journey: Array<{ origin_destination_id: string | null; destination_id: string }> = [];
const upsert = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));
vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: vi.fn(async (id: string) => ({ session: { id, class_id: 'c1', status: 'active' }, error: null })),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) => table === 'class_world_flight_state'
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state }) }) }) }
      : {
        upsert,
        select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: journey }) }) }) }) }),
      },
  }),
}));

import { GET, POST } from '@/app/api/session/[sessionId]/room-leg/route';

const params = { params: { sessionId: 's1' } };
const post = (destinationId: string) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ destinationId }) }), params);

describe('room-leg route', () => {
  beforeEach(() => { upsert.mockClear(); state = null; });

  it('reports the class position (LC International before the first flight)', async () => {
    const res = await GET(new Request('http://x'), params);
    expect(await res.json()).toMatchObject({ currentDestinationId: null, planeSelectionRequired: false });
  });

  it('lists the completed journey, oldest first', async () => {
    journey = [{ origin_destination_id: null, destination_id: 'lisbon' }, { origin_destination_id: 'lisbon', destination_id: 'madrid' }];
    const res = await GET(new Request('http://x'), params);
    expect((await res.json()).journey).toEqual([{ from: null, to: 'lisbon' }, { from: 'lisbon', to: 'madrid' }]);
    journey = [];
  });

  it('records a leg on the first flight', async () => {
    const res = await post('tokyo');
    expect(await res.json()).toMatchObject({ movesClass: true });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ class_id: 'c1', session_id: 's1', destination_id: 'tokyo', origin_destination_id: null, status: 'planned' }), { onConflict: 'session_id' });
  });

  it('does not move the class beyond the plane range', async () => {
    state = { current_destination_id: 'lisbon', range_km: 500, plane_selection_required: false };
    expect(await (await post('tokyo')).json()).toMatchObject({ movesClass: false, reason: 'out-of-range' });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('does not move the class while a plane choice is pending', async () => {
    state = { current_destination_id: null, range_km: 5200, plane_selection_required: true };
    expect(await (await post('tokyo')).json()).toMatchObject({ movesClass: false, reason: 'plane-selection-required' });
  });

  it('rejects unknown destinations', async () => {
    expect((await post('atlantis')).status).toBe(400);
  });
});
