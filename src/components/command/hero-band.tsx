import * as React from "react";
import { cn } from "@/lib/utils";

export interface HeroBandKpi {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Small trailing delta in terracotta, e.g. "+3" or "2 overdue". */
  delta?: React.ReactNode;
  /** Optional leading icon (e.g. a Lucide element sized ~14). */
  icon?: React.ReactNode;
}

interface HeroBandProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Initials shown in a circular chip on the leading side. */
  avatar?: React.ReactNode;
  /** Inline KPI row rendered under the title, with hairline dividers. */
  kpis?: HeroBandKpi[];
  /** Slot rendered above the title row (e.g. a back link). */
  topSlot?: React.ReactNode;
  /** Slot rendered under the title row (e.g. a search + action bar). */
  actions?: React.ReactNode;
  /** Trailing-side controls (theme/lang toggles, buttons) — passed as children. */
  children?: React.ReactNode;
}

/**
 * Setpal "Command" hero band — deep-teal gradient screen header with cream text,
 * terracotta glow, optional avatar, KPI row, and trailing actions. The signature
 * surface of the redesign.
 */
export function HeroBand({
  eyebrow,
  title,
  subtitle,
  avatar,
  kpis,
  topSlot,
  actions,
  children,
  className,
  ...rest
}: HeroBandProps) {
  return (
    <div
      className={cn("command-band px-5 pb-6 pt-5 sm:px-8", className)}
      {...rest}
    >
      {topSlot}

      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          {avatar && (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[rgba(250,243,230,0.32)] bg-[rgba(250,243,230,0.16)] text-base font-semibold text-[var(--brand-cream)]">
              {avatar}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[rgba(250,243,230,0.72)]">
                {eyebrow}
              </div>
            )}
            {title && (
              <h1 className="mt-0.5 font-serif text-[26px] leading-[1.1] font-medium tracking-[-0.02em] text-[var(--brand-cream)] sm:text-[28px]">
                {title}
              </h1>
            )}
            {subtitle && (
              <div className="mt-0.5 text-[13px] text-[rgba(250,243,230,0.74)]">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {children && (
          <div className="flex shrink-0 items-center gap-2.5">{children}</div>
        )}
      </div>

      {kpis && kpis.length > 0 && (
        <div className="mt-5 flex flex-wrap">
          {kpis.map((k, i) => (
            <div
              key={i}
              className={cn(
                "min-w-[150px] flex-1 px-6",
                i === 0
                  ? "ps-0"
                  : "border-s border-[rgba(250,243,230,0.16)]"
              )}
            >
              <div className="flex items-center gap-1.5 text-xs text-[rgba(250,243,230,0.72)]">
                {k.icon}
                {k.label}
              </div>
              <div className="mt-1.5 flex items-baseline gap-2 font-serif text-[34px] font-semibold tracking-[-0.02em]">
                {k.value}
                {k.delta && (
                  <small className="font-sans text-xs font-semibold text-[#f0b59f]">
                    {k.delta}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
