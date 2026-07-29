-- Captain of the Day: the top scorer(s) of a class's most recent session earn a wings
-- insignia they can wear in the next session. Stored as a per-student flag so the roster
-- query (join picker) can surface it directly. On each session end the server crowns the
-- new captain(s) and clears everyone else in the class (see /api/session/end).
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_captain_of_the_day boolean NOT NULL DEFAULT false;
