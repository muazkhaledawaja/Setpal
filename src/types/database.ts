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
          status: "pending" | "active" | "suspended";
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
    form_templates: {
      Row: {
        id: string;
        coach_id: string;
        name: string;
        description_ar: string | null;
        description_en: string | null;
        type: "onboarding" | "check_in" | "custom";
        is_active: boolean;
        settings: Record<string, unknown>;
        version: number;
        parent_template_id: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: Partial<{
        id: string; coach_id: string; name: string;
        description_ar: string | null; description_en: string | null;
        type: "onboarding" | "check_in" | "custom"; is_active: boolean;
        settings: Record<string, unknown>; version: number;
        parent_template_id: string | null; created_at: string; updated_at: string;
      }> & { coach_id: string; name: string };
      Update: Partial<{
        id: string; coach_id: string; name: string;
        description_ar: string | null; description_en: string | null;
        type: "onboarding" | "check_in" | "custom"; is_active: boolean;
        settings: Record<string, unknown>; version: number;
        parent_template_id: string | null; created_at: string; updated_at: string;
      }>;
    };
    form_questions: {
      Row: {
        id: string;
        template_id: string;
        label_ar: string;
        label_en: string;
        type: string;
        options: { value: string; label_ar: string; label_en: string }[] | null;
        validation: Record<string, unknown>;
        placeholder_ar: string | null;
        placeholder_en: string | null;
        help_text_ar: string | null;
        help_text_en: string | null;
        order_index: number;
        conditional_logic: Record<string, unknown> | null;
        created_at: string;
        updated_at: string;
      };
      Insert: Partial<{
        id: string; template_id: string; label_ar: string; label_en: string;
        type: string; options: { value: string; label_ar: string; label_en: string }[] | null; validation: Record<string, unknown>;
        placeholder_ar: string | null; placeholder_en: string | null;
        help_text_ar: string | null; help_text_en: string | null;
        order_index: number; conditional_logic: Record<string, unknown> | null;
        created_at: string; updated_at: string;
      }> & { template_id: string; label_ar: string; label_en: string; type: string; order_index: number };
      Update: Partial<{
        id: string; template_id: string; label_ar: string; label_en: string; type: string;
        options: { value: string; label_ar: string; label_en: string }[] | null; validation: Record<string, unknown>;
        placeholder_ar: string | null; placeholder_en: string | null;
        help_text_ar: string | null; help_text_en: string | null;
        order_index: number; conditional_logic: Record<string, unknown> | null;
        created_at: string; updated_at: string;
      }>;
    };
    form_assignments: {
      Row: {
        id: string;
        template_id: string;
        template_version: number;
        client_id: string;
        assigned_by: string;
        status: "pending" | "in_progress" | "completed" | "overdue" | "skipped";
        due_at: string | null;
        started_at: string | null;
        completed_at: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: Partial<{
        id: string; template_id: string; template_version: number;
        client_id: string; assigned_by: string;
        status: "pending" | "in_progress" | "completed" | "overdue" | "skipped";
        due_at: string | null; started_at: string | null; completed_at: string | null;
        created_at: string; updated_at: string;
      }> & { template_id: string; client_id: string; assigned_by: string };
      Update: Partial<{
        id: string; template_id: string; template_version: number;
        client_id: string; assigned_by: string;
        status: "pending" | "in_progress" | "completed" | "overdue" | "skipped";
        due_at: string | null; started_at: string | null; completed_at: string | null;
        created_at: string; updated_at: string;
      }>;
    };
    form_responses: {
      Row: {
        id: string;
        assignment_id: string;
        question_id: string;
        value: unknown;
        is_draft: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: Partial<{
        id: string; assignment_id: string; question_id: string;
        value: unknown; is_draft: boolean;
        created_at: string; updated_at: string;
      }> & { assignment_id: string; question_id: string; value: unknown };
      Update: Partial<{
        id: string; assignment_id: string; question_id: string;
        value: unknown; is_draft: boolean;
        created_at: string; updated_at: string;
      }>;
    };
    form_files: {
      Row: {
        id: string;
        response_id: string;
        storage_path: string;
        original_name: string;
        mime_type: string;
        size_bytes: number;
        created_at: string;
      };
      Insert: Partial<{
        id: string; response_id: string; storage_path: string;
        original_name: string; mime_type: string; size_bytes: number; created_at: string;
      }> & { response_id: string; storage_path: string; original_name: string; mime_type: string; size_bytes: number };
      Update: Partial<{
        id: string; response_id: string; storage_path: string;
        original_name: string; mime_type: string; size_bytes: number; created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      admin_list_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          full_name: string | null;
          email: string;
          role: "admin" | "coach" | "client";
          status: "pending" | "active" | "suspended";
          locale: "ar" | "en";
          created_at: string;
          last_sign_in: string | null;
          client_count: number;
          coach_id: string | null;
        }[];
      };
      admin_dashboard_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          pending_approvals: number;
          active_users: number;
          suspended_users: number;
          total_coaches: number;
          active_coaches: number;
          total_clients: number;
          recent_signups: number;
        }[];
      };
      accept_client_invite: {
        Args: { invite_token: string };
        Returns: void;
      };
      approve_user: {
        Args: { target: string; new_role: string };
        Returns: void;
      };
      set_user_status: {
        Args: { target: string; new_status: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};
