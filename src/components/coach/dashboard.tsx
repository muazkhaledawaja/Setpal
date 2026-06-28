"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  ClipboardList,
  Activity,
  AlarmClock,
  MessageSquare,
  PauseCircle,
  Dumbbell,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import {
  HeroBand,
  AlertCard,
  ProgressBar,
  CountUp,
  SectionHeading,
} from "@/components/command";

export interface DashboardClient {
  id: string;
  name: string;
  initials: string;
  status: "active" | "paused" | "ended";
  startDate: string;
  /** 0–100. Illustrative until an adherence metric exists in the schema. */
  adherence: number;
}

export interface AttentionItem {
  id: string;
  clientId: string;
  kind: "overdue" | "message" | "paused";
  name: string;
  description: string;
}

export interface SessionItem {
  id: string;
  time: string;
  name: string;
  type: string;
}

interface DashboardProps {
  coachName: string;
  coachInitials: string;
  period: "Morning" | "Afternoon" | "Evening";
  kpis: { activeClients: number; checkInsToReview: number; avgAdherence: number };
  attention: AttentionItem[];
  sessions: SessionItem[];
  roster: DashboardClient[];
}

const ATTENTION_ICON = {
  overdue: AlarmClock,
  message: MessageSquare,
  paused: PauseCircle,
} as const;

const ATTENTION_ACCENT = {
  overdue: "terra",
  message: "primary",
  paused: "warning",
} as const;

function InitialsAvatar({ initials, size = 30 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.37 }}
    >
      {initials}
    </span>
  );
}

export function CoachDashboard({
  coachName,
  coachInitials,
  period,
  kpis,
  attention,
  sessions,
  roster,
}: DashboardProps) {
  const t = useTranslations("coach");
  const router = useRouter();
  const openClient = (id: string) => router.push(`/coach/clients/${id}`);

  return (
    <div className="-m-6">
      <HeroBand
        eyebrow={t("nav.dashboard")}
        avatar={coachInitials}
        title={t(`dashboard.greeting${period}`, { name: coachName })}
        kpis={[
          {
            icon: <Users className="size-3.5" />,
            label: t("stats.activeClients"),
            value: <CountUp value={kpis.activeClients} />,
          },
          {
            icon: <ClipboardList className="size-3.5" />,
            label: t("stats.checkInsToReview"),
            value: <CountUp value={kpis.checkInsToReview} />,
          },
          {
            icon: <Activity className="size-3.5" />,
            label: t("stats.avgAdherence"),
            value: <CountUp value={kpis.avgAdherence} suffix="%" />,
          },
        ]}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Needs attention + today's sessions */}
        <div>
          <SectionHeading count={attention.length}>
            {t("dashboard.needsAttention")}
          </SectionHeading>
          {attention.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {attention.map((a) => {
                const Icon = ATTENTION_ICON[a.kind];
                return (
                  <AlertCard
                    key={a.id}
                    accent={ATTENTION_ACCENT[a.kind]}
                    icon={<Icon className="size-[18px]" />}
                    title={a.name}
                    description={a.description}
                    onClick={() => openClient(a.clientId)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground command-shadow">
              {t("dashboard.allGood")}
            </div>
          )}

          <SectionHeading count={sessions.length} className="mt-6">
            {t("dashboard.todaySessions")}
          </SectionHeading>
          <div className="overflow-hidden rounded-xl border border-border bg-card command-shadow">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3.5 border-b border-border px-4 py-3 last:border-0"
                >
                  <span className="w-[52px] shrink-0 font-serif text-sm font-semibold text-primary">
                    {s.time}
                  </span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.type}</div>
                  </div>
                  <Dumbbell className="size-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.noSessions")}
              </div>
            )}
          </div>
        </div>

        {/* Roster */}
        <div>
          <SectionHeading
            count={roster.length}
            action={
              <button
                type="button"
                onClick={() => router.push("/coach/clients")}
                className="cursor-pointer"
              >
                {t("dashboard.viewAll")}
              </button>
            }
          >
            {t("dashboard.roster")}
          </SectionHeading>
          <div className="overflow-hidden rounded-xl border border-border bg-card command-shadow">
            {roster.length > 0 ? (
              roster.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openClient(c.id)}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted/50"
                >
                  <InitialsAvatar initials={c.initials} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                    {c.name}
                  </span>
                  <div className="w-[84px] shrink-0">
                    <ProgressBar value={c.adherence} />
                  </div>
                  <span className="w-10 text-end text-[12.5px] font-semibold tabular-nums">
                    {c.adherence}%
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.emptyRoster")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
