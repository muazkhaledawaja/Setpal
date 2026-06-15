"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Dumbbell, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "library", href: "/admin/library", icon: Dumbbell },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-e border-sidebar-border shrink-0">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border" dir="ltr">
        <Logo variant="horizontal" theme="dark" width={160} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
