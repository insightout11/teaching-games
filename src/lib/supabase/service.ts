import { createClient } from '@supabase/supabase-js';

// Service role client for server-side operations that bypass RLS
// Only use in API routes, never expose to client
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Explicitly bypass Next.js 14 data cache for all Supabase requests.
      // force-dynamic at the route level should do this, but being explicit
      // here ensures no stale reads via the fetch data cache.
      fetch: (url: RequestInfo | URL, init?: RequestInit) =>
        fetch(url, { ...init, cache: 'no-store' }),
    },
  });
}
