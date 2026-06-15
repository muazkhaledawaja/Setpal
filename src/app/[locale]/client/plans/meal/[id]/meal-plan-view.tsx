"use client";

import { useTranslations } from "next-intl";
import type { MealPlanWithDays } from "@/modules/meal-plans/meal-plans.types";
import { mealMacros, dayMacros, itemMacros, roundMacros } from "@/modules/meal-plans/macros";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function MealPlanView({ plan, locale }: { plan: MealPlanWithDays; locale: string }) {
  const t = useTranslations("mealPlans");
  const ar = locale === "ar";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">{plan.name}</h1>
          {(ar ? plan.description_ar : plan.description_en) && (
            <p className="text-sm text-muted-foreground">{ar ? plan.description_ar : plan.description_en}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/pdf/meal/${plan.id}?locale=${locale}`} target="_blank" rel="noopener noreferrer">
            <Download className="size-4 me-2" />{t("downloadPdf")}
          </a>
        </Button>
      </div>

      {plan.days.map((day) => {
        const dt = roundMacros(dayMacros(day));
        return (
          <Card key={day.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{day.name}</h2>
              <span className="text-xs text-muted-foreground">{dt.calories} {t("kcal")} · P{dt.protein_g} C{dt.carbs_g} F{dt.fat_g}</span>
            </div>
            {day.meals.map((meal) => {
              const mt = roundMacros(mealMacros(meal));
              return (
                <div key={meal.id} className="rounded-md border border-border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {ar ? meal.name_ar : meal.name_en}
                      {meal.time_label ? <span className="text-muted-foreground ms-2">{meal.time_label}</span> : null}
                    </p>
                    <span className="text-xs text-muted-foreground">{mt.calories} {t("kcal")}</span>
                  </div>
                  <ul className="text-sm space-y-0.5">
                    {meal.items.map((it) => {
                      const food = it.food;
                      const im = food ? roundMacros(itemMacros(food, it.quantity_grams)) : null;
                      return (
                        <li key={it.id} className="flex justify-between gap-2">
                          <span>{food ? (ar ? food.name_ar : food.name_en) : "—"} · {it.quantity_grams}{t("g")}</span>
                          {im && <span className="text-muted-foreground shrink-0">{im.calories} {t("kcal")}</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {meal.notes && <p className="text-xs text-muted-foreground">{meal.notes}</p>}
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}
