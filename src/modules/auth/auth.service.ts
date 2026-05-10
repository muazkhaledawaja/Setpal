import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RegisterInput, LoginInput, Role } from "./auth.schemas";
import { InvalidCredentialsError, EmailAlreadyInUseError, AuthError } from "./auth.errors";

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async register(input: RegisterInput) {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role,
          locale: input.locale,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        throw new EmailAlreadyInUseError();
      }
      throw new AuthError(error.message, "register_failed");
    }

    return { userId: data.user?.id ?? null, needsConfirmation: !data.session };
  }

  async login(input: LoginInput) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new InvalidCredentialsError();
    return { userId: data.user.id };
  }

  async logout() {
    await this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  }

  async getCurrentProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getRoleHomePath(role: Role): Promise<string> {
    return {
      admin: "/admin",
      coach: "/coach",
      client: "/client",
    }[role];
  }
}
