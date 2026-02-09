-- TeachPlay initial schema

-- Teachers (extends auth.users)
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'trial', 'active', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Classes
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  theme text not null default 'colorful' check (theme in ('colorful', 'professional')),
  ai_scoring_config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Students (no auth, belong to a class)
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  avatar_seed text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

-- Sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Rounds
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  game_type text not null,
  game_config jsonb default '{}',
  round_number int not null,
  created_at timestamptz not null default now()
);

-- Scores
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  points int not null default 0,
  streak_count int not null default 0,
  streak_bonus int not null default 0,
  is_correct boolean not null default false,
  response_data jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Session leaderboard view
create or replace view public.session_leaderboard as
select
  s.session_id,
  s.student_id,
  st.name as student_name,
  st.avatar_seed,
  sum(s.points + s.streak_bonus) as total_points,
  count(*) filter (where s.is_correct) as correct_count,
  count(*) as total_attempts,
  max(s.streak_count) as best_streak
from public.scores s
join public.students st on st.id = s.student_id
group by s.session_id, s.student_id, st.name, st.avatar_seed;

-- Enable RLS
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.rounds enable row level security;
alter table public.scores enable row level security;

-- RLS policies: teachers see only their own data
create policy "Teachers see own profile" on public.teachers
  for all using (id = auth.uid());

create policy "Teachers see own classes" on public.classes
  for all using (teacher_id = auth.uid());

create policy "Teachers see own students" on public.students
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()));

create policy "Teachers see own sessions" on public.sessions
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()));

create policy "Teachers see own rounds" on public.rounds
  for all using (session_id in (
    select s.id from public.sessions s
    join public.classes c on c.id = s.class_id
    where c.teacher_id = auth.uid()
  ));

create policy "Teachers see own scores" on public.scores
  for all using (session_id in (
    select s.id from public.sessions s
    join public.classes c on c.id = s.class_id
    where c.teacher_id = auth.uid()
  ));

-- Enable realtime on scores
alter publication supabase_realtime add table public.scores;

-- Indexes
create index idx_classes_teacher on public.classes(teacher_id);
create index idx_students_class on public.students(class_id);
create index idx_sessions_class on public.sessions(class_id);
create index idx_rounds_session on public.rounds(session_id);
create index idx_scores_session on public.scores(session_id);
create index idx_scores_student on public.scores(student_id);
create index idx_scores_round on public.scores(round_id);

-- Function to auto-create teacher profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.teachers (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
