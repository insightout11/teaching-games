-- Teacher onboarding profile — drives "Recommended for you" personalization (home §5).
-- Captured by a short first-run flow; nullable so a skipped/partial profile is fine.
-- RLS: the existing "Teachers see own profile" policy (for all using id = auth.uid())
-- already permits a teacher to update these on their own row.

alter table public.teachers
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists profile_class_size   text,   -- one-on-one | small-group | classroom | mixed
  add column if not exists profile_level        text,   -- beginner | intermediate | advanced | mixed
  add column if not exists profile_focus        text,   -- speaking | grammar | vocabulary | exam | business | kids
  add column if not exists profile_age          text,   -- kids | teens | adults
  add column if not exists profile_mode         text;   -- online | in-person

comment on column public.teachers.profile_focus is
  'Onboarding: main teaching focus — drives which lessons/shelves lead on the home.';
