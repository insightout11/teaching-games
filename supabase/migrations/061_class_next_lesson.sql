-- Prepare the next lesson (replaces the old planner): one prepared lesson per class, shown on Home as the class's
-- next flight and launched by Board, then cleared. Shape: src/lib/prepared-lesson.ts (PreparedLesson). Null = none.
alter table public.classes
  add column next_lesson jsonb;
