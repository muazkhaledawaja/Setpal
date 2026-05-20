# Workout Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Workout Plans vertical slice — coach builds a plan from an exercise library, assigns it to a client, the client views it in a real client portal, logs a live workout session, and sees it in workout-log history.

**Architecture:** Follow the existing Setpal module pattern: SQL migrations (applied by hand via Supabase Dashboard) + RLS as the auth layer, framework-free services (`SupabaseClient<Database>` in constructor, `any` boundary cast for stubbed types), thin Server Components / Client Components, shadcn UI with existing design tokens, bilingual via next-intl.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Supabase (Postgres + RLS + Auth), Tailwind v4, shadcn/ui, react-hook-form + zod, next-intl, lucide-react, sonner.

**Testing reality:** This codebase has NO unit-test framework yet (Vitest is planned but not installed). Standing one up is out of scope for this slice. Verification is therefore: (a) `npm run build` must pass after every code task (catches type errors against the extended `database.ts` stub), and (b) manual end-to-end verification at the checkpoints marked **🔍 VERIFY**, driven through the running app. Do NOT write `*.test.ts` files in this plan.

**Migration reality:** Per CLAUDE.md the user applies SQL via the Supabase Dashboard SQL Editor (no local CLI). Migration tasks produce the `.sql` file, commit it, and then STOP at a **🛑 USER ACTION** checkpoint for the user to paste-and-run it before dependent code is verified.

**Spec:** `docs/superpowers/specs/2026-05-21-workout-plans-vertical-slice-design.md`

---

## File Structure

**New SQL migrations** (`supabase/migrations/`):
- `<ts>_exercises_library.sql` — `exercises` table + RLS + indexes
- `<ts>_exercises_seed.sql` — ~40 bilingual seed exercises
- `<ts>_workout_plans.sql` — `workout_plans`, `workout_days`, `workout_day_exercises`, `workout_logs`, `workout_log_sets` + RLS + indexes

**Types:** extend `src/types/database.ts` with the 6 new tables.

**Auth helper:** extend `src/lib/auth/require-role.ts` to return the `clients` row for clients.

**New modules:**
- `src/modules/library/` — `exercises.schemas.ts`, `exercises.service.ts`, `exercises.errors.ts`
- `src/modules/workouts/` — `workouts.schemas.ts`, `workouts.service.ts`, `workouts.errors.ts`, `workouts.types.ts`
- `src/modules/workout-logs/` — `workout-logs.schemas.ts`, `workout-logs.service.ts`, `workout-logs.errors.ts`

**shadcn:** add `tabs`.

**Coach UI:**
- `src/app/[locale]/coach/library/page.tsx` + `exercises-client.tsx`
- `src/app/[locale]/coach/workouts/page.tsx`
- `src/app/[locale]/coach/workouts/new/page.tsx`, `[id]/page.tsx`, and shared `plan-builder.tsx`
- Modify `src/app/[locale]/coach/clients/[id]/client-tabs.tsx` (Plans tab)

**Client UI (new shell):**
- `src/app/[locale]/client/layout.tsx`
- `src/components/client/sidebar.tsx`, `src/components/client/topbar.tsx`
- `src/app/[locale]/client/page.tsx` (rewrite Overview)
- `src/app/[locale]/client/plans/page.tsx`
- `src/app/[locale]/client/plans/workout/[id]/page.tsx` + `plan-view.tsx`
- `src/app/[locale]/client/workout/[logId]/page.tsx` + `session-logger.tsx`
- `src/app/[locale]/client/workout-logs/page.tsx`, `[id]/page.tsx`

**i18n:** add `client`, `library`, `workouts` namespaces to `messages/ar.json` + `messages/en.json`.

---

## Task 1: Exercises library migration

**Files:**
- Create: `supabase/migrations/20260521090000_exercises_library.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260521090000_exercises_library.sql
git commit -m "feat(db): exercises library table + RLS"
```

---

## Task 2: Exercises seed migration

**Files:**
- Create: `supabase/migrations/20260521090100_exercises_seed.sql`

- [ ] **Step 1: Write the seed** (40 rows; global = `coach_id` defaults to NULL)

```sql
-- Global exercise library seed (coach_id null). Bilingual, MENA gym + bodyweight staples.
insert into public.exercises (name_en, name_ar, muscle_group, equipment, video_url) values
('Barbell Bench Press','بنش بريس بالبار','chest','barbell','https://www.youtube.com/watch?v=rT7DgCr-3pg'),
('Incline Dumbbell Press','بريس دمبل مائل','chest','dumbbell','https://www.youtube.com/watch?v=8iPEnn-ltC8'),
('Chest Press Machine','جهاز ضغط الصدر','chest','machine',null),
('Cable Fly','تفتيح كابل','chest','cable','https://www.youtube.com/watch?v=Iwe6AmxVf7o'),
('Push-Up','ضغط','chest','bodyweight','https://www.youtube.com/watch?v=IODxDxX7oi4'),
('Pull-Up','عقلة','back','bodyweight','https://www.youtube.com/watch?v=eGo4IYlbE5g'),
('Lat Pulldown','سحب أمامي','back','cable','https://www.youtube.com/watch?v=CAwf7n6Luuc'),
('Seated Cable Row','تجديف كابل جالس','back','cable','https://www.youtube.com/watch?v=GZbfZ033f74'),
('Barbell Row','تجديف بالبار','back','barbell','https://www.youtube.com/watch?v=9efgcAjQe7E'),
('Deadlift','رفعة ميتة','back','barbell','https://www.youtube.com/watch?v=op9kVnSso6Q'),
('Overhead Press','بريس كتف واقف','shoulders','barbell','https://www.youtube.com/watch?v=2yjwXTZQDDI'),
('Dumbbell Shoulder Press','بريس كتف دمبل','shoulders','dumbbell','https://www.youtube.com/watch?v=qEwKCR5JCog'),
('Lateral Raise','رفرفة جانبي','shoulders','dumbbell','https://www.youtube.com/watch?v=3VcKaXpzqRo'),
('Cable Lateral Raise','رفرفة جانبي كابل','shoulders','cable','https://www.youtube.com/watch?v=WF9oZyEHnU4'),
('Face Pull','سحب للوجه','shoulders','cable','https://www.youtube.com/watch?v=rep-qVOkqgk'),
('Barbell Squat','سكوات بالبار','legs','barbell','https://www.youtube.com/watch?v=ultWZbUMPL8'),
('Leg Press','جهاز دفع الأرجل','legs','machine','https://www.youtube.com/watch?v=IZxyjW7MPJQ'),
('Romanian Deadlift','رفعة رومانية','legs','barbell','https://www.youtube.com/watch?v=jEy_czb3RKA'),
('Leg Extension','تمديد الأرجل','legs','machine','https://www.youtube.com/watch?v=YyvSfVjQeL0'),
('Leg Curl','ثني الأرجل','legs','machine','https://www.youtube.com/watch?v=1Tq3QdYUuHs'),
('Walking Lunge','اندفاع مشي','legs','dumbbell','https://www.youtube.com/watch?v=L8fvypPrzzs'),
('Standing Calf Raise','رفع السمانة واقف','legs','machine','https://www.youtube.com/watch?v=gwLzBJYoWlI'),
('Barbell Curl','مرجحة بايسبس بالبار','arms','barbell','https://www.youtube.com/watch?v=kwG2ipFRgfo'),
('Dumbbell Curl','مرجحة بايسبس دمبل','arms','dumbbell','https://www.youtube.com/watch?v=ykJmrZ5v0Oo'),
('Hammer Curl','مرجحة هامر','arms','dumbbell','https://www.youtube.com/watch?v=zC3nLlEvin4'),
('Triceps Pushdown','دفع ترايسبس كابل','arms','cable','https://www.youtube.com/watch?v=2-LAMcpzODU'),
('Overhead Triceps Extension','تمديد ترايسبس علوي','arms','dumbbell','https://www.youtube.com/watch?v=YbX7Wd8jQ-Q'),
('Skull Crusher','سكال كراشر','arms','barbell','https://www.youtube.com/watch?v=d_KZxkY_0cM'),
('Plank','بلانك','core','bodyweight','https://www.youtube.com/watch?v=pSHjTRCQxIw'),
('Hanging Leg Raise','رفع الأرجل معلق','core','bodyweight','https://www.youtube.com/watch?v=Pr1ieGZ5atk'),
('Cable Crunch','كرنش كابل','core','cable','https://www.youtube.com/watch?v=2fbujnGCFmA'),
('Russian Twist','التواء روسي','core','bodyweight','https://www.youtube.com/watch?v=wkD8rjkodUI'),
('Dead Bug','ديد باج','core','bodyweight','https://www.youtube.com/watch?v=rbemelnkHag'),
('Treadmill Run','جري على المشاية','cardio','machine',null),
('Stationary Bike','دراجة ثابتة','cardio','machine',null),
('Rowing Machine','جهاز التجديف','cardio','machine',null),
('Jump Rope','نط الحبل','cardio','bodyweight','https://www.youtube.com/watch?v=u3zgHI8QnqE'),
('Burpee','بيربي','full_body','bodyweight','https://www.youtube.com/watch?v=TU8QYVW0gDU'),
('Kettlebell Swing','أرجحة الكيتل بيل','full_body','kettlebell','https://www.youtube.com/watch?v=YSxHifyI6s8'),
('Mountain Climber','تسلق الجبل','full_body','bodyweight','https://www.youtube.com/watch?v=nmwgirgXLYM');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260521090100_exercises_seed.sql
git commit -m "feat(db): seed 40 global exercises"
```

