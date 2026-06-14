import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("client");

  const { userId } = await requireRole(locale, "client");
  const supabase = await createClient();

  const { data: profileData } = (await supabase
    .from("profiles")
    .select("full_name, locale")
    .eq("id", userId)
    .single()) as {
    data: { full_name: string | null; locale: string | null } | null;
    error: unknown;
  };

  const profile = profileData ?? { full_name: null, locale: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <span className="font-medium">{t("common.fullName")}: </span>
              {profile?.full_name ?? "—"}
            </p>
            <p>
              <span className="font-medium">{t("common.locale")}: </span>
              {profile?.locale ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
