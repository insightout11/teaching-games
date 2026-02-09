import { createBrowserClient } from '@supabase/ssr';
import { isMockMode } from '@/lib/mock/auth';
import { createMockClient } from '@/lib/mock/client';

export function createClient() {
  if (isMockMode()) {
    return createMockClient() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
