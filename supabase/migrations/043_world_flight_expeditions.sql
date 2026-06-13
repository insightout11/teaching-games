-- Optional, teacher-directed World Flight Expeditions.
-- Expeditions recommend destinations and lesson sources but remain separate
-- from automatic Flight Missions and their evidence.

CREATE TABLE public.class_world_flight_expedition_runs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  expedition_id           text NOT NULL,
  status                  text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'left')),
  expedition_snapshot     jsonb NOT NULL DEFAULT '{}',
  visited_destination_ids text[] NOT NULL DEFAULT '{}',
  activated_at            timestamptz NOT NULL DEFAULT now(),
  paused_at               timestamptz,
  completed_at            timestamptz,
  left_at                 timestamptz,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX class_world_flight_expedition_runs_one_current_idx
  ON public.class_world_flight_expedition_runs (class_id)
  WHERE status IN ('active', 'paused');

CREATE INDEX class_world_flight_expedition_runs_class_status_idx
  ON public.class_world_flight_expedition_runs (class_id, status, updated_at DESC);

ALTER TABLE public.class_world_flight_expedition_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own world flight expeditions"
  ON public.class_world_flight_expedition_runs FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );
