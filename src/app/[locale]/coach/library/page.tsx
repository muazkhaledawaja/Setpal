import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { FoodsService } from "@/modules/library/foods.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExercisesClient } from "./exercises-client";
import { FoodsClient } from "./foods-client";

export default async function CoachLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();

  const [exercises, foods] = await Promise.all([
    new ExercisesService(supabase).listLibrary(userId),
    new FoodsService(supabase).listLibrary(userId),
  ]);

  const t = await getTranslations("library");
  const tf = await getTranslations("foods");

  return (
    <div className="p-6">
      <Tabs defaultValue="exercises">
        <TabsList className="mb-6">
          <TabsTrigger value="exercises">{t("title")}</TabsTrigger>
          <TabsTrigger value="foods">{tf("title")}</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises">
          <ExercisesClient initialExercises={exercises} coachId={userId} locale={locale} />
        </TabsContent>
        <TabsContent value="foods">
          <FoodsClient initialFoods={foods} coachId={userId} locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
