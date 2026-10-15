-- 064: lock student data and teacher entitlements (critical audit, Oct 2026). Applied to production 15 Oct 2026
-- by the owner in the SQL editor (this exact text).
--
-- Students never talk to the database directly: every phone read and write goes through a server route that uses
-- the service role, which these rules do not affect. The only browsers that read these tables directly are the
-- teacher's own screens, signed in as the teacher. So each table becomes readable by the teacher who owns the
-- session and by nobody else, and writable only by the server. Tables, views or columns missing from a database are
-- skipped (production had never received migration 012, so session_missions does not exist there).

BEGIN;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'session_missions','session_participants','student_session_prefs',
    'wonder_questions','wonder_votes','flight_cards','debate_points'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'skipped % (not in this database)', t;
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Teachers read own session rows" ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY "Teachers read own session rows" ON public.%I
        FOR SELECT TO authenticated
        USING (session_id IN (
          SELECT s.id FROM public.sessions s
          JOIN public.classes c ON c.id = s.class_id
          WHERE c.teacher_id = auth.uid()))
    $p$, t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- Captain's Pick puts a student's name and answer here; it was readable by anyone.
DROP POLICY IF EXISTS "Anyone can read session private state" ON public.session_private_state;
DROP POLICY IF EXISTS "Teachers read own session state" ON public.session_private_state;
CREATE POLICY "Teachers read own session state" ON public.session_private_state
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT s.id FROM public.sessions s
    JOIN public.classes c ON c.id = s.class_id
    WHERE c.teacher_id = auth.uid()));
REVOKE ALL ON public.session_private_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.session_private_state FROM authenticated;

-- The leaderboard view now obeys the reader's own access to scores and students.
DO $$
BEGIN
  IF to_regclass('public.session_leaderboard') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.session_leaderboard SET (security_invoker = true)';
    EXECUTE 'REVOKE ALL ON public.session_leaderboard FROM anon';
  END IF;
END $$;

-- Teachers may change only their name, picture and onboarding answers (whichever of those columns exist);
-- Pro, developer and credit fields are changed only by the server.
REVOKE INSERT, UPDATE, DELETE ON public.teachers FROM anon, authenticated;
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ') INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'teachers'
    AND column_name IN ('display_name','avatar_url','onboarding_completed','profile_class_size',
                        'profile_level','profile_focus','profile_age','profile_mode');
  IF cols IS NOT NULL THEN
    EXECUTE format('GRANT UPDATE (%s) ON public.teachers TO authenticated', cols);
  END IF;
END $$;

-- Usage counter: one allowance per kind of paid work (see checkAndRecordAiUsage).
DO $$
BEGIN
  IF to_regclass('public.ai_usage') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT ''ai''';
    EXECUTE 'CREATE INDEX IF NOT EXISTS ai_usage_teacher_kind_window ON public.ai_usage (teacher_id, kind, created_at DESC)';
  END IF;
END $$;

COMMIT;
