-- Entitlement extensions: developer flag + promotional access (Test Flights)
-- is_developer: set directly in Supabase Studio; bypasses all monetisation checks
-- promo_expires_at: NULL = no promo; set to future timestamp for time-limited Pro access

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS is_developer    boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;

-- Update RPC to include is_developer and evaluate promo window in is_pro
CREATE OR REPLACE FUNCTION public.get_teacher_credits(teacher_id uuid)
RETURNS TABLE(
  credits      int,
  is_verified  boolean,
  is_pro       boolean,
  is_developer boolean,
  generations  int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.generation_credits,
    t.email_verified,
    (
      t.is_developer = true
      OR t.subscription_status = 'active'
      OR (t.promo_expires_at IS NOT NULL AND t.promo_expires_at > now())
    ),
    t.is_developer,
    t.total_generations
  FROM public.teachers t
  WHERE t.id = teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
