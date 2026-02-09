-- Student submissions (text answers from student devices)
CREATE TABLE public.student_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,  -- Persistent browser ID (stored in localStorage)
  display_name text NOT NULL,
  team text,  -- 'red' | 'blue' | null
  submission_type text NOT NULL,  -- 'text' | 'poll'
  content text NOT NULL,  -- text answer or poll choice
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'error'
  error_message text,  -- Error details if status = 'error'
  game_key text,  -- which game this is for (null = general)
  created_at timestamptz DEFAULT now()
);

-- Poll definitions (teacher-created polls)
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,  -- ["Option A", "Option B", ...]
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Poll votes (student responses to polls)
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,  -- Persistent browser ID
  display_name text NOT NULL,
  team text,
  choice text NOT NULL,  -- The selected option
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, client_id)  -- One vote per client per poll (can update)
);

-- Rate limiting tracking (keyed by client_id for consistency)
CREATE TABLE public.submission_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  client_id uuid NOT NULL,
  last_text_submission timestamptz,
  last_poll_vote timestamptz,
  UNIQUE(session_id, client_id)
);

-- Indexes
CREATE INDEX idx_submissions_session ON student_submissions(session_id);
CREATE INDEX idx_submissions_status ON student_submissions(status);
CREATE INDEX idx_submissions_client ON student_submissions(client_id);
CREATE INDEX idx_polls_session ON polls(session_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_client ON poll_votes(client_id);
CREATE INDEX idx_rate_limits_session ON submission_rate_limits(session_id, client_id);

-- Enable realtime for teacher to see incoming submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- RLS: NO public write policies - all writes via API with service role
-- Only authenticated teachers can read/manage via direct DB access
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Teachers can read submissions in their sessions (for realtime subscriptions)
CREATE POLICY "Teachers read submissions" ON student_submissions FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM sessions s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

-- Teachers can update submissions (approve/reject)
CREATE POLICY "Teachers update submissions" ON student_submissions FOR UPDATE
  USING (session_id IN (
    SELECT s.id FROM sessions s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

-- Teachers can manage polls in their sessions
CREATE POLICY "Teachers manage polls" ON polls FOR ALL
  USING (session_id IN (
    SELECT s.id FROM sessions s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

-- Teachers can read votes in their sessions
CREATE POLICY "Teachers read votes" ON poll_votes FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM sessions s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
  ));

-- Note: All INSERT/UPDATE for student_submissions, poll_votes, rate_limits
-- are done via API routes using SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)

-- Add columns to existing scores table for team tracking
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS team text;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS display_name text;
CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team);
