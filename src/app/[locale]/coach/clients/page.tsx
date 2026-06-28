import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { ClientsScreen, type ClientRow } from "@/components/coach/clients-screen";

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Stable illustrative adherence — see coach/page.tsx for rationale. */
function illustrativeAdherence(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 45 + (h % 56);
}

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("coach");

  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new ClientsService(supabase);
  const clients = await service.listForCoach(userId);

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.profile?.full_name ?? t("coach"),
    initials: initialsOf(c.profile?.full_name),
    status: c.status,
    startDate: c.start_date,
    adherence: c.status === "ended" ? 0 : illustrativeAdherence(c.id),
  }));

  return <ClientsScreen clients={rows} locale={locale} />;
}
