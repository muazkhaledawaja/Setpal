import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { notFound } from "next/navigation";
import { SessionLogger } from "./session-logger";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ locale: string; logId: string }>;
}) {
  const { locale, logId } = await params;
  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();

  const log = await new WorkoutLogsService(supabase).getById(logId);
  if (!log || log.client_id !== userId) notFound();

  const plan = log.plan_id ? await new WorkoutsService(supabase).getPlanWithDays(log.plan_id) : null;
  const day = plan?.days?.find((d) => d.id === log.day_id) ?? null;

  return <SessionLogger log={log} day={day} locale={locale} />;
}
