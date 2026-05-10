import { setRequestLocale, getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";
import { Link } from "@/i18n/routing";

export default async function LoginPage({
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
          <h1 className="text-3xl">{t("auth.loginTitle")}</h1>
          <p className="text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("auth.createAccount")}
          </Link>
        </p>
      </div>
    </main>
  );
}
