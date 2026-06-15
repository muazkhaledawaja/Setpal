import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";
import { LogoutButton } from "@/components/logout-button";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function PendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user!.id)
    .single()) as { data: Pick<ProfileRow, "role" | "status"> | null };

  // Already approved → send them to their dashboard.
  if (profile?.status === "active") {
    const home =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "coach"
        ? "/coach"
        : "/client";
    redirect({ href: home, locale });
  }

  const suspended = profile?.status === "suspended";

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Logo variant="stacked" theme="dark" width={88} />
        </div>
        <div className="bg-card border border-border rounded-lg p-8 space-y-3">
          <h1 className="text-2xl">
            {suspended ? t("suspendedTitle") : t("pendingTitle")}
          </h1>
          <p className="text-muted-foreground">
            {suspended ? t("suspendedBody") : t("pendingBody")}
          </p>
        </div>
        <LogoutButton />
      </div>
    </main>
  );
}
