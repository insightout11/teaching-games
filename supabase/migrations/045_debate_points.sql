-- Team Debate prep board
-- During the prep phase, students add argument points to their team's board.
-- Each point is scoped to a side ('for' | 'against'); students see only their own
-- side, the teacher sees both. Mirrors the Wonder Board pattern (server writes via
-- service client, browser reads + realtime; no moderation queue).

CREATE TABLE debate_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) NOT NULL,
  client_id uuid NOT NULL,
  display_name text NOT NULL,
  side text NOT NULL,              -- 'for' | 'against'
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_debate_points_session ON debate_points(session_id);

-- Realtime so the teacher board updates live as points arrive.
ALTER PUBLICATION supabase_realtime ADD TABLE debate_points;
