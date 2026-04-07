-- Migration 020: session_participants
-- Tracks which students actually joined a specific session (vs. the full class roster).
-- Used by the Launch Lobby to show real attendance, not historical roster.

CREATE TABLE session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  display_name text NOT NULL,
  avatar_seed text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, client_id)
);

CREATE INDEX session_participants_session_idx ON session_participants(session_id);
