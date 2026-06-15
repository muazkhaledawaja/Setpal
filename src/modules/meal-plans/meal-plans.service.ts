/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateMealPlanInput } from "./meal-plans.schemas";
import type { MealPlanRow, MealPlanWithDays } from "./meal-plans.types";
import { MealPlansError } from "./meal-plans.errors";

type SB = SupabaseClient<any>;

export class MealPlansService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  async createPlan(coachId: string, input: CreateMealPlanInput): Promise<MealPlanRow> {
    const { data: plan, error: planErr } = await this.db
      .from("meal_plans")
      .insert({
        coach_id: coachId,
        client_id: input.client_id ?? null,
        name: input.name,
        description_ar: input.description_ar ?? null,
        description_en: input.description_en ?? null,
        daily_calorie_target: input.daily_calorie_target ?? null,
      })
      .select()
      .single();
    if (planErr || !plan) throw new MealPlansError(planErr?.message ?? "plan insert failed", "create_plan_failed");

    await this.replaceDays((plan as MealPlanRow).id, input);
    return plan as MealPlanRow;
  }

  // Replace all days/meals/items for a plan (used by create and edit).
  async replaceDays(planId: string, input: CreateMealPlanInput): Promise<void> {
    await this.db.from("meal_plan_days").delete().eq("plan_id", planId); // cascades down

    for (let i = 0; i < input.days.length; i++) {
      const day = input.days[i];
      const { data: dayRow, error: dayErr } = await this.db
        .from("meal_plan_days")
        .insert({ plan_id: planId, name: day.name, order_index: i })
        .select()
        .single();
      if (dayErr || !dayRow) throw new MealPlansError(dayErr?.message ?? "day insert failed", "create_day_failed");

      for (let j = 0; j < day.meals.length; j++) {
        const meal = day.meals[j];
        const { data: mealRow, error: mealErr } = await this.db
          .from("meal_plan_meals")
          .insert({
            day_id: (dayRow as { id: string }).id,
            name_ar: meal.name_ar,
            name_en: meal.name_en,
            order_index: j,
            time_label: meal.time_label ?? null,
            notes: meal.notes ?? null,
          })
          .select()
          .single();
        if (mealErr || !mealRow) throw new MealPlansError(mealErr?.message ?? "meal insert failed", "create_meal_failed");

        if (meal.items.length > 0) {
          const rows = meal.items.map((it, k) => ({
            meal_id: (mealRow as { id: string }).id,
            food_id: it.food_id,
            order_index: k,
            quantity_grams: it.quantity_grams,
            notes: it.notes ?? null,
          }));
          const { error: itErr } = await this.db.from("meal_plan_items").insert(rows);
          if (itErr) throw new MealPlansError(itErr.message, "create_item_failed");
        }
      }
    }
  }

  async updatePlanMeta(
    planId: string,
    fields: Partial<Pick<MealPlanRow, "name" | "description_ar" | "description_en" | "client_id" | "status" | "daily_calorie_target">>,
  ): Promise<void> {
    const { error } = await this.db
      .from("meal_plans")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", planId);
    if (error) throw new MealPlansError(error.message, "update_plan_failed");
  }

  async listForCoach(coachId: string): Promise<MealPlanRow[]> {
    const { data, error } = await this.db
      .from("meal_plans")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    if (error) throw new MealPlansError(error.message, "list_failed");
    return (data ?? []) as MealPlanRow[];
  }

  async listForClient(clientId: string): Promise<MealPlanRow[]> {
    const { data, error } = await this.db
      .from("meal_plans")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new MealPlansError(error.message, "list_failed");
    return (data ?? []) as MealPlanRow[];
  }

  async getPlanWithDays(planId: string): Promise<MealPlanWithDays | null> {
    const { data, error } = await this.db
      .from("meal_plans")
      .select(`*, days:meal_plan_days(*, meals:meal_plan_meals(*, items:meal_plan_items(*, food:foods(*))))`)
      .eq("id", planId)
      .single();
    if (error) return null;
    const plan = data as MealPlanWithDays;
    plan.days?.sort((a, b) => a.order_index - b.order_index);
    plan.days?.forEach((d) => {
      d.meals?.sort((a, b) => a.order_index - b.order_index);
      d.meals?.forEach((m) => m.items?.sort((a, b) => a.order_index - b.order_index));
    });
    return plan;
  }
}
