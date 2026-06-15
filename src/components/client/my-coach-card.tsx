import { getTranslations } from "next-intl/server";
import { UserRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MyCoach } from "@/modules/clients/clients.service";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function MyCoachCard({
  coach,
}: {
  coach: MyCoach | null;
}) {
  const t = await getTranslations("client.coach");

  if (!coach) {
    return (
      <Card className="p-5">
        <UserRound className="size-5 text-primary mb-2" />
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <p className="text-sm mt-1">{t("none")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground mb-3">{t("title")}</p>
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarImage src={coach.avatar_url ?? ""} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {initials(coach.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium truncate">{coach.full_name ?? "—"}</p>
        </div>
      </div>
      <Button asChild variant="link" className="px-0 mt-2">
        <Link href="/client/coach">{t("view")}</Link>
      </Button>
    </Card>
  );
}
