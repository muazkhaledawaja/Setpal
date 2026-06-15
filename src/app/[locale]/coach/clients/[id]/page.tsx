import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { MealPlansService } from "@/modules/meal-plans/meal-plans.service";
import { ChatService } from "@/modules/chat/chat.service";
import { ClientTabs } from "./client-tabs";

const STATUS_STYLES = {
  active: "bg-success text-success-foreground",
  paused: "bg-warning text-warning-foreground",
  ended: "bg-muted text-muted-foreground",
} as const;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("coach");

  const { userId: coachId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new ClientsService(supabase);
  const client = await service.getById(id);

  if (!client) notFound();

  const [assignedPlans, assignedMealPlans, chatMessages] = await Promise.all([
    new WorkoutsService(supabase).listForClient(id),
    new MealPlansService(supabase).listForClient(id),
    new ChatService(supabase).listMessages(id),
  ]);

  const initials = client.profile?.full_name
    ? client.profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const joinDate = new Date(client.start_date).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/coach/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {t("clients.backToClients")}
        </Link>

        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={client.profile?.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-serif font-semibold">
              {client.profile?.full_name ?? "—"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                {t(`clients.status.${client.status}`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("clients.detail.joinedOn", { date: joinDate })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ClientTabs
        clientId={id}
        coachId={coachId}
        locale={locale}
        status={client.status}
        assignedPlans={assignedPlans}
        assignedMealPlans={assignedMealPlans}
        chatMessages={chatMessages}
      />
    </div>
  );
}
