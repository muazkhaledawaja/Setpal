import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/modules/admin/admin.service";
import { Link } from "@/i18n/routing";
import {
  Clock,
  Users,
  UserCheck,
  User,
  Users2,
  TrendingUp,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HeroBand, CountUp } from "@/components/command";

type StatColor = "warning" | "primary" | "success" | "muted";

interface StatCard {
  label: string;
  value: number;
  color: StatColor;
  Icon: LucideIcon;
  href?: string;
  badge?: string;
}

const colorMap: Record<StatColor, { iconBg: string; iconText: string; linkText: string }> = {
  warning: {
    iconBg: "bg-warning/10",
    iconText: "text-warning",
    linkText: "text-warning hover:text-warning/80",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    linkText: "text-primary hover:text-primary/80",
  },
  success: {
    iconBg: "bg-success/10",
    iconText: "text-success",
    linkText: "text-success hover:text-success/80",
  },
  muted: {
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
    linkText: "text-muted-foreground hover:text-foreground",
  },
};

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

  const stats: StatCard[] = [
    {
      label: t("stats.pending"),
      value: s.pending_approvals,
      color: "warning",
      Icon: Clock,
      href: "/admin/users",
    },
    {
      label: t("stats.activeUsers"),
      value: s.active_users,
      color: "primary",
      Icon: Users,
    },
    {
      label: t("stats.activeCoaches"),
      value: s.active_coaches,
      color: "success",
      Icon: UserCheck,
    },
    {
      label: t("stats.clients"),
      value: s.total_clients,
      color: "primary",
      Icon: User,
    },
    {
      label: t("stats.totalUsers"),
      value: s.total_users,
      color: "muted",
      Icon: Users2,
    },
    {
      label: t("stats.recentSignups"),
      value: s.recent_signups,
      color: "success",
      Icon: TrendingUp,
      badge: "7d",
    },
  ];

  const bandStats = stats.slice(0, 3);
  const gridStats = stats.slice(3);

  return (
    <div className="-m-6 pb-6">
      <HeroBand
        eyebrow={t("nav.dashboard")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        kpis={bandStats.map((stat) => ({
          icon: <stat.Icon className="size-3.5" />,
          label: stat.label,
          value: <CountUp value={stat.value} />,
        }))}
      />

      <div className="space-y-8 px-6 pt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {gridStats.map((stat) => {
          const c = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className="command-shadow flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground leading-tight">{stat.label}</p>
                <div className={`size-9 rounded-lg ${c.iconBg} ${c.iconText} flex items-center justify-center shrink-0`}>
                  <stat.Icon className="size-4" />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <p className="text-4xl font-semibold tabular-nums">{stat.value}</p>
                {stat.badge && (
                  <span className="mb-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {stat.badge}
                  </span>
                )}
              </div>

              {stat.href && (
                <Link
                  href={stat.href}
                  className={`text-xs font-medium flex items-center gap-1 ${c.linkText} transition-colors`}
                >
                  {t("dashboard.manageUsers").replace(" ←", "")}
                  <ArrowRight className="size-3 rtl:rotate-180" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          {locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            <div className="size-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {locale === "ar" ? "مراجعة طلبات الموافقة" : "Review pending approvals"}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.pending_approvals}{" "}
                {locale === "ar" ? "طلب بانتظار المراجعة" : "awaiting review"}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground ms-auto shrink-0 rtl:rotate-180 group-hover:text-primary transition-colors" />
          </Link>

          <Link
            href="/admin/library"
            className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {locale === "ar" ? "إدارة المكتبة" : "Manage library"}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "التمارين والأطعمة" : "Exercises & foods"}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground ms-auto shrink-0 rtl:rotate-180 group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
