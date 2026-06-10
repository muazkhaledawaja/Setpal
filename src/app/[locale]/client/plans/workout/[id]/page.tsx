import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { notFound } from "next/navigation";
import { PlanView } from "./plan-view";

export default async function ClientPlanDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();
  const plan = await new WorkoutsService(supabase).getPlanWithDays(id);
  if (!plan || plan.client_id !== userId) notFound();

  return <PlanView plan={plan} locale={locale} clientId={userId} />;
}
