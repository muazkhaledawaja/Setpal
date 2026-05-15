/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { InviteClientInput, UpdateClientStatusInput } from "./clients.schemas";
import {
  ClientLimitReachedError,
  InviteAlreadySentError,
  InvalidInviteTokenError,
  ClientsError,
} from "./clients.errors";

type DB = Database["public"]["Tables"];
type ClientRow = DB["clients"]["Row"];
type CoachRow = DB["coaches"]["Row"];
type InviteRow = DB["client_invites"]["Row"];
type ProfileRow = DB["profiles"]["Row"];

export type ClientWithProfile = ClientRow & {
  profile: Pick<ProfileRow, "full_name" | "avatar_url" | "locale"> | null;
};

// Supabase's generic client returns `never` for many operations when types are hand-written stubs.
// We use `any` at the boundary and return strongly-typed values from each method.
type SB = SupabaseClient<any>;

export class ClientsService {
  private db: SB;

  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  async listForCoach(coachId: string): Promise<ClientWithProfile[]> {
    const { data, error } = await this.db
      .from("clients")
      .select("*, profile:profiles(full_name, avatar_url, locale)")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (error) throw new ClientsError(error.message, "list_failed");
    return (data ?? []) as ClientWithProfile[];
  }

  async getById(clientId: string): Promise<ClientWithProfile | null> {
    const { data } = await this.db
      .from("clients")
      .select("*, profile:profiles(full_name, avatar_url, locale)")
      .eq("id", clientId)
      .single();

    return (data ?? null) as ClientWithProfile | null;
  }

  async updateStatus(input: UpdateClientStatusInput): Promise<void> {
    const { error } = await this.db
      .from("clients")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.clientId);

    if (error) throw new ClientsError(error.message, "update_status_failed");
  }

  async inviteClient(
    coachId: string,
    input: InviteClientInput,
    baseUrl: string
  ): Promise<{ inviteUrl: string; invite: InviteRow }> {
    const { data: coach } = await this.db
      .from("coaches")
      .select("client_limit")
      .eq("id", coachId)
      .single();

    const { count: activeCount } = await this.db
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", coachId)
      .eq("status", "active");

    if (coach && activeCount !== null && activeCount >= (coach as Pick<CoachRow, "client_limit">).client_limit) {
      throw new ClientLimitReachedError();
    }

    const { data: existing } = await this.db
      .from("client_invites")
      .select("id")
      .eq("coach_id", coachId)
      .eq("email", input.email.toLowerCase())
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) throw new InviteAlreadySentError();

    const { data: invite, error } = await this.db
      .from("client_invites")
      .insert({ coach_id: coachId, email: input.email.toLowerCase() })
      .select()
      .single();

    if (error || !invite) throw new ClientsError(error?.message ?? "Insert failed", "invite_create_failed");

    const row = invite as InviteRow;
    const inviteUrl = `${baseUrl}/invite/${row.token}`;
    return { inviteUrl, invite: row };
  }

  async listInvites(coachId: string): Promise<InviteRow[]> {
    const { data, error } = await this.db
      .from("client_invites")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (error) throw new ClientsError(error.message, "list_invites_failed");
    return (data ?? []) as InviteRow[];
  }

  async getInviteByToken(token: string): Promise<InviteRow | null> {
    const { data } = await this.db
      .from("client_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    return (data ?? null) as InviteRow | null;
  }

  async acceptInvite(token: string, newUserId: string): Promise<void> {
    const invite = await this.getInviteByToken(token);
    if (!invite) throw new InvalidInviteTokenError();

    const { error: inviteError } = await this.db
      .from("client_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (inviteError) throw new ClientsError(inviteError.message, "accept_invite_failed");

    const { error: clientError } = await this.db
      .from("clients")
      .insert({
        id: newUserId,
        coach_id: invite.coach_id,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
      });

    if (clientError) throw new ClientsError(clientError.message, "create_client_failed");
  }
}
