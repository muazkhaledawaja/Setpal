import { cn } from "@/lib/utils";

type LogoVariant = "horizontal" | "stacked" | "mark" | "wordmark";
type LogoTheme = "dark" | "light" | "cream";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  className?: string;
  /** Width in px — height scales proportionally */
  width?: number;
}

const MARK_BG: Record<LogoTheme, string> = {
  dark: "#0E4744",
  light: "#FAF3E6",
  cream: "#0E4744",
};

const MARK_STROKE: Record<LogoTheme, string> = {
  dark: "#FAF3E6",
  light: "#0E4744",
  cream: "#FAF3E6",
};

const WORDMARK_FILL: Record<LogoTheme, string> = {
  dark: "#0E4744",
  light: "#FAF3E6",
  cream: "#0E4744",
};

const TERRA = "#C25A3A";
const MARK_PATH = "M78 46C78 36 68 34 60 34C50 34 42 39 42 48C42 57 50 60 60 60C70 60 78 64 78 73C78 82 70 86 60 86C52 86 44 84 42 78";

function Mark({ theme = "dark", width = 48 }: { theme?: LogoTheme; width?: number }) {
  return (
    <svg
      width={width}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="108" height="108" rx="30" fill={MARK_BG[theme]} />
      <path
        d={MARK_PATH}
        stroke={MARK_STROKE[theme]}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="46" r="6.5" fill={TERRA} />
    </svg>
  );
}

function Wordmark({ theme = "dark", width = 120 }: { theme?: LogoTheme; width?: number }) {
  return (
    <svg
      role="img"
      width={width}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Setpal"
    >
      <text
        x="0"
        y="48"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="58"
        fontWeight="600"
        fill={WORDMARK_FILL[theme]}
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        Setpal
      </text>
    </svg>
  );
}

function Horizontal({ theme = "dark", width = 220 }: { theme?: LogoTheme; width?: number }) {
  return (
    <svg
      role="img"
      width={width}
      viewBox="0 0 344 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Setpal"
    >
      <rect x="6" y="6" width="108" height="108" rx="30" fill={MARK_BG[theme]} />
      <path
        d={MARK_PATH}
        stroke={MARK_STROKE[theme]}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="46" r="6.5" fill={TERRA} />
      <text
        x="154"
        y="84"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="78"
        fontWeight="600"
        fill={WORDMARK_FILL[theme]}
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        Setpal
      </text>
    </svg>
  );
}

function Stacked({ theme = "dark", width = 100 }: { theme?: LogoTheme; width?: number }) {
  return (
    <svg
      role="img"
      width={width}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Setpal"
    >
      <rect x="6" y="6" width="108" height="108" rx="30" fill={MARK_BG[theme]} />
      <path
        d={MARK_PATH}
        stroke={MARK_STROKE[theme]}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="46" r="6.5" fill={TERRA} />
      <text
        x="60"
        y="150"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="36"
        fontWeight="600"
        fill={WORDMARK_FILL[theme]}
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        Setpal
      </text>
    </svg>
  );
}

export function Logo({ variant = "horizontal", theme = "dark", className, width }: LogoProps) {
  const defaults: Record<LogoVariant, number> = {
    horizontal: 220,
    stacked: 100,
    mark: 48,
    wordmark: 120,
  };
  const w = width ?? defaults[variant];

  return (
    <span className={cn("inline-flex items-center", className)}>
      {variant === "mark" && <Mark theme={theme} width={w} />}
      {variant === "wordmark" && <Wordmark theme={theme} width={w} />}
      {variant === "horizontal" && <Horizontal theme={theme} width={w} />}
      {variant === "stacked" && <Stacked theme={theme} width={w} />}
    </span>
  );
}
