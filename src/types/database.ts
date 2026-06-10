// Generated types will replace this file. For now, a minimal stub.
// Run: npx supabase gen types typescript --project-id YOUR_REF > src/types/database.ts
// (once you have the CLI working)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "coach" | "client";
          full_name: string | null;
          locale: "ar" | "en";
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          role: "admin" | "coach" | "client";
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      coaches: {
        Row: {
          id: string;
          bio_ar: string | null;
          bio_en: string | null;
          specializations: string[];
          subscription_tier: "trial" | "starter" | "pro" | "elite";
          subscription_status: "active" | "past_due" | "canceled" | "expired";
          trial_ends_at: string | null;
          current_period_end: string | null;
          client_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["coaches"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["coaches"]["Row"]>;
      };
      clients: {
        Row: {
          id: string;
          coach_id: string;
          package_id: string | null;
          status: "active" | "paused" | "ended";
          start_date: string;
          end_date: string | null;
          goal_ar: string | null;
          goal_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          id: string;
          coach_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
      };
      client_invites: {
        Row: {
          id: string;
          coach_id: string;
          email: string;
          token: string;
          status: "pending" | "accepted" | "expired";
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_invites"]["Row"]> & {
          coach_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_invites"]["Row"]>;
      };
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
