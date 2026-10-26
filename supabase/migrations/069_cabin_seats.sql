-- Migration 069: students pick their cabin seat on the phone (Oct 2026, pilot 001: "sit next to my friends").
-- Null = no pick; the room seats them in boarding order around the picked seats.
alter table public.session_participants add column if not exists seat smallint;
alter table public.session_participants drop constraint if exists session_participants_seat_range;
alter table public.session_participants add constraint session_participants_seat_range check (seat is null or (seat >= 0 and seat < 48));
-- One student per seat per session; a second tap on a taken seat fails instead of doubling up.
create unique index if not exists session_participants_seat_unique on public.session_participants (session_id, seat) where seat is not null;
