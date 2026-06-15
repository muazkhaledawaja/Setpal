"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { ExercisesService } from "@/modules/library/exercises.service";
import { MUSCLE_GROUPS } from "@/modules/library/exercises.schemas";
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

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export function ExercisesClient({
  initialExercises, coachId, locale,
}: {
  initialExercises: Exercise[]; coachId: string; locale: string;
}) {
  const t = useTranslations("library");
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name_en: "", name_ar: "", muscle_group: "chest", equipment: "", video_url: "" });

  const filtered = useMemo(() => exercises.filter((e) => {
    const matchesGroup = group === "all" || e.muscle_group === group;
    const q = search.toLowerCase();
    const matchesSearch = !q || e.name_en.toLowerCase().includes(q) || e.name_ar.includes(search);
    return matchesGroup && matchesSearch;
  }), [exercises, search, group]);

  async function handleAdd() {
    try {
      const service = new ExercisesService(createClient());
      const created = await service.createCustom(coachId, {
        name_en: form.name_en, name_ar: form.name_ar,
        muscle_group: form.muscle_group as Exercise["muscle_group"],
        equipment: form.equipment || null, video_url: form.video_url || null,
        thumbnail_url: null,
      });
      setExercises((prev) => [...prev, created]);
      setOpen(false);
      setForm({ name_en: "", name_ar: "", muscle_group: "chest", equipment: "", video_url: "" });
      toast.success(t("form.save"));
    } catch {
      toast.error("Error");
    }
  }

  const name = (e: Exercise) => (locale === "ar" ? e.name_ar : e.name_en);

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
              <div><Label>{t("form.nameEn")}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>{t("form.nameAr")}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div>
                <Label>{t("form.muscleGroup")}</Label>
                <Select value={form.muscle_group} onValueChange={(v) => setForm({ ...form, muscle_group: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{t(`groups.${g}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("form.equipment")}</Label><Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></div>
              <div><Label>{t("form.videoUrl")}</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
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
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("allGroups")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGroups")}</SelectItem>
            {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{t(`groups.${g}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <Card key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{name(e)}</p>
              <p className="text-xs text-muted-foreground">{t(`groups.${e.muscle_group}`)}{e.equipment ? ` • ${e.equipment}` : ""}</p>
            </div>
            <Badge variant={e.coach_id ? "default" : "secondary"}>{e.coach_id ? t("custom") : t("global")}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
