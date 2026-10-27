-- 073: postcards home from each student (Oct 2026). Optional homework after class: on their phone each student writes
-- a postcard from the city the class flew to; sending it puts a postcard stamp on their own boarding pass. The teacher
-- can read a few out during the next boarding. One postcard per student (or phone) per lesson. The server writes.

BEGIN;

CREATE TABLE IF NOT EXISTS public.student_postcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  destination_id text NOT NULL CHECK (char_length(destination_id) BETWEEN 1 AND 80),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 600),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);
CREATE INDEX IF NOT EXISTS student_postcards_class_idx ON public.student_postcards (class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS student_postcards_student_idx ON public.student_postcards (student_id) WHERE student_id IS NOT NULL;

ALTER TABLE public.student_postcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers read own class rows" ON public.student_postcards;
CREATE POLICY "Teachers read own class rows" ON public.student_postcards
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.student_postcards FROM anon, authenticated;
REVOKE SELECT ON public.student_postcards FROM anon;

COMMIT;

-- Check (run after): should return the table name.
-- SELECT to_regclass('public.student_postcards');
