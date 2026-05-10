import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("common");
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-6xl">{t("appName")}</h1>
        <p className="text-muted-foreground text-lg">
          The coaching platform built for MENA.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/register">{t("signUp")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("signIn")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
