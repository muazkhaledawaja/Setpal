"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LayoutDashboard, ClipboardList, TrendingUp, Dumbbell, UtensilsCrossed, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlanRow } from "@/modules/workouts/workouts.types";
import type { MealPlanRow } from "@/modules/meal-plans/meal-plans.types";
import type { ChatMessageRow } from "@/modules/chat/chat.service";
import { ChatThread } from "@/components/chat/chat-thread";

type Status = "active" | "paused" | "ended";

const TABS = [
  { key: "overview", icon: LayoutDashboard },
  { key: "forms", icon: ClipboardList },
  { key: "progress", icon: TrendingUp },
  { key: "plans", icon: Dumbbell },
  { key: "mealPlans", icon: UtensilsCrossed },
  { key: "messages", icon: MessageSquare },
] as const;

type TabKey = typeof TABS[number]["key"];

interface ClientTabsProps {
  clientId: string;
  coachId: string;
  locale: string;
  status: Status;
  assignedPlans: PlanRow[];
  assignedMealPlans: MealPlanRow[];
  chatMessages: ChatMessageRow[];
}

export function ClientTabs({ clientId, coachId, locale, status, assignedPlans, assignedMealPlans, chatMessages }: ClientTabsProps) {
  const t = useTranslations("coach");
  const tWorkouts = useTranslations("workouts");
  const tMeals = useTranslations("mealPlans");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleStatusChange(newStatus: Status) {
    setUpdatingStatus(true);
    await fetch(`/api/coach/clients/${clientId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdatingStatus(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-border gap-1">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {t(`clients.detail.tabs.${key}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card border border-border rounded-lg p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {t("clients.detail.statusManagement")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(["active", "paused", "ended"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? "default" : "outline"}
                    size="sm"
                    disabled={updatingStatus || status === s}
                    onClick={() => handleStatusChange(s)}
                  >
                    {t(`clients.status.${s}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "forms" && (
          <Placeholder label={t("clients.detail.tabs.forms")} />
        )}
        {activeTab === "progress" && (
          <Placeholder label={t("clients.detail.tabs.progress")} />
        )}
        {activeTab === "plans" && (
          <div className="space-y-4">
            <Button asChild>
              <Link href={`/coach/workouts/new?client=${clientId}`}>{tWorkouts("newPlan")}</Link>
            </Button>
            {assignedPlans.length === 0 ? (
              <p className="text-muted-foreground text-sm">{tWorkouts("empty")}</p>
            ) : (
              <div className="space-y-2">
                {assignedPlans.map((p) => (
                  <Card key={p.id} className="p-3">
                    <p className="font-medium">{p.name}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mealPlans" && (
          <div className="space-y-4">
            <Button asChild>
              <Link href={`/coach/meal-plans/new?client=${clientId}`}>{tMeals("newPlan")}</Link>
            </Button>
            {assignedMealPlans.length === 0 ? (
              <p className="text-muted-foreground text-sm">{tMeals("empty")}</p>
            ) : (
              <div className="space-y-2">
                {assignedMealPlans.map((p) => (
                  <Card key={p.id} className="p-3">
                    <p className="font-medium">{p.name}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <ChatThread clientId={clientId} currentUserId={coachId} initialMessages={chatMessages} />
        )}
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
      {label} — coming soon
    </div>
  );
}
