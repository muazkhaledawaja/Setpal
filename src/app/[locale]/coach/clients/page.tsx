import { getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";

const STATUS_STYLES = {
  active: "bg-success text-success-foreground",
  paused: "bg-warning text-warning-foreground",
  ended: "bg-muted text-muted-foreground",
} as const;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">{t("clients.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("clients.subtitle", { count: clients.length })}
          </p>
        </div>
        <Button asChild>
          <Link href="/coach/clients/invite">
            <UserPlus className="size-4 me-2" />
            {t("clients.invite")}
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg bg-card">
          <UserPlus className="size-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">{t("clients.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("clients.empty.subtitle")}</p>
          <Button asChild className="mt-4">
            <Link href="/coach/clients/invite">{t("clients.invite")}</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t("clients.table.name")}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t("clients.table.status")}</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t("clients.table.startDate")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const initials = client.profile?.full_name
                  ? client.profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?";

                return (
                  <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={client.profile?.avatar_url ?? ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{client.profile?.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                        {t(`clients.status.${client.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(client.start_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/coach/clients/${client.id}`}>{t("clients.table.view")}</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
