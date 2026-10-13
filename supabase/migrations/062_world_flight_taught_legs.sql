-- World Flight: a city's lesson taught WITHOUT flying there (the city is out of the plane's range).
--
-- Until now a flight record always moved the class when it completed, so a far city's lesson left no
-- record at all: no flight hour, no stars, no evidence. A leg can now say it does not move the class
-- (`moves_class = false`). When its lesson ends it becomes 'taught' instead of 'completed':
--   * 'completed' = the class flew there (stamp, route, expedition stop), exactly as before;
--   * 'taught'    = the class did the city's lesson from where it is (flight hour, stars, evidence only).
-- Every existing reader that asks for 'completed' legs therefore keeps meaning "visits".

ALTER TABLE public.class_world_flight_legs
  ADD COLUMN IF NOT EXISTS moves_class boolean NOT NULL DEFAULT true;

ALTER TABLE public.class_world_flight_legs
  DROP CONSTRAINT IF EXISTS class_world_flight_legs_status_check;
ALTER TABLE public.class_world_flight_legs
  ADD CONSTRAINT class_world_flight_legs_status_check
  CHECK (status IN ('planned', 'completed', 'cancelled', 'taught'));

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

  IF v_leg.status = 'planned' AND p_completed AND v_leg.moves_class THEN
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
  ELSIF v_leg.status = 'planned' AND p_completed THEN
    -- The lesson was done, but the class stays where it is.
    UPDATE public.class_world_flight_legs
    SET status = 'taught',
        completed_at = now()
    WHERE id = v_leg.id;

    v_leg.status := 'taught';
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

-- Flight hours and crew stars are earned by a taught lesson as well as by a flight.
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
      AND status IN ('completed', 'taught')
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
