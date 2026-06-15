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
import { Plus, Pencil, Trash2 } from "lucide-react";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

const EMPTY_FORM = { name_en: "", name_ar: "", muscle_group: "chest", equipment: "", video_url: "" };
type ExerciseForm = typeof EMPTY_FORM;

function FormFields({
  form, set, t,
}: {
  form: ExerciseForm;
  set: (f: ExerciseForm) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-3">
      <div><Label>{t("form.nameEn")}</Label><Input value={form.name_en} onChange={(e) => set({ ...form, name_en: e.target.value })} /></div>
      <div><Label>{t("form.nameAr")}</Label><Input value={form.name_ar} onChange={(e) => set({ ...form, name_ar: e.target.value })} /></div>
      <div>
        <Label>{t("form.muscleGroup")}</Label>
        <Select value={form.muscle_group} onValueChange={(v) => set({ ...form, muscle_group: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((g) => <SelectItem key={g} value={g}>{t(`groups.${g}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>{t("form.equipment")}</Label><Input value={form.equipment} onChange={(e) => set({ ...form, equipment: e.target.value })} /></div>
      <div><Label>{t("form.videoUrl")}</Label><Input value={form.video_url} onChange={(e) => set({ ...form, video_url: e.target.value })} /></div>
    </div>
  );
}

export function AdminExercisesClient({
  initialExercises, locale,
}: {
  initialExercises: Exercise[]; locale: string;
}) {
  const t = useTranslations("library");
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const filtered = useMemo(() => exercises.filter((e) => {
    const matchesGroup = group === "all" || e.muscle_group === group;
    const q = search.toLowerCase();
    const matchesSearch = !q || e.name_en.toLowerCase().includes(q) || e.name_ar.includes(search);
    return matchesGroup && matchesSearch;
  }), [exercises, search, group]);

  const name = (e: Exercise) => (locale === "ar" ? e.name_ar : e.name_en);

  async function handleAdd() {
    try {
      const service = new ExercisesService(createClient());
      const created = await service.createGlobal({
        name_en: addForm.name_en, name_ar: addForm.name_ar,
        muscle_group: addForm.muscle_group as Exercise["muscle_group"],
        equipment: addForm.equipment || null, video_url: addForm.video_url || null,
        thumbnail_url: null,
      });
      setExercises((prev) => [...prev, created]);
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
      toast.success(t("saved"));
    } catch {
      toast.error("Error");
    }
  }

  function openEdit(e: Exercise) {
    setEditTarget(e);
    setEditForm({
      name_en: e.name_en, name_ar: e.name_ar,
      muscle_group: e.muscle_group, equipment: e.equipment ?? "", video_url: e.video_url ?? "",
    });
  }

  async function handleEdit() {
    if (!editTarget) return;
    try {
      const service = new ExercisesService(createClient());
      await service.update({
        id: editTarget.id,
        name_en: editForm.name_en, name_ar: editForm.name_ar,
        muscle_group: editForm.muscle_group as Exercise["muscle_group"],
        equipment: editForm.equipment || null, video_url: editForm.video_url || null,
      });
      setExercises((prev) => prev.map((e) =>
        e.id === editTarget.id
          ? { ...e, name_en: editForm.name_en, name_ar: editForm.name_ar,
              muscle_group: editForm.muscle_group as Exercise["muscle_group"],
              equipment: editForm.equipment || null, video_url: editForm.video_url || null }
          : e
      ));
      setEditTarget(null);
      toast.success(t("saved"));
    } catch {
      toast.error("Error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const service = new ExercisesService(createClient());
      await service.delete(deleteTarget.id);
      setExercises((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("deleted"));
    } catch {
      toast.error("Error");
    }
  }

  return (
    <div className="p-6 space-y-6">
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
          <Card key={e.id} className="p-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{name(e)}</p>
              <p className="text-xs text-muted-foreground">{t(`groups.${e.muscle_group}`)}{e.equipment ? ` • ${e.equipment}` : ""}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="secondary">{t("global")}</Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(e)} aria-label={t("editExercise")}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(e)} aria-label={t("deleteExercise")}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("editExercise")}</DialogTitle></DialogHeader>
          <FormFields form={editForm} set={setEditForm} t={t} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t("form.cancel")}</Button>
            <Button onClick={handleEdit} disabled={!editForm.name_en || !editForm.name_ar}>{t("form.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("deleteExercise")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deleteConfirm", { name: deleteTarget ? name(deleteTarget) : "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("form.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("deleteExercise")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
