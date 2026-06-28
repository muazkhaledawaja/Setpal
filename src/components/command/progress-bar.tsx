import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value?: number;
  /**
   * Fill color (any CSS color). Omit to auto-color by value:
   * ≥80 success, ≥60 primary, else warning.
   */
  color?: string;
  /** Track height in px. @default 6 */
  height?: number;
  /** Track (unfilled) color. */
  trackColor?: string;
  /** Grow the fill from 0 on mount. @default true */
  animate?: boolean;
}

function autoColor(value: number): string {
  if (value >= 80) return "var(--success)";
  if (value >= 60) return "var(--primary)";
  return "var(--warning)";
}

/**
 * Setpal adherence/progress bar — rounded track + fill, auto-colored by value.
 * The fill grows from 0 on mount via a CSS keyframe; its resting width is the
 * final value, so a static render (no JS / reduced motion) shows it correctly.
 */
export function ProgressBar({
  value = 0,
  color,
  height = 6,
  trackColor = "color-mix(in oklab, var(--muted-foreground) 20%, transparent)",
  animate = true,
  className,
  style,
  ...rest
}: ProgressBarProps) {
  const v = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("overflow-hidden rounded-full", className)}
      style={{ height, background: trackColor, ...style }}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div
        className={cn("h-full rounded-full", animate && "command-bar-fill")}
        style={
          {
            width: `${v}%`,
            background: color ?? autoColor(v),
            "--bar-w": `${v}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
