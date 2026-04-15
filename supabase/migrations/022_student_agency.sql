-- Migration 022: Student agency features
-- (1) student_session_prefs: per-student score visibility preference
-- (2) polls.metadata: discriminator for bonus-vote polls

CREATE TABLE public.student_session_prefs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL,
  score_visible boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_session_prefs_session_client_key UNIQUE(session_id, client_id)
);

CREATE INDEX student_session_prefs_session_idx ON public.student_session_prefs(session_id);

ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS metadata jsonb;
