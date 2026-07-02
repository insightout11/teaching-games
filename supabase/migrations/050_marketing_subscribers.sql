-- Email capture for pre-marketing growth: homepage + /video-lesson result screen.
create table if not exists public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- Deny-all: only the service role (used by /api/marketing/subscribe) may read/write
-- this table. No policies needed — RLS with zero policies blocks the anon key
-- entirely while the service role still bypasses RLS.
alter table public.marketing_subscribers enable row level security;
