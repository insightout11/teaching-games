-- Add per-class default difficulty and tone presets
alter table public.classes
  add column default_difficulty text default null,
  add column default_tone text default null;
