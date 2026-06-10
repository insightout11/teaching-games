-- Public, opt-in sharing for a class's World Flight journey.
-- A share token renders a read-only, indexable marketing page (no student PII).
-- Sharing is off by default; the teacher toggles it on from /world-flight.
alter table public.class_world_flight_state
  add column if not exists share_token uuid not null default gen_random_uuid(),
  add column if not exists share_enabled boolean not null default false;

create index if not exists class_world_flight_state_share_token
  on public.class_world_flight_state (share_token) where share_enabled;
