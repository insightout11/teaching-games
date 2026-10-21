import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ai: vi.fn(), wiki: vi.fn(), pictures: vi.fn(), usage: vi.fn(), update: vi.fn(), upsert: vi.fn(),
  auth: vi.fn(), ownership: vi.fn(), difficulty: 'Beginner', junior: false,
}));
vi.mock('@/lib/ai', () => ({ generateJSON: mocks.ai }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: mocks.auth, checkAndRecordAiUsage: mocks.usage }));
vi.mock('@/lib/session-ownership', () => ({ verifyTeacherOwnsSession: mocks.ownership }));
vi.mock('@/lib/sources/wikipedia', () => ({ lookupWikipedia: mocks.wiki }));
vi.mock('@/lib/sources/wikimedia-images', () => ({ freePictures: mocks.pictures }));
vi.mock('@/lib/supabase/realtime-broadcast', () => ({ broadcastInputSpecFromServer: vi.fn(async () => null) }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { difficulty: mocks.difficulty, classes: { junior: mocks.junior } } }) }) }),
    update: (patch: unknown) => { mocks.update(patch); return { eq: async () => ({ error: null }) }; },
    upsert: mocks.upsert,
  }) }),
}));

import { POST as focus } from '@/app/api/session/[sessionId]/focus/route';
import { POST as moment } from '@/app/api/live-room/moment/route';
import { findRoutePlaceBriefing } from '@/lib/topic-briefings';

const request = (body: unknown) => new Request('http://localhost/test', { method: 'POST', body: JSON.stringify(body) });
const postFocus = (body: unknown) => focus(request(body), { params: { sessionId: 'session-test' } });
const paris = findRoutePlaceBriefing('Paris')!;
// Exact photos are static data until the separate room integration. Keep
// asserting the current API's authored prose and fallback search contract.
const publicCards = (cards: NonNullable<typeof paris.levels.B1.cards>) => cards.map(({ headline, detail, questions, picture, pictureFile }) => ({ headline, detail, questions, picture, ...(pictureFile ? { pictureFile } : {}) }));
const photo = { url: 'https://example.test/paris.jpg', title: 'Paris', source: 'Wikimedia' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.difficulty = 'Beginner'; mocks.junior = false;
  mocks.auth.mockResolvedValue({ teacher: { id: 'teacher-test' }, error: null });
  mocks.ownership.mockResolvedValue({ session: { id: 'session-test' }, error: null });
  mocks.usage.mockResolvedValue(null);
  mocks.wiki.mockResolvedValue(null);
  mocks.pictures.mockResolvedValue([photo]);
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.ai.mockResolvedValue({ briefing: 'A live briefing about the requested place.', facts: ['A live fact.'], angles: ['What would you explore?'], vocab: [], expressions: [] });
});

describe('focus route checked places', () => {
  it.each([['Beginner', 'A1'], ['Easy', 'B1'], ['Intermediate', 'B1'], ['Advanced', 'B1'], ['A1', 'A1']])('returns %s cards with no AI, lookup or usage charge', async (difficulty, level) => {
    mocks.difficulty = difficulty;
    const response = await postFocus({ title: 'THE pArIs' });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.cards).toEqual(publicCards(paris.levels[level].cards!));
    expect(data.facts).toEqual(paris.levels[level].facts);
    expect(mocks.ai).not.toHaveBeenCalled();
    expect(mocks.wiki).not.toHaveBeenCalled();
    expect(mocks.usage).not.toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      key: 'facts', payload: { title: 'THE pArIs', cards: paris.levels[level].cards!.map(c => ({ headline: c.headline, detail: c.detail })) },
    }), expect.anything());
  });

  it('does not choose an easier level just because the class is Junior', async () => {
    mocks.difficulty = 'Easy'; mocks.junior = true;
    expect((await (await postFocus({ title: 'Paris' })).json()).cards).toEqual(publicCards(paris.levels.B1.cards!));
  });

  it.each(['Pariss', 'Paris suburbs', 'Cordillera Oriental'])('keeps the existing AI fallback for %s', async title => {
    expect((await postFocus({ title, where: 'Europe' })).status).toBe(200);
    expect(mocks.ai).toHaveBeenCalledTimes(1);
    expect(mocks.usage).toHaveBeenCalledTimes(1);
    expect(mocks.wiki).toHaveBeenCalledWith(title, 'Europe');
    expect(mocks.ai.mock.calls[0][0]).toContain(title);
  });

  it('preserves attached-material generation for a known place', async () => {
    await postFocus({ title: 'Paris', text: 'A class reading about the river.' });
    expect(mocks.ai).toHaveBeenCalledTimes(1);
    expect(mocks.ai.mock.calls[0][0]).toContain('A class reading about the river.');
  });

  it('still checks ownership before using the bank', async () => {
    mocks.ownership.mockResolvedValue({ error: new Response('Forbidden', { status: 403 }) });
    expect((await postFocus({ title: 'Paris' })).status).toBe(403);
    expect(mocks.ai).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('moment route checked places', () => {
  it('returns B1 headlines and the first card photo, without Wikipedia or AI', async () => {
    const response = await moment(request({ title: 'THE pArIs', kind: 'city' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ facts: paris.levels.B1.facts, picture: photo });
    expect(mocks.pictures).toHaveBeenCalledWith(paris.levels.B1.cards![0].picture, 1, { strict: true });
    expect(mocks.wiki).not.toHaveBeenCalled();
    expect(mocks.ai).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
  });

  it('still returns ready facts when the free photo lookup fails', async () => {
    mocks.pictures.mockRejectedValue(new Error('offline'));
    expect(await (await moment(request({ title: 'Paris' }))).json()).toEqual({ facts: paris.levels.B1.facts, picture: null });
  });

  it('keeps the existing free Wikipedia fallback for an unknown place', async () => {
    // This route has no AI fallback on origin/main. Preserve that behavior.
    mocks.wiki.mockResolvedValue({ text: 'This is a long enough live sentence. This is another source sentence.' });
    const data = await (await moment(request({ title: 'the Paris suburbs' }))).json();
    expect(data.facts).toEqual(['This is a long enough live sentence.', 'This is another source sentence.']);
    expect(mocks.wiki).toHaveBeenCalledWith('Paris suburbs');
    expect(mocks.pictures).toHaveBeenCalledWith('Paris suburbs', 1);
    expect(mocks.ai).not.toHaveBeenCalled();
  });

  it('keeps event handling even if its title matches a place', async () => {
    expect((await (await moment(request({ title: 'Paris', kind: 'event' }))).json()).facts).toEqual([]);
    expect(mocks.wiki).not.toHaveBeenCalled();
    expect(mocks.pictures).toHaveBeenCalledWith('Paris', 1);
  });

  it('requires authentication before either bank or picture lookup', async () => {
    mocks.auth.mockResolvedValue({ teacher: null, error: null });
    expect((await moment(request({ title: 'Paris' }))).status).toBe(401);
    expect(mocks.pictures).not.toHaveBeenCalled();
  });
});
