-- Invite codes, signup attribution, and adjusted onboarding credits
-- Credit model (Max's spec):
--   1 credit = 1 session start
--   Email signup:   0 credits  (verify email to get +1)
--   Google OAuth:   1 credit   (already verified)
--   Email verify:  +1 credit   (via activate_email_credit RPC)
--   Standard invite (LC-CAMPAIGN-####): +3 credits
--   Creator invite: +5 credits
--   Anti-abuse: max 1 invite code per teacher, single-use by default, 30-day expiry

-- ── 1. invite_codes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text        NOT NULL UNIQUE,          -- e.g. LC-BETA-A3F7
  campaign        text        NOT NULL,                  -- e.g. 'beta', 'partner-school'
  tier            text        NOT NULL DEFAULT 'standard'
                              CHECK (tier IN ('standard', 'creator')),
  credits_granted int         NOT NULL DEFAULT 3,        -- 3 for standard, 5 for creator
  is_single_use   boolean     NOT NULL DEFAULT true,
  uses_count      int         NOT NULL DEFAULT 0,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- No public access — codes are managed via service role only
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_codes_no_public_access"
  ON public.invite_codes
  FOR ALL
  USING (false);

-- ── 2. invite_code_redemptions ─────────────────────────────────────────────────
-- UNIQUE on teacher_id enforces max-1-code-per-teacher at the DB level
CREATE TABLE IF NOT EXISTS public.invite_code_redemptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     uuid        NOT NULL UNIQUE REFERENCES public.teachers(id) ON DELETE CASCADE,
  invite_code_id uuid        NOT NULL REFERENCES public.invite_codes(id),
  redeemed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions_teacher_read_own"
  ON public.invite_code_redemptions
  FOR SELECT
  USING (teacher_id = auth.uid());

-- ── 3. signup_source on teachers ──────────────────────────────────────────────
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS signup_source text;

-- ── 4. Update handle_new_user with new credit defaults ────────────────────────
--    Email signup: 0 credits (pending email verification)
--    Google OAuth: 1 credit  (already verified — gets the email-verify credit)
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
    CASE
      WHEN coalesce(new.raw_app_meta_data->>'provider', '') = 'google' THEN 1
      ELSE 0
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. activate_email_credit ──────────────────────────────────────────────────
-- Grants +1 credit when a teacher verifies their email.
-- No-op if already verified. Returns new credit balance (-1 if teacher not found).
CREATE OR REPLACE FUNCTION public.activate_email_credit(p_teacher_id uuid)
RETURNS int AS $$
DECLARE
  v_new_credits int;
BEGIN
  -- Atomically mark verified + add credit (only if not yet verified)
  UPDATE public.teachers
  SET email_verified    = true,
      generation_credits = generation_credits + 1
  WHERE id            = p_teacher_id
    AND email_verified = false
  RETURNING generation_credits INTO v_new_credits;

  IF NOT FOUND THEN
    -- Already verified (or teacher doesn't exist) — return current balance
    SELECT generation_credits INTO v_new_credits
    FROM public.teachers
    WHERE id = p_teacher_id;
    RETURN COALESCE(v_new_credits, -1);
  END IF;

  RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. redeem_invite_code ─────────────────────────────────────────────────────
-- Validates and consumes an invite code atomically.
-- Returns: credits_granted on success.
-- Raises named exceptions on failure (caught and mapped in API route):
--   INVITE_NOT_FOUND, INVITE_EXPIRED, INVITE_ALREADY_USED, ALREADY_REDEEMED
CREATE OR REPLACE FUNCTION public.redeem_invite_code(
  p_teacher_id uuid,
  p_code       text
)
RETURNS int AS $$
DECLARE
  v_code        public.invite_codes%ROWTYPE;
BEGIN
  -- Lock the code row to prevent race conditions on single-use codes
  SELECT * INTO v_code
  FROM public.invite_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND';
  END IF;

  IF v_code.expires_at < now() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;

  IF v_code.is_single_use AND v_code.uses_count >= 1 THEN
    RAISE EXCEPTION 'INVITE_ALREADY_USED';
  END IF;

  -- Max 1 code per teacher (UNIQUE constraint is the hard guarantee;
  -- this gives a friendlier error message)
  IF EXISTS (
    SELECT 1 FROM public.invite_code_redemptions
    WHERE teacher_id = p_teacher_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_REDEEMED';
  END IF;

  -- Record redemption
  INSERT INTO public.invite_code_redemptions (teacher_id, invite_code_id)
  VALUES (p_teacher_id, v_code.id);

  -- Increment uses_count
  UPDATE public.invite_codes
  SET uses_count = uses_count + 1
  WHERE id = v_code.id;

  -- Grant credits; set signup_source to campaign if not already set
  UPDATE public.teachers
  SET generation_credits = generation_credits + v_code.credits_granted,
      signup_source       = COALESCE(signup_source, v_code.campaign)
  WHERE id = p_teacher_id;

  RETURN v_code.credits_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
