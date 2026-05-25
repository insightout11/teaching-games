-- session_private_state: generic key-value store for private session data.
-- Phase 1 uses only the "spotlight" key (cockpit → shared screen channel).
-- Server writes via service role; shared screen reads via realtime subscription.

CREATE TABLE public.session_private_state (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  key         text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX session_private_state_session_key_idx
  ON public.session_private_state (session_id, key);

CREATE INDEX session_private_state_session_idx
  ON public.session_private_state (session_id);

ALTER TABLE public.session_private_state ENABLE ROW LEVEL SECURITY;

-- Shared screen (any authenticated or anonymous user) can read state for any session.
-- Writes are restricted to the server-side service role only (no client policy needed).
CREATE POLICY "Anyone can read session private state"
  ON public.session_private_state FOR SELECT
  USING (true);

-- Enable realtime for the table so shared screen can subscribe.
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_private_state;
