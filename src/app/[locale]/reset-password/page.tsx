import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // The recovery link (via /api/auth/callback) establishes a session.
  // Without one, the link was invalid, expired, or already used.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl">{t("auth.resetPasswordTitle")}</h1>
          {user && (
            <p className="text-muted-foreground">{t("auth.resetPasswordSubtitle")}</p>
          )}
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
            <p className="text-destructive">{t("auth.resetLinkInvalid")}</p>
            <Link href="/forgot-password" className="text-primary hover:underline">
              {t("auth.forgotPasswordTitle")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
