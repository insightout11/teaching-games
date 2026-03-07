-- Migration 012: session_missions table for Mission System
-- Stores each student's chosen mission question for a session

CREATE TABLE session_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  mission_text text NOT NULL,
  chosen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, client_id)
);

CREATE INDEX ON session_missions(session_id);
