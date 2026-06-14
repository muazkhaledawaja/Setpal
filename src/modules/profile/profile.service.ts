/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  UpdateProfileInput,
  UpdateCoachProfileValues,
} from "./profile.schemas";
import { ProfileUpdateError, CoachProfileUpdateError } from "./profile.errors";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CoachRow = Database["public"]["Tables"]["coaches"]["Row"];

/**
 * Profile mutations. RLS enforces that a user can only update their own
 * profiles / coaches row, so we don't re-check ownership here — we just write
 * against `userId` and trust the policy. Mirrors the FormsService pattern.
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  private get db(): SupabaseClient<any> {
    return this.supabase as SupabaseClient<any>;
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<ProfileRow> {
    const phone = input.phone?.trim() ? input.phone.trim() : null;

    const { data, error } = await this.db
      .from("profiles")
      .update({
        full_name: input.full_name.trim(),
        phone,
        locale: input.locale,
        ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) throw new ProfileUpdateError(error?.message);
    return data as ProfileRow;
  }

  async updateCoachProfile(
    userId: string,
    input: UpdateCoachProfileValues
  ): Promise<CoachRow> {
    const { data, error } = await this.db
      .from("coaches")
      .update({
        bio_ar: input.bio_ar?.trim() ? input.bio_ar.trim() : null,
        bio_en: input.bio_en?.trim() ? input.bio_en.trim() : null,
        specializations: input.specializations,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) throw new CoachProfileUpdateError(error?.message);
    return data as CoachRow;
  }
}
