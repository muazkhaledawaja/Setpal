import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ExercisesService } from "@/modules/library/exercises.service";
import { FoodsService } from "@/modules/library/foods.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminExercisesClient } from "./admin-exercises-client";
import { AdminFoodsClient } from "./admin-foods-client";

export default async function AdminLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "admin");
  const supabase = await createClient();

  const [exercises, foods] = await Promise.all([
    new ExercisesService(supabase).listGlobal(),
    new FoodsService(supabase).listGlobal(),
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
          <AdminExercisesClient initialExercises={exercises} locale={locale} />
        </TabsContent>
        <TabsContent value="foods">
          <AdminFoodsClient initialFoods={foods} locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
