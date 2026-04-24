-- Source extractions cache
-- Stores extracted transcripts and AI-generated summaries from external sources.
-- Keyed by (source_type, source_key) for YouTube/TED cache hits.
-- PDF and plain text are not cached (no stable key).

CREATE TABLE public.source_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_key text, -- YouTube video ID or TED talk ID; NULL for PDF/text
  raw_transcript text,
  summary text NOT NULL,
  title text NOT NULL,
  duration_secs integer,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_source_extractions_key
  ON public.source_extractions (source_type, source_key)
  WHERE source_key IS NOT NULL;

ALTER TABLE public.source_extractions ENABLE ROW LEVEL SECURITY;

-- Service role only — no direct client access
CREATE POLICY "service_role_all" ON public.source_extractions
  FOR ALL USING (auth.role() = 'service_role');
