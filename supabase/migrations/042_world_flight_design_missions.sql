-- Durable, stationary World Flight design missions. A completed investigation
-- can launch Design Studio without moving the class to another city.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS world_flight_design_mission_context jsonb;

CREATE TABLE public.class_world_flight_design_missions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id              uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  investigation_id        text NOT NULL,
  status                  text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'completed', 'cancelled')),
  mission_context         jsonb NOT NULL DEFAULT '{}',
  design_state_snapshot   jsonb NOT NULL DEFAULT '{}',
  brief_snapshot          jsonb NOT NULL DEFAULT '{}',
  planned_at              timestamptz NOT NULL DEFAULT now(),
  completed_at            timestamptz,
  cancelled_at            timestamptz
);

CREATE INDEX class_world_flight_design_missions_class_status_idx
  ON public.class_world_flight_design_missions (class_id, status, completed_at DESC);

CREATE UNIQUE INDEX class_world_flight_design_missions_completed_once_idx
  ON public.class_world_flight_design_missions (class_id, investigation_id)
  WHERE status = 'completed';

ALTER TABLE public.class_world_flight_design_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own world flight design missions"
  ON public.class_world_flight_design_missions FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.create_world_flight_design_mission_session(
  p_class_id uuid,
  p_mission_context jsonb
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
    SELECT 1
    FROM public.class_world_flight_design_missions
    WHERE class_id = p_class_id
      AND investigation_id = v_investigation_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Design mission already completed';
  END IF;

  INSERT INTO public.sessions (class_id, world_flight_design_mission_context)
  VALUES (p_class_id, p_mission_context)
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

CREATE OR REPLACE FUNCTION public.complete_world_flight_design_mission(
  p_session_id uuid,
  p_design_state jsonb,
  p_brief jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission public.class_world_flight_design_missions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = p_session_id AND c.teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_mission
  FROM public.class_world_flight_design_missions
  WHERE session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('missionStatus', 'none');
  END IF;

  IF v_mission.status = 'planned' THEN
    UPDATE public.class_world_flight_design_missions
    SET status = 'completed',
        design_state_snapshot = COALESCE(p_design_state, '{}'::jsonb),
        brief_snapshot = COALESCE(p_brief, '{}'::jsonb),
        completed_at = now()
    WHERE id = v_mission.id;
    v_mission.status := 'completed';
  END IF;

  RETURN jsonb_build_object(
    'missionStatus', v_mission.status,
    'investigationId', v_mission.investigation_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_world_flight_design_mission_session(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_world_flight_design_mission(uuid, jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_world_flight_design_mission_session(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_world_flight_design_mission(uuid, jsonb, jsonb) TO authenticated;
