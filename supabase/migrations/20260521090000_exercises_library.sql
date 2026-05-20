-- exercises: shared library (coach_id null = global/seeded) + per-coach customs
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid references public.profiles(id) on delete cascade, -- null = global
  name_ar       text not null,
  name_en       text not null,
  muscle_group  text not null check (muscle_group in
                  ('chest','back','shoulders','legs','arms','core','full_body','cardio')),
  equipment     text,
  video_url     text,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index exercises_coach_id_idx on public.exercises(coach_id);
create index exercises_muscle_group_idx on public.exercises(muscle_group);

alter table public.exercises enable row level security;

-- library is not sensitive: any authenticated user may read all exercises
create policy "exercises_select_authenticated"
  on public.exercises for select
  to authenticated
  using (true);

-- coaches manage only their own customs
create policy "exercises_insert_own"
  on public.exercises for insert
  to authenticated
  with check (coach_id = auth.uid());

create policy "exercises_update_own"
  on public.exercises for update
  to authenticated
  using (coach_id = auth.uid());

create policy "exercises_delete_own"
  on public.exercises for delete
  to authenticated
  using (coach_id = auth.uid());
