-- Migration 026: Enable realtime for student_session_prefs
-- Required so teacher-side useStudentPrefs hook receives live pref updates
-- (e.g. student enabling stealth mode mid-session).

ALTER PUBLICATION supabase_realtime ADD TABLE public.student_session_prefs;
