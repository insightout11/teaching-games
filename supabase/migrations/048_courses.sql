-- Course Builder (v1): multi-lesson courses.
-- A course = a theme + an ordered sequence of source-anchored lessons.
-- Teacher-owned content (class chosen at launch); is_template rows are pre-built/global.

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL teacher_id = pre-built/global template course (everyone can read; "use" clones it).
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  theme text NOT NULL,
  description text,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL,
  title text NOT NULL,
  -- { kind:'library', sourceType, id } | { kind:'custom'|'generated', material } | null
  source_ref jsonb,
  -- The launchLesson payload shape (customTopic, difficulty, goal, slots, sourceMaterial, …),
  -- minus ephemeral fields. Source of truth for launching the lesson.
  lesson_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'launched', 'completed')),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  -- v2: end-of-session summary (vocab covered, struggles). Architected, UNUSED in v1.
  lesson_memory jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_template ON public.courses(is_template);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON public.course_lessons(course_id, order_index);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Teachers manage their own courses; everyone can read pre-built templates.
CREATE POLICY "Teachers read own + template courses" ON public.courses
  FOR SELECT USING (teacher_id = auth.uid() OR is_template = true);
CREATE POLICY "Teachers write own courses" ON public.courses
  FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers read lessons of readable courses" ON public.course_lessons
  FOR SELECT USING (course_id IN (
    SELECT id FROM public.courses WHERE teacher_id = auth.uid() OR is_template = true
  ));
CREATE POLICY "Teachers write lessons of own courses" ON public.course_lessons
  FOR ALL USING (course_id IN (SELECT id FROM public.courses WHERE teacher_id = auth.uid()))
  WITH CHECK (course_id IN (SELECT id FROM public.courses WHERE teacher_id = auth.uid()));
