import { requireRole } from "@/lib/auth/require-role";
import { FormBuilder } from "@/components/forms/form-builder";

export default async function NewFormPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireRole(locale, "coach");

  return <FormBuilder coachId={userId} locale={locale} />;
}
