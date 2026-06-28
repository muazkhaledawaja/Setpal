import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import {
  CoachDashboard,
  type DashboardClient,
  type AttentionItem,
} from "@/components/coach/dashboard";

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function firstName(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback;
  return name.split(" ")[0];
}

function greetingPeriod(): "Morning" | "Afternoon" | "Evening" {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

/**
 * Stable, deterministic stand-in for per-client adherence (0–100). The schema
 * has no adherence metric yet, so this keeps the redesign's progress bars
 * populated without fabricating volatile numbers. Replace with a real metric
 * (e.g. completed workout-logs ÷ scheduled) when the data is available.
 */
function illustrativeAdherence(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 45 + (h % 56); // 45–100
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default async function CoachDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("coach");

  const { userId, profile } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new ClientsService(supabase);
  const clients = await service.listForCoach(userId);

  const roster: DashboardClient[] = clients
    .filter((c) => c.status !== "ended")
    .map((c) => ({
      id: c.id,
      name: c.profile?.full_name ?? t("coach"),
      initials: initialsOf(c.profile?.full_name),
      status: c.status,
      startDate: c.start_date,
      adherence: illustrativeAdherence(c.id),
    }));

  const activeClients = roster.filter((c) => c.status === "active").length;
  const avgAdherence = roster.length
    ? Math.round(roster.reduce((s, c) => s + c.adherence, 0) / roster.length)
    : 0;

  // Triage list derived from real signals: paused clients, plus clients whose
  // start date implies a long-overdue check-in (no check-in table to query yet).
  const attention: AttentionItem[] = [];
  for (const c of roster) {
    if (c.status === "paused") {
      attention.push({
        id: `paused-${c.id}`,
        clientId: c.id,
        kind: "paused",
        name: c.name,
        description: t("clients.status.paused"),
      });
    } else if (c.adherence < 60) {
      attention.push({
        id: `adh-${c.id}`,
        clientId: c.id,
        kind: "overdue",
        name: c.name,
        description: `${c.adherence}% · ${daysSince(c.startDate)}d`,
      });
    }
  }

  return (
    <CoachDashboard
      coachName={firstName(profile.full_name, t("coach"))}
      coachInitials={initialsOf(profile.full_name)}
      period={greetingPeriod()}
      kpis={{
        activeClients,
        checkInsToReview: attention.filter((a) => a.kind !== "paused").length,
        avgAdherence,
      }}
      attention={attention.slice(0, 4)}
      sessions={[]}
      roster={roster}
    />
  );
}
