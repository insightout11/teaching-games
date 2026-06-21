-- Class Board tables
-- Reusable teacher/student board items for activity-scoped discussion, evidence, and ranking flows.

CREATE TABLE IF NOT EXISTS public.class_board_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  board_key text NOT NULL DEFAULT 'class-board',
  author_type text NOT NULL DEFAULT 'student' CHECK (author_type IN ('teacher', 'student')),
  client_id uuid,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'idea',
  zone_key text NOT NULL DEFAULT 'main',
  content text NOT NULL,
  visibility text NOT NULL DEFAULT 'pending' CHECK (visibility IN ('pending', 'visible', 'hidden')),
  pinned boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_board_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.class_board_items(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_class_board_items_session_board
  ON public.class_board_items(session_id, board_key, visibility, created_at);

CREATE INDEX IF NOT EXISTS idx_class_board_items_position
  ON public.class_board_items(session_id, board_key, pinned, position, created_at);

CREATE INDEX IF NOT EXISTS idx_class_board_votes_item
  ON public.class_board_votes(item_id);

CREATE INDEX IF NOT EXISTS idx_class_board_votes_session
  ON public.class_board_votes(session_id);

ALTER TABLE public.class_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_board_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read class board items" ON public.class_board_items
  FOR SELECT USING (session_id IN (
    SELECT s.id FROM public.sessions s JOIN public.classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers insert class board items" ON public.class_board_items
  FOR INSERT WITH CHECK (session_id IN (
    SELECT s.id FROM public.sessions s JOIN public.classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers update class board items" ON public.class_board_items
  FOR UPDATE USING (session_id IN (
    SELECT s.id FROM public.sessions s JOIN public.classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers delete class board items" ON public.class_board_items
  FOR DELETE USING (session_id IN (
    SELECT s.id FROM public.sessions s JOIN public.classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers read class board votes" ON public.class_board_votes
  FOR SELECT USING (session_id IN (
    SELECT s.id FROM public.sessions s JOIN public.classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.class_board_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_board_votes;
