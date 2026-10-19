-- 066: saved Live Room searches (Serper). The same search within a week costs nothing and skips the daily cap.
-- Server-only (service role); holds search results, never student data. Safe to run twice.
CREATE TABLE IF NOT EXISTS public.source_search_cache (
  cache_key text PRIMARY KEY,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.source_search_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.source_search_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.source_search_cache TO service_role;
CREATE INDEX IF NOT EXISTS source_search_cache_created_at ON public.source_search_cache (created_at);
