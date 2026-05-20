"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { WorkoutLogsService } from "@/modules/workout-logs/workout-logs.service";
import type { PlanWithDays } from "@/modules/workouts/workouts.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PlanView({ plan, locale, clientId }: { plan: PlanWithDays; locale: string; clientId: string; }) {
  const t = useTranslations("client.planView");
  const router = useRouter();
  const days = plan.days ?? [];

  async function start(dayId: string, dayName: string) {
    const service = new WorkoutLogsService(createClient());
    const log = await service.start(clientId, plan.id, dayId, dayName);
    router.push(`/client/workout/${log.id}`);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl">{plan.name}</h1>
      <Tabs defaultValue={days[0]?.id}>
        <TabsList className="flex-wrap h-auto">
          {days.map((d) => <TabsTrigger key={d.id} value={d.id}>{d.name}</TabsTrigger>)}
        </TabsList>
        {days.map((d) => (
          <TabsContent key={d.id} value={d.id} className="space-y-3">
            {d.is_rest ? (
              <p className="text-muted-foreground py-8 text-center">{t("restDay")}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{d.exercises.length} {t("exercises")}</span>
                  <Button onClick={() => start(d.id, d.name)}>{t("startWorkout")}</Button>
                </div>
                {d.exercises.map((ex) => {
                  const name = locale === "ar" ? ex.exercise?.name_ar : ex.exercise?.name_en;
                  return (
                    <Card key={ex.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{name}</p>
                          {ex.exercise?.muscle_group && <Badge variant="secondary" className="mt-1">{ex.exercise.muscle_group}</Badge>}
                        </div>
                        <div className="text-sm text-end shrink-0">
                          <p>{t("sets")}: {ex.sets}</p>
                          <p>{t("reps")}: {ex.rep_range}</p>
                        </div>
                      </div>
                      {ex.exercise?.video_url && (
                        <a href={ex.exercise.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm mt-2 inline-block">{t("watchVideo")}</a>
                      )}
                      {ex.notes && <p className="text-xs text-muted-foreground mt-2">{t("notes")}: {ex.notes}</p>}
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
