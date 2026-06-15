"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { FoodsService } from "@/modules/library/foods.service";
import { FOOD_CATEGORIES } from "@/modules/library/foods.schemas";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

type Food = Database["public"]["Tables"]["foods"]["Row"];

const EMPTY = {
  name_en: "", name_ar: "", category: "grains",
  serving_label_en: "", serving_label_ar: "",
  serving_grams: "100", calories: "0", protein_g: "0", carbs_g: "0", fat_g: "0",
};

export function FoodsClient({
  initialFoods, coachId, locale,
}: {
  initialFoods: Food[]; coachId: string; locale: string;
}) {
  const t = useTranslations("foods");
  const [foods, setFoods] = useState(initialFoods);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => foods.filter((f) => {
    const matchesCat = category === "all" || f.category === category;
    const q = search.toLowerCase();
    const matchesSearch = !q || f.name_en.toLowerCase().includes(q) || f.name_ar.includes(search);
    return matchesCat && matchesSearch;
  }), [foods, search, category]);

  async function handleAdd() {
    try {
      const service = new FoodsService(createClient());
      const created = await service.createCustom(coachId, {
        name_en: form.name_en, name_ar: form.name_ar,
        category: form.category as Food["category"],
        serving_label_en: form.serving_label_en || null,
        serving_label_ar: form.serving_label_ar || null,
        serving_grams: Number(form.serving_grams) || 100,
        calories: Number(form.calories) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fat_g: Number(form.fat_g) || 0,
      });
      setFoods((prev) => [...prev, created]);
      setOpen(false);
      setForm(EMPTY);
      toast.success(t("form.save"));
    } catch {
      toast.error("Error");
    }
  }

  const name = (f: Food) => (locale === "ar" ? f.name_ar : f.name_en);
  const serving = (f: Food) => (locale === "ar" ? f.serving_label_ar : f.serving_label_en) ?? `${f.serving_grams}g`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 me-2" />{t("addCustom")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("addCustom")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("form.nameEn")}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                <div><Label>{t("form.nameAr")}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              </div>
              <div>
                <Label>{t("form.category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOOD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("form.servingLabelEn")}</Label><Input value={form.serving_label_en} onChange={(e) => setForm({ ...form, serving_label_en: e.target.value })} /></div>
                <div><Label>{t("form.servingLabelAr")}</Label><Input value={form.serving_label_ar} onChange={(e) => setForm({ ...form, serving_label_ar: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("form.servingGrams")}</Label><Input type="number" value={form.serving_grams} onChange={(e) => setForm({ ...form, serving_grams: e.target.value })} /></div>
                <div><Label>{t("form.calories")}</Label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{t("form.protein")}</Label><Input type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} /></div>
                <div><Label>{t("form.carbs")}</Label><Input type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} /></div>
                <div><Label>{t("form.fat")}</Label><Input type="number" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("form.cancel")}</Button>
              <Button onClick={handleAdd} disabled={!form.name_en || !form.name_ar}>{t("form.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("allCategories")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {FOOD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => (
          <Card key={f.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{name(f)}</p>
              <Badge variant={f.coach_id ? "default" : "secondary"}>{f.coach_id ? t("custom") : t("global")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t(`categories.${f.category}`)} • {serving(f)}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(f.calories)} {t("kcal")} · {t("form.protein")} {f.protein_g}g · {t("form.carbs")} {f.carbs_g}g · {t("form.fat")} {f.fat_g}g
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
