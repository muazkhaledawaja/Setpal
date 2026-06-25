"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { ChatMessageRow } from "@/modules/chat/chat.service";

// Subscribes to inserts on chat_messages for one thread (client_id) and appends
// new rows to local state. First realtime usage in the app.
export function useChatChannel(clientId: string, initial: ChatMessageRow[]) {
  const [messages, setMessages] = useState<ChatMessageRow[]>(initial);
  const seen = useRef<Set<string>>(new Set(initial.map((m) => m.id)));

  function appendLocal(msg: ChatMessageRow) {
    if (seen.current.has(msg.id)) return;
    seen.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `client_id=eq.${clientId}` },
        (payload) => appendLocal(payload.new as ChatMessageRow),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { messages, appendLocal };
}