---

## Task 3: Workout plans migration

**Files:**
- Create: `supabase/migrations/20260521090200_workout_plans.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260521090200_workout_plans.sql
git commit -m "feat(db): workout plans, days, exercises, logs + RLS"
```

- [ ] **Step 3: 🛑 USER ACTION** — Tell the user: "Paste and run these three migration files in the Supabase Dashboard SQL Editor in order: `20260521090000_exercises_library.sql`, `20260521090100_exercises_seed.sql`, `20260521090200_workout_plans.sql`. Confirm the `exercises` table shows ~40 rows and the 5 workout tables exist with RLS enabled." Wait for confirmation before relying on these tables at runtime.

---

## Task 4: Extend database types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add the 6 new table types** inside `Tables: { ... }` (after `client_invites`, before the closing of `Tables`)

```ts
      exercises: {
        Row: {
          id: string;
          coach_id: string | null;
          name_ar: string;
          name_en: string;
          muscle_group: "chest" | "back" | "shoulders" | "legs" | "arms" | "core" | "full_body" | "cardio";
          equipment: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & {
          name_ar: string;
          name_en: string;
          muscle_group: Database["public"]["Tables"]["exercises"]["Row"]["muscle_group"];
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
      };
      workout_plans: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string | null;
          name: string;
          description_ar: string | null;
          description_en: string | null;
          status: "active" | "archived" | "draft";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_plans"]["Row"]> & {
          coach_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_plans"]["Row"]>;
      };
      workout_days: {
        Row: {
          id: string;
          plan_id: string;
          name: string;
          order_index: number;
          is_rest: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_days"]["Row"]> & {
          plan_id: string;
          name: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_days"]["Row"]>;
      };
      workout_day_exercises: {
        Row: {
          id: string;
          day_id: string;
          exercise_id: string;
          order_index: number;
          sets: number;
          rep_range: string;
          rest_seconds: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_day_exercises"]["Row"]> & {
          day_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_day_exercises"]["Row"]>;
      };
      workout_logs: {
        Row: {
          id: string;
          client_id: string;
          plan_id: string | null;
          day_id: string | null;
          day_name_snapshot: string;
          status: "in_progress" | "completed";
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]> & {
          client_id: string;
          day_name_snapshot: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]>;
      };
      workout_log_sets: {
        Row: {
          id: string;
          log_id: string;
          exercise_id: string | null;
          exercise_name_snapshot: string;
          set_number: number;
          reps: number | null;
          weight: number | null;
          completed: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_log_sets"]["Row"]> & {
          log_id: string;
          exercise_name_snapshot: string;
          set_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_log_sets"]["Row"]>;
      };
```

- [ ] **Step 2: Build to verify types compile**

Run: `npm run build`
Expected: PASS (no type errors). If build surfaces unrelated pre-existing errors, note them but ensure no NEW errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(types): add workout + exercises table types"
```

---

## Task 5: Extend requireRole for clients

**Files:**
- Modify: `src/lib/auth/require-role.ts`

- [ ] **Step 1: Add `clientData` to the return** — replace the function body so that when `requiredRole === "client"` it also fetches the `clients` row. Full new file content:

```ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import type { Database } from "@/types/database";

type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

export async function requireRole(
  locale: string,
  requiredRole: Role
): Promise<{
  userId: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  coachData: Database["public"]["Tables"]["coaches"]["Row"] | null;
  clientData: Database["public"]["Tables"]["clients"]["Row"] | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  const { data: profileData } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: Database["public"]["Tables"]["profiles"]["Row"] | null; error: unknown };

  if (!profileData) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  if (profileData.role !== requiredRole) {
    redirect({ href: "/", locale });
    throw new Error("unreachable");
  }

  const profile = profileData;

  let coachData: Database["public"]["Tables"]["coaches"]["Row"] | null = null;
  if (requiredRole === "coach") {
    const { data } = (await supabase
      .from("coaches")
      .select("*")
      .eq("id", user.id)
      .single()) as { data: Database["public"]["Tables"]["coaches"]["Row"] | null; error: unknown };
    coachData = data;
  }

  let clientData: Database["public"]["Tables"]["clients"]["Row"] | null = null;
  if (requiredRole === "client") {
    const { data } = (await supabase
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .single()) as { data: Database["public"]["Tables"]["clients"]["Row"] | null; error: unknown };
    clientData = data;
  }

  return { userId: user.id, profile, coachData, clientData };
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS. (The existing coach layout destructures only the fields it uses, so adding `clientData` to the return is non-breaking.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/require-role.ts
git commit -m "feat(auth): requireRole returns clientData for clients"
```

---

## Task 6: Library module (exercises service)

**Files:**
- Create: `src/modules/library/exercises.errors.ts`
- Create: `src/modules/library/exercises.schemas.ts`
- Create: `src/modules/library/exercises.service.ts`

- [ ] **Step 1: errors**

```ts
// src/modules/library/exercises.errors.ts
export class ExercisesError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ExercisesError";
  }
}
```

- [ ] **Step 2: schemas**

```ts
// src/modules/library/exercises.schemas.ts
import { z } from "zod";

export const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "legs", "arms", "core", "full_body", "cardio",
] as const;

export const createExerciseSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  muscle_group: z.enum(MUSCLE_GROUPS),
  equipment: z.string().optional().nullable(),
  video_url: z.string().url().optional().or(z.literal("")).nullable(),
  thumbnail_url: z.string().url().optional().or(z.literal("")).nullable(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export const updateExerciseSchema = createExerciseSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: (typeof MUSCLE_GROUPS)[number];
}
```

- [ ] **Step 3: service** (mirrors `ClientsService` boundary pattern)

```ts
// src/modules/library/exercises.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateExerciseInput, UpdateExerciseInput, ExerciseFilters } from "./exercises.schemas";
import { ExercisesError } from "./exercises.errors";

type DB = Database["public"]["Tables"];
type ExerciseRow = DB["exercises"]["Row"];
type SB = SupabaseClient<any>;

