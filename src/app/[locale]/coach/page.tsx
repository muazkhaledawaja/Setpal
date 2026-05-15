import { getTranslations } from "next-intl/server";
import { Users, ClipboardCheck, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function CoachDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("coach");

  const { userId, coachData } = await requireRole(locale, "coach");

  const supabase = await createClient();

  const [{ count: activeClients }] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", userId)
      .eq("status", "active"),
  ]);

  const pendingCheckIns = 0;

  const trialDaysLeft = daysUntil(coachData?.trial_ends_at ?? null);
  const tier = coachData?.subscription_tier ?? "trial";

  const subscriptionLabel =
    tier === "trial" && trialDaysLeft !== null
      ? t("subscription.trial", { days: trialDaysLeft })
      : t(`subscription.${tier}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.activeClients")}
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.pendingCheckIns")}
            </CardTitle>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCheckIns ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.subscription")}
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{subscriptionLabel}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
