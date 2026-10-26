-- 070: class mascots and class unlocks (Oct 2026, pilot 001). Unlocks record what a class has earned by talking or
-- seeing: country items ('country:Saudi Arabia') and mascot parts ('mascot:alien'). The items and parts are data in
-- the code. Nothing here names a student. The server writes; the teacher who owns the class can read.

BEGIN;

CREATE TABLE IF NOT EXISTS public.class_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  unlock_id text NOT NULL CHECK (char_length(unlock_id) BETWEEN 1 AND 120),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, unlock_id)
);
CREATE INDEX IF NOT EXISTS class_unlocks_class_idx ON public.class_unlocks (class_id);

CREATE TABLE IF NOT EXISTS public.class_mascots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  look jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS class_mascots_class_idx ON public.class_mascots (class_id, created_at DESC);

ALTER TABLE public.class_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_mascots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers read own class rows" ON public.class_unlocks;
CREATE POLICY "Teachers read own class rows" ON public.class_unlocks
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()));
DROP POLICY IF EXISTS "Teachers read own class rows" ON public.class_mascots;
CREATE POLICY "Teachers read own class rows" ON public.class_mascots
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.class_unlocks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.class_mascots FROM anon, authenticated;
REVOKE SELECT ON public.class_unlocks FROM anon;
REVOKE SELECT ON public.class_mascots FROM anon;

COMMIT;

-- Check (run after): both should return a name.
-- SELECT to_regclass('public.class_unlocks'), to_regclass('public.class_mascots');
