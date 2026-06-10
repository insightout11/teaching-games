-- Per-teacher AI generation usage log.
-- Used by checkAndRecordAiUsage() in src/lib/auth-credits.ts to enforce a
-- rolling weekly free-tier cap on per-round AI calls (anti-abuse backstop).
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_usage_teacher_window on public.ai_usage (teacher_id, created_at desc);
