import { getTranslations } from "next-intl/server";
import {
  Users,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
} from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
}

export async function AppMock() {
  const t = await getTranslations("landing.appmock");

  const stats = [
    { Icon: Users, label: t("clients"), val: "18", tint: "var(--lp-accent)" },
    { Icon: ClipboardCheck, label: t("checkins"), val: "5", tint: "var(--warning)" },
    { Icon: CreditCard, label: t("sub"), val: t("plan"), tint: "var(--muted-foreground)" },
  ];

  const rows = [
    { name: t("row1Name"), date: t("row1Date"), st: "active" as const },
    { name: t("row2Name"), date: t("row2Date"), st: "active" as const },
    { name: t("row3Name"), date: t("row3Date"), st: "paused" as const },
  ];

  return (
    <div className="lp-mock">
      <div className="lp-mock-bar">
        <span className="lp-dot" style={{ background: "#e06a5a" }} />
        <span className="lp-dot" style={{ background: "#e3b34d" }} />
        <span className="lp-dot" style={{ background: "#5aa56b" }} />
      </div>
      <div className="lp-mock-body">
        <aside className="lp-mock-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/setpal-mark.svg" alt="" style={{ width: 28, height: 28 }} />
          <div className="lp-mock-nav on">
            <LayoutDashboard size={15} strokeWidth={2} />
          </div>
          <div className="lp-mock-nav">
            <Users size={15} strokeWidth={2} />
          </div>
          <div className="lp-mock-nav">
            <Dumbbell size={15} strokeWidth={2} />
          </div>
          <div className="lp-mock-nav">
            <ClipboardList size={15} strokeWidth={2} />
          </div>
        </aside>
        <div className="lp-mock-main">
          <div className="lp-mock-h">{t("title")}</div>
          <div className="lp-mock-stats">
            {stats.map((s) => (
              <div key={s.label} className="lp-mock-stat">
                <div className="lp-mock-stat-top">
                  <span>{s.label}</span>
                  <span style={{ color: s.tint }}>
                    <s.Icon size={14} strokeWidth={2} />
                  </span>
                </div>
                <div className="lp-mock-stat-v">{s.val}</div>
              </div>
            ))}
          </div>
          <div className="lp-mock-recent">{t("recent")}</div>
          <div className="lp-mock-list">
            {rows.map((r) => (
              <div key={r.name} className="lp-mock-row">
                <div className="lp-mock-ava">{initials(r.name)}</div>
                <div className="lp-mock-row-id">
                  <div className="lp-mock-name">{r.name}</div>
                  <div className="lp-mock-meta">
                    {t("joined")} {r.date}
                  </div>
                </div>
                <span className={"lp-mock-pill " + r.st}>
                  {r.st === "active" ? t("active") : t("paused")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
