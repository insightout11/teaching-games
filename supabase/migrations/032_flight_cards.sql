-- Flight Cards: between-module gamification layer (Phase 1a — state + APIs only)
-- Adds flight_cards table and card tracking columns to scores.
-- No scoring behavior changes in this migration. card_bonus defaults to 0.
-- Card bonus logic is wired in Phase 1c.

CREATE TABLE IF NOT EXISTS public.flight_cards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  client_id        text NOT NULL,
  student_id       uuid REFERENCES public.students(id),
  display_name     text,

  card_key         text NOT NULL,
  -- v1a: 'takeoff' | 'clear-skies' | 'afterburner' | 'full-throttle'
  -- v1e adds: 'contrail'

  status           text NOT NULL DEFAULT 'offered',
  -- deal-phase : 'offered' | 'declined' | 'replaced'
  -- live       : 'held' | 'active'
  -- terminal   : 'used' | 'expired'
  --   used    = produced at least one bonus point
  --   expired = produced zero bonus points

  deal_index       int NOT NULL,    -- monotonically increasing per session (1, 2, 3…)
  module_key       text NOT NULL,   -- module the card is scoped to

  activations_count  int NOT NULL DEFAULT 0,  -- Contrail: incremented per +1 earned (max 3)
  bonus_points_total int NOT NULL DEFAULT 0,  -- running sum of card_bonus across all score rows

  offered_at  timestamptz NOT NULL DEFAULT now(),
  held_at     timestamptz,
  expired_at  timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flight_cards_session_client
  ON public.flight_cards(session_id, client_id);

CREATE INDEX IF NOT EXISTS flight_cards_session_deal
  ON public.flight_cards(session_id, deal_index);

CREATE INDEX IF NOT EXISTS flight_cards_session_live
  ON public.flight_cards(session_id, status)
  WHERE status IN ('held', 'active');

-- scores: add card tracking columns
-- card_id nullable; card_bonus defaults to 0 — existing writes are completely unaffected
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS card_id    uuid REFERENCES public.flight_cards(id),
  ADD COLUMN IF NOT EXISTS card_bonus int NOT NULL DEFAULT 0;
