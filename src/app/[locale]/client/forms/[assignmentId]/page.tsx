import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { FormsService } from "@/modules/forms";
import { FormRunner } from "@/components/forms/form-runner";

export default async function ClientFormAssignmentPage({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>;
}) {
  const { locale, assignmentId } = await params;
  const { userId } = await requireRole(locale, "client");

  const supabase = await createClient();
  const service = new FormsService(supabase);

  const assignment = await service.getAssignmentForClient(assignmentId, userId);
  if (!assignment) notFound();

  const { template, questions } = assignment;
  const templateName =
    locale === "ar" && template.name ? template.name : template.name ?? "Form";

  const initialResponses: Record<string, unknown> = {};
  for (const q of questions) {
    const r = (q as typeof q & { response: { value: unknown } | null }).response;
    if (r?.value !== undefined) initialResponses[q.id] = r.value;
  }

  return (
    <FormRunner
      assignmentId={assignmentId}
      clientId={userId}
      questions={questions}
      locale={locale}
      templateName={templateName}
      initialResponses={initialResponses}
    />
  );
}
