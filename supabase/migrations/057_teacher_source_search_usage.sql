-- PR ONLY: not applied. Independent of the replacement Live Room schema.
BEGIN;
CREATE TABLE public.teacher_source_search_usage (
 teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
 usage_date date NOT NULL,
 used integer NOT NULL CHECK (used >= 0),
 PRIMARY KEY (teacher_id,usage_date)
);
ALTER TABLE public.teacher_source_search_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.teacher_source_search_usage FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.reserve_teacher_source_search(p_teacher_id uuid,p_cap integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE day date := (statement_timestamp() AT TIME ZONE 'UTC')::date; reserved integer;
BEGIN
 IF p_teacher_id IS NULL OR p_cap IS NULL OR p_cap<0 OR p_cap>100000 THEN
  RAISE EXCEPTION 'INVALID_SOURCE_BUDGET';
 END IF;
 IF p_cap=0 THEN RAISE EXCEPTION 'SOURCE_LIMIT'; END IF;
 INSERT INTO public.teacher_source_search_usage AS usage(teacher_id,usage_date,used)
 VALUES(p_teacher_id,day,1)
 ON CONFLICT(teacher_id,usage_date) DO UPDATE SET used=usage.used+1 WHERE usage.used<p_cap
 RETURNING used INTO reserved;
 IF reserved IS NULL THEN RAISE EXCEPTION 'SOURCE_LIMIT'; END IF;
 RETURN reserved;
END $$;
REVOKE ALL ON FUNCTION public.reserve_teacher_source_search(uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.reserve_teacher_source_search(uuid,integer) TO service_role;
COMMIT;
