-- Add topic, difficulty, and custom_topic to sessions so students can access them
-- Defaults match the Zustand store defaults so existing sessions are unaffected

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS topic       text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS difficulty  text NOT NULL DEFAULT 'Intermediate',
  ADD COLUMN IF NOT EXISTS custom_topic text;
