import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { MealPlansService } from "@/modules/meal-plans/meal-plans.service";
import { notFound } from "next/navigation";
import { MealPlanView } from "./meal-plan-view";

export default async function ClientMealPlanDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();
  const plan = await new MealPlansService(supabase).getPlanWithDays(id);
  if (!plan || plan.client_id !== userId) notFound();

  return <MealPlanView plan={plan} locale={locale} />;
}
