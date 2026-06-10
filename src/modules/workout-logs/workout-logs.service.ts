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
