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
