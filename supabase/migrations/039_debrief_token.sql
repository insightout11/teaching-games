-- Per-participant take-home debrief token. Lets a student reopen their own
-- session results (points, accuracy, streak, rank + session vocab) on another
-- device/day via a public /debrief/[token] page. Read-only; expires 30 days
-- after the session ends (enforced in the page against sessions.ended_at).
alter table public.session_participants
  add column if not exists debrief_token uuid not null default gen_random_uuid();

create index if not exists session_participants_debrief_token
  on public.session_participants (debrief_token);
