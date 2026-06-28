"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const ITEMS: { key: string; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/coach", icon: LayoutDashboard },
  { key: "clients", href: "/coach/clients", icon: Users },
  { key: "library", href: "/coach/library", icon: Dumbbell },
  { key: "forms", href: "/coach/forms", icon: ClipboardList },
  { key: "settings", href: "/coach/settings", icon: Settings },
];

/** Mobile bottom tab bar — shown when the sidebar is hidden (< md). */
export function CoachMobileNav() {
  const t = useTranslations("coach");
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-border bg-card/90 px-1 py-1.5 backdrop-blur-md md:hidden">
      {ITEMS.map(({ key, href, icon: Icon }) => {
        const isActive =
          href === "/coach" ? pathname === "/coach" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-[21px]" />
            <span>{t(`nav.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
