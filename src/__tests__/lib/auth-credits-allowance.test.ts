import { beforeEach, describe, expect, it, vi } from 'vitest';

let tier = { credits: 0, is_pro: false, is_developer: false };
let used = 0;
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: async () => ({ data: { user: { id: 't1', email: 'a@b.c' } }, error: null }) } }),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    rpc: async () => ({ data: [{ ...tier, is_verified: true, generations: 0 }], error: null }),
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ gte: async () => ({ count: used, error: null }) }) }) }) }),
  }),
}));

import { requireAuthWithCredits } from '@/lib/auth-credits';

describe('lesson allowance at session start (pricing option B)', () => {
  beforeEach(() => { tier = { credits: 0, is_pro: false, is_developer: false }; used = 0; });

  it('lets a free teacher start lessons while this month has free ones left', async () => {
    used = 2;
    const r = await requireAuthWithCredits();
    expect(r.error).toBeNull();
    expect(r.teacher?.freeLeft).toBe(2);
    expect(r.teacher?.credits).toBe(2);
  });

  it('uses leftover credits after the 4 free lessons', async () => {
    used = 4;
    tier.credits = 3;
    const r = await requireAuthWithCredits();
    expect(r.error).toBeNull();
    expect(r.teacher?.freeLeft).toBe(0);
  });

  it('blocks a free teacher with no free lessons or credits left, with a clear message', async () => {
    used = 4;
    const r = await requireAuthWithCredits();
    expect(r.teacher).toBeNull();
    expect(r.error?.status).toBe(402);
    expect((await r.error!.json()).error).toContain('4 free lessons');
  });

  it('never limits Pro', async () => {
    used = 40;
    tier.is_pro = true;
    expect((await requireAuthWithCredits()).error).toBeNull();
  });
});
