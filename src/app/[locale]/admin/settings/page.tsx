import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const { userId, profile } = await requireRole(locale, "admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
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

      <PasswordSettingsForm />
    </div>
  );
}
