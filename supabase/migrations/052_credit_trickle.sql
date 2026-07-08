-- Monthly credit trickle for exhausted free accounts (pricing/Pro audit Phase 4).
--
-- A teacher who burns all 5 onboarding Test Flight credits is otherwise
-- permanently locked out. This grants 1 credit per 30 days, lazily, inside
-- get_teacher_credits — every entitlement read (launch gate, tier hook,
-- session create) flows through this RPC, so no cron and no new call sites.
--
-- Rules:
--   * Only non-Pro, non-developer accounts with 0 credits remaining.
--   * Only genuinely exhausted accounts: total_generations >= 5 (they used
--     their full onboarding grant; fresh accounts never trickle).
--   * Non-cumulative: the grant sets credits to 1, and the next grant can't
--     happen until 30 days after the last one. Unused trickle doesn't stack.

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS last_trickle_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_teacher_credits(teacher_id uuid)
RETURNS TABLE(
  credits      int,
  is_verified  boolean,
  is_pro       boolean,
  is_developer boolean,
  generations  int
) AS $$
BEGIN
  -- Lazy monthly trickle: top an exhausted free account back up to 1 credit.
  UPDATE public.teachers t
  SET generation_credits = 1,
      last_trickle_at = now()
  WHERE t.id = teacher_id
    AND t.generation_credits = 0
    AND t.total_generations >= 5
    AND t.is_developer = false
    AND t.subscription_status IS DISTINCT FROM 'active'
    AND (t.promo_expires_at IS NULL OR t.promo_expires_at <= now())
    AND (t.last_trickle_at IS NULL OR t.last_trickle_at < now() - INTERVAL '30 days');

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
