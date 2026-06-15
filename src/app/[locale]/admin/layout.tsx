import { AdminSidebar } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "admin");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-end h-16 px-6 border-b border-border">
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
