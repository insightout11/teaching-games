-- Fix session_leaderboard view to include remote students whose scores have
-- student_id = null (written before the clientId→studentId cache fix).
-- Uses LEFT JOIN + coalesce so existing session data remains visible.

create or replace view public.session_leaderboard as
select
  s.session_id,
  coalesce(s.student_id, s.client_id) as student_id,
  coalesce(st.name, s.display_name) as student_name,
  st.avatar_seed,
  sum(s.points + s.streak_bonus) as total_points,
  count(*) filter (where s.is_correct = true) as correct_count,
  count(*) as total_attempts,
  max(s.streak_count) as best_streak
from public.scores s
left join public.students st on st.id = s.student_id
where coalesce(s.student_id, s.client_id) is not null
group by
  s.session_id,
  coalesce(s.student_id, s.client_id),
  coalesce(st.name, s.display_name),
  st.avatar_seed;
