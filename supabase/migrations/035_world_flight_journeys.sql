-- Persistent World Flight journeys.
-- A class owns its current location and plane state. Only completed, movable
-- flight legs update that location.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS world_flight_context jsonb;

CREATE TABLE public.class_world_flight_state (
  class_id                uuid PRIMARY KEY REFERENCES public.classes(id) ON DELETE CASCADE,
  current_destination_id  text,
  plane_tier              integer NOT NULL DEFAULT 0 CHECK (plane_tier >= 0),
  plane_key               text NOT NULL DEFAULT 'starter-biplane',
  range_km                integer NOT NULL DEFAULT 5200 CHECK (range_km > 0),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.class_world_flight_legs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id              uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  origin_destination_id   text,
  destination_id          text NOT NULL,
  focus_id                 text NOT NULL,
  status                   text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'completed', 'cancelled')),
  distance_km              double precision NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  evidence_snapshot        jsonb NOT NULL DEFAULT '{}',
  planned_at               timestamptz NOT NULL DEFAULT now(),
  completed_at             timestamptz,
  cancelled_at             timestamptz
);

CREATE INDEX class_world_flight_legs_class_status_idx
  ON public.class_world_flight_legs (class_id, status, completed_at DESC);

ALTER TABLE public.class_world_flight_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_world_flight_legs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own world flight state"
  ON public.class_world_flight_state FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers read own world flight legs"
  ON public.class_world_flight_legs FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

-- Creates a World Flight session and its planned movable leg in one transaction.
-- Lessons launched without moving still retain durable session context but do not
-- create a flight leg or contribute journey evidence.
CREATE OR REPLACE FUNCTION public.create_world_flight_session(
  p_class_id uuid,
  p_world_flight_context jsonb,
  p_origin_destination_id text,
  p_destination_id text,
  p_focus_id text,
  p_distance_km double precision,
  p_moves_class boolean,
  p_evidence_snapshot jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.sessions (class_id, world_flight_context)
  VALUES (p_class_id, p_world_flight_context)
  RETURNING id INTO v_session_id;

  IF p_moves_class THEN
    INSERT INTO public.class_world_flight_legs (
      class_id,
      session_id,
      origin_destination_id,
      destination_id,
      focus_id,
      distance_km,
      evidence_snapshot
    )
    VALUES (
      p_class_id,
      v_session_id,
      p_origin_destination_id,
      p_destination_id,
      p_focus_id,
      GREATEST(COALESCE(p_distance_km, 0), 0),
      COALESCE(p_evidence_snapshot, '{}'::jsonb)
    );
  END IF;

  RETURN v_session_id;
END;
$$;

-- Ends a session and resolves its planned World Flight leg atomically.
-- Repeated calls are idempotent: completed/cancelled legs never transition again.
CREATE OR REPLACE FUNCTION public.finish_world_flight_session(
  p_session_id uuid,
  p_completed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leg public.class_world_flight_legs%ROWTYPE;
  v_context jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = p_session_id AND c.teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sessions
  SET status = 'ended',
      ended_at = COALESCE(ended_at, now())
  WHERE id = p_session_id
  RETURNING world_flight_context INTO v_context;

  SELECT *
  INTO v_leg
  FROM public.class_world_flight_legs
  WHERE session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'legStatus', 'none',
      'currentDestinationId', NULL,
      'worldFlightContext', v_context
    );
  END IF;

  IF v_leg.status = 'planned' AND p_completed THEN
    UPDATE public.class_world_flight_legs
    SET status = 'completed',
        completed_at = now()
    WHERE id = v_leg.id;

    INSERT INTO public.class_world_flight_state (
      class_id,
      current_destination_id
    )
    VALUES (
      v_leg.class_id,
      v_leg.destination_id
    )
    ON CONFLICT (class_id) DO UPDATE
    SET current_destination_id = EXCLUDED.current_destination_id,
        updated_at = now();

    v_leg.status := 'completed';
  ELSIF v_leg.status = 'planned' THEN
    UPDATE public.class_world_flight_legs
    SET status = 'cancelled',
        cancelled_at = now()
    WHERE id = v_leg.id;

    v_leg.status := 'cancelled';
  END IF;

  RETURN jsonb_build_object(
    'legStatus', v_leg.status,
    'currentDestinationId',
      CASE WHEN v_leg.status = 'completed' THEN v_leg.destination_id ELSE NULL END,
    'worldFlightContext', v_context
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_world_flight_session(
  uuid, jsonb, text, text, text, double precision, boolean, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_world_flight_session(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_world_flight_session(
  uuid, jsonb, text, text, text, double precision, boolean, jsonb
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_world_flight_session(uuid, boolean) TO authenticated;

