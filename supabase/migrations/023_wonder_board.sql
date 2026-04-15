-- Wonder Board activity tables
-- Students ask questions about the lesson topic, grouped by assigned starter words.
-- Teacher or AI answers questions; students upvote and leave follow-ups.

CREATE TABLE wonder_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) NOT NULL,
  client_id uuid NOT NULL,
  display_name text NOT NULL,
  starter text NOT NULL,           -- 'Why', 'How', 'What', 'When', 'Where', 'Should', 'What if'
  content text NOT NULL,
  parent_id uuid REFERENCES wonder_questions(id), -- NULL = top-level question
  answer_text text,                -- NULL until answered
  answer_type text,                -- 'teacher' | 'ai'
  answered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE wonder_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES wonder_questions(id) NOT NULL,
  session_id uuid NOT NULL,
  client_id uuid NOT NULL,
  UNIQUE(question_id, client_id)
);

CREATE INDEX idx_wonder_questions_session ON wonder_questions(session_id);
CREATE INDEX idx_wonder_votes_question ON wonder_votes(question_id);
