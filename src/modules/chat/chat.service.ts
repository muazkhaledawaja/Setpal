/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ChatError } from "./chat.errors";

type DB = Database["public"]["Tables"];
export type ChatMessageRow = DB["chat_messages"]["Row"];
type SB = SupabaseClient<any>;

export class ChatService {
  private db: SB;
  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  // Messages in a thread, oldest-first. RLS ensures the caller is a party to it.
  async listMessages(clientId: string, opts: { limit?: number } = {}): Promise<ChatMessageRow[]> {
    const { data, error } = await this.db
      .from("chat_messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(opts.limit ?? 200);
    if (error) throw new ChatError(error.message, "list_failed");
    return (data ?? []) as ChatMessageRow[];
  }

  async sendMessage(senderId: string, clientId: string, body: string): Promise<ChatMessageRow> {
    const { data, error } = await this.db
      .from("chat_messages")
      .insert({ client_id: clientId, sender_id: senderId, body: body.trim() })
      .select()
      .single();
    if (error || !data) throw new ChatError(error?.message ?? "send failed", "send_failed");
    return data as ChatMessageRow;
  }

  // Mark all messages in the thread not sent by `readerId` as read.
  async markRead(clientId: string, readerId: string): Promise<void> {
    const { error } = await this.db
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("client_id", clientId)
      .neq("sender_id", readerId)
      .is("read_at", null);
    if (error) throw new ChatError(error.message, "mark_read_failed");
  }

  // Count unread messages addressed to `userId`.
  // Coach: across all their clients' threads. Client: their own thread.
  async countUnread(userId: string, isCoach: boolean): Promise<number> {
    let query = this.db
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", userId);
    if (!isCoach) query = query.eq("client_id", userId);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  }
}
