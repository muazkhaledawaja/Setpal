import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { FormsService } from "@/modules/forms";
import { FormBuilder } from "@/components/forms/form-builder";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await requireRole(locale, "coach");
  const supabase = await createClient();
  const service = new FormsService(supabase);

  let template;
  try {
    template = await service.getTemplateWithQuestions(id, userId);
  } catch {
    notFound();
  }

  const initialData = {
    name: template.name,
    description_ar: template.description_ar ?? "",
    description_en: template.description_en ?? "",
    type: template.type,
    settings: template.settings,
    questions: template.questions.map((q) => ({
      id: q.id,
      label_ar: q.label_ar,
      label_en: q.label_en,
      type: q.type,
      options: q.options ?? [],
      validation: q.validation,
      placeholder_ar: q.placeholder_ar ?? "",
      placeholder_en: q.placeholder_en ?? "",
      help_text_ar: q.help_text_ar ?? "",
      help_text_en: q.help_text_en ?? "",
      order_index: q.order_index,
      conditional_logic: q.conditional_logic,
    })),
  };

  return (
    <FormBuilder
      coachId={userId}
      locale={locale}
      templateId={id}
      initialData={initialData}
    />
  );
}
