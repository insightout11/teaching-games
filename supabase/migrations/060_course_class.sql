-- Course belongs to a class (course builder upgrade, docs/course-builder-review.md): chosen once in the builder, so
-- Board on the course goes straight to the next lesson for that class. Null = choose when boarding (existing courses).
alter table public.courses
  add column class_id uuid references public.classes(id) on delete set null;
create index if not exists idx_courses_class on public.courses(class_id);
