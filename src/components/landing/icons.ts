import {
  Dumbbell,
  Library,
  ClipboardList,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon keys stored in the landing copy (messages) to lucide-react components. */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  library: Library,
  "clipboard-list": ClipboardList,
  "trending-up": TrendingUp,
};
