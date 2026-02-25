-- 009_class_questions.sql
-- Adds publish/lifecycle columns to student_submissions for the Class Questions feature.
-- Creates question_votes table modeled after poll_votes.

-- Add publish/lifecycle columns to student_submissions
-- status = pending/rejected retains its approval-queue meaning.
-- published_to_class and answered_at are the publish-lifecycle fields.
ALTER TABLE public.student_submissions
  ADD COLUMN IF NOT EXISTS published_to_class boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at        timestamptz,
  ADD COLUMN IF NOT EXISTS answered_at         timestamptz;

-- Index for efficient lookup of published questions per session
CREATE INDEX IF NOT EXISTS idx_submissions_published
  ON student_submissions(session_id, published_to_class, published_at)
  WHERE published_to_class = true;

-- Upvote table (modeled after poll_votes)
CREATE TABLE IF NOT EXISTS public.question_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES student_submissions(id) ON DELETE CASCADE NOT NULL,
  session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  client_id   uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(question_id, client_id)   -- one vote per client per question (idempotent)
);

CREATE INDEX IF NOT EXISTS idx_question_votes_question ON question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_session  ON question_votes(session_id);

-- RLS: teachers can read votes in their sessions
ALTER TABLE question_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read question votes" ON question_votes
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );
-- All INSERTs via service role (API route), same as poll_votes

-- Realtime so teacher widget sees vote count updates immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_votes;
