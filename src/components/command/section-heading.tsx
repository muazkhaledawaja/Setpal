import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Count chip shown after the label. */
  count?: React.ReactNode;
  /** Trailing link/action (e.g. "View all"), pinned to the inline-end. */
  action?: React.ReactNode;
}

/** Serif section heading with an optional count chip and trailing action. */
export function SectionHeading({
  count,
  action,
  className,
  children,
  ...rest
}: SectionHeadingProps) {
  return (
    <h3
      className={cn(
        "mb-3.5 flex items-center gap-2.5 font-serif text-[17px] font-semibold tracking-[-0.01em]",
        className
      )}
      {...rest}
    >
      {children}
      {count != null && (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 font-sans text-[11.5px] font-bold text-secondary-foreground">
          {count}
        </span>
      )}
      {action && (
        <span className="ms-auto text-[12.5px] font-semibold text-primary">
          {action}
        </span>
      )}
    </h3>
  );
}
