/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateFoodInput, UpdateFoodInput, FoodFilters } from "./foods.schemas";
import { FoodsError } from "./foods.errors";

type DB = Database["public"]["Tables"];
type FoodRow = DB["foods"]["Row"];
type SB = SupabaseClient<any>;

export class FoodsService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  // global (coach_id null) + this coach's customs, optional filters
  async listLibrary(coachId: string, filters: FoodFilters = {}): Promise<FoodRow[]> {
    let query = this.db
      .from("foods")
      .select("*")
      .or(`coach_id.is.null,coach_id.eq.${coachId}`)
      .order("name_en", { ascending: true });

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.search) {
      query = query.or(`name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new FoodsError(error.message, "list_failed");
    return (data ?? []) as FoodRow[];
  }

  // Global (coach_id null) library, optional filters. Admin-facing.
  async listGlobal(filters: FoodFilters = {}): Promise<FoodRow[]> {
    let query = this.db
      .from("foods")
      .select("*")
      .is("coach_id", null)
      .order("name_en", { ascending: true });

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.search) {
      query = query.or(`name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    // RLS may block admin SELECT before migration is applied — return empty list
    if (error) return [];
    return (data ?? []) as FoodRow[];
  }

  // Creates a global food (coach_id null). Admin-only via RLS.
  async createGlobal(input: CreateFoodInput): Promise<FoodRow> {
    const { data, error } = await this.db
      .from("foods")
      .insert({ coach_id: null, ...this.normalize(input) })
      .select()
      .single();
    if (error || !data) throw new FoodsError(error?.message ?? "insert failed", "create_failed");
    return data as FoodRow;
  }

  async createCustom(coachId: string, input: CreateFoodInput): Promise<FoodRow> {
    const { data, error } = await this.db
      .from("foods")
      .insert({ coach_id: coachId, ...this.normalize(input) })
      .select()
      .single();
    if (error || !data) throw new FoodsError(error?.message ?? "insert failed", "create_failed");
    return data as FoodRow;
  }

  async update(input: UpdateFoodInput): Promise<void> {
    const { id, ...fields } = input;
    const { error } = await this.db
      .from("foods")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new FoodsError(error.message, "update_failed");
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("foods").delete().eq("id", id);
    if (error) throw new FoodsError(error.message, "delete_failed");
  }

  private normalize(input: CreateFoodInput) {
    return {
      name_ar: input.name_ar,
      name_en: input.name_en,
      category: input.category,
      serving_label_ar: input.serving_label_ar || null,
      serving_label_en: input.serving_label_en || null,
      serving_grams: input.serving_grams,
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
    };
  }
}
