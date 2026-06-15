import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { AdminExercisesClient } from "./admin-exercises-client";

export default async function AdminLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "admin");
  const supabase = await createClient();
  const exercises = await new ExercisesService(supabase).listGlobal();

  return <AdminExercisesClient initialExercises={exercises} locale={locale} />;
}
