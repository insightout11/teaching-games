-- Cargo Hold: teacher-refresh recovery state + durable score idempotency.
--
-- NOT YET APPLIED. Apply with the Management API token before Cargo Hold is used in
-- a real class; until then the activity runs but loses a round on teacher refresh.
--
-- Why a new table rather than session_private_state: migration 033 grants
--   CREATE POLICY "Anyone can read session private state" ... USING (true)
-- so every row of that table is readable by anonymous clients (the shared screen
-- subscribes to it). Cargo's recovery state contains who played which card before the
-- anonymous reveal, plus vote attribution â€” a student who knows the session ID could
-- read authorship straight out of it. This table has NO select policy at all, so RLS
-- denies every anonymous and authenticated read; only the service role can touch it.

CREATE TABLE IF NOT EXISTS public.cargo_hold_state (
  session_id  uuid        PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  -- Monotonic per activity run. Compare-and-set happens inside the RPC below, so two
  -- concurrent saves cannot both read the same value and roll state backwards.
  sequence    bigint      NOT NULL DEFAULT 0,
  payload     jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cargo_hold_state ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies: service role bypasses RLS, everyone else is denied.
-- Do NOT add a permissive SELECT policy â€” it would expose pre-reveal authorship.

-- Deliberately NOT added to supabase_realtime: nothing subscribes to this, and
-- publishing it would hand the payload to any connected client.

COMMENT ON TABLE public.cargo_hold_state IS
  'Cargo Hold authoritative round state for teacher-refresh recovery. Service-role only: contains pre-reveal authorship and votes.';

-- ---------------------------------------------------------------------------
-- Atomic compare-and-set.
--
-- Read-then-write in application code is not safe: two requests can both read
-- sequence 4, then sequence 6 commits before sequence 5, leaving the older payload
-- stored. The comparison has to happen inside the statement, so the newer sequence
-- always wins regardless of arrival order.

CREATE OR REPLACE FUNCTION public.cargo_hold_state_save(
  p_session_id uuid,
  p_sequence   bigint,
  p_payload    jsonb
)
RETURNS TABLE (applied boolean, current_sequence bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
  v_seq  bigint;
BEGIN
  INSERT INTO public.cargo_hold_state AS s (session_id, sequence, payload, updated_at)
  VALUES (p_session_id, p_sequence, p_payload, now())
  ON CONFLICT (session_id) DO UPDATE
    SET sequence   = EXCLUDED.sequence,
        payload    = EXCLUDED.payload,
        updated_at = now()
    WHERE EXCLUDED.sequence > s.sequence;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  SELECT c.sequence INTO v_seq
    FROM public.cargo_hold_state c
   WHERE c.session_id = p_session_id;

  RETURN QUERY SELECT (v_rows > 0), COALESCE(v_seq, 0::bigint);
END;
$$;

-- Only the service role may call this; it writes on behalf of an already
-- teacher-authenticated route.
REVOKE ALL ON FUNCTION public.cargo_hold_state_save(uuid, bigint, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cargo_hold_state_save(uuid, bigint, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.cargo_hold_state_save(uuid, bigint, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cargo_hold_state_save(uuid, bigint, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- Durable idempotency for activity score writes.
--
-- Cargo writes one score per student per round, and a failed write is retried. The
-- route checks before inserting; this index makes the guarantee hold when a retry
-- races the original.

CREATE UNIQUE INDEX IF NOT EXISTS scores_activity_idempotency_unique
  ON public.scores (
    session_id,
    client_id,
    (response_data->>'idempotencyKey')
  )
  WHERE response_data->>'idempotencyKey' IS NOT NULL
    AND client_id IS NOT NULL;
