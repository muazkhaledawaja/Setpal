import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { PlanBuilder } from "../plan-builder";

export default async function NewWorkoutPlanPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { locale } = await params;
  const { client } = await searchParams;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const library = await new ExercisesService(supabase).listLibrary(userId);

  return <PlanBuilder library={library} coachId={userId} locale={locale} clientId={client ?? null} />;
}
