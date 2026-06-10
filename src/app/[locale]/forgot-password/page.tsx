import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl">{t("auth.forgotPasswordTitle")}</h1>
          <p className="text-muted-foreground">{t("auth.forgotPasswordSubtitle")}</p>
        </div>

        {error === "invalid_link" && (
          <p className="text-sm text-destructive text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {t("auth.resetLinkInvalid")}
          </p>
        )}

        <ForgotPasswordForm />

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
