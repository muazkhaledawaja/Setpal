import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AdminUser, ListUsersQuery, DashboardStats } from "./admin.schemas";

// rpc() calls use an untyped client, matching the repo convention in
// forms.service.ts (the generated Functions types aren't available yet).
type SB = SupabaseClient<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Admin operations over all users. All mutations go through SECURITY DEFINER
 * RPCs (`approve_user`, `set_user_status`, `admin_list_users`) that enforce
 * `is_admin()` in the database — application code stays free of permission
 * logic and never needs the service-role client.
 */
export class AdminService {
  private db: SB;

  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  async listUsers(query: ListUsersQuery = {}): Promise<AdminUser[]> {
    const { data, error } = await this.db.rpc("admin_list_users");
    if (error) {
      if ((error as any).code === "PGRST202") return [];
      throw error;
    }

    let users = (data ?? []) as AdminUser[];

    if (query.role) {
      users = users.filter((u) => u.role === query.role);
    }
    if (query.status) {
      users = users.filter((u) => u.status === query.status);
    }
    if (query.search) {
      const needle = query.search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.full_name ?? "").toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle)
      );
    }

    return users;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await this.db.rpc("admin_dashboard_stats");
    // PGRST202 = function not found (migration not yet applied) — return zeros so the page still renders
    if (error) {
      if ((error as any).code === "PGRST202") {
        return { total_users: 0, pending_approvals: 0, active_users: 0, suspended_users: 0, total_coaches: 0, active_coaches: 0, total_clients: 0, recent_signups: 0 };
      }
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return row as DashboardStats;
  }

  async approveUser(
    userId: string,
    role: "admin" | "coach" | "client"
  ): Promise<void> {
    const { error } = await this.db.rpc("approve_user", {
      target: userId,
      new_role: role,
    });
    if (error) throw error;
  }

  async setStatus(
    userId: string,
    status: "pending" | "active" | "suspended"
  ): Promise<void> {
    const { error } = await this.db.rpc("set_user_status", {
      target: userId,
      new_status: status,
    });
    if (error) throw error;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.db.rpc("delete_user", { target: userId });
    if (error) throw error;
  }
}
