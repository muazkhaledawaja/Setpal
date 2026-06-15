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

  // Global (coach_id null) library, optional filters. Admin-facing.
  async listGlobal(filters: ExerciseFilters = {}): Promise<ExerciseRow[]> {
    let query = this.db
      .from("exercises")
      .select("*")
      .is("coach_id", null)
      .order("name_en", { ascending: true });

    if (filters.muscleGroup) query = query.eq("muscle_group", filters.muscleGroup);
    if (filters.search) {
      query = query.or(`name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ExercisesError(error.message, "list_failed");
    return (data ?? []) as ExerciseRow[];
  }

  // Creates a global exercise (coach_id null). Admin-only via RLS.
  async createGlobal(input: CreateExerciseInput): Promise<ExerciseRow> {
    const { data, error } = await this.db
      .from("exercises")
      .insert({
        coach_id: null,
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
