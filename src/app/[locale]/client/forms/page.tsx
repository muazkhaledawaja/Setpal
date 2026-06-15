import { getTranslations } from "next-intl/server";
import { ClipboardList, ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { FormsService } from "@/modules/forms";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  skipped: "bg-muted text-muted-foreground",
};

export default async function ClientFormsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "client");
  const t = await getTranslations("client.forms");

  const supabase = await createClient();
  const assignments = await new FormsService(supabase).listClientAssignments(userId);

  const formatDue = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg bg-card">
          <ClipboardList className="size-10 text-muted-foreground mb-4" />
          <p className="font-medium text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const due = formatDue(a.due_at);
            return (
              <Link key={a.assignment_id} href={`/client/forms/${a.assignment_id}`}>
                <Card className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{a.template_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {due ? t("due", { date: due }) : t("noDue")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[a.status] ?? STATUS_STYLES.pending}`}
                    >
                      {t(`status.${a.status}`)}
                    </span>
                    <ChevronLeft className="size-4 text-muted-foreground rotate-180 rtl:rotate-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
