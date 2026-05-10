"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations("common");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      {t("signOut")}
    </Button>
  );
}
