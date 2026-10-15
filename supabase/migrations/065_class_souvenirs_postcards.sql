-- 065: souvenirs and postcards for each class (World Flight collections, Oct 2026).
-- The souvenirs themselves are data (src/data/world-flight/city-packs.json); these tables only record what a class
-- has earned and the postcards it wrote. The server writes both; the teacher who owns the class can read them.
-- Nothing here names a student.

BEGIN;

CREATE TABLE IF NOT EXISTS public.class_souvenirs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  souvenir_id text NOT NULL,
  destination_id text NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, souvenir_id)
);
CREATE INDEX IF NOT EXISTS class_souvenirs_class_idx ON public.class_souvenirs (class_id);

CREATE TABLE IF NOT EXISTS public.class_postcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  destination_id text NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  prompt text NOT NULL DEFAULT '',
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS class_postcards_class_idx ON public.class_postcards (class_id, created_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['class_souvenirs', 'class_postcards'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Teachers read own class rows" ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY "Teachers read own class rows" ON public.%I
        FOR SELECT TO authenticated
        USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()))
    $p$, t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
  END LOOP;
END $$;

COMMIT;
