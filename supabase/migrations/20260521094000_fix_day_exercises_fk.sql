-- Fix: the reconcile migration (20260521093000) ran `drop table exercises cascade`,
-- which dropped the FK from workout_day_exercises.exercise_id -> exercises.id.
-- Re-running 20260521090200 used `create table if not exists`, so the table was
-- skipped and the FK never came back. PostgREST needs this FK to embed
-- `exercise:exercises(*)` in getPlanWithDays. Re-add it (idempotent).

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'workout_day_exercises_exercise_id_fkey'
      and table_name = 'workout_day_exercises'
      and table_schema = 'public'
  ) then
    alter table public.workout_day_exercises
      add constraint workout_day_exercises_exercise_id_fkey
      foreign key (exercise_id) references public.exercises(id) on delete restrict;
  end if;
end $$;

-- Also re-check the workout_log_sets -> exercises FK (same cascade casualty).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'workout_log_sets_exercise_id_fkey'
      and table_name = 'workout_log_sets'
      and table_schema = 'public'
  ) then
    alter table public.workout_log_sets
      add constraint workout_log_sets_exercise_id_fkey
      foreign key (exercise_id) references public.exercises(id) on delete set null;
  end if;
end $$;
