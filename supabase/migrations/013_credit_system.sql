-- Credit system for generation gating
-- Teachers get 2 free session generations, +3 on email verification, unlimited on Pro

ALTER TABLE public.teachers
  ADD COLUMN generation_credits int NOT NULL DEFAULT 2,
  ADD COLUMN email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN total_generations int NOT NULL DEFAULT 0;

-- Auto-verify Google OAuth users (they already have verified emails)
-- and grant them the full 5 credits
UPDATE public.teachers t
SET email_verified = true, generation_credits = 5
FROM auth.users u
WHERE t.id = u.id
  AND u.raw_app_meta_data->>'provider' = 'google';

-- Update the trigger so new Google OAuth signups get auto-verified with 5 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.teachers (id, email, display_name, avatar_url, email_verified, generation_credits)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    -- Google OAuth users are already email-verified
    coalesce(new.raw_app_meta_data->>'provider', '') = 'google',
    CASE WHEN coalesce(new.raw_app_meta_data->>'provider', '') = 'google' THEN 5 ELSE 2 END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to decrement credits and increment total_generations atomically
-- Returns the new credit count (-1 means the teacher wasn't found)
CREATE OR REPLACE FUNCTION public.use_generation_credit(teacher_id uuid)
RETURNS int AS $$
DECLARE
  new_credits int;
BEGIN
  UPDATE public.teachers
  SET generation_credits = GREATEST(generation_credits - 1, 0),
      total_generations = total_generations + 1
  WHERE id = teacher_id
    AND (generation_credits > 0 OR subscription_status = 'active')
  RETURNING generation_credits INTO new_credits;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get teacher credit info
CREATE OR REPLACE FUNCTION public.get_teacher_credits(teacher_id uuid)
RETURNS TABLE(credits int, is_verified boolean, is_pro boolean, generations int) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.generation_credits,
    t.email_verified,
    t.subscription_status = 'active',
    t.total_generations
  FROM public.teachers t
  WHERE t.id = teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
