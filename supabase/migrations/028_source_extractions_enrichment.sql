-- Enrichment columns for curated video library entries.
-- Populated by the local prefetch/enrichment script (never by Vercel).
-- All new columns are nullable so existing rows are unaffected.

ALTER TABLE public.source_extractions
  ADD COLUMN IF NOT EXISTS transcript_quality   text,
  ADD COLUMN IF NOT EXISTS approved_for_library boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS difficulty           text,
  ADD COLUMN IF NOT EXISTS key_vocabulary       text[],
  ADD COLUMN IF NOT EXISTS topic_tags           text[],
  ADD COLUMN IF NOT EXISTS lesson_fit_tags      text[],
  ADD COLUMN IF NOT EXISTS grammar_features     text[],
  ADD COLUMN IF NOT EXISTS accent               text,
  ADD COLUMN IF NOT EXISTS content_flags        text[];

-- Index for the upcoming "suggest a video" feature
CREATE INDEX IF NOT EXISTS idx_source_extractions_library
  ON public.source_extractions (approved_for_library, difficulty)
  WHERE approved_for_library = true;
