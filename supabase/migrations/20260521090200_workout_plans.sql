-- ============ workout_plans ============
create table if not exists public.workout_plans (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  client_id      uuid references public.profiles(id) on delete set null, -- null = template
  name           text not null,
  description_ar text,
  description_en text,
  status         text not null default 'active'
                   check (status in ('active','archived','draft')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index workout_plans_coach_id_idx on public.workout_plans(coach_id);
create index workout_plans_client_id_idx on public.workout_plans(client_id);
alter table public.workout_plans enable row level security;

create policy "workout_plans_coach_all"
  on public.workout_plans for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "workout_plans_client_select"
  on public.workout_plans for select to authenticated
  using (client_id = auth.uid());

-- ============ workout_days ============
create table if not exists public.workout_days (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.workout_plans(id) on delete cascade,
  name        text not null,
  order_index int not null,
  is_rest     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index workout_days_plan_id_idx on public.workout_days(plan_id);
alter table public.workout_days enable row level security;

create policy "workout_days_coach_all"
  on public.workout_days for all to authenticated
  using (exists (select 1 from public.workout_plans p
                 where p.id = plan_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from public.workout_plans p
                 where p.id = plan_id and p.coach_id = auth.uid()));

create policy "workout_days_client_select"
  on public.workout_days for select to authenticated
  using (exists (select 1 from public.workout_plans p
                 where p.id = plan_id and p.client_id = auth.uid()));

-- ============ workout_day_exercises ============
create table if not exists public.workout_day_exercises (
  id           uuid primary key default gen_random_uuid(),
  day_id       uuid not null references public.workout_days(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete restrict,
  order_index  int not null,
  sets         int not null default 3,
  rep_range    text not null default '8-12',
  rest_seconds int,
  notes        text,
  created_at   timestamptz not null default now()
);
create index workout_day_exercises_day_id_idx on public.workout_day_exercises(day_id);
alter table public.workout_day_exercises enable row level security;

create policy "workout_day_exercises_coach_all"
  on public.workout_day_exercises for all to authenticated
  using (exists (select 1 from public.workout_days d
                 join public.workout_plans p on p.id = d.plan_id
                 where d.id = day_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from public.workout_days d
                 join public.workout_plans p on p.id = d.plan_id
                 where d.id = day_id and p.coach_id = auth.uid()));

create policy "workout_day_exercises_client_select"
  on public.workout_day_exercises for select to authenticated
  using (exists (select 1 from public.workout_days d
                 join public.workout_plans p on p.id = d.plan_id
                 where d.id = day_id and p.client_id = auth.uid()));

-- ============ workout_logs ============
create table if not exists public.workout_logs (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.profiles(id) on delete cascade,
  plan_id           uuid references public.workout_plans(id) on delete set null,
  day_id            uuid references public.workout_days(id) on delete set null,
  day_name_snapshot text not null,
  status            text not null default 'in_progress'
                      check (status in ('in_progress','completed')),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);
create index workout_logs_client_id_idx on public.workout_logs(client_id);
alter table public.workout_logs enable row level security;

create policy "workout_logs_client_all"
  on public.workout_logs for all to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());

create policy "workout_logs_coach_select"
  on public.workout_logs for select to authenticated
  using (exists (select 1 from public.workout_plans p
                 where p.id = plan_id and p.coach_id = auth.uid()));

-- ============ workout_log_sets ============
create table if not exists public.workout_log_sets (
  id                     uuid primary key default gen_random_uuid(),
  log_id                 uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id            uuid references public.exercises(id) on delete set null,
  exercise_name_snapshot text not null,
  set_number             int not null,
  reps                   int,
  weight                 numeric,
  completed              boolean not null default false,
  created_at             timestamptz not null default now()
);
create index workout_log_sets_log_id_idx on public.workout_log_sets(log_id);
alter table public.workout_log_sets enable row level security;

create policy "workout_log_sets_client_all"
  on public.workout_log_sets for all to authenticated
  using (exists (select 1 from public.workout_logs l
                 where l.id = log_id and l.client_id = auth.uid()))
  with check (exists (select 1 from public.workout_logs l
                 where l.id = log_id and l.client_id = auth.uid()));
