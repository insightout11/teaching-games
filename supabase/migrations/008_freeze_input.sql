-- Add frozen flag to sessions table for teacher-controlled input suspension
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.sessions.frozen IS
  'When true, student input is suspended. Teacher toggles this via the Freeze widget.';
