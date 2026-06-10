# Workout Plans — Vertical Slice Design

**Date:** 2026-05-21
**Status:** Approved design → ready for implementation plan
**Cycle:** 1 of 4 (Workout Plans → Nutrition Plans → Forms Builder → Library/polish)

## Context

Setpal is a B2B coaching SaaS (coaches pay; their clients use the platform). The codebase already has auth, role-based routing, a coach shell (sidebar: Dashboard/Clients/Library/Forms/Settings), a working client invite flow, and DB tables for `profiles`, `coaches`, `clients`, `client_invites`. What's missing is every actual coaching feature.

The user asked to clone FitForce.io / Trainerize functionality. We explored the live reference (`belghamdi.fitforce.io`) and confirmed its client portal centers on **Plans** (workout + nutrition), **Workout Logs** (executed sessions), and **Forms**. We decided to build **Plans first, then the Forms builder**, using the **existing Setpal design system** (cream/teal/sand, Fraunces+Inter, shadcn).

This spec covers **Cycle 1 only: Workout Plans as a full vertical slice** — coach builds a plan from an exercise library → assigns it to a client → client views the plan → client logs a live workout session → session appears in workout-log history. Building one domain end-to-end de-risks the novel work (plan data model + assignment + logging); Nutrition Plans (Cycle 2) reuse this exact architecture with different leaf fields.

### Reference model observed in FitForce (what we are replicating, functionally)

- **Workout plan** = named program → ordered **days** (a weekly split: push / pull / legs / upper / lower / REST). Days can be rest days.
- **Day** = ordered list of **exercises**, each with: muscle group, thumbnail, video link, **sets**, **rep range** (e.g. "6-10"), rest, optional notes.
- **Start Workout** → client executes a day, logging actual sets/reps/weight per exercise → saved as a **workout log** (status: in-progress / completed, start/end time, exercise count).
- **Workout Logs** = history list of executed sessions.

## Scope

### In scope (Cycle 1)
1. **Exercise library** — new `exercises` table + migration, seeded with ~40 common exercises (bilingual, muscle group, video URL, thumbnail, equipment). Coach-scoped customs supported (`coach_id null = global`).
2. **Coach: library UI** — `/coach/library` (Exercises tab) to browse/search the seeded library and add/edit/delete own custom exercises.
3. **Coach: workout plan builder** — create a plan, add days (incl. REST days), add exercises to each day from the library with sets/reps/rest/notes, reorder, save.
4. **Coach: assign plan to a client** — from the client detail page's "Plans" tab.
5. **Client portal shell** — `/client` layout with sidebar nav (Overview, Plans, Workout Logs, Forms, Settings — Forms/Settings as placeholders this cycle) + topbar (locale/theme toggle, avatar menu). Mobile-first.
6. **Client: Overview** — stat cards (active workout plans, pending forms placeholder, etc.) + recent activity (assigned plans).
7. **Client: view assigned workout plan** — days as tabs, exercises with sets/reps/video, "Start Workout".
8. **Client: log a workout session** — Start Workout → per-exercise set logging (reps + weight + done) → finish → saved.
9. **Client: Workout Logs** — history list with status/date/duration/exercise count + detail view.

### Out of scope (later cycles)
- Nutrition plans (Cycle 2), Forms builder (Cycle 3), Foods library, measurements/progress charts, "Request Replace", subscription/billing UI, Resend email, real-time, admin dashboard, native/PWA.
- We will NOT wire email sending; invite flow already exists and is untouched.

## Architecture

Follows the existing module pattern exactly (`src/modules/<domain>/`), thin route handlers/pages, services taking `SupabaseClient<Database>`, RLS as the auth layer.

### Data model (new tables)

All tables: `enable row level security`, `created_at`/`updated_at` timestamps, indexes on FKs. Migration mirrors the style of `20260511000000_client_invites.sql`. RLS uses `auth.uid()` and the existing `is_coach()` helper.

