-- 072: market accessories students keep (Oct 2026, city stops). After a market scene each student picks one of the
-- city's accessories; it stays on their avatar in later lessons. The accessory itself is data (name, type, colours).
-- One row per student per accessory; `worn` marks the one on the avatar. The server writes; the class's teacher reads.

BEGIN;

CREATE TABLE IF NOT EXISTS public.student_accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  accessory_id text NOT NULL CHECK (char_length(accessory_id) BETWEEN 1 AND 80),
  accessory jsonb NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  worn boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, accessory_id)
);
CREATE INDEX IF NOT EXISTS student_accessories_class_idx ON public.student_accessories (class_id) WHERE worn;

ALTER TABLE public.student_accessories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers read own class rows" ON public.student_accessories;
CREATE POLICY "Teachers read own class rows" ON public.student_accessories
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.student_accessories FROM anon, authenticated;
REVOKE SELECT ON public.student_accessories FROM anon;

COMMIT;

-- Check (run after): should return the table name.
-- SELECT to_regclass('public.student_accessories');
