import { getTranslations } from "next-intl/server";
import { CoachSidebar } from "@/components/coach/sidebar";
import { CoachMobileNav } from "@/components/coach/mobile-nav";
import { CoachTopbar } from "@/components/coach/topbar";
import { requireRole } from "@/lib/auth/require-role";

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
  );
}

export default async function CoachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { profile, coachData } = await requireRole(locale, "coach");
  const t = await getTranslations("coach");

  const tier = coachData?.subscription_tier ?? "trial";
  const planLabel =
    tier === "trial"
      ? t("subscription.trial", { days: daysUntil(coachData?.trial_ends_at) })
      : t(`subscription.${tier}`);

  return (
    <div className="flex min-h-screen bg-background">
      <CoachSidebar
        coachName={profile.full_name}
        coachInitials={initialsOf(profile.full_name)}
        planLabel={planLabel}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <CoachTopbar
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          locale={locale}
        />
        <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <CoachMobileNav />
    </div>
  );
}
