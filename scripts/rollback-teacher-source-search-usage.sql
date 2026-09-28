-- NOT EXECUTED. Manual rollback only, after disabling SOURCES_ENABLED.
-- Destructively removes search counters; reapplying resets allowance history.
-- Also reconcile the migration ledger using your normal deployment procedure.
BEGIN;
DROP FUNCTION public.reserve_teacher_source_search(uuid,integer);
DROP TABLE public.teacher_source_search_usage;
COMMIT;