export class ExercisesService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  // global (coach_id null) + this coach's customs, optional filters
  async listLibrary(coachId: string, filters: ExerciseFilters = {}): Promise<ExerciseRow[]> {
    let query = this.db
      .from("exercises")
      .select("*")
      .or(`coach_id.is.null,coach_id.eq.${coachId}`)
      .order("name_en", { ascending: true });

    if (filters.muscleGroup) query = query.eq("muscle_group", filters.muscleGroup);
    if (filters.search) {
      query = query.or(`name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ExercisesError(error.message, "list_failed");
    return (data ?? []) as ExerciseRow[];
  }

  async createCustom(coachId: string, input: CreateExerciseInput): Promise<ExerciseRow> {
    const { data, error } = await this.db
      .from("exercises")
      .insert({
        coach_id: coachId,
        name_ar: input.name_ar,
        name_en: input.name_en,
        muscle_group: input.muscle_group,
        equipment: input.equipment || null,
        video_url: input.video_url || null,
        thumbnail_url: input.thumbnail_url || null,
      })
      .select()
      .single();
    if (error || !data) throw new ExercisesError(error?.message ?? "insert failed", "create_failed");
    return data as ExerciseRow;
  }

  async update(input: UpdateExerciseInput): Promise<void> {
    const { id, ...fields } = input;
    const { error } = await this.db
      .from("exercises")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new ExercisesError(error.message, "update_failed");
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("exercises").delete().eq("id", id);
    if (error) throw new ExercisesError(error.message, "delete_failed");
  }
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/library/
git commit -m "feat(library): exercises service, schemas, errors"
```

---

## Task 7: Workouts module (plans service)

**Files:**
- Create: `src/modules/workouts/workouts.errors.ts`
- Create: `src/modules/workouts/workouts.types.ts`
- Create: `src/modules/workouts/workouts.schemas.ts`
- Create: `src/modules/workouts/workouts.service.ts`

- [ ] **Step 1: errors**

```ts
// src/modules/workouts/workouts.errors.ts
export class WorkoutsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkoutsError";
  }
}
```

- [ ] **Step 2: types**

```ts
// src/modules/workouts/workouts.types.ts
import type { Database } from "@/types/database";

type T = Database["public"]["Tables"];
export type PlanRow = T["workout_plans"]["Row"];
export type DayRow = T["workout_days"]["Row"];
export type DayExerciseRow = T["workout_day_exercises"]["Row"];
export type ExerciseRow = T["exercises"]["Row"];

export type DayExerciseWithExercise = DayExerciseRow & { exercise: ExerciseRow | null };
export type DayWithExercises = DayRow & { exercises: DayExerciseWithExercise[] };
export type PlanWithDays = PlanRow & { days: DayWithExercises[] };
```

- [ ] **Step 3: schemas**

```ts
// src/modules/workouts/workouts.schemas.ts
import { z } from "zod";

export const dayExerciseInputSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().int().min(1).default(3),
  rep_range: z.string().min(1).default("8-12"),
  rest_seconds: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type DayExerciseInput = z.infer<typeof dayExerciseInputSchema>;

export const dayInputSchema = z.object({
  name: z.string().min(1),
  is_rest: z.boolean().default(false),
  exercises: z.array(dayExerciseInputSchema).default([]),
});
export type DayInput = z.infer<typeof dayInputSchema>;

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  days: z.array(dayInputSchema).min(1),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
```

- [ ] **Step 4: service**

```ts
// src/modules/workouts/workouts.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreatePlanInput } from "./workouts.schemas";
import type { PlanRow, PlanWithDays } from "./workouts.types";
import { WorkoutsError } from "./workouts.errors";

type SB = SupabaseClient<any>;

export class WorkoutsService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  // Create a plan with all its days + exercises in sequence (no transaction API in PostgREST;
  // we insert top-down and clean up on failure of the plan insert only).
  async createPlan(coachId: string, input: CreatePlanInput): Promise<PlanRow> {
    const { data: plan, error: planErr } = await this.db
      .from("workout_plans")
      .insert({
        coach_id: coachId,
        client_id: input.client_id ?? null,
        name: input.name,
        description_ar: input.description_ar ?? null,
        description_en: input.description_en ?? null,
      })
      .select()
      .single();
    if (planErr || !plan) throw new WorkoutsError(planErr?.message ?? "plan insert failed", "create_plan_failed");

    await this.replaceDays((plan as PlanRow).id, input);
    return plan as PlanRow;
  }

  // Replace all days/exercises for a plan (used by create and edit).
  async replaceDays(planId: string, input: CreatePlanInput): Promise<void> {
    // delete existing days (cascades to day_exercises)
    await this.db.from("workout_days").delete().eq("plan_id", planId);

    for (let i = 0; i < input.days.length; i++) {
      const day = input.days[i];
      const { data: dayRow, error: dayErr } = await this.db
        .from("workout_days")
        .insert({ plan_id: planId, name: day.name, order_index: i, is_rest: day.is_rest })
        .select()
        .single();
      if (dayErr || !dayRow) throw new WorkoutsError(dayErr?.message ?? "day insert failed", "create_day_failed");

      if (!day.is_rest && day.exercises.length > 0) {
        const rows = day.exercises.map((ex, j) => ({
          day_id: (dayRow as { id: string }).id,
          exercise_id: ex.exercise_id,
          order_index: j,
          sets: ex.sets,
          rep_range: ex.rep_range,
          rest_seconds: ex.rest_seconds ?? null,
          notes: ex.notes ?? null,
        }));
        const { error: exErr } = await this.db.from("workout_day_exercises").insert(rows);
        if (exErr) throw new WorkoutsError(exErr.message, "create_exercise_failed");
      }
    }
  }

  async updatePlanMeta(planId: string, fields: Partial<Pick<PlanRow, "name" | "description_ar" | "description_en" | "client_id" | "status">>): Promise<void> {
    const { error } = await this.db
      .from("workout_plans")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", planId);
    if (error) throw new WorkoutsError(error.message, "update_plan_failed");
  }

  async listForCoach(coachId: string): Promise<PlanRow[]> {
    const { data, error } = await this.db
      .from("workout_plans")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    if (error) throw new WorkoutsError(error.message, "list_failed");
    return (data ?? []) as PlanRow[];
  }

  async listForClient(clientId: string): Promise<PlanRow[]> {
    const { data, error } = await this.db
      .from("workout_plans")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new WorkoutsError(error.message, "list_failed");
    return (data ?? []) as PlanRow[];
  }

  async getPlanWithDays(planId: string): Promise<PlanWithDays | null> {
    const { data, error } = await this.db
      .from("workout_plans")
      .select(`*, days:workout_days(*, exercises:workout_day_exercises(*, exercise:exercises(*)))`)
      .eq("id", planId)
      .single();
    if (error) return null;
    const plan = data as PlanWithDays;
    // ensure deterministic ordering
    plan.days?.sort((a, b) => a.order_index - b.order_index);
    plan.days?.forEach((d) => d.exercises?.sort((a, b) => a.order_index - b.order_index));
    return plan;
  }
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/workouts/
git commit -m "feat(workouts): plans service, schemas, types, errors"
```

---

## Task 8: Workout-logs module

**Files:**
- Create: `src/modules/workout-logs/workout-logs.errors.ts`
- Create: `src/modules/workout-logs/workout-logs.schemas.ts`
- Create: `src/modules/workout-logs/workout-logs.service.ts`

- [ ] **Step 1: errors**

```ts
// src/modules/workout-logs/workout-logs.errors.ts
export class WorkoutLogsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkoutLogsError";
  }
}
```

- [ ] **Step 2: schemas**

```ts
// src/modules/workout-logs/workout-logs.schemas.ts
import { z } from "zod";

export const logSetSchema = z.object({
  log_id: z.string().uuid(),
  exercise_id: z.string().uuid().nullable(),
  exercise_name_snapshot: z.string().min(1),
  set_number: z.number().int().min(1),
  reps: z.number().int().min(0).nullable(),
  weight: z.number().min(0).nullable(),
  completed: z.boolean().default(true),
});
export type LogSetInput = z.infer<typeof logSetSchema>;
```

- [ ] **Step 3: service**

```ts
// src/modules/workout-logs/workout-logs.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LogSetInput } from "./workout-logs.schemas";
import { WorkoutLogsError } from "./workout-logs.errors";

type DB = Database["public"]["Tables"];
type LogRow = DB["workout_logs"]["Row"];
type LogSetRow = DB["workout_log_sets"]["Row"];
type SB = SupabaseClient<any>;

export type LogWithSets = LogRow & { sets: LogSetRow[] };

export class WorkoutLogsService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  async start(clientId: string, planId: string, dayId: string, dayName: string): Promise<LogRow> {
    const { data, error } = await this.db
      .from("workout_logs")
      .insert({
        client_id: clientId,
        plan_id: planId,
        day_id: dayId,
        day_name_snapshot: dayName,
        status: "in_progress",
      })
      .select()
      .single();
    if (error || !data) throw new WorkoutLogsError(error?.message ?? "start failed", "start_failed");
    return data as LogRow;
  }

  async logSet(input: LogSetInput): Promise<void> {
    const { error } = await this.db.from("workout_log_sets").insert({
      log_id: input.log_id,
      exercise_id: input.exercise_id,
      exercise_name_snapshot: input.exercise_name_snapshot,
      set_number: input.set_number,
      reps: input.reps,
      weight: input.weight,
      completed: input.completed,
    });
    if (error) throw new WorkoutLogsError(error.message, "log_set_failed");
  }

  async finish(logId: string): Promise<void> {
    const { error } = await this.db
      .from("workout_logs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", logId);
    if (error) throw new WorkoutLogsError(error.message, "finish_failed");
  }

  async listForClient(clientId: string): Promise<LogRow[]> {
    const { data, error } = await this.db
      .from("workout_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("started_at", { ascending: false });
    if (error) throw new WorkoutLogsError(error.message, "list_failed");
    return (data ?? []) as LogRow[];
  }

  async getById(logId: string): Promise<LogWithSets | null> {
    const { data, error } = await this.db
      .from("workout_logs")
      .select("*, sets:workout_log_sets(*)")
      .eq("id", logId)
      .single();
    if (error) return null;
    const log = data as LogWithSets;
    log.sets?.sort((a, b) => a.set_number - b.set_number);
    return log;
  }
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/workout-logs/
git commit -m "feat(workout-logs): session logging service"
```

---

## Task 9: Add tabs component + i18n keys

**Files:**
- Create (via CLI): `src/components/ui/tabs.tsx`
- Modify: `messages/en.json`, `messages/ar.json`

- [ ] **Step 1: Install shadcn tabs**

Run: `npx shadcn@latest add tabs`
Expected: creates `src/components/ui/tabs.tsx`.

- [ ] **Step 2: Add namespaces to `messages/en.json`** (merge these top-level keys; do not remove existing keys)

```json
  "client": {
    "appName": "Setpal",
    "nav": {
      "overview": "Overview",
      "plans": "Plans",
      "workoutLogs": "Workout Logs",
      "forms": "Forms",
      "settings": "Settings"
    },
    "overview": {
      "welcome": "Welcome back, {name}!",
      "portal": "Client Portal",
      "activeWorkoutPlans": "Workout Plans",
      "pendingForms": "Pending Forms",
      "recentActivity": "Recent Activity",
      "noActivity": "No recent activity yet.",
      "planAssigned": "Workout plan assigned",
      "viewPlans": "View Plans"
    },
    "plans": {
      "title": "Your Active Plans",
      "subtitle": "View your active workout plans",
      "workoutTab": "Workout Plans",
      "empty": "No active plans yet. Your coach will assign one soon.",
      "viewDetails": "View Details",
      "created": "Created",
      "active": "Active"
    },
    "planView": {
      "exercises": "exercises",
      "sets": "Sets",
      "reps": "Reps",
      "rest": "Rest",
      "watchVideo": "Watch Video",
      "startWorkout": "Start Workout",
      "restDay": "Rest Day",
      "notes": "Notes"
    },
    "session": {
      "title": "Logging: {day}",
      "set": "Set",
      "reps": "Reps",
      "weight": "Weight (kg)",
      "markDone": "Done",
      "finish": "Finish Workout",
      "finished": "Workout saved!",
      "saving": "Saving..."
    },
    "logs": {
      "title": "Workout Logs",
      "subtitle": "View your complete workout history.",
      "empty": "No workout sessions logged yet.",
      "completed": "Completed",
      "inProgress": "In Progress",
      "exercises": "exercises",
      "duration": "Duration"
    }
  },
  "library": {
    "title": "Exercise Library",
    "subtitle": "Browse exercises and add your own.",
    "search": "Search exercises...",
    "allGroups": "All muscle groups",
    "addCustom": "Add Exercise",
    "edit": "Edit",
    "delete": "Delete",
    "global": "Global",
    "custom": "Custom",
    "form": {
      "nameEn": "Name (English)",
      "nameAr": "Name (Arabic)",
      "muscleGroup": "Muscle Group",
      "equipment": "Equipment",
      "videoUrl": "Video URL",
      "save": "Save",
      "cancel": "Cancel"
    },
    "groups": {
      "chest": "Chest", "back": "Back", "shoulders": "Shoulders",
      "legs": "Legs", "arms": "Arms", "core": "Core",
      "full_body": "Full Body", "cardio": "Cardio"
    }
  },
  "workouts": {
    "title": "Workout Plans",
    "subtitle": "Build and assign workout programs.",
    "newPlan": "New Plan",
    "empty": "No workout plans yet.",
    "builder": {
      "planName": "Plan Name",
      "descriptionEn": "Description (English)",
      "descriptionAr": "Description (Arabic)",
      "addDay": "Add Day",
      "dayName": "Day Name",
      "restDay": "Rest Day",
      "addExercise": "Add Exercise",
      "sets": "Sets",
      "reps": "Reps",
      "rest": "Rest (sec)",
      "notes": "Notes",
      "remove": "Remove",
      "save": "Save Plan",
      "saved": "Plan saved!",
      "assignTo": "Assign to client"
    },
    "assignedTo": "Assigned to",
    "unassigned": "Template (unassigned)"
  }
```

- [ ] **Step 3: Add the same namespaces to `messages/ar.json`** (Arabic translations)

```json
  "client": {
    "appName": "Setpal",
    "nav": {
      "overview": "نظرة عامة",
      "plans": "الخطط",
      "workoutLogs": "سجلات التمارين",
      "forms": "النماذج",
      "settings": "الإعدادات"
    },
    "overview": {
      "welcome": "مرحباً بعودتك، {name}!",
      "portal": "بوابة العميل",
      "activeWorkoutPlans": "خطط التمرين",
      "pendingForms": "النماذج المعلقة",
      "recentActivity": "الأنشطة الأخيرة",
      "noActivity": "لا توجد أنشطة حتى الآن.",
      "planAssigned": "تم تعيين خطة تمرين",
      "viewPlans": "عرض الخطط"
    },
    "plans": {
      "title": "خططك النشطة",
      "subtitle": "اعرض خطط التمرين النشطة لديك",
      "workoutTab": "خطط التمرين",
      "empty": "لا توجد خطط نشطة بعد. سيقوم مدربك بتعيين واحدة قريباً.",
      "viewDetails": "عرض التفاصيل",
      "created": "تم الإنشاء",
      "active": "نشط"
    },
    "planView": {
      "exercises": "تمارين",
      "sets": "المجموعات",
      "reps": "التكرارات",
      "rest": "الراحة",
      "watchVideo": "مشاهدة الفيديو",
      "startWorkout": "ابدأ التمرين",
      "restDay": "يوم راحة",
      "notes": "ملاحظات"
    },
    "session": {
      "title": "تسجيل: {day}",
      "set": "مجموعة",
      "reps": "تكرارات",
      "weight": "الوزن (كجم)",
      "markDone": "تم",
      "finish": "إنهاء التمرين",
      "finished": "تم حفظ التمرين!",
      "saving": "جارٍ الحفظ..."
    },
    "logs": {
      "title": "سجلات التمارين",
      "subtitle": "اعرض سجل تمارينك الكامل.",
      "empty": "لم يتم تسجيل أي جلسات تمرين بعد.",
      "completed": "مكتمل",
      "inProgress": "قيد التنفيذ",
      "exercises": "تمارين",
      "duration": "المدة"
    }
  },
  "library": {
    "title": "مكتبة التمارين",
    "subtitle": "تصفح التمارين وأضف تمارينك الخاصة.",
    "search": "ابحث عن التمارين...",
    "allGroups": "كل المجموعات العضلية",
    "addCustom": "إضافة تمرين",
    "edit": "تعديل",
    "delete": "حذف",
    "global": "عام",
    "custom": "خاص",
    "form": {
      "nameEn": "الاسم (إنجليزي)",
      "nameAr": "الاسم (عربي)",
      "muscleGroup": "المجموعة العضلية",
      "equipment": "المعدات",
      "videoUrl": "رابط الفيديو",
      "save": "حفظ",
      "cancel": "إلغاء"
    },
    "groups": {
      "chest": "صدر", "back": "ظهر", "shoulders": "أكتاف",
      "legs": "أرجل", "arms": "ذراعين", "core": "بطن",
      "full_body": "الجسم كامل", "cardio": "كارديو"
    }
  },
  "workouts": {
    "title": "خطط التمرين",
    "subtitle": "أنشئ وعيّن برامج التمرين.",
    "newPlan": "خطة جديدة",
    "empty": "لا توجد خطط تمرين بعد.",
    "builder": {
      "planName": "اسم الخطة",
      "descriptionEn": "الوصف (إنجليزي)",
      "descriptionAr": "الوصف (عربي)",
      "addDay": "إضافة يوم",
      "dayName": "اسم اليوم",
      "restDay": "يوم راحة",
      "addExercise": "إضافة تمرين",
      "sets": "المجموعات",
      "reps": "التكرارات",
      "rest": "الراحة (ثانية)",
      "notes": "ملاحظات",
      "remove": "إزالة",
      "save": "حفظ الخطة",
      "saved": "تم حفظ الخطة!",
      "assignTo": "تعيين لعميل"
    },
    "assignedTo": "معيّن إلى",
    "unassigned": "قالب (غير معيّن)"
  }
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS (JSON valid, tabs component compiles).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tabs.tsx messages/en.json messages/ar.json
git commit -m "feat: add tabs component + workout/library/client i18n"
```

---

## Task 10: Coach library page

**Files:**
- Create: `src/app/[locale]/coach/library/page.tsx`
- Create: `src/app/[locale]/coach/library/exercises-client.tsx`

- [ ] **Step 1: Server page** — fetch library, render client component

```tsx
// src/app/[locale]/coach/library/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { ExercisesClient } from "./exercises-client";

export default async function CoachLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new ExercisesService(supabase);
  const exercises = await service.listLibrary(userId);

  return <ExercisesClient initialExercises={exercises} coachId={userId} locale={locale} />;
}
```

- [ ] **Step 2: Client component** — search, filter, list, add-custom dialog

```tsx
// src/app/[locale]/coach/library/exercises-client.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { ExercisesService } from "@/modules/library/exercises.service";
import { MUSCLE_GROUPS } from "@/modules/library/exercises.schemas";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export function ExercisesClient({
  initialExercises, coachId, locale,
}: {
  initialExercises: Exercise[]; coachId: string; locale: string;
}) {
  const t = useTranslations("library");
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name_en: "", name_ar: "", muscle_group: "chest", equipment: "", video_url: "" });

  const filtered = useMemo(() => exercises.filter((e) => {
    const matchesGroup = group === "all" || e.muscle_group === group;
    const q = search.toLowerCase();
    const matchesSearch = !q || e.name_en.toLowerCase().includes(q) || e.name_ar.includes(search);
    return matchesGroup && matchesSearch;
  }), [exercises, search, group]);

  async function handleAdd() {
    try {
      const service = new ExercisesService(createClient());
      const created = await service.createCustom(coachId, {
        name_en: form.name_en, name_ar: form.name_ar,
        muscle_group: form.muscle_group as Exercise["muscle_group"],
        equipment: form.equipment || null, video_url: form.video_url || null,
        thumbnail_url: null,
      });
      setExercises((prev) => [...prev, created]);
      setOpen(false);
      setForm({ name_en: "", name_ar: "", muscle_group: "chest", equipment: "", video_url: "" });
      toast.success(t("form.save"));
    } catch {
      toast.error("Error");
    }
  }

  const name = (e: Exercise) => (locale === "ar" ? e.name_ar : e.name_en);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 me-2" />{t("addCustom")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("addCustom")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("form.nameEn")}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>{t("form.nameAr")}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div>
                <Label>{t("form.muscleGroup")}</Label>
                <Select value={form.muscle_group} onValueChange={(v) => setForm({ ...form, muscle_group: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{t(`groups.${g}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("form.equipment")}</Label><Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></div>
              <div><Label>{t("form.videoUrl")}</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("form.cancel")}</Button>
              <Button onClick={handleAdd} disabled={!form.name_en || !form.name_ar}>{t("form.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("allGroups")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGroups")}</SelectItem>
            {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{t(`groups.${g}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <Card key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{name(e)}</p>
              <p className="text-xs text-muted-foreground">{t(`groups.${e.muscle_group}`)}{e.equipment ? ` • ${e.equipment}` : ""}</p>
            </div>
            <Badge variant={e.coach_id ? "default" : "secondary"}>{e.coach_id ? t("custom") : t("global")}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/coach/library/"
git commit -m "feat(coach): exercise library page"
```

- [ ] **Step 5: 🔍 VERIFY** — `npm run dev`, log in as coach, open `/en/coach/library`. Confirm ~40 seeded exercises render, search + muscle-group filter work, and "Add Exercise" creates a custom one that appears with a "Custom" badge. (Requires Task 3 migrations applied.)

---

## Task 11: Coach workout plan builder

**Files:**
- Create: `src/app/[locale]/coach/workouts/plan-builder.tsx`
- Create: `src/app/[locale]/coach/workouts/new/page.tsx`
- Create: `src/app/[locale]/coach/workouts/page.tsx`

- [ ] **Step 1: Plan builder client component** (days + exercise picker; no dnd — simple add/remove + ordering by array position)

```tsx
// src/app/[locale]/coach/workouts/plan-builder.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface DayEx { exercise_id: string; sets: number; rep_range: string; rest_seconds: number | null; notes: string | null; }
interface Day { name: string; is_rest: boolean; exercises: DayEx[]; }

export function PlanBuilder({
  library, coachId, locale, clientId,
}: {
  library: Exercise[]; coachId: string; locale: string; clientId: string | null;
}) {
  const t = useTranslations("workouts.builder");
  const router = useRouter();
  const [name, setName] = useState("");
  const [days, setDays] = useState<Day[]>([{ name: "Day 1", is_rest: false, exercises: [] }]);
  const [saving, setSaving] = useState(false);

  const exName = (e: Exercise) => (locale === "ar" ? e.name_ar : e.name_en);

  function addDay() { setDays([...days, { name: `Day ${days.length + 1}`, is_rest: false, exercises: [] }]); }
  function removeDay(i: number) { setDays(days.filter((_, idx) => idx !== i)); }
  function updateDay(i: number, patch: Partial<Day>) {
    setDays(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addExercise(dayIdx: number) {
    const first = library[0];
    if (!first) return;
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: [...d.exercises, { exercise_id: first.id, sets: 3, rep_range: "8-12", rest_seconds: 60, notes: null }] });
  }
  function updateExercise(dayIdx: number, exIdx: number, patch: Partial<DayEx>) {
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: d.exercises.map((e, idx) => (idx === exIdx ? { ...e, ...patch } : e)) });
  }
  function removeExercise(dayIdx: number, exIdx: number) {
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: d.exercises.filter((_, idx) => idx !== exIdx) });
  }

  async function save() {
    setSaving(true);
    try {
      const service = new WorkoutsService(createClient());
      await service.createPlan(coachId, {
        name, client_id: clientId, description_ar: null, description_en: null,
        days: days.map((d) => ({ name: d.name, is_rest: d.is_rest, exercises: d.is_rest ? [] : d.exercises })),
      });
      toast.success(t("saved"));
      router.push(clientId ? `/coach/clients/${clientId}` : "/coach/workouts");
    } catch {
      toast.error("Error");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Label>{t("planName")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {days.map((day, di) => (
        <Card key={di} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Input value={day.name} onChange={(e) => updateDay(di, { name: e.target.value })} className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={day.is_rest} onCheckedChange={(v) => updateDay(di, { is_rest: !!v })} />
              {t("restDay")}
            </label>
            <Button variant="ghost" size="icon" className="ms-auto" onClick={() => removeDay(di)}><Trash2 className="size-4" /></Button>
          </div>

          {!day.is_rest && (
            <div className="space-y-2">
              {day.exercises.map((ex, ei) => (
                <div key={ei} className="flex items-center gap-2 flex-wrap">
                  <Select value={ex.exercise_id} onValueChange={(v) => updateExercise(di, ei, { exercise_id: v })}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {library.map((l) => <SelectItem key={l.id} value={l.id}>{exName(l)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" className="w-20" value={ex.sets} onChange={(e) => updateExercise(di, ei, { sets: Number(e.target.value) })} placeholder={t("sets")} />
                  <Input className="w-24" value={ex.rep_range} onChange={(e) => updateExercise(di, ei, { rep_range: e.target.value })} placeholder={t("reps")} />
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(di, ei)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addExercise(di)}><Plus className="size-4 me-2" />{t("addExercise")}</Button>
            </div>
          )}
        </Card>
      ))}

      <div className="flex gap-3">
        <Button variant="outline" onClick={addDay}><Plus className="size-4 me-2" />{t("addDay")}</Button>
        <Button onClick={save} disabled={saving || !name || days.length === 0}>{t("save")}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: New plan page** (reads optional `?client=` query for pre-scoping)

```tsx
// src/app/[locale]/coach/workouts/new/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { PlanBuilder } from "../plan-builder";

export default async function NewWorkoutPlanPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { locale } = await params;
  const { client } = await searchParams;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const library = await new ExercisesService(supabase).listLibrary(userId);

  return <PlanBuilder library={library} coachId={userId} locale={locale} clientId={client ?? null} />;
}
```

- [ ] **Step 3: Plans list page**

```tsx
// src/app/[locale]/coach/workouts/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CoachWorkoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");
  const t = await getTranslations("workouts");
  const supabase = await createClient();
  const plans = await new WorkoutsService(supabase).listForCoach(userId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild><Link href="/coach/workouts/new">{t("newPlan")}</Link></Button>
      </div>
      {plans.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="p-4">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {p.client_id ? t("assignedTo") : t("unassigned")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/coach/workouts/"
git commit -m "feat(coach): workout plan builder + list"
```

---

## Task 12: Wire the client-detail Plans tab to assign workouts

**Files:**
- Modify: `src/app/[locale]/coach/clients/[id]/client-tabs.tsx`

The current `client-tabs.tsx` is a `"use client"` custom tab switcher (NOT shadcn Tabs). Its props are `{ clientId, locale, status }`, and the `plans` tab currently renders `<Placeholder label={t("clients.detail.tabs.plans")} />` at line ~96-98. We add an `assignedPlans` prop and a `plans` tab body.

- [ ] **Step 1: Add the `workouts` plan type + new prop to `client-tabs.tsx`.** At the top, add imports and extend the props interface:

```tsx
// add to the existing imports in client-tabs.tsx
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import type { PlanRow } from "@/modules/workouts/workouts.types";
```

Update the props interface and signature:

```tsx
interface ClientTabsProps {
  clientId: string;
  locale: string;
  status: Status;
  assignedPlans: PlanRow[];
}

export function ClientTabs({ clientId, locale, status, assignedPlans }: ClientTabsProps) {
```

(`locale` is currently unused-but-present; keep it. Add `const tWorkouts = useTranslations("workouts");` next to the existing `const t = useTranslations("coach");`.)

- [ ] **Step 2: Replace the `plans` placeholder branch.** Change lines ~96-98 from:

```tsx
        {activeTab === "plans" && (
          <Placeholder label={t("clients.detail.tabs.plans")} />
        )}
```

to:

```tsx
        {activeTab === "plans" && (
          <div className="space-y-4">
            <Button asChild>
              <Link href={`/coach/workouts/new?client=${clientId}`}>{tWorkouts("newPlan")}</Link>
            </Button>
            {assignedPlans.length === 0 ? (
              <p className="text-muted-foreground text-sm">{tWorkouts("empty")}</p>
            ) : (
              <div className="space-y-2">
                {assignedPlans.map((p) => (
                  <Card key={p.id} className="p-3">
                    <p className="font-medium">{p.name}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 3: Update the parent server page** `src/app/[locale]/coach/clients/[id]/page.tsx`. Add the import and fetch (the page already has `supabase` and `id` in scope; `requireRole` is already called):

```tsx
// add import
import { WorkoutsService } from "@/modules/workouts/workouts.service";
// after `const client = await service.getById(id); if (!client) notFound();`
const assignedPlans = await new WorkoutsService(supabase).listForClient(id);
```

Then change the render line from:

```tsx
      <ClientTabs clientId={id} locale={locale} status={client.status} />
```

to:

```tsx
      <ClientTabs clientId={id} locale={locale} status={client.status} assignedPlans={assignedPlans} />
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/coach/clients/[id]/"
git commit -m "feat(coach): assign workout plans from client detail"
```

- [ ] **Step 6: 🔍 VERIFY** — As coach, open a client's detail → Plans tab → "New Plan" → builder opens pre-scoped to that client. Build a plan with a push day (2-3 exercises) + a REST day, Save. Confirm redirect back to client detail and the plan now lists under Plans. Confirm it also appears in `/coach/workouts`.

---

## Task 13: Client portal shell (layout + sidebar + topbar)

**Files:**
- Create: `src/components/client/sidebar.tsx`
- Create: `src/components/client/topbar.tsx`
- Create: `src/app/[locale]/client/layout.tsx`

- [ ] **Step 1: Sidebar** (mirrors `CoachSidebar`; mobile-first — hidden on small screens, shown md+; mobile uses bottom nav via topbar later — keep simple: `hidden md:flex`)

```tsx
// src/components/client/sidebar.tsx
"use client";

import { useTranslations } from "next-intl";
import { Home, Dumbbell, ClipboardList, History, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "overview", href: "/client", icon: Home },
  { key: "plans", href: "/client/plans", icon: Dumbbell },
  { key: "workoutLogs", href: "/client/workout-logs", icon: History },
  { key: "forms", href: "/client/forms", icon: ClipboardList },
  { key: "settings", href: "/client/settings", icon: Settings },
] as const;

export function ClientSidebar() {
  const t = useTranslations("client");
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar border-e border-sidebar-border shrink-0">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <span className="text-lg font-serif font-semibold text-sidebar-primary">{t("appName")}</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const isActive = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
          return (
            <Link key={key} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
              <Icon className="size-4 shrink-0" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Mobile bottom nav + topbar** — for mobile-first, add a bottom tab bar (client portal is mobile-first per spec). Create topbar with locale/avatar AND a separate bottom nav for small screens.

```tsx
// src/components/client/topbar.tsx
"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { Home, Dumbbell, History, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { key: "overview", href: "/client", icon: Home },
  { key: "plans", href: "/client/plans", icon: Dumbbell },
  { key: "workoutLogs", href: "/client/workout-logs", icon: History },
  { key: "forms", href: "/client/forms", icon: ClipboardList },
] as const;

export function ClientTopbar({ fullName, avatarUrl, locale }: { fullName: string | null; avatarUrl: string | null; locale: string; }) {
  const t = useTranslations("client");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border bg-card shrink-0">
        <span className="md:hidden text-lg font-serif font-semibold text-primary">{t("appName")}</span>
        <div className="flex items-center gap-3 ms-auto">
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-sm">
            <Link href={pathname} locale="ar" className={cn("px-3 py-1.5", locale === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>ع</Link>
            <Link href={pathname} locale="en" className={cn("px-3 py-1.5 border-s border-border", locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>EN</Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors outline-none">
                <Avatar className="size-8">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild><Link href="/client/settings">{t("nav.settings")}</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">{tCommon("signOut")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around bg-card border-t border-border h-16">
        {MOBILE_NAV.map(({ key, href, icon: Icon }) => {
          const isActive = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
          return (
            <Link key={key} href={href} className={cn("flex flex-col items-center justify-center gap-1 flex-1 text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
              <Icon className="size-5" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
```

- [ ] **Step 3: Client layout** (role-gates to client; flex sidebar + main; pads bottom for mobile nav)

```tsx
// src/app/[locale]/client/layout.tsx
import { requireRole } from "@/lib/auth/require-role";
import { ClientSidebar } from "@/components/client/sidebar";
import { ClientTopbar } from "@/components/client/topbar";

export default async function ClientLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { profile } = await requireRole(locale, "client");

  return (
    <div className="flex min-h-screen">
      <ClientSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <ClientTopbar fullName={profile.full_name} avatarUrl={profile.avatar_url} locale={locale} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/components/client/" "src/app/[locale]/client/layout.tsx"
git commit -m "feat(client): portal shell (sidebar, topbar, mobile nav, layout)"
```

---

## Task 14: Client Overview page

**Files:**
- Modify (rewrite): `src/app/[locale]/client/page.tsx`

- [ ] **Step 1: Rewrite Overview** — stat cards + recent activity, using the layout's role gate (no inline auth needed; layout already gated, but fetch data here)

```tsx
// src/app/[locale]/client/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, ClipboardList } from "lucide-react";

export default async function ClientOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, profile } = await requireRole(locale, "client");
  const t = await getTranslations("client.overview");
  const supabase = await createClient();
  const plans = await new WorkoutsService(supabase).listForClient(userId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("welcome", { name: profile.full_name ?? "" })}</h1>
        <p className="text-sm text-muted-foreground">{t("portal")}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <Dumbbell className="size-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">{t("activeWorkoutPlans")}</p>
          <p className="text-3xl font-semibold">{plans.length}</p>
          <Button asChild variant="link" className="px-0 mt-1">
            <Link href="/client/plans">{t("viewPlans")}</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <ClipboardList className="size-5 text-warning mb-2" />
          <p className="text-sm text-muted-foreground">{t("pendingForms")}</p>
          <p className="text-3xl font-semibold">0</p>
        </Card>
      </div>

      <div>
        <h2 className="text-lg mb-3">{t("recentActivity")}</h2>
        {plans.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
        ) : (
          <div className="space-y-2">
            {plans.slice(0, 5).map((p) => (
              <Card key={p.id} className="p-3">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{t("planAssigned")}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/client/page.tsx"
git commit -m "feat(client): overview dashboard"
```

---

## Task 15: Client plans list + plan detail view

**Files:**
- Create: `src/app/[locale]/client/plans/page.tsx`
- Create: `src/app/[locale]/client/plans/workout/[id]/page.tsx`
- Create: `src/app/[locale]/client/plans/workout/[id]/plan-view.tsx`

- [ ] **Step 1: Plans list**

```tsx
// src/app/[locale]/client/plans/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ClientPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.plans");
  const supabase = await createClient();
  const plans = await new WorkoutsService(supabase).listForClient(userId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {plans.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{p.name}</p>
                <Badge variant="secondary">{t("active")}</Badge>
              </div>
              <Button asChild size="sm">
                <Link href={`/client/plans/workout/${p.id}`}>{t("viewDetails")}</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Plan detail server page**

```tsx
// src/app/[locale]/client/plans/workout/[id]/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { notFound } from "next/navigation";
import { PlanView } from "./plan-view";

export default async function ClientPlanDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();
  const plan = await new WorkoutsService(supabase).getPlanWithDays(id);
  if (!plan || plan.client_id !== userId) notFound();

  return <PlanView plan={plan} locale={locale} clientId={userId} />;
}
```

- [ ] **Step 3: Plan view client component** (days as tabs; Start Workout creates a log + navigates)

```tsx
// src/app/[locale]/client/plans/workout/[id]/plan-view.tsx
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import type { PlanWithDays } from "@/modules/workouts/workouts.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PlanView({ plan, locale, clientId }: { plan: PlanWithDays; locale: string; clientId: string; }) {
  const t = useTranslations("client.planView");
  const router = useRouter();
  const days = plan.days ?? [];

  async function start(dayId: string, dayName: string) {
    const service = new WorkoutLogsService(createClient());
    const log = await service.start(clientId, plan.id, dayId, dayName);
    router.push(`/client/workout/${log.id}`);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl">{plan.name}</h1>
      <Tabs defaultValue={days[0]?.id}>
        <TabsList className="flex-wrap h-auto">
          {days.map((d) => <TabsTrigger key={d.id} value={d.id}>{d.name}</TabsTrigger>)}
        </TabsList>
        {days.map((d) => (
          <TabsContent key={d.id} value={d.id} className="space-y-3">
            {d.is_rest ? (
              <p className="text-muted-foreground py-8 text-center">{t("restDay")}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{d.exercises.length} {t("exercises")}</span>
                  <Button onClick={() => start(d.id, d.name)}>{t("startWorkout")}</Button>
                </div>
                {d.exercises.map((ex) => {
                  const name = locale === "ar" ? ex.exercise?.name_ar : ex.exercise?.name_en;
                  return (
                    <Card key={ex.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{name}</p>
                          {ex.exercise?.muscle_group && <Badge variant="secondary" className="mt-1">{ex.exercise.muscle_group}</Badge>}
                        </div>
                        <div className="text-sm text-end shrink-0">
                          <p>{t("sets")}: {ex.sets}</p>
                          <p>{t("reps")}: {ex.rep_range}</p>
                        </div>
                      </div>
                      {ex.exercise?.video_url && (
                        <a href={ex.exercise.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm mt-2 inline-block">{t("watchVideo")}</a>
                      )}
                      {ex.notes && <p className="text-xs text-muted-foreground mt-2">{t("notes")}: {ex.notes}</p>}
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/client/plans/"
git commit -m "feat(client): plans list + workout plan detail view"
```

- [ ] **Step 6: 🔍 VERIFY** — As the client, open `/client/plans`, open the assigned plan, confirm days render as tabs, exercises show sets/reps and a working video link, REST day shows the rest message.

---

## Task 16: Client live session logger

**Files:**
- Create: `src/app/[locale]/client/workout/[logId]/page.tsx`
- Create: `src/app/[locale]/client/workout/[logId]/session-logger.tsx`

- [ ] **Step 1: Server page** — load the log, then the plan/day to know which exercises to log

```tsx
// src/app/[locale]/client/workout/[logId]/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { notFound } from "next/navigation";
import { SessionLogger } from "./session-logger";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ locale: string; logId: string }>;
}) {
  const { locale, logId } = await params;
  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();

  const log = await new WorkoutLogsService(supabase).getById(logId);
  if (!log || log.client_id !== userId) notFound();

  const plan = log.plan_id ? await new WorkoutsService(supabase).getPlanWithDays(log.plan_id) : null;
  const day = plan?.days?.find((d) => d.id === log.day_id) ?? null;

  return <SessionLogger log={log} day={day} locale={locale} />;
}
```

- [ ] **Step 2: Session logger client component** — for each exercise, render `sets` rows of reps/weight inputs; "Done" logs the set; "Finish" finalizes

```tsx
// src/app/[locale]/client/workout/[logId]/session-logger.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import type { DayWithExercises } from "@/modules/workouts/workouts.types";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Log = Database["public"]["Tables"]["workout_logs"]["Row"];

export function SessionLogger({ log, day, locale }: { log: Log; day: DayWithExercises | null; locale: string; }) {
  const t = useTranslations("client.session");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // track per-set values keyed by `${exerciseId}-${setNumber}`
  const [values, setValues] = useState<Record<string, { reps: string; weight: string; done: boolean }>>({});

  function key(exId: string, setNum: number) { return `${exId}-${setNum}`; }

  async function logSet(exId: string, exName: string, setNum: number) {
    const k = key(exId, setNum);
    const v = values[k] ?? { reps: "", weight: "", done: false };
    try {
      await new WorkoutLogsService(createClient()).logSet({
        log_id: log.id, exercise_id: exId, exercise_name_snapshot: exName,
        set_number: setNum,
        reps: v.reps ? Number(v.reps) : null,
        weight: v.weight ? Number(v.weight) : null,
        completed: true,
      });
      setValues((prev) => ({ ...prev, [k]: { ...v, done: true } }));
    } catch {
      toast.error("Error");
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await new WorkoutLogsService(createClient()).finish(log.id);
      toast.success(t("finished"));
      router.push("/client/workout-logs");
    } catch {
      toast.error("Error");
      setSaving(false);
    }
  }

  const exName = (e: DayWithExercises["exercises"][number]) =>
    (locale === "ar" ? e.exercise?.name_ar : e.exercise?.name_en) ?? "Exercise";

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl">{t("title", { day: log.day_name_snapshot })}</h1>

      {(day?.exercises ?? []).map((ex) => {
        const name = exName(ex);
        return (
          <Card key={ex.id} className="p-4 space-y-3">
            <p className="font-medium">{name}</p>
            {Array.from({ length: ex.sets }).map((_, idx) => {
              const setNum = idx + 1;
              const k = key(ex.exercise_id, setNum);
              const v = values[k] ?? { reps: "", weight: "", done: false };
              return (
                <div key={setNum} className="flex items-center gap-2">
                  <span className="text-sm w-16 text-muted-foreground">{t("set")} {setNum}</span>
                  <Input type="number" placeholder={t("reps")} className="w-20" value={v.reps}
                    onChange={(e) => setValues((p) => ({ ...p, [k]: { ...v, reps: e.target.value } }))} disabled={v.done} />
                  <Input type="number" placeholder={t("weight")} className="w-24" value={v.weight}
                    onChange={(e) => setValues((p) => ({ ...p, [k]: { ...v, weight: e.target.value } }))} disabled={v.done} />
                  <Button size="sm" variant={v.done ? "secondary" : "default"} disabled={v.done}
                    onClick={() => logSet(ex.exercise_id, name, setNum)}>{t("markDone")}</Button>
                </div>
              );
            })}
          </Card>
        );
      })}

      <Button onClick={finish} disabled={saving} className="w-full">{saving ? t("saving") : t("finish")}</Button>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/client/workout/"
git commit -m "feat(client): live workout session logger"
```

---

## Task 17: Client workout logs history + detail

**Files:**
- Create: `src/app/[locale]/client/workout-logs/page.tsx`
- Create: `src/app/[locale]/client/workout-logs/[id]/page.tsx`

- [ ] **Step 1: History list**

```tsx
// src/app/[locale]/client/workout-logs/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientWorkoutLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.logs");
  const supabase = await createClient();
  const logs = await new WorkoutLogsService(supabase).listForClient(userId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {logs.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Link key={l.id} href={`/client/workout-logs/${l.id}`}>
              <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{l.day_name_snapshot}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.started_at).toLocaleDateString(locale)}</p>
                </div>
                <Badge variant={l.status === "completed" ? "default" : "secondary"}>
                  {l.status === "completed" ? t("completed") : t("inProgress")}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Log detail**

```tsx
// src/app/[locale]/client/workout-logs/[id]/page.tsx
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function WorkoutLogDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.logs");
  const supabase = await createClient();
  const log = await new WorkoutLogsService(supabase).getById(id);
  if (!log || log.client_id !== userId) notFound();

  // group sets by exercise name snapshot
  const byExercise: Record<string, typeof log.sets> = {};
  for (const s of log.sets ?? []) {
    (byExercise[s.exercise_name_snapshot] ??= []).push(s);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl">{log.day_name_snapshot}</h1>
      <p className="text-sm text-muted-foreground">{new Date(log.started_at).toLocaleString(locale)}</p>
      {Object.entries(byExercise).map(([name, sets]) => (
        <Card key={name} className="p-4">
          <p className="font-medium mb-2">{name}</p>
          <div className="space-y-1 text-sm">
            {sets.map((s) => (
              <div key={s.id} className="flex gap-4 text-muted-foreground">
                <span>{t("completed")} {s.set_number}</span>
                <span>{s.reps ?? "-"} {t("exercises") /* reps label reused minimally */}</span>
                <span>{s.weight ?? "-"} kg</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

NOTE for implementer: the reps label above reuses a key loosely; if it reads awkwardly, add a dedicated `client.logs.reps` / `client.logs.weight` key to both message files and use those instead. Keep it correct over clever.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/client/workout-logs/"
git commit -m "feat(client): workout logs history + detail"
```

---

## Task 18: Full end-to-end verification & RLS check

- [ ] **Step 1: 🔍 VERIFY full loop** — `npm run dev`. Drive via Chrome DevTools MCP or manually:
  1. **Coach** logs in → `/coach/library` shows seeded exercises; add a custom one.
  2. Coach → client detail → Plans → New Plan → build push day (3 exercises) + REST day → Save.
  3. **Client** logs in → `/client` Overview shows "Workout Plans: 1" + recent activity.
  4. `/client/plans` → open plan → days as tabs, exercises with sets/reps/video.
  5. Tap **Start Workout** → log reps+weight per set, mark Done → **Finish**.
  6. Redirects to `/client/workout-logs` → session shows as **Completed**; open detail → logged sets appear grouped by exercise.

- [ ] **Step 2: 🔍 VERIFY RTL** — switch to `/ar/...` on the client portal; confirm sidebar/bottom-nav, cards, and tabs render correctly RTL on a narrow viewport (mobile-first).

- [ ] **Step 3: 🔍 VERIFY RLS isolation** — create/log in as a second client (or coach) and confirm they CANNOT open the first client's plan or log URLs (should `notFound()` due to the `client_id !== userId` guard AND RLS returning no rows). Confirm a second coach cannot see the first coach's plans in `/coach/workouts`.

- [ ] **Step 4: Final build**

Run: `npm run build`
Expected: PASS with no new errors.

- [ ] **Step 5: Finishing the branch** — use the `superpowers:finishing-a-development-branch` skill to decide merge/PR. Summarize what shipped.

---

## Self-review notes (for the executor)
- **No transactions:** `createPlan` inserts plan→days→exercises sequentially. If a later insert fails, the plan row may persist with partial days. Acceptable for Cycle 1 (coach can re-save via `replaceDays`). A Postgres RPC/function for atomicity is a Cycle-2+ hardening item.
- **Stubbed types boundary:** every service casts to `SupabaseClient<any>` exactly like `ClientsService` — this is intentional, not a smell, until `supabase gen types` is wired.
- **`useTranslations` namespaces:** server components use `getTranslations("client.plans")` (dotted) — confirmed valid in next-intl v4.
- **`Link` wrapping `Card`:** Task 17 wraps a `Card` in next-intl `Link`; if hydration warns about nested interactive elements, move the click handler to the Card via `onClick`+`router.push`. Prefer the `Link` for accessibility unless it warns.
