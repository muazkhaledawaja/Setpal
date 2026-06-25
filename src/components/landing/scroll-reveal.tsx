"use client";

import { useEffect, useRef } from "react";

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: "up" | "left" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => el.setAttribute("data-revealed", ""), delay);
          obs.disconnect();
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const variantClass =
    variant === "left" ? "lp-reveal-left" : variant === "scale" ? "lp-reveal-scale" : "lp-reveal";

  return (
    <div ref={ref} className={`${variantClass} ${className}`}>
      {children}
    </div>
  );
}
