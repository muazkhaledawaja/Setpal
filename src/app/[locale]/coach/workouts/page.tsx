import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CoachWorkoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");
  const t = await getTranslations("workouts");
  const supabase = await createClient();
  const plans = await new WorkoutsService(supabase).listForCoach(userId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild><Link href="/coach/workouts/new">{t("newPlan")}</Link></Button>
      </div>
      {plans.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="p-4">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {p.client_id ? t("assignedTo") : t("unassigned")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
