-- Persist the complete launch plan with its session. This makes a guided lesson
-- recoverable in a fresh teacher tab and removes the post-navigation settings
-- race that could leave student standby showing "General".

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS lesson_plan_content jsonb;

CREATE OR REPLACE FUNCTION public.create_world_flight_session(
  p_class_id uuid,
  p_world_flight_context jsonb,
  p_origin_destination_id text,
  p_destination_id text,
  p_focus_id text,
  p_distance_km double precision,
  p_moves_class boolean,
  p_evidence_snapshot jsonb,
  p_topic text,
  p_custom_topic text,
  p_difficulty text,
  p_lesson_plan_content jsonb
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
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.sessions (
    class_id,
    world_flight_context,
    topic,
    custom_topic,
    difficulty,
    lesson_plan_content
  )
  VALUES (
    p_class_id,
    p_world_flight_context,
    COALESCE(NULLIF(p_topic, ''), 'General'),
    NULLIF(p_custom_topic, ''),
    COALESCE(NULLIF(p_difficulty, ''), 'Intermediate'),
    p_lesson_plan_content
  )
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

CREATE OR REPLACE FUNCTION public.create_world_flight_design_mission_session(
  p_class_id uuid,
  p_mission_context jsonb,
  p_topic text,
  p_custom_topic text,
  p_difficulty text,
  p_lesson_plan_content jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_investigation_id text;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  v_investigation_id := p_mission_context->>'investigationId';
  IF v_investigation_id IS NULL OR length(v_investigation_id) = 0 THEN
    RAISE EXCEPTION 'Investigation id is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.class_world_flight_design_missions
    WHERE class_id = p_class_id
      AND investigation_id = v_investigation_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Design mission already completed';
  END IF;

  INSERT INTO public.sessions (
    class_id,
    world_flight_design_mission_context,
    topic,
    custom_topic,
    difficulty,
    lesson_plan_content
  )
  VALUES (
    p_class_id,
    p_mission_context,
    COALESCE(NULLIF(p_topic, ''), 'General'),
    NULLIF(p_custom_topic, ''),
    COALESCE(NULLIF(p_difficulty, ''), 'Intermediate'),
    p_lesson_plan_content
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.class_world_flight_design_missions (
    class_id,
    session_id,
    investigation_id,
    mission_context
  )
  VALUES (
    p_class_id,
    v_session_id,
    v_investigation_id,
    p_mission_context
  );

  RETURN v_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_world_flight_session(
  uuid, jsonb, text, text, text, double precision, boolean, jsonb, text, text, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_world_flight_session(
  uuid, jsonb, text, text, text, double precision, boolean, jsonb, text, text, text, jsonb
) TO authenticated;

REVOKE ALL ON FUNCTION public.create_world_flight_design_mission_session(
  uuid, jsonb, text, text, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_world_flight_design_mission_session(
  uuid, jsonb, text, text, text, jsonb
) TO authenticated;
