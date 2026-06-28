"use client";

import * as React from "react";

interface CountUpProps {
  /** Final value to animate to. */
  value: number;
  /** Appended after the number, e.g. "%". */
  suffix?: string;
  /** Decimal places to show. @default 0 */
  decimals?: number;
  /** Animation duration in ms. @default 900 */
  duration?: number;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up from 0 to `value` on mount. The server (and the first client paint)
 * render the final number, so the value is never blank and degrades gracefully
 * without JS or with reduced-motion enabled.
 */
export function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 900,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = (eased * value).toFixed(decimals) + suffix;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, suffix, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
