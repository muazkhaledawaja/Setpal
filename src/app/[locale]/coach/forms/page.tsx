import { getTranslations } from "next-intl/server";
import { ClipboardList, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TYPE_STYLES: Record<string, string> = {
  onboarding: "bg-primary/10 text-primary",
  check_in: "bg-success/10 text-success",
  custom: "bg-muted text-muted-foreground",
};

export default async function FormsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("forms");
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("form_templates")
    .select("*, questions:form_questions(count)")
    .eq("coach_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const forms: any[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/coach/forms/new">
            <Plus className="size-4 me-2" />
            {t("newForm")}
          </Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg bg-card">
          <ClipboardList className="size-10 text-muted-foreground mb-4" />
          <p className="font-medium text-muted-foreground">{t("empty")}</p>
          <Button asChild className="mt-4">
            <Link href="/coach/forms/new">{t("newForm")}</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">
                  {t("name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">
                  {t("type")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">
                  {t("questions")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const count =
                  Array.isArray(form.questions) && form.questions[0]
                    ? (form.questions[0] as { count: number }).count
                    : 0;
                return (
                  <tr
                    key={form.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{form.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${TYPE_STYLES[form.type] ?? TYPE_STYLES.custom}`}
                      >
                        {t(`typeLabels.${form.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{count}</td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/coach/forms/${form.id}`}>{t("edit")}</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
