import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/modules/admin/admin.service";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const service = new AdminService(supabase);
  const users = await service.listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{t("users.title")}</h1>
        <p className="text-muted-foreground">{t("users.subtitle")}</p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
