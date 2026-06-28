"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Light/dark toggle. The icon is chosen via the `dark:` CSS variant (driven by
 * next-themes' `.dark` class on <html>), so there is no client state and no
 * hydration mismatch. Variants:
 *  - "default": bordered icon button for light surfaces (e.g. the topbar)
 *  - "band": cream-on-teal styling for use inside the Command hero band
 */
export function ThemeToggle({
  variant = "default",
  className,
}: {
  variant?: "default" | "band";
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-[34px] items-center justify-center rounded-[9px] transition-colors",
        variant === "band"
          ? "border border-[rgba(250,243,230,0.28)] text-[var(--brand-cream)] hover:bg-[rgba(250,243,230,0.12)]"
          : "border border-border text-muted-foreground hover:bg-muted",
        className
      )}
    >
      <Moon className="size-[17px] dark:hidden" />
      <Sun className="hidden size-[17px] dark:block" />
    </button>
  );
}
