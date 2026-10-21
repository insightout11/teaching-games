-- 068: the Landmark Album (Landmark Quest step 4, Oct 2026). Every photo a class takes of a landmark on its flight.
-- The pictures live in a private storage bucket; the server writes both and hands the teacher short-lived links.
-- Scenery only: nothing here names a student or holds student work.

BEGIN;

CREATE TABLE IF NOT EXISTS public.class_landmark_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  landmark_id text NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  time_of_day text NOT NULL DEFAULT '',
  weather text NOT NULL DEFAULT '',
  from_city text NOT NULL DEFAULT '',
  to_city text NOT NULL DEFAULT '',
  image_path text NOT NULL,
  rare boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS class_landmark_photos_class_idx ON public.class_landmark_photos (class_id, taken_at DESC);

ALTER TABLE public.class_landmark_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers read own class rows" ON public.class_landmark_photos;
CREATE POLICY "Teachers read own class rows" ON public.class_landmark_photos
  FOR SELECT TO authenticated
  USING (class_id IN (SELECT c.id FROM public.classes c WHERE c.teacher_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.class_landmark_photos FROM anon, authenticated;
REVOKE SELECT ON public.class_landmark_photos FROM anon;

-- The private bucket for the pictures (only the server reads and writes it).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('landmark-album', 'landmark-album', false, 3145728, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Check (run after): both should return one row.
-- SELECT to_regclass('public.class_landmark_photos');
-- SELECT id, public FROM storage.buckets WHERE id = 'landmark-album';
