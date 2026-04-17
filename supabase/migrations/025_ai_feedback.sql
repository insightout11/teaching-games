-- Migration 025: AI feedback columns + per-student scoring mode
-- Adds ai_feedback/ai_score to student_submissions so auto-evaluated answers
-- can be privately delivered to each student's device.
-- Adds scoring_mode to student_session_prefs for Competitive vs Participation override.

ALTER TABLE public.student_submissions
  ADD COLUMN ai_feedback text NULL,
  ADD COLUMN ai_score    int  NULL;

ALTER TABLE public.student_session_prefs
  ADD COLUMN scoring_mode text NULL; -- 'competitive' | 'participation' | NULL = use session default
