import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("coach");
  await requireRole(locale, "coach");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{t("clients.invitePage.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("clients.invitePage.subtitle")}</p>
      </div>
      <InviteForm locale={locale} />
    </div>
  );
}
