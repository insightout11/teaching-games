-- World Flight: the city the class chose for its next flight (the "where next?" vote after landing).
-- Saved on the class so it is today's default destination on any device. Cleared when the class takes off.

ALTER TABLE public.class_world_flight_state
  ADD COLUMN IF NOT EXISTS next_destination_id text;
