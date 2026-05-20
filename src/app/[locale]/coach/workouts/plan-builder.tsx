"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutsService } from "@/modules/workouts/workouts.service";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface DayEx { exercise_id: string; sets: number; rep_range: string; rest_seconds: number | null; notes: string | null; }
interface Day { name: string; is_rest: boolean; exercises: DayEx[]; }

export function PlanBuilder({
  library, coachId, locale, clientId,
}: {
  library: Exercise[]; coachId: string; locale: string; clientId: string | null;
}) {
  const t = useTranslations("workouts.builder");
  const router = useRouter();
  const [name, setName] = useState("");
  const [days, setDays] = useState<Day[]>([{ name: "Day 1", is_rest: false, exercises: [] }]);
  const [saving, setSaving] = useState(false);

  const exName = (e: Exercise) => (locale === "ar" ? e.name_ar : e.name_en);

  function addDay() { setDays([...days, { name: `Day ${days.length + 1}`, is_rest: false, exercises: [] }]); }
  function removeDay(i: number) { setDays(days.filter((_, idx) => idx !== i)); }
  function updateDay(i: number, patch: Partial<Day>) {
    setDays(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addExercise(dayIdx: number) {
    const first = library[0];
    if (!first) return;
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: [...d.exercises, { exercise_id: first.id, sets: 3, rep_range: "8-12", rest_seconds: 60, notes: null }] });
  }
  function updateExercise(dayIdx: number, exIdx: number, patch: Partial<DayEx>) {
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: d.exercises.map((e, idx) => (idx === exIdx ? { ...e, ...patch } : e)) });
  }
  function removeExercise(dayIdx: number, exIdx: number) {
    const d = days[dayIdx];
    updateDay(dayIdx, { exercises: d.exercises.filter((_, idx) => idx !== exIdx) });
  }

  async function save() {
    setSaving(true);
    try {
      const service = new WorkoutsService(createClient());
      await service.createPlan(coachId, {
        name, client_id: clientId, description_ar: null, description_en: null,
        days: days.map((d) => ({ name: d.name, is_rest: d.is_rest, exercises: d.is_rest ? [] : d.exercises })),
      });
      toast.success(t("saved"));
      router.push(clientId ? `/coach/clients/${clientId}` : "/coach/workouts");
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

      {days.map((day, di) => (
        <Card key={di} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Input value={day.name} onChange={(e) => updateDay(di, { name: e.target.value })} className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={day.is_rest} onCheckedChange={(v) => updateDay(di, { is_rest: !!v })} />
              {t("restDay")}
            </label>
            <Button variant="ghost" size="icon" className="ms-auto" onClick={() => removeDay(di)}><Trash2 className="size-4" /></Button>
          </div>

          {!day.is_rest && (
            <div className="space-y-2">
              {day.exercises.map((ex, ei) => (
                <div key={ei} className="flex items-center gap-2 flex-wrap">
                  <Select value={ex.exercise_id} onValueChange={(v) => updateExercise(di, ei, { exercise_id: v })}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {library.map((l) => <SelectItem key={l.id} value={l.id}>{exName(l)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" className="w-20" value={ex.sets} onChange={(e) => updateExercise(di, ei, { sets: Number(e.target.value) })} placeholder={t("sets")} />
                  <Input className="w-24" value={ex.rep_range} onChange={(e) => updateExercise(di, ei, { rep_range: e.target.value })} placeholder={t("reps")} />
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(di, ei)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addExercise(di)}><Plus className="size-4 me-2" />{t("addExercise")}</Button>
            </div>
          )}
        </Card>
      ))}

      <div className="flex gap-3">
        <Button variant="outline" onClick={addDay}><Plus className="size-4 me-2" />{t("addDay")}</Button>
        <Button onClick={save} disabled={saving || !name || days.length === 0}>{t("save")}</Button>
      </div>
    </div>
  );
}
