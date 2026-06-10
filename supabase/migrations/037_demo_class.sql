-- Demo classes power the "Try a demo lesson" onboarding flow: a real session
-- against a hidden, per-teacher demo class driven by client-side simulated
-- students. Flagged so Control Room aggregates and normal class lists can
-- exclude them.
alter table public.classes
  add column if not exists is_demo boolean not null default false;

create index if not exists classes_is_demo on public.classes (teacher_id) where is_demo;
