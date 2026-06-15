import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/modules/chat/chat.service";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function ClientChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("chat");
  const supabase = await createClient();
  // Client thread is keyed by their own profile id.
  const messages = await new ChatService(supabase).listMessages(userId);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ChatThread clientId={userId} currentUserId={userId} initialMessages={messages} />
    </div>
  );
}
