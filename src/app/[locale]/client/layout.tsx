import { requireRole } from "@/lib/auth/require-role";
import { ClientSidebar } from "@/components/client/sidebar";
import { ClientTopbar } from "@/components/client/topbar";

export default async function ClientLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { profile } = await requireRole(locale, "client");

  return (
    <div className="flex min-h-screen">
      <ClientSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <ClientTopbar fullName={profile.full_name} avatarUrl={profile.avatar_url} locale={locale} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
