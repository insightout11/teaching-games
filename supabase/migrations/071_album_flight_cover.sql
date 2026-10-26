-- 071: the flight's album cover (Oct 2026). When the class's "best discovery" is a landmark it photographed on that
-- flight, that photo becomes the flight's cover. One per session; the server sets it.
alter table public.class_landmark_photos add column if not exists flight_cover boolean not null default false;

-- Check (run after): should return 1.
-- SELECT count(*) FROM information_schema.columns WHERE table_name = 'class_landmark_photos' AND column_name = 'flight_cover';
