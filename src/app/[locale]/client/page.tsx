import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { FormsService } from "@/modules/forms";
import { ClientsService } from "@/modules/clients/clients.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, ClipboardList } from "lucide-react";
import { MyCoachCard } from "@/components/client/my-coach-card";

export default async function ClientOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, profile } = await requireRole(locale, "client");
  const t = await getTranslations("client.overview");
  const supabase = await createClient();
  const [plans, pendingForms, coach] = await Promise.all([
    new WorkoutsService(supabase).listForClient(userId).catch(() => [] as never[]),
    new FormsService(supabase).countPendingForms(userId).catch(() => 0),
    new ClientsService(supabase).getMyCoach(userId).catch(() => null),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("welcome", { name: profile.full_name ?? "" })}</h1>
        <p className="text-sm text-muted-foreground">{t("portal")}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <Dumbbell className="size-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">{t("activeWorkoutPlans")}</p>
          <p className="text-3xl font-semibold">{plans.length}</p>
          <Button asChild variant="link" className="px-0 mt-1">
            <Link href="/client/plans">{t("viewPlans")}</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <ClipboardList className="size-5 text-warning mb-2" />
          <p className="text-sm text-muted-foreground">{t("pendingForms")}</p>
          <p className="text-3xl font-semibold">{pendingForms}</p>
          <Button asChild variant="link" className="px-0 mt-1">
            <Link href="/client/forms">{t("viewForms")}</Link>
          </Button>
        </Card>

        <MyCoachCard coach={coach} />
      </div>

      <div>
        <h2 className="text-lg mb-3">{t("recentActivity")}</h2>
        {plans.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
        ) : (
          <div className="space-y-2">
            {plans.slice(0, 5).map((p) => (
              <Card key={p.id} className="p-3">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{t("planAssigned")}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
