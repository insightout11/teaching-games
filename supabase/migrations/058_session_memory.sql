-- Live memory, step 1 (docs/live-memory-concept.md): one record per session of what the lesson covered
-- (topics, words, material, activities). Teacher-only: written and read through the server (service role) after
-- an ownership check. Unlike session_private_state, NOT readable by anyone: topics can come from students' words.
-- PR ONLY: apply by hand (Management API), owner approval required.
BEGIN;
CREATE TABLE IF NOT EXISTS public.session_memory (
  session_id  uuid        PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  payload     jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.session_memory ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: the service role bypasses RLS; everyone else is denied.
REVOKE ALL ON public.session_memory FROM anon, authenticated;
COMMIT;
