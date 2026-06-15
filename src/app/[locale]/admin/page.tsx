import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/modules/admin/admin.service";
import { Link } from "@/i18n/routing";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const service = new AdminService(supabase);
  const s = await service.getDashboardStats();

  const stats = [
    { label: t("stats.pending"), value: s.pending_approvals },
    { label: t("stats.activeUsers"), value: s.active_users },
    { label: t("stats.activeCoaches"), value: s.active_coaches },
    { label: t("stats.clients"), value: s.total_clients },
    { label: t("stats.totalUsers"), value: s.total_users },
    { label: t("stats.recentSignups"), value: s.recent_signups },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <Link href="/admin/users" className="text-primary hover:underline text-sm">
        {t("dashboard.manageUsers")}
      </Link>
    </div>
  );
}
