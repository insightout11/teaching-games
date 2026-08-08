import { createBrowserClient } from '@supabase/ssr';
import { isMockMode } from '@/lib/mock/auth';
import { createMockClient } from '@/lib/mock/client';

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | null = null;
let mockClient: BrowserClient | null = null;

export function createClient() {
  if (isMockMode()) {
    mockClient ??= createMockClient() as BrowserClient;
    return mockClient;
  }

  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
