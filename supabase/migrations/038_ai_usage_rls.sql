-- ai_usage (migration 036) was created without RLS, breaking the convention
-- set in 001. Without RLS the table is fully readable/writable via the anon
-- key: anyone could insert junk rows for a teacher_id (exhausting their weekly
-- free cap) or delete rows to bypass their own. No policies on purpose — only
-- checkAndRecordAiUsage() touches this table, via the service role, which
-- bypasses RLS.
alter table public.ai_usage enable row level security;
