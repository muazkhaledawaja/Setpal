"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopbarProps {
  fullName: string | null;
  avatarUrl: string | null;
  locale: string;
}

export function CoachTopbar({ fullName, avatarUrl, locale }: TopbarProps) {
  const t = useTranslations("coach");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card shrink-0">
      <div />

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-sm">
          <span
            className={cn(
              "px-3 py-1.5 font-medium",
              locale === "ar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {locale === "ar" ? (
              <span>ع</span>
            ) : (
              <Link href={pathname} locale="ar" className="block">
                ع
              </Link>
            )}
          </span>
          <span
            className={cn(
              "px-3 py-1.5 font-medium border-s border-border",
              locale === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {locale === "en" ? (
              <span>EN</span>
            ) : (
              <Link href={pathname} locale="en" className="block">
                EN
              </Link>
            )}
          </span>
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors outline-none">
              <Avatar className="size-8">
                <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {fullName ?? t("coach")}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/coach/settings">{t("nav.settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              {tCommon("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
