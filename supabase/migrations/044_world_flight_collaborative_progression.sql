-- Collaborative World Flight progression.
-- Aircraft selection and automatic range changes are intentionally deferred.

ALTER TABLE public.class_world_flight_state
  ADD COLUMN IF NOT EXISTS flight_hours integer NOT NULL DEFAULT 0 CHECK (flight_hours >= 0),
  ADD COLUMN IF NOT EXISTS crew_stars integer NOT NULL DEFAULT 0 CHECK (crew_stars >= 0);

-- Existing completed flights count as Flight Hours. Crew Stars begin with the
-- new collaborative reward system because historical lesson evidence varies.
UPDATE public.class_world_flight_state state
SET flight_hours = completed.flight_count
FROM (
  SELECT class_id, COUNT(*)::integer AS flight_count
  FROM public.class_world_flight_legs
  WHERE status = 'completed'
  GROUP BY class_id
) completed
WHERE completed.class_id = state.class_id
  AND state.flight_hours = 0;

CREATE TABLE public.class_world_flight_rewards (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id              uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  leg_id                  uuid NOT NULL UNIQUE REFERENCES public.class_world_flight_legs(id) ON DELETE CASCADE,
  flight_hours_awarded    integer NOT NULL DEFAULT 1 CHECK (flight_hours_awarded BETWEEN 0 AND 1),
  crew_stars_awarded      integer NOT NULL DEFAULT 0 CHECK (crew_stars_awarded BETWEEN 0 AND 3),
  everyone_aboard         boolean NOT NULL DEFAULT false,
  strong_landing          boolean NOT NULL DEFAULT false,
  crew_commendation       boolean NOT NULL DEFAULT false,
  reward_snapshot         jsonb NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX class_world_flight_rewards_class_created_idx
  ON public.class_world_flight_rewards (class_id, created_at DESC);

ALTER TABLE public.class_world_flight_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own world flight rewards"
  ON public.class_world_flight_rewards FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.record_world_flight_reward(
  p_class_id uuid,
  p_session_id uuid,
  p_leg_id uuid,
  p_flight_hours_awarded integer,
  p_crew_stars_awarded integer,
  p_everyone_aboard boolean,
  p_strong_landing boolean,
  p_reward_snapshot jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id uuid;
  v_state public.class_world_flight_state%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.class_world_flight_legs
    WHERE id = p_leg_id
      AND class_id = p_class_id
      AND session_id = p_session_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Completed World Flight leg not found';
  END IF;

  INSERT INTO public.class_world_flight_rewards (
    class_id,
    session_id,
    leg_id,
    flight_hours_awarded,
    crew_stars_awarded,
    everyone_aboard,
    strong_landing,
    reward_snapshot
  )
  VALUES (
    p_class_id,
    p_session_id,
    p_leg_id,
    LEAST(GREATEST(COALESCE(p_flight_hours_awarded, 0), 0), 1),
    LEAST(GREATEST(COALESCE(p_crew_stars_awarded, 0), 0), 2),
    COALESCE(p_everyone_aboard, false),
    COALESCE(p_strong_landing, false),
    COALESCE(p_reward_snapshot, '{}'::jsonb)
  )
  ON CONFLICT (session_id) DO NOTHING
  RETURNING id INTO v_reward_id;

  IF v_reward_id IS NOT NULL THEN
    INSERT INTO public.class_world_flight_state (
      class_id,
      flight_hours,
      crew_stars
    )
    VALUES (
      p_class_id,
      LEAST(GREATEST(COALESCE(p_flight_hours_awarded, 0), 0), 1),
      LEAST(GREATEST(COALESCE(p_crew_stars_awarded, 0), 0), 2)
    )
    ON CONFLICT (class_id) DO UPDATE
    SET flight_hours = class_world_flight_state.flight_hours + EXCLUDED.flight_hours,
        crew_stars = class_world_flight_state.crew_stars + EXCLUDED.crew_stars,
        updated_at = now();
  END IF;

  SELECT *
  INTO v_state
  FROM public.class_world_flight_state
  WHERE class_id = p_class_id;

  RETURN jsonb_build_object(
    'alreadyRecorded', v_reward_id IS NULL,
    'flightHours', COALESCE(v_state.flight_hours, 0),
    'crewStars', COALESCE(v_state.crew_stars, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_world_flight_reward(
  uuid, uuid, uuid, integer, integer, boolean, boolean, jsonb
) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.record_world_flight_reward(
  uuid, uuid, uuid, integer, integer, boolean, boolean, jsonb
) TO service_role;
