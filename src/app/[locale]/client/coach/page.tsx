import { getTranslations } from "next-intl/server";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ClientCoachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.coach");

  const supabase = await createClient();
  const coach = await new ClientsService(supabase).getMyCoach(userId);

  const bio = coach ? (locale === "ar" ? coach.bio_ar : coach.bio_en) : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {!coach ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <UserRound className="size-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("none")}</p>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={coach.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {initials(coach.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-serif font-semibold">{coach.full_name ?? "—"}</h2>
            </div>
          </div>

          {bio && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("bio")}</p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{bio}</p>
            </div>
          )}

          {coach.specializations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("specializations")}
              </p>
              <div className="flex flex-wrap gap-2">
                {coach.specializations.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
