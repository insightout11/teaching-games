-- Migration 010: Add prompt_index to scores table
-- Tracks which teacher-initiated round each score belongs to.
-- Used to compute participation coverage: attempts / max(prompt_index) per session.
-- Nulls are acceptable for pre-migration sessions; downstream queries must be null-safe.

ALTER TABLE scores ADD COLUMN IF NOT EXISTS prompt_index int;

CREATE INDEX IF NOT EXISTS idx_scores_session_prompt_index
  ON scores (session_id, prompt_index);
