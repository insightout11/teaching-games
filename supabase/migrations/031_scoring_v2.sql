-- Scoring V2: separate outcome (points category) from accuracy tracking.
-- Stops proxy input rows from polluting leaderboard/accuracy stats.

-- 1. New columns on scores
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS outcome text,
  -- 'invalid' | 'genuine' | 'on-task' | 'standout' — null for pre-V2 rows

  ADD COLUMN IF NOT EXISTS accuracy_status text,
  -- 'correct' | 'incorrect' | 'not_applicable' — null for pre-V2 rows

  ADD COLUMN IF NOT EXISTS counts_for_leaderboard boolean NOT NULL DEFAULT true,
  -- false for proxy input rows from /api/student/submit

  ADD COLUMN IF NOT EXISTS counts_for_accuracy boolean NOT NULL DEFAULT false,
  -- true when accuracy_status is 'correct' OR 'incorrect' (both needed for accuracy %)

  ADD COLUMN IF NOT EXISTS scoring_version smallint NOT NULL DEFAULT 1;
  -- 1 = pre-V2, 2 = Scoring V2+

-- 2. Backfill: proxy input rows (remote_vote) must not count for leaderboard
UPDATE public.scores
  SET
    counts_for_leaderboard = false,
    counts_for_accuracy = false
  WHERE response_data->>'type' = 'remote_vote';

-- 3. Replace session_leaderboard view
-- Filters counts_for_leaderboard=true so proxy rows are excluded.
-- Preserves existing column names (student_id, student_name, avatar_seed,
-- total_points, correct_count, total_attempts, best_streak) so existing
-- callers do not break.
-- Adds V2 accuracy columns (v2_correct_count, accuracy_attempts) for new readers.
CREATE OR REPLACE VIEW public.session_leaderboard AS
SELECT
  s.session_id,
  COALESCE(s.student_id, s.client_id)               AS student_id,
  COALESCE(st.name, s.display_name)                 AS student_name,
  st.avatar_seed,
  SUM(s.points + s.streak_bonus)                    AS total_points,
  -- Legacy accuracy (is_correct): kept for pre-V2 rows
  COUNT(*) FILTER (WHERE s.is_correct = true)       AS correct_count,
  COUNT(*)                                           AS total_attempts,
  MAX(s.streak_count)                               AS best_streak,
  -- V2 accuracy: use accuracy_status + counts_for_accuracy
  COUNT(*) FILTER (WHERE s.accuracy_status = 'correct')    AS v2_correct_count,
  COUNT(*) FILTER (WHERE s.counts_for_accuracy = true)     AS accuracy_attempts,
  -- V2 metadata
  MAX(s.scoring_version)                            AS max_scoring_version
FROM public.scores s
LEFT JOIN public.students st ON st.id = s.student_id
WHERE
  COALESCE(s.student_id, s.client_id) IS NOT NULL
  AND s.counts_for_leaderboard = true
GROUP BY
  s.session_id,
  COALESCE(s.student_id, s.client_id),
  COALESCE(st.name, s.display_name),
  st.avatar_seed;