```
exercises
  id uuid pk
  coach_id uuid null references profiles(id) on delete cascade  -- null = global/seeded
  name_ar text not null
  name_en text not null
  muscle_group text not null        -- 'chest','back','shoulders','legs','arms','core','full_body','cardio'
  equipment text null               -- 'barbell','dumbbell','machine','cable','bodyweight', etc.
  video_url text null
  thumbnail_url text null
  created_at, updated_at

workout_plans
  id uuid pk
  coach_id uuid not null references profiles(id) on delete cascade
  client_id uuid null references profiles(id) on delete set null  -- null = template; set = assigned
  name text not null
  description_ar text null
  description_en text null
  status text not null default 'active' check (status in ('active','archived','draft'))
  created_at, updated_at

workout_days
  id uuid pk
  plan_id uuid not null references workout_plans(id) on delete cascade
  name text not null                -- 'push','pull','legs','REST', etc.
  order_index int not null
  is_rest boolean not null default false
  created_at

workout_day_exercises
  id uuid pk
  day_id uuid not null references workout_days(id) on delete cascade
  exercise_id uuid not null references exercises(id) on delete restrict
  order_index int not null
  sets int not null default 3
  rep_range text not null default '8-12'   -- free text to allow ranges & 'AMRAP'
  rest_seconds int null
  notes text null
  created_at

workout_logs
  id uuid pk
  client_id uuid not null references profiles(id) on delete cascade
  plan_id uuid null references workout_plans(id) on delete set null
  day_id uuid null references workout_days(id) on delete set null
  day_name_snapshot text not null    -- snapshot in case plan changes/deletes
  status text not null default 'in_progress' check (status in ('in_progress','completed'))
  started_at timestamptz not null default now()
  completed_at timestamptz null
  created_at

workout_log_sets
  id uuid pk
  log_id uuid not null references workout_logs(id) on delete cascade
  exercise_id uuid null references exercises(id) on delete set null
  exercise_name_snapshot text not null
  set_number int not null
  reps int null
  weight numeric null               -- kg
  completed boolean not null default false
  created_at
```

**Design notes:**
- A `workout_plan` is a **template** when `client_id is null` and an **assignment** when `client_id` is set. Cycle 1 builder may create directly-assigned plans (simplest); template/clone can come later. We keep the column now to avoid a migration later.
- **Snapshots** (`day_name_snapshot`, `exercise_name_snapshot`) on logs so history survives plan edits/deletes — mirrors how `form_submissions` snapshots `template_version`.
- `rep_range` is text (supports "6-10", "AMRAP", "15").

### RLS policies (per table)

- **exercises:** anyone authenticated can `select` global rows (`coach_id is null`) OR their own (`coach_id = auth.uid()`); coach can `insert/update/delete` only rows where `coach_id = auth.uid()`. Clients also need `select` on global exercises (for viewing plans) → policy allows select where `coach_id is null or coach_id = auth.uid()` PLUS a policy so a client can read exercises referenced by their assigned plan. **Simpler approach: allow all authenticated users to `select` exercises** (library is not sensitive); restrict writes to owner. We'll use the simple approach.
- **workout_plans / workout_days / workout_day_exercises:** coach manages rows where the plan's `coach_id = auth.uid()`; client can `select` rows where the plan's `client_id = auth.uid()`. Child tables join up to the plan for the check (via `exists` subquery on parent).
- **workout_logs / workout_log_sets:** client manages rows where `client_id = auth.uid()`; coach can `select` logs of their own clients (`exists` subquery: plan/ client belongs to coach). For Cycle 1, client full CRUD on own logs + coach read is enough.

### Module structure (new)

```
src/modules/library/
  exercises.schemas.ts      # Zod: CreateExercise, UpdateExercise, query filters
  exercises.service.ts      # listLibrary(coachId, filters), createCustom, update, delete
  exercises.errors.ts

src/modules/workouts/
  workouts.schemas.ts       # Zod: CreatePlan, UpsertDay, UpsertDayExercise, AssignPlan
  workouts.service.ts       # plan CRUD, day/exercise CRUD, assign, listForClient, getPlanWithDays
  workouts.errors.ts
  workouts.types.ts         # PlanWithDays, DayWithExercises composite types

src/modules/workout-logs/
  workout-logs.schemas.ts   # Zod: StartSession, LogSet, FinishSession
  workout-logs.service.ts   # start, logSet, finish, listForClient, getById
  workout-logs.errors.ts
```

Each service mirrors `ClientsService`: constructor takes `SupabaseClient<Database>`, casts to `SB = SupabaseClient<any>` at the boundary (stubbed types), returns strongly-typed values, throws domain errors.

### Routes (new)

**Coach side** (under existing `coach/layout.tsx`, role-gated to coach):
- `src/app/[locale]/coach/library/page.tsx` — Exercises browser + custom CRUD (replaces the dead sidebar link).
- `src/app/[locale]/coach/workouts/page.tsx` — list of all workout plans the coach has built (across clients).
- `src/app/[locale]/coach/workouts/new/page.tsx` + `[id]/page.tsx` — plan builder (create/edit).
- Update `src/app/[locale]/coach/clients/[id]/client-tabs.tsx` "Plans" tab: list THIS client's assigned workout plans + an "Assign plan" / "Build plan" action that deep-links into the builder pre-scoped to this client. (The client-detail Plans tab is the primary entry point; `/coach/workouts` is the cross-client index.)

