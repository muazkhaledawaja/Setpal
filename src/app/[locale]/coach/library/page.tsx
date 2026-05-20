import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { ExercisesClient } from "./exercises-client";

export default async function CoachLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new ExercisesService(supabase);
  const exercises = await service.listLibrary(userId);

  return <ExercisesClient initialExercises={exercises} coachId={userId} locale={locale} />;
}
