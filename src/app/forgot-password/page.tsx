import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function ForgotPasswordRedirectPage() {
  redirect(`/${routing.defaultLocale}/forgot-password`);
}
