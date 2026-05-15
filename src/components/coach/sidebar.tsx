"use client";

import { useTranslations } from "next-intl";
import { Home, Users, Dumbbell, ClipboardList, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "dashboard", href: "/coach", icon: Home },
  { key: "clients", href: "/coach/clients", icon: Users },
  { key: "library", href: "/coach/library", icon: Dumbbell },
  { key: "forms", href: "/coach/forms", icon: ClipboardList },
  { key: "settings", href: "/coach/settings", icon: Settings },
] as const;

export function CoachSidebar() {
  const t = useTranslations("coach");
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-e border-sidebar-border shrink-0">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <span className="text-lg font-serif font-semibold text-sidebar-primary">
          {t("appName")}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/coach"
              ? pathname === "/coach"
              : pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
