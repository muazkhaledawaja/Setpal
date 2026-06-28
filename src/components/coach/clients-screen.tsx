"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, UserPlus } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { HeroBand, ProgressBar } from "@/components/command";
import { cn } from "@/lib/utils";

export interface ClientRow {
  id: string;
  name: string;
  initials: string;
  status: "active" | "paused" | "ended";
  startDate: string;
  adherence: number;
}

const STATUS_PILL: Record<ClientRow["status"], string> = {
  active: "bg-success/15 text-success",
  paused: "bg-warning/20 text-warning-foreground",
  ended: "bg-secondary text-muted-foreground",
};

export function ClientsScreen({
  clients,
  locale,
}: {
  clients: ClientRow[];
  locale: string;
}) {
  const t = useTranslations("coach");
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB");

  return (
    <div className="-m-6 pb-6">
      <HeroBand
        eyebrow={t("nav.clients")}
        title={t("clients.title")}
        subtitle={t("clients.subtitle", { count: clients.length })}
        actions={
          <>
            <div className="relative min-w-[200px] max-w-[380px] flex-1">
              <Search className="pointer-events-none absolute inset-inline-start-3 top-1/2 size-4 -translate-y-1/2 text-[rgba(250,243,230,0.6)] ltr:left-3 rtl:right-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("clients.table.name")}
                className="h-10 w-full rounded-[10px] border border-[rgba(250,243,230,0.26)] bg-[rgba(250,243,230,0.1)] text-sm text-[var(--brand-cream)] outline-none placeholder:text-[rgba(250,243,230,0.55)] ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <Link
              href="/coach/clients/invite"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--brand-cream)] px-4 text-[13.5px] font-semibold text-[var(--brand-teal-deep)] transition-[filter] hover:brightness-95"
            >
              <UserPlus className="size-4" />
              {t("clients.invite")}
            </Link>
          </>
        }
      />

      <div className="px-6 pt-6">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <UserPlus className="mb-4 size-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              {t("clients.empty.title")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("clients.empty.subtitle")}
            </p>
            <Link
              href="/coach/clients/invite"
              className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {t("clients.invite")}
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card command-shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-start text-[12.5px] font-medium text-muted-foreground">
                    {t("clients.table.name")}
                  </th>
                  <th className="px-4 py-3 text-start text-[12.5px] font-medium text-muted-foreground">
                    {t("clients.table.status")}
                  </th>
                  <th className="px-4 py-3 text-start text-[12.5px] font-medium text-muted-foreground">
                    {t("stats.avgAdherence")}
                  </th>
                  <th className="px-4 py-3 text-start text-[12.5px] font-medium text-muted-foreground">
                    {t("clients.table.startDate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/coach/clients/${c.id}`)}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 font-medium">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {c.initials}
                        </span>
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-0.5 text-[11.5px] font-semibold",
                          STATUS_PILL[c.status]
                        )}
                      >
                        {t(`clients.status.${c.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[70px]">
                          <ProgressBar value={c.adherence} />
                        </div>
                        <span className="text-[12.5px] font-semibold tabular-nums">
                          {c.adherence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(c.startDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
