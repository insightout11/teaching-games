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
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

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

  it('keeps flying the current plane while a plane choice is waiting', async () => {
    state = { current_destination_id: null, range_km: 5200, plane_selection_required: true };
    expect(await (await post('tokyo')).json()).toMatchObject({ movesClass: true });
  });

  it('records the flight as a visit, never as one of the city lessons', async () => {
    await post('tokyo');
    const row = (upsert.mock.calls as unknown as unknown[][])[0][0] as { focus_id: string; evidence_snapshot: { skills: string[]; investigationTags: string[]; keyIdea: unknown } };
    expect(row.focus_id).toBe('live-room');
    expect(row.evidence_snapshot).toMatchObject({ skills: [], investigationTags: [], keyIdea: null });
  });

  const postLesson = (destinationId: string, focusId: string) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ destinationId, focusId }) }), params);
  const lastRow = () => (upsert.mock.calls as unknown as unknown[][])[0][0] as { focus_id: string; moves_class: boolean; distance_km: number; evidence_snapshot: { focusTitle: string; skills: string[] } };

  it('records a chosen city lesson with its real evidence, and moves the class when in range', async () => {
    const focus = WORLD_DESTINATIONS.find((d) => d.id === 'tokyo')!.focusOptions[0];
    expect(await (await postLesson('tokyo', focus.id)).json()).toMatchObject({ movesClass: true, cityLesson: true });
    expect(lastRow()).toMatchObject({ focus_id: focus.id, moves_class: true });
    expect(lastRow().evidence_snapshot.focusTitle).toBe(focus.title);
  });

  it('records a far city lesson as taught from here: evidence kept, class not moved', async () => {
    state = { current_destination_id: 'london', range_km: 500, plane_selection_required: false };
    const focus = WORLD_DESTINATIONS.find((d) => d.id === 'tokyo')!.focusOptions[0];
    expect(await (await postLesson('tokyo', focus.id)).json()).toMatchObject({ movesClass: false, taughtOnly: true });
    expect(lastRow()).toMatchObject({ focus_id: focus.id, moves_class: false, distance_km: 0 });
  });

  it('ignores a lesson id that does not belong to the city', async () => {
    await postLesson('tokyo', 'not-a-tokyo-lesson');
    expect(lastRow().focus_id).toBe('live-room');
  });

  it('rejects unknown destinations', async () => {
    expect((await post('atlantis')).status).toBe(400);
  });
});
