"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { Home, Dumbbell, History, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const MOBILE_NAV = [
  { key: "overview", href: "/client", icon: Home },
  { key: "plans", href: "/client/plans", icon: Dumbbell },
  { key: "workoutLogs", href: "/client/workout-logs", icon: History },
  { key: "forms", href: "/client/forms", icon: ClipboardList },
] as const;

export function ClientTopbar({ fullName, avatarUrl, locale }: { fullName: string | null; avatarUrl: string | null; locale: string; }) {
  const t = useTranslations("client");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border bg-card shrink-0">
        <span className="md:hidden text-lg font-serif font-semibold text-primary">{t("appName")}</span>
        <div className="flex items-center gap-3 ms-auto">
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-sm">
            <Link href={pathname} locale="ar" className={cn("px-3 py-1.5", locale === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>ع</Link>
            <Link href={pathname} locale="en" className={cn("px-3 py-1.5 border-s border-border", locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>EN</Link>
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors outline-none">
                <Avatar className="size-8">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild><Link href="/client/settings">{t("nav.settings")}</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">{tCommon("signOut")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around bg-card border-t border-border h-16">
        {MOBILE_NAV.map(({ key, href, icon: Icon }) => {
          const isActive = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
          return (
            <Link key={key} href={href} className={cn("flex flex-col items-center justify-center gap-1 flex-1 text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
              <Icon className="size-5" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
