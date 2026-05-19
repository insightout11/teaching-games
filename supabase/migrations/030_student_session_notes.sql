CREATE TABLE public.student_session_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  class_id    uuid        NOT NULL REFERENCES public.classes(id)   ON DELETE CASCADE,
  session_id  uuid        NOT NULL REFERENCES public.sessions(id)  ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES public.students(id)  ON DELETE CASCADE,
  note        text        NOT NULL DEFAULT '',
  tags        text[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX student_session_notes_session_student_idx
  ON public.student_session_notes (session_id, student_id);

CREATE INDEX student_session_notes_teacher_class_idx
  ON public.student_session_notes (teacher_id, class_id);

CREATE INDEX student_session_notes_class_student_idx
  ON public.student_session_notes (class_id, student_id);

CREATE INDEX student_session_notes_session_idx
  ON public.student_session_notes (session_id);

CREATE INDEX student_session_notes_student_created_idx
  ON public.student_session_notes (student_id, created_at);

ALTER TABLE public.student_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own student session notes"
  ON public.student_session_notes FOR ALL
  USING (teacher_id = auth.uid());
