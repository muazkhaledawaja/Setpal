"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "sectionCoaching",
    items: [
      { key: "dashboard", href: "/coach", icon: LayoutDashboard },
      { key: "clients", href: "/coach/clients", icon: Users },
      { key: "library", href: "/coach/library", icon: Dumbbell },
    ],
  },
  {
    label: "sectionManage",
    items: [
      { key: "mealPlans", href: "/coach/meal-plans", icon: UtensilsCrossed },
      { key: "forms", href: "/coach/forms", icon: ClipboardList },
      { key: "settings", href: "/coach/settings", icon: Settings },
    ],
  },
];

interface CoachSidebarProps {
  coachName: string | null;
  coachInitials: string;
  planLabel: string;
}

export function CoachSidebar({
  coachName,
  coachInitials,
  planLabel,
}: CoachSidebarProps) {
  const t = useTranslations("coach");
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar md:flex">
      <div
        className="flex h-[68px] items-center px-6"
        dir="ltr"
      >
        <Logo variant="horizontal" theme="dark" width={150} />
      </div>

      <nav className="flex-1 px-3.5 py-2">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              {t(`nav.${section.label}`)}
            </div>
            {section.items.map(({ key, href, icon: Icon, badge }) => {
              const isActive =
                href === "/coach"
                  ? pathname === "/coach"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "mb-0.5 flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{t(`nav.${key}`)}</span>
                  {badge ? (
                    <span
                      className={cn(
                        "inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                        isActive
                          ? "bg-[rgba(250,243,230,0.25)] text-[var(--brand-cream)]"
                          : "bg-terra text-terra-foreground"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-[13px] border border-sidebar-border bg-card/70 p-3">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
          {coachInitials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{coachName}</div>
          <div className="truncate text-[11.5px] text-muted-foreground">
            {planLabel}
          </div>
        </div>
      </div>
    </aside>
  );
}
