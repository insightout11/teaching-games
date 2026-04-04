-- Add per-class default scoring mode preset
alter table public.classes
  add column default_scoring_mode text default null;
