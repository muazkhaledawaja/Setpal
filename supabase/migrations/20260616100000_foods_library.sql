-- foods: shared library (coach_id null = global/seeded) + per-coach customs
-- Mirrors the exercises library pattern. Macros are per `serving_grams` serving.
create table if not exists public.foods (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid references public.profiles(id) on delete cascade, -- null = global
  name_ar         text not null,
  name_en         text not null,
  category        text not null check (category in
                    ('grains','protein','dairy','vegetables','fruits','fats','beverages','composite')),
  serving_label_ar text,
  serving_label_en text,
  serving_grams   numeric not null default 100,
  calories        numeric not null default 0,
  protein_g       numeric not null default 0,
  carbs_g         numeric not null default 0,
  fat_g           numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists foods_coach_id_idx on public.foods(coach_id);
create index if not exists foods_category_idx on public.foods(category);

alter table public.foods enable row level security;

-- library is not sensitive: any authenticated user may read all foods
create policy "foods_select_authenticated"
  on public.foods for select
  to authenticated
  using (true);

-- coaches manage only their own customs
create policy "foods_insert_own"
  on public.foods for insert
  to authenticated
  with check (coach_id = auth.uid());

create policy "foods_update_own"
  on public.foods for update
  to authenticated
  using (coach_id = auth.uid());

create policy "foods_delete_own"
  on public.foods for delete
  to authenticated
  using (coach_id = auth.uid());
