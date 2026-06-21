-- World Flight Hangar plane selection.
-- Range is tied to the equipped plane. Claiming a new range tier requires the
-- class to choose a same-tier aircraft before moving again.

ALTER TABLE public.class_world_flight_state
  ADD COLUMN IF NOT EXISTS plane_selection_required boolean NOT NULL DEFAULT false;
