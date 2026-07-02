-- Public, opt-in sharing for every class's general logbook.
-- This is separate from World Flight's journey share because non-World-Flight
-- classes still need a safe, account-free class progress page.
alter table public.classes
  add column if not exists logbook_share_token uuid not null default gen_random_uuid(),
  add column if not exists logbook_share_enabled boolean not null default false;

create unique index if not exists classes_logbook_share_token
  on public.classes (logbook_share_token);

create index if not exists classes_logbook_share_enabled_token
  on public.classes (logbook_share_token) where logbook_share_enabled;
