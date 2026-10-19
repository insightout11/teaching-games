-- 067: how a class usually runs (class type, age, second screens, online or classroom, usual length, game vote).
-- Read and written by the class's teacher (existing classes policy). Null = not set up yet: the class works as before.
-- Safe to run twice.
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_profile jsonb;
