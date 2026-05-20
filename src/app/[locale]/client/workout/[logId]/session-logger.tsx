"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import type { DayWithExercises } from "@/modules/workouts/workouts.types";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Log = Database["public"]["Tables"]["workout_logs"]["Row"];

export function SessionLogger({ log, day, locale }: { log: Log; day: DayWithExercises | null; locale: string; }) {
  const t = useTranslations("client.session");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // track per-set values keyed by `${exerciseId}-${setNumber}`
  const [values, setValues] = useState<Record<string, { reps: string; weight: string; done: boolean }>>({});

  function key(exId: string, setNum: number) { return `${exId}-${setNum}`; }

  async function logSet(exId: string, exName: string, setNum: number) {
    const k = key(exId, setNum);
    const v = values[k] ?? { reps: "", weight: "", done: false };
    try {
      await new WorkoutLogsService(createClient()).logSet({
        log_id: log.id, exercise_id: exId, exercise_name_snapshot: exName,
        set_number: setNum,
        reps: v.reps ? Number(v.reps) : null,
        weight: v.weight ? Number(v.weight) : null,
        completed: true,
      });
      setValues((prev) => ({ ...prev, [k]: { ...v, done: true } }));
    } catch {
      toast.error("Error");
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await new WorkoutLogsService(createClient()).finish(log.id);
      toast.success(t("finished"));
      router.push("/client/workout-logs");
    } catch {
      toast.error("Error");
      setSaving(false);
    }
  }

  const exName = (e: DayWithExercises["exercises"][number]) =>
    (locale === "ar" ? e.exercise?.name_ar : e.exercise?.name_en) ?? "Exercise";

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl">{t("title", { day: log.day_name_snapshot })}</h1>

      {(day?.exercises ?? []).map((ex) => {
        const name = exName(ex);
        return (
          <Card key={ex.id} className="p-4 space-y-3">
            <p className="font-medium">{name}</p>
            {Array.from({ length: ex.sets }).map((_, idx) => {
              const setNum = idx + 1;
              const k = key(ex.exercise_id, setNum);
              const v = values[k] ?? { reps: "", weight: "", done: false };
              return (
                <div key={setNum} className="flex items-center gap-2">
                  <span className="text-sm w-16 text-muted-foreground">{t("set")} {setNum}</span>
                  <Input type="number" placeholder={t("reps")} className="w-20" value={v.reps}
                    onChange={(e) => setValues((p) => ({ ...p, [k]: { ...v, reps: e.target.value } }))} disabled={v.done} />
                  <Input type="number" placeholder={t("weight")} className="w-24" value={v.weight}
                    onChange={(e) => setValues((p) => ({ ...p, [k]: { ...v, weight: e.target.value } }))} disabled={v.done} />
                  <Button size="sm" variant={v.done ? "secondary" : "default"} disabled={v.done}
                    onClick={() => logSet(ex.exercise_id, name, setNum)}>{t("markDone")}</Button>
                </div>
              );
            })}
          </Card>
        );
      })}

      <Button onClick={finish} disabled={saving} className="w-full">{saving ? t("saving") : t("finish")}</Button>
    </div>
  );
}
