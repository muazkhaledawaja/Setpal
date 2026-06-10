import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ClientPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.plans");
  const supabase = await createClient();
  const plans = await new WorkoutsService(supabase).listForClient(userId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {plans.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{p.name}</p>
                <Badge variant="secondary">{t("active")}</Badge>
              </div>
              <Button asChild size="sm">
                <Link href={`/client/plans/workout/${p.id}`}>{t("viewDetails")}</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
