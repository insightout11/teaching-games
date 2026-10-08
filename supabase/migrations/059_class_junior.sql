-- Junior mode (docs/pictures-and-junior-concept.md, part 2): one switch per class for young kids (about 5-9).
-- Turns on picture answers, bigger phone tiles, gentle feedback and no rankings for that class's lessons.
alter table public.classes
  add column junior boolean not null default false;
