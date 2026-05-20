import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService, type LogWithSets } from "@/modules/workout-logs/workout-logs.service";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

type SetRow = LogWithSets["sets"][number];

export default async function WorkoutLogDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.logs");
  const supabase = await createClient();
  const log = await new WorkoutLogsService(supabase).getById(id);
  if (!log || log.client_id !== userId) notFound();

  // group sets by exercise name snapshot
  const byExercise: Record<string, SetRow[]> = {};
  for (const s of log.sets ?? []) {
    (byExercise[s.exercise_name_snapshot] ??= []).push(s);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl">{log.day_name_snapshot}</h1>
      <p className="text-sm text-muted-foreground">{new Date(log.started_at).toLocaleString(locale)}</p>
      {Object.entries(byExercise).map(([name, sets]) => (
        <Card key={name} className="p-4">
          <p className="font-medium mb-2">{name}</p>
          <div className="space-y-1 text-sm">
            {sets.map((s) => (
              <div key={s.id} className="flex gap-4 text-muted-foreground">
                <span>{t("set")} {s.set_number}</span>
                <span>{s.reps ?? "-"} {t("reps")}</span>
                <span>{s.weight ?? "-"} {t("weight")}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
