import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const t = await getTranslations("invite");

  // Validate token server-side before rendering the form
  const supabase = await createClient();
  const service = new ClientsService(supabase);
  const invite = await service.getInviteByToken(token);

  if (!invite) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("subtitle", { email: invite.email })}
          </p>
        </div>
        <AcceptInviteForm token={token} email={invite.email} locale={locale} />
      </div>
    </div>
  );
}
