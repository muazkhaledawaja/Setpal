import { setRequestLocale, getTranslations } from "next-intl/server";
import { RegisterForm } from "./register-form";
import { Link } from "@/i18n/routing";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl">{t("auth.registerTitle")}</h1>
          <p className="text-muted-foreground">{t("auth.registerSubtitle")}</p>
        </div>

        <RegisterForm locale={locale} />

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
