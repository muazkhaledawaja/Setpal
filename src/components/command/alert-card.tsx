import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "terra" | "primary" | "warning" | "destructive" | "success";

interface AlertCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading icon node (e.g. a Lucide element sized ~18). */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Accent color for the border + icon chip. @default "terra" */
  accent?: Accent;
}

const ACCENT_VAR: Record<Accent, string> = {
  terra: "var(--terra)",
  primary: "var(--primary)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
  success: "var(--success)",
};

/**
 * Setpal triage row — card with a colored inline-start accent, icon chip, title +
 * description, and a trailing chevron when clickable. For "needs attention" lists.
 */
export function AlertCard({
  icon,
  title,
  description,
  accent = "terra",
  onClick,
  className,
  ...rest
}: AlertCardProps) {
  const color = ACCENT_VAR[accent];
  const clickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (onClick as React.MouseEventHandler<HTMLDivElement>)(
                  e as unknown as React.MouseEvent<HTMLDivElement>
                );
              }
            }
          : undefined
      }
      className={cn(
        "command-shadow flex items-center gap-3.5 rounded-xl border border-border bg-card p-[14px_16px]",
        clickable &&
          "command-shadow-hover cursor-pointer transition-transform duration-150 hover:-translate-y-0.5",
        className
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: color }}
      {...rest}
    >
      {icon && (
        <span
          className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px]"
          style={{
            background: `color-mix(in oklab, ${color} 13%, transparent)`,
            color,
          }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="mt-px truncate text-[12.5px] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {clickable && (
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-border text-muted-foreground rtl:rotate-180">
          <ChevronRight className="size-[15px]" />
        </span>
      )}
    </div>
  );
}
