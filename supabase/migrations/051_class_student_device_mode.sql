-- Per-class setting: whether students answer on their own devices, or the class
-- shares one screen (teacher enters answers on behalf of the class). Drives honest
-- "needs student devices" / "students answer by voice" badges in launch flows.
alter table public.classes
  add column student_device_mode text not null default 'devices'
    check (student_device_mode in ('devices', 'shared-screen'));
