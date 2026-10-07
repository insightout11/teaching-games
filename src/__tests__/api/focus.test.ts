import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
const update = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })),
  checkAndRecordAiUsage: vi.fn(async () => null),
}));
vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: vi.fn(async (id: string) => ({ session: { id, class_id: 'c1' }, error: null })),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { difficulty: 'Beginner' } }) }) }),
      update: (patch: unknown) => { update(patch); return { eq: async () => ({ error: null }) }; },
    }),
  }),
}));

// A fixed bank for these tests (the real one is src/data/topic-briefings.json, from library round 18).
vi.mock('@/data/topic-briefings.json', () => ({
  default: [{
    id: 'dinosaurs', title: 'Dinosaurs', aliases: ['dinosaur', 't-rex'], ageBand: 'kids',
    levels: { A1: { briefing: 'Dinosaurs lived a very long time ago. Some were big.', facts: ['Some ate plants.'], angles: ['Big or small?'], vocab: [{ word: 'fossil', definition: 'Old bones in rock.' }], expressions: [{ phrase: 'My favourite is…', example: 'My favourite is the T-rex.' }] } },
  }],
}));

import { POST } from '@/app/api/session/[sessionId]/focus/route';

const params = { params: { sessionId: 's1' } };
const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }), params);

describe('focus route', () => {
  beforeEach(() => { aiGen.mockReset(); update.mockReset(); });

  it('briefs the class and writes the topic plus phone reference materials', async () => {
    aiGen.mockResolvedValue({
      briefing: 'Volcanoes are openings in the ground.',
      facts: ['a', 'b', 'c', 'd', 'e', 'f'],
      angles: ['Would you live near one?'],
      vocab: [{ word: 'lava', definition: 'Hot melted rock.' }],
      expressions: [{ phrase: 'I think…', example: 'I think volcanoes are scary.' }],
    });
    const data = await (await post({ title: 'Volcanoes' })).json();
    expect(data.briefing).toContain('Volcanoes');
    expect(data.facts).toHaveLength(5);
    expect(update).toHaveBeenCalledWith({
      custom_topic: 'Volcanoes',
      reference_vocab: [{ word: 'lava', definition: 'Hot melted rock.', source: 'topic' }],
      reference_expressions: [{ phrase: 'I think…', example: 'I think volcanoes are scary.' }],
    });
    expect(aiGen.mock.calls[0][0]).toContain('LANGUAGE RULE');
    expect(aiGen.mock.calls[0][0]).toContain('Beginner');
  });

  it('grounds the briefing on material the class is looking at', async () => {
    aiGen.mockResolvedValue({ briefing: 'x', facts: [], angles: [], vocab: [], expressions: [] });
    await post({ title: 'Why do cities flood?', text: 'Mia asked this after the river video.' });
    expect(aiGen.mock.calls[0][0]).toContain('Mia asked this after the river video.');
  });

  it('still changes the topic when the AI fails', async () => {
    aiGen.mockRejectedValue(new Error('down'));
    expect((await post({ title: 'Robots' })).status).toBe(502);
    expect(update).toHaveBeenCalledWith({ custom_topic: 'Robots' });
  });

  it('uses a banked topic instantly, with no AI call', async () => {
    const data = await (await post({ title: 'T-Rex' })).json();
    expect(aiGen).not.toHaveBeenCalled();
    expect(data.briefing).toContain('Dinosaurs lived');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ custom_topic: 'T-Rex', reference_vocab: [{ word: 'fossil', definition: 'Old bones in rock.', source: 'topic' }] }));
  });

  it('still asks the AI when material is attached, even for a banked topic', async () => {
    aiGen.mockResolvedValue({ briefing: 'x', facts: [], angles: [], vocab: [], expressions: [] });
    await post({ title: 'Dinosaurs', text: 'A museum page about a new fossil.' });
    expect(aiGen).toHaveBeenCalled();
  });

  it('requires a title', async () => {
    expect((await post({ title: '  ' })).status).toBe(400);
  });
});
