"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, X, Plus } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { ProfileService } from "@/modules/profile";
import { UpdateCoachProfileSchema } from "@/modules/profile/profile.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Props {
  userId: string;
  initial: {
    bio_ar: string | null;
    bio_en: string | null;
    specializations: string[];
  };
}

export function CoachProfileForm({ userId, initial }: Props) {
  const t = useTranslations("settings.coach");
  const router = useRouter();

  const [bioAr, setBioAr] = useState(initial.bio_ar ?? "");
  const [bioEn, setBioEn] = useState(initial.bio_en ?? "");
  const [specializations, setSpecializations] = useState<string[]>(
    initial.specializations ?? []
  );
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function addSpecialization() {
    const value = draft.trim();
    if (!value || specializations.includes(value)) {
      setDraft("");
      return;
    }
    setSpecializations([...specializations, value]);
    setDraft("");
  }

  function removeSpecialization(value: string) {
    setSpecializations(specializations.filter((s) => s !== value));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const service = new ProfileService(createClient());
      await service.updateCoachProfile(
        userId,
        UpdateCoachProfileSchema.parse({
          bio_ar: bioAr,
          bio_en: bioEn,
          specializations,
        })
      );
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profileTitle")}</CardTitle>
        <CardDescription>{t("profileSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bio_ar">{t("bioAr")}</Label>
              <Textarea
                id="bio_ar"
                dir="rtl"
                rows={4}
                value={bioAr}
                onChange={(e) => setBioAr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio_en">{t("bioEn")}</Label>
              <Textarea
                id="bio_en"
                dir="ltr"
                rows={4}
                value={bioEn}
                onChange={(e) => setBioEn(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("specializations")}</Label>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("specializationsPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialization();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={addSpecialization}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {specializations.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-sm"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(s)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t("removeSpecialization")}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 me-2 animate-spin" />}
            {t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
