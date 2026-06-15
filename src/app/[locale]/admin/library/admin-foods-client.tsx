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
import { Plus, Pencil, Trash2 } from "lucide-react";

type Food = Database["public"]["Tables"]["foods"]["Row"];

const EMPTY_FORM = {
  name_en: "", name_ar: "", category: "grains",
  serving_label_en: "", serving_label_ar: "",
  serving_grams: "100", calories: "0", protein_g: "0", carbs_g: "0", fat_g: "0",
};
type FoodForm = typeof EMPTY_FORM;

function toInput(f: FoodForm) {
  return {
    name_en: f.name_en, name_ar: f.name_ar, category: f.category as Food["category"],
    serving_label_en: f.serving_label_en || null, serving_label_ar: f.serving_label_ar || null,
    serving_grams: Number(f.serving_grams) || 100, calories: Number(f.calories) || 0,
    protein_g: Number(f.protein_g) || 0, carbs_g: Number(f.carbs_g) || 0, fat_g: Number(f.fat_g) || 0,
  };
}

function FormFields({ form, set, t }: { form: FoodForm; set: (f: FoodForm) => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("form.nameEn")}</Label><Input value={form.name_en} onChange={(e) => set({ ...form, name_en: e.target.value })} /></div>
        <div><Label>{t("form.nameAr")}</Label><Input value={form.name_ar} onChange={(e) => set({ ...form, name_ar: e.target.value })} /></div>
      </div>
      <div>
        <Label>{t("form.category")}</Label>
        <Select value={form.category} onValueChange={(v) => set({ ...form, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FOOD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("form.servingLabelEn")}</Label><Input value={form.serving_label_en} onChange={(e) => set({ ...form, serving_label_en: e.target.value })} /></div>
        <div><Label>{t("form.servingLabelAr")}</Label><Input value={form.serving_label_ar} onChange={(e) => set({ ...form, serving_label_ar: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("form.servingGrams")}</Label><Input type="number" value={form.serving_grams} onChange={(e) => set({ ...form, serving_grams: e.target.value })} /></div>
        <div><Label>{t("form.calories")}</Label><Input type="number" value={form.calories} onChange={(e) => set({ ...form, calories: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>{t("form.protein")}</Label><Input type="number" value={form.protein_g} onChange={(e) => set({ ...form, protein_g: e.target.value })} /></div>
        <div><Label>{t("form.carbs")}</Label><Input type="number" value={form.carbs_g} onChange={(e) => set({ ...form, carbs_g: e.target.value })} /></div>
        <div><Label>{t("form.fat")}</Label><Input type="number" value={form.fat_g} onChange={(e) => set({ ...form, fat_g: e.target.value })} /></div>
      </div>
    </div>
  );
}

export function AdminFoodsClient({ initialFoods, locale }: { initialFoods: Food[]; locale: string }) {
  const t = useTranslations("foods");
  const [foods, setFoods] = useState(initialFoods);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Food | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const filtered = useMemo(() => foods.filter((f) => {
    const matchesCat = category === "all" || f.category === category;
    const q = search.toLowerCase();
    const matchesSearch = !q || f.name_en.toLowerCase().includes(q) || f.name_ar.includes(search);
    return matchesCat && matchesSearch;
  }), [foods, search, category]);

  const name = (f: Food) => (locale === "ar" ? f.name_ar : f.name_en);

  async function handleAdd() {
    try {
      const created = await new FoodsService(createClient()).createGlobal(toInput(addForm));
      setFoods((prev) => [...prev, created]);
      setAddOpen(false); setAddForm(EMPTY_FORM);
      toast.success(t("form.save"));
    } catch { toast.error("Error"); }
  }

  function openEdit(f: Food) {
    setEditTarget(f);
    setEditForm({
      name_en: f.name_en, name_ar: f.name_ar, category: f.category,
      serving_label_en: f.serving_label_en ?? "", serving_label_ar: f.serving_label_ar ?? "",
      serving_grams: String(f.serving_grams), calories: String(f.calories),
      protein_g: String(f.protein_g), carbs_g: String(f.carbs_g), fat_g: String(f.fat_g),
    });
  }

  async function handleEdit() {
    if (!editTarget) return;
    try {
      const input = toInput(editForm);
      await new FoodsService(createClient()).update({ id: editTarget.id, ...input });
      setFoods((prev) => prev.map((f) => (f.id === editTarget.id ? { ...f, ...input } : f)));
      setEditTarget(null);
      toast.success(t("form.save"));
    } catch { toast.error("Error"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await new FoodsService(createClient()).delete(deleteTarget.id);
      setFoods((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { toast.error("Error"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">{t("adminTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminSubtitle")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 me-2" />{t("addGlobal")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("addGlobal")}</DialogTitle></DialogHeader>
            <FormFields form={addForm} set={setAddForm} t={t} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{t("form.cancel")}</Button>
              <Button onClick={handleAdd} disabled={!addForm.name_en || !addForm.name_ar}>{t("form.save")}</Button>
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
          <Card key={f.id} className="p-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{name(f)}</p>
              <p className="text-xs text-muted-foreground">{t(`categories.${f.category}`)} • {Math.round(f.calories)} {t("kcal")}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="secondary">{t("global")}</Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(f)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("edit")}</DialogTitle></DialogHeader>
          <FormFields form={editForm} set={setEditForm} t={t} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t("form.cancel")}</Button>
            <Button onClick={handleEdit} disabled={!editForm.name_en || !editForm.name_ar}>{t("form.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("delete")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("deleteConfirm")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("form.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
