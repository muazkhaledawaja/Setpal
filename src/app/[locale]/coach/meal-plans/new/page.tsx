import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { FoodsService } from "@/modules/library/foods.service";
import { MealPlanBuilder } from "../meal-plan-builder";

export default async function NewMealPlanPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { locale } = await params;
  const { client } = await searchParams;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const library = await new FoodsService(supabase).listLibrary(userId);

  return <MealPlanBuilder library={library} coachId={userId} locale={locale} clientId={client ?? null} />;
}
