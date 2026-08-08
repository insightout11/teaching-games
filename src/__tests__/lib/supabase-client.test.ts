import { beforeEach, describe, expect, it, vi } from 'vitest';

const createBrowserClient = vi.fn(() => ({ client: 'browser' }));

vi.mock('@supabase/ssr', () => ({ createBrowserClient }));
vi.mock('@/lib/mock/auth', () => ({ isMockMode: () => false }));
vi.mock('@/lib/mock/client', () => ({ createMockClient: vi.fn() }));

describe('browser Supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserClient.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('reuses one browser client across hooks and components', async () => {
    const { createClient } = await import('@/lib/supabase/client');

    const first = createClient();
    const second = createClient();

    expect(first).toBe(second);
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });
});
