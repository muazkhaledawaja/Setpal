import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import { MealPlansService } from "@/modules/meal-plans/meal-plans.service";
import { registerPdfFonts } from "@/lib/pdf/register-fonts";
import { WorkoutPlanDocument, MealPlanDocument } from "@/lib/pdf/PlanDocument";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";

  const supabase = await createClient();
  // RLS scopes visibility: a user can only fetch plans they own or are assigned.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  registerPdfFonts();

  let doc: ReactElement<DocumentProps>;
  let filename: string;

  if (type === "workout") {
    const plan = await new WorkoutsService(supabase).getPlanWithDays(id);
    if (!plan) return new Response("Not found", { status: 404 });
    doc = WorkoutPlanDocument({ plan, locale, brand: "Setpal" });
    filename = `workout-${id}.pdf`;
  } else if (type === "meal") {
    const plan = await new MealPlansService(supabase).getPlanWithDays(id);
    if (!plan) return new Response("Not found", { status: 404 });
    doc = MealPlanDocument({ plan, locale, brand: "Setpal" });
    filename = `meal-plan-${id}.pdf`;
  } else {
    return new Response("Bad request", { status: 400 });
  }

  const stream = await renderToStream(doc);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
