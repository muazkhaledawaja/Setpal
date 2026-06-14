import { getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";
import { CoachProfileForm } from "@/components/coach/coach-profile-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function CoachSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const { userId, profile, coachData } = await requireRole(locale, "coach");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", userId);

  const tier = coachData?.subscription_tier ?? "trial";
  const trialDays =
    tier === "trial" ? daysUntil(coachData?.trial_ends_at ?? null) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{t("coach.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("coach.subtitle")}</p>
      </div>

      <ProfileSettingsForm
        userId={userId}
        locale={locale}
        email={user?.email ?? ""}
        initial={{
          full_name: profile.full_name,
          phone: profile.phone,
          locale: profile.locale,
          avatar_url: profile.avatar_url,
        }}
      />

      <CoachProfileForm
        userId={userId}
        initial={{
          bio_ar: coachData?.bio_ar ?? null,
          bio_en: coachData?.bio_en ?? null,
          specializations: coachData?.specializations ?? [],
        }}
      />

      {/* Subscription (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("coach.subscription")}</CardTitle>
          <CardDescription>{t("coach.subscriptionSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("coach.plan")}</p>
              <p className="font-medium capitalize">
                {t(`tierLabels.${tier}`)}
                {trialDays !== null && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    ({t("coach.trialDaysLeft", { days: trialDays })})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("coach.currentClients")}
              </p>
              <p className="font-medium">
                {clientCount ?? 0}
                {coachData?.client_limit != null && ` / ${coachData.client_limit}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("coach.clientLimit")}
              </p>
              <p className="font-medium">{coachData?.client_limit ?? "—"}</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground cursor-not-allowed"
          >
            <CreditCard className="size-4" />
            {t("coach.manageBilling")}
            <span className="text-xs">({t("coach.comingSoon")})</span>
          </button>
        </CardContent>
      </Card>

      <PasswordSettingsForm />
    </div>
  );
}
