"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { MealPlansService } from "@/modules/meal-plans/meal-plans.service";
import { itemMacros, addMacros, EMPTY_MACROS, roundMacros, type Macros } from "@/modules/meal-plans/macros";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

type Food = Database["public"]["Tables"]["foods"]["Row"];

interface Item { food_id: string; quantity_grams: number; notes: string | null; }
interface Meal { name_ar: string; name_en: string; time_label: string | null; notes: string | null; items: Item[]; }
interface Day { name: string; meals: Meal[]; }

export function MealPlanBuilder({
  library, coachId, locale, clientId,
}: {
  library: Food[]; coachId: string; locale: string; clientId: string | null;
}) {
  const t = useTranslations("mealPlansBuilder");
  const router = useRouter();
  const [name, setName] = useState("");
  const [days, setDays] = useState<Day[]>([{ name: "Day 1", meals: [] }]);
  const [saving, setSaving] = useState(false);

  const foodName = (f: Food) => (locale === "ar" ? f.name_ar : f.name_en);
  const foodById = (id: string) => library.find((f) => f.id === id);

  function setDay(i: number, patch: Partial<Day>) {
    setDays(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addDay() { setDays([...days, { name: `Day ${days.length + 1}`, meals: [] }]); }
  function removeDay(i: number) { setDays(days.filter((_, idx) => idx !== i)); }

  function addMeal(di: number) {
    const d = days[di];
    setDay(di, { meals: [...d.meals, { name_ar: "وجبة", name_en: "Meal", time_label: null, notes: null, items: [] }] });
  }
  function setMeal(di: number, mi: number, patch: Partial<Meal>) {
    const d = days[di];
    setDay(di, { meals: d.meals.map((m, idx) => (idx === mi ? { ...m, ...patch } : m)) });
  }
  function removeMeal(di: number, mi: number) {
    const d = days[di];
    setDay(di, { meals: d.meals.filter((_, idx) => idx !== mi) });
  }

  function addItem(di: number, mi: number) {
    const first = library[0];
    if (!first) return;
    const m = days[di].meals[mi];
    setMeal(di, mi, { items: [...m.items, { food_id: first.id, quantity_grams: first.serving_grams, notes: null }] });
  }
  function setItem(di: number, mi: number, ii: number, patch: Partial<Item>) {
    const m = days[di].meals[mi];
    setMeal(di, mi, { items: m.items.map((it, idx) => (idx === ii ? { ...it, ...patch } : it)) });
  }
  function removeItem(di: number, mi: number, ii: number) {
    const m = days[di].meals[mi];
    setMeal(di, mi, { items: m.items.filter((_, idx) => idx !== ii) });
  }

  function mealTotals(m: Meal): Macros {
    return m.items.reduce<Macros>((acc, it) => {
      const f = foodById(it.food_id);
      return f ? addMacros(acc, itemMacros(f, it.quantity_grams)) : acc;
    }, { ...EMPTY_MACROS });
  }
  function dayTotals(d: Day): Macros {
    return d.meals.reduce<Macros>((acc, m) => addMacros(acc, mealTotals(m)), { ...EMPTY_MACROS });
  }

  async function save() {
    setSaving(true);
    try {
      const service = new MealPlansService(createClient());
      await service.createPlan(coachId, {
        name, client_id: clientId, description_ar: null, description_en: null, daily_calorie_target: null,
        days: days.map((d) => ({
          name: d.name,
          meals: d.meals.map((m) => ({
            name_ar: m.name_ar, name_en: m.name_en, time_label: m.time_label, notes: m.notes,
            items: m.items.map((it) => ({ food_id: it.food_id, quantity_grams: it.quantity_grams, notes: it.notes })),
          })),
        })),
      });
      toast.success(t("saved"));
      router.push(clientId ? `/coach/clients/${clientId}` : "/coach/meal-plans");
    } catch {
      toast.error("Error");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Label>{t("planName")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {days.map((day, di) => {
        const dt = roundMacros(dayTotals(day));
        return (
          <Card key={di} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Input value={day.name} onChange={(e) => setDay(di, { name: e.target.value })} className="max-w-xs" />
              <span className="text-xs text-muted-foreground">{dt.calories} {t("kcal")}</span>
              <Button variant="ghost" size="icon" className="ms-auto" onClick={() => removeDay(di)}><Trash2 className="size-4" /></Button>
            </div>

            {day.meals.map((meal, mi) => {
              const mt = roundMacros(mealTotals(meal));
              return (
                <Card key={mi} className="p-3 space-y-2 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Input value={locale === "ar" ? meal.name_ar : meal.name_en}
                      onChange={(e) => setMeal(di, mi, locale === "ar" ? { name_ar: e.target.value } : { name_en: e.target.value })}
                      className="max-w-[12rem]" placeholder={t("mealName")} />
                    <Input value={meal.time_label ?? ""} onChange={(e) => setMeal(di, mi, { time_label: e.target.value })} className="w-24" placeholder={t("time")} />
                    <span className="text-xs text-muted-foreground ms-auto">{mt.calories} {t("kcal")} · P{mt.protein_g} C{mt.carbs_g} F{mt.fat_g}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeMeal(di, mi)}><Trash2 className="size-4" /></Button>
                  </div>

                  {meal.items.map((it, ii) => (
                    <div key={ii} className="flex items-center gap-2 flex-wrap">
                      <Select value={it.food_id} onValueChange={(v) => setItem(di, mi, ii, { food_id: v })}>
                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {library.map((f) => <SelectItem key={f.id} value={f.id}>{foodName(f)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" className="w-24" value={it.quantity_grams}
                        onChange={(e) => setItem(di, mi, ii, { quantity_grams: Number(e.target.value) })} placeholder={t("grams")} />
                      <span className="text-xs text-muted-foreground">{t("grams")}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(di, mi, ii)}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addItem(di, mi)}><Plus className="size-4 me-2" />{t("addFood")}</Button>
                </Card>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => addMeal(di)}><Plus className="size-4 me-2" />{t("addMeal")}</Button>
          </Card>
        );
      })}

      <div className="flex gap-3">
        <Button variant="outline" onClick={addDay}><Plus className="size-4 me-2" />{t("addDay")}</Button>
        <Button onClick={save} disabled={saving || !name || days.length === 0}>{t("save")}</Button>
      </div>
    </div>
  );
}
