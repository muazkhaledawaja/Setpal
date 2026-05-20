import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientWorkoutLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.logs");
  const supabase = await createClient();
  const logs = await new WorkoutLogsService(supabase).listForClient(userId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {logs.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Link key={l.id} href={`/client/workout-logs/${l.id}`}>
              <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{l.day_name_snapshot}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.started_at).toLocaleDateString(locale)}</p>
                </div>
                <Badge variant={l.status === "completed" ? "default" : "secondary"}>
                  {l.status === "completed" ? t("completed") : t("inProgress")}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
