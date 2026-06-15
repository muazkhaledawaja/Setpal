-- ============ meal_plans ============
-- Mirrors workout_plans, one level deeper: plans -> days -> meals -> items(food).
create table if not exists public.meal_plans (
  id                   uuid primary key default gen_random_uuid(),
  coach_id             uuid not null references public.profiles(id) on delete cascade,
  client_id            uuid references public.profiles(id) on delete set null, -- null = template
  name                 text not null,
  description_ar       text,
  description_en       text,
  status               text not null default 'active'
                         check (status in ('active','archived','draft')),
  daily_calorie_target numeric,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index meal_plans_coach_id_idx on public.meal_plans(coach_id);
create index meal_plans_client_id_idx on public.meal_plans(client_id);
alter table public.meal_plans enable row level security;

create policy "meal_plans_coach_all"
  on public.meal_plans for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "meal_plans_client_select"
  on public.meal_plans for select to authenticated
  using (client_id = auth.uid());

-- ============ meal_plan_days ============
create table if not exists public.meal_plan_days (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.meal_plans(id) on delete cascade,
  name        text not null,
  order_index int not null,
  created_at  timestamptz not null default now()
);
create index meal_plan_days_plan_id_idx on public.meal_plan_days(plan_id);
alter table public.meal_plan_days enable row level security;

create policy "meal_plan_days_coach_all"
  on public.meal_plan_days for all to authenticated
  using (exists (select 1 from public.meal_plans p
                 where p.id = plan_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from public.meal_plans p
                 where p.id = plan_id and p.coach_id = auth.uid()));

create policy "meal_plan_days_client_select"
  on public.meal_plan_days for select to authenticated
  using (exists (select 1 from public.meal_plans p
                 where p.id = plan_id and p.client_id = auth.uid()));

-- ============ meal_plan_meals ============
create table if not exists public.meal_plan_meals (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references public.meal_plan_days(id) on delete cascade,
  name_ar     text not null,
  name_en     text not null,
  order_index int not null,
  time_label  text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index meal_plan_meals_day_id_idx on public.meal_plan_meals(day_id);
alter table public.meal_plan_meals enable row level security;

create policy "meal_plan_meals_coach_all"
  on public.meal_plan_meals for all to authenticated
  using (exists (select 1 from public.meal_plan_days d
                 join public.meal_plans p on p.id = d.plan_id
                 where d.id = day_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from public.meal_plan_days d
                 join public.meal_plans p on p.id = d.plan_id
                 where d.id = day_id and p.coach_id = auth.uid()));

create policy "meal_plan_meals_client_select"
  on public.meal_plan_meals for select to authenticated
  using (exists (select 1 from public.meal_plan_days d
                 join public.meal_plans p on p.id = d.plan_id
                 where d.id = day_id and p.client_id = auth.uid()));

-- ============ meal_plan_items ============
create table if not exists public.meal_plan_items (
  id             uuid primary key default gen_random_uuid(),
  meal_id        uuid not null references public.meal_plan_meals(id) on delete cascade,
  food_id        uuid not null references public.foods(id) on delete restrict,
  order_index    int not null,
  quantity_grams numeric not null default 100,
  notes          text,
  created_at     timestamptz not null default now()
);
create index meal_plan_items_meal_id_idx on public.meal_plan_items(meal_id);
alter table public.meal_plan_items enable row level security;

create policy "meal_plan_items_coach_all"
  on public.meal_plan_items for all to authenticated
  using (exists (select 1 from public.meal_plan_meals m
                 join public.meal_plan_days d on d.id = m.day_id
                 join public.meal_plans p on p.id = d.plan_id
                 where m.id = meal_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from public.meal_plan_meals m
                 join public.meal_plan_days d on d.id = m.day_id
                 join public.meal_plans p on p.id = d.plan_id
                 where m.id = meal_id and p.coach_id = auth.uid()));

create policy "meal_plan_items_client_select"
  on public.meal_plan_items for select to authenticated
  using (exists (select 1 from public.meal_plan_meals m
                 join public.meal_plan_days d on d.id = m.day_id
                 join public.meal_plans p on p.id = d.plan_id
                 where m.id = meal_id and p.client_id = auth.uid()));
