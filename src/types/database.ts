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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
