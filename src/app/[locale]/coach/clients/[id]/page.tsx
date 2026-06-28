import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { MealPlansService } from "@/modules/meal-plans/meal-plans.service";
import { ChatService } from "@/modules/chat/chat.service";
import { HeroBand } from "@/components/command";
import { ClientTabs } from "./client-tabs";

const STATUS_PILL = {
  active: "bg-[rgba(120,200,150,0.22)] text-[#cfeedd]",
  paused: "bg-[rgba(240,200,120,0.22)] text-[#f3e2c0]",
  ended: "bg-[rgba(250,243,230,0.16)] text-[rgba(250,243,230,0.75)]",
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
    <div className="-m-6 pb-6">
      <HeroBand
        avatar={initials}
        title={client.profile?.full_name ?? "—"}
        topSlot={
          <Link
            href="/coach/clients"
            className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-[rgba(250,243,230,0.78)] transition-colors hover:text-[var(--brand-cream)]"
          >
            <ChevronLeft className="size-[15px] rtl:rotate-180" />
            {t("clients.backToClients")}
          </Link>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-md px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_PILL[client.status]}`}
            >
              {t(`clients.status.${client.status}`)}
            </span>
            <span>{t("clients.detail.joinedOn", { date: joinDate })}</span>
          </span>
        }
      />

      <div className="px-6 pt-6">
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
    </div>
  );
}