**Client side** (NEW shell):
- `src/app/[locale]/client/layout.tsx` — client shell (sidebar + topbar), role-gated to client via new helper. Replaces the placeholder page-only setup.
- `src/components/client/sidebar.tsx`, `src/components/client/topbar.tsx` — mirror coach equivalents, mobile-first (collapsible drawer on small screens).
- `src/app/[locale]/client/page.tsx` (Overview) — stat cards + recent activity (rewrite the placeholder).
- `src/app/[locale]/client/plans/page.tsx` — list active workout plans (Cycle 2 adds nutrition tab).
- `src/app/[locale]/client/plans/workout/[id]/page.tsx` — plan detail (days as tabs, exercises, Start Workout).
- `src/app/[locale]/client/workout/[logId]/page.tsx` — live session logging UI ("use client").
- `src/app/[locale]/client/workout-logs/page.tsx` — history list.
- `src/app/[locale]/client/workout-logs/[id]/page.tsx` — log detail.

### Reused existing code
- **`requireRole(locale, role)`** (`src/lib/auth/require-role.ts`) for coach pages; add a thin `requireClient` path (extend helper to fetch the `clients` row when role is client, analogous to how it fetches `coaches`).
- **Service/error/schema pattern** from `src/modules/clients/`.
- **Migration + RLS style** from `supabase/migrations/20260511000000_client_invites.sql`.
- **shadcn primitives** already installed: button, card, input, select, dialog, badge, separator, tabs (verify tabs is installed; `add` if not), dropdown-menu, avatar.
- **Design tokens** in `globals.css` (`bg-card`, `bg-primary`, `--sidebar*`, success/warning) — no new tokens.
- **i18n**: add `client.*` and `library.*` / `workouts.*` namespaces to BOTH `messages/ar.json` and `messages/en.json`.

### Data flow examples

**Coach builds & assigns:**
`/coach/workouts/new` (client component) → form state (RHF + Zod) → server action / route calls `WorkoutsService.createPlan` + `upsertDay` + `upsertDayExercise` → on assign, set `client_id`. RLS ensures coach owns the plan.

**Client logs a session:**
`/client/plans/workout/[id]` → "Start Workout" → calls `WorkoutLogsService.start(clientId, planId, dayId)` → creates `workout_logs` row (in_progress) + redirects to `/client/workout/[logId]` → client logs each set (`logSet`) → "Finish" → `finish(logId)` sets status=completed, completed_at. Appears in `/client/workout-logs`.

## Error handling
- Domain errors per module (`<domain>.errors.ts`), thrown by services.
- Client forms: catch → surface to RHF state / `sonner` toast.
- Server components: let errors bubble to Next error boundary; add `error.tsx` where a friendly fallback matters (client plan/log pages).
- Respect coach `client_limit` already enforced in invite flow — not re-touched here.

## Types
- Extend `src/types/database.ts` stub with the new tables (Row/Insert/Update) so services stay typed. The `SB = SupabaseClient<any>` boundary cast handles Supabase's `never`-typing on stubbed schemas (same as `ClientsService`).
- Add composite types (`PlanWithDays`, `DayWithExercises`, `LogWithSets`) in `workouts.types.ts` / inline.

## Migrations
Two new migration files (mirrored to `supabase/migrations/`, applied by the user via Supabase Dashboard SQL Editor per CLAUDE.md):
1. `<ts>_exercises_library.sql` — `exercises` table + RLS + indexes + seed (~40 exercises, bilingual, with muscle_group/video_url).
2. `<ts>_workout_plans.sql` — `workout_plans`, `workout_days`, `workout_day_exercises`, `workout_logs`, `workout_log_sets` + RLS + indexes.

(Seed may be split into its own file for readability.)

## Verification (end-to-end)
1. Apply both migrations in Supabase SQL Editor; confirm tables + RLS exist.
2. `npm run dev`. As **coach** (existing test login): open `/coach/library` → see seeded exercises, add a custom one. Build a plan at `/coach/workouts/new` with 2 days (push + REST) and a few exercises; assign to the existing test client.
3. As **client** (existing test client login): `/client` shows the plan in Overview; `/client/plans` lists it; open it → days as tabs, exercises with sets/reps/video link; tap **Start Workout** → log sets (reps+weight) → Finish.
4. Confirm the session shows in `/client/workout-logs` with status=completed, duration, exercise count; open detail → see logged sets.
5. **RLS check:** sign in as a second coach/client and confirm they cannot read the first's plan/logs (cross-tenant isolation).
6. Verify Arabic (`/ar/...`) renders RTL correctly on the client portal (mobile-first layout).
7. `npm run build` passes (no type errors against extended `database.ts`).

## Open questions / deferred
- **Template vs. direct-assign:** Cycle 1 creates directly-assigned plans; `client_id null` template reuse deferred. Column exists now.
- **Type generation:** still hand-stub; proper `supabase gen types` deferred (CLI not installed) — noted in CLAUDE.md.
- **Coach view of client logs / compliance dashboard:** RLS allows coach reads now; the coach-facing compliance UI is a later polish item.
