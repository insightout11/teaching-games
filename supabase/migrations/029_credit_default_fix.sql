-- Fix credit defaults: all new teachers get 5 Test Flight credits
-- Background: migration 015 overrode 013's trigger, dropping Google OAuth
-- from 5 → 1 credit and email signups to 0. This restores the intended model:
-- every new teacher, regardless of signup method, starts with 5 Test Flights.

-- 1. Update column default
ALTER TABLE public.teachers
  ALTER COLUMN generation_credits SET DEFAULT 5;

-- 2. Replace handle_new_user: always 5 credits, no provider distinction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.teachers (id, email, display_name, avatar_url, email_verified, generation_credits)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', '') = 'google',
    5
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing teachers who never ran a session (give them the full 5)
UPDATE public.teachers
SET generation_credits = 5
WHERE total_generations = 0
  AND generation_credits < 5;
