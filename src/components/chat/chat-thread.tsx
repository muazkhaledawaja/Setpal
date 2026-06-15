"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/browser";
import { ChatService, type ChatMessageRow } from "@/modules/chat/chat.service";
import { useChatChannel } from "@/lib/realtime/use-chat-channel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

export function ChatThread({
  clientId, currentUserId, initialMessages,
}: {
  clientId: string; currentUserId: string; initialMessages: ChatMessageRow[];
}) {
  const t = useTranslations("chat");
  const { messages, appendLocal } = useChatChannel(clientId, initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // mark incoming messages read on open
    new ChatService(createClient()).markRead(clientId, currentUserId).catch(() => {});
  }, [clientId, currentUserId]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const msg = await new ChatService(createClient()).sendMessage(currentUserId, clientId, body);
      appendLocal(msg); // optimistic-ish; realtime echo is de-duped by id
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[60vh] border border-border rounded-lg bg-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">{t("empty")}</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-border">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={t("placeholder")}
        />
        <Button size="icon" onClick={send} disabled={sending || !draft.trim()} aria-label={t("send")}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
